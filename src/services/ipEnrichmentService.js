const axios = require('axios');
const redisClient = require('../../config/redis');

// IPinfo.io API configuration
const IPINFO_API_KEY = process.env.IPINFO_API_KEY;
const IPINFO_API_URL = 'https://ipinfo.io';

// Cache TTL configuration (in seconds)
const CACHE_TTL = {
  business: 7 * 24 * 60 * 60,    // 7 days for business IPs
  consumer: 24 * 60 * 60,         // 24 hours for consumer IPs
  vpn: 6 * 60 * 60,               // 6 hours for VPN/proxy IPs
  unknown: 3 * 24 * 60 * 60,      // 3 days for unknown
};

// Known ISP patterns for consumer classification
const CONSUMER_ISPS = [
  'comcast', 'at&t', 'verizon', 'charter', 'cox', 'spectrum',
  'centurylink', 'frontier', 'optimum', 'xfinity', 'time warner',
  'suddenlink', 'windstream', 'mediacom', 'wow', 'rcn', 'bt group',
  'virgin media', 'sky broadband', 'talktalk', 'vodafone', 'orange',
  'telekom', 'swisscom', 'telstra', 'optus', 'rogers', 'bell canada'
];

/**
 * Enrich IP address with geolocation and company data
 * @param {string} ipAddress - IP address to enrich
 * @returns {object} Enriched IP data
 */
const enrichIP = async (ipAddress) => {
  try {
    // Step 1: Check cache first
    const cached = await getCachedEnrichment(ipAddress);
    if (cached) {
      return cached;
    }

    // Step 2: Call IPinfo.io API
    const enrichedData = await callIPinfoAPI(ipAddress);

    // Step 3: Classify visitor type
    const visitorType = classifyVisitor(enrichedData);
    enrichedData.visitor_type = visitorType;

    // Step 4: Cache the result with appropriate TTL
    await cacheEnrichment(ipAddress, enrichedData, visitorType);

    return enrichedData;
  } catch (error) {
    console.error('IP enrichment error:', error);
    return getDefaultEnrichment(ipAddress);
  }
};

/**
 * Get cached enrichment data from Redis
 * @param {string} ipAddress
 * @returns {object|null}
 */
const getCachedEnrichment = async (ipAddress) => {
  try {
    const cacheKey = `ip_enrichment:${ipAddress}`;
    const cached = await redisClient.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }
    
    return null;
  } catch (error) {
    console.error('Cache retrieval error:', error);
    return null;
  }
};

/**
 * Cache enrichment data in Redis
 * @param {string} ipAddress
 * @param {object} data
 * @param {string} visitorType
 */
const cacheEnrichment = async (ipAddress, data, visitorType) => {
  try {
    const cacheKey = `ip_enrichment:${ipAddress}`;
    const ttl = CACHE_TTL[visitorType] || CACHE_TTL.unknown;
    
    await redisClient.set(cacheKey, JSON.stringify(data), {
      EX: ttl,
    });
  } catch (error) {
    console.error('Cache storage error:', error);
  }
};

/**
 * Call IPinfo.io API
 * @param {string} ipAddress
 * @returns {object}
 */
const callIPinfoAPI = async (ipAddress) => {
  const url = `${IPINFO_API_URL}/${ipAddress}?token=${IPINFO_API_KEY}`;
  
  const response = await axios.get(url, {
    timeout: 3000,
  });

  const data = response.data;

  // Parse and structure the response
  return {
    ip: data.ip,
    city: data.city || null,
    region: data.region || null,
    country: data.country || null,
    postal_code: data.postal || null,
    latitude: data.loc ? parseFloat(data.loc.split(',')[0]) : null,
    longitude: data.loc ? parseFloat(data.loc.split(',')[1]) : null,
    timezone: data.timezone || null,
    organization: data.org || null,
    asn: data.asn?.asn || null,
    asn_name: data.asn?.name || data.org || null,
    asn_domain: data.asn?.domain || null,
    company_name: data.company?.name || null,
    company_domain: data.company?.domain || null,
    connection_type: data.company?.type || (data.privacy?.vpn ? 'vpn' : 'residential'),
    is_vpn: data.privacy?.vpn || false,
    is_proxy: data.privacy?.proxy || false,
    is_tor: data.privacy?.tor || false,
    is_hosting: data.privacy?.hosting || false,
  };
};

/**
 * Classify visitor based on enriched IP data
 * @param {object} data - Enriched IP data
 * @returns {string} - business, consumer, bot, or privacy_user
 */
const classifyVisitor = (data) => {
  // Privacy user (VPN, proxy, Tor)
  if (data.is_vpn || data.is_proxy || data.is_tor) {
    return 'vpn';
  }

  // Bot/Server (hosting provider)
  if (data.is_hosting) {
    return 'bot';
  }

  // Business visitor (company identified)
  if (data.company_name && data.company_domain) {
    return 'business';
  }

  // Consumer visitor (residential ISP)
  if (data.organization) {
    const orgLower = data.organization.toLowerCase();
    for (const isp of CONSUMER_ISPS) {
      if (orgLower.includes(isp)) {
        return 'consumer';
      }
    }
  }

  // Default to consumer
  return 'consumer';
};

/**
 * Get default enrichment data when API fails
 * @param {string} ipAddress
 * @returns {object}
 */
const getDefaultEnrichment = (ipAddress) => {
  return {
    ip: ipAddress,
    city: null,
    region: null,
    country: null,
    postal_code: null,
    latitude: null,
    longitude: null,
    timezone: null,
    organization: null,
    asn: null,
    asn_name: null,
    asn_domain: null,
    company_name: null,
    company_domain: null,
    connection_type: null,
    is_vpn: false,
    is_proxy: false,
    is_tor: false,
    is_hosting: false,
    visitor_type: 'unknown',
  };
};

/**
 * Manually invalidate cached IP data
 * @param {string} ipAddress
 */
const invalidateCache = async (ipAddress) => {
  try {
    const cacheKey = `ip_enrichment:${ipAddress}`;
    await redisClient.del(cacheKey);
    return true;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return false;
  }
};

/**
 * Get cache statistics
 * @returns {object}
 */
const getCacheStats = async () => {
  try {
    const keys = await redisClient.keys('ip_enrichment:*');
    return {
      cached_ips: keys.length,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return {
      cached_ips: 0,
    };
  }
};

module.exports = {
  enrichIP,
  invalidateCache,
  getCacheStats,
};
