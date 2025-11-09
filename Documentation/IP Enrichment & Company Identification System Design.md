# IP Enrichment & Company Identification System Design

## Overview

This document outlines the design for an IP-to-company enrichment system that will be integrated into the Warp server-side tracking solution. The system will identify companies visiting client websites by analyzing IP addresses and enriching visitor data with company information.

---

## Part 1: IP Enrichment Services Comparison

### Option 1: Clearbit Reveal API

**Capabilities:**
- Identifies company from IP address
- Provides full company profile (name, domain, industry, size, location)
- B2B-focused with high accuracy for business IPs
- Real-time API lookups

**Data Provided:**
- Company name
- Company domain
- Industry/sector
- Company size (employee count)
- Annual revenue
- Technology stack
- Social media profiles
- Company description
- Location (HQ address, city, state, country)
- Company type (public, private, non-profit)

**Pricing:**
- Premium service (typically $99-$999+/month)
- Usage-based pricing
- Higher accuracy for B2B identification

**Pros:**
- Most comprehensive company data
- High accuracy for business IPs
- Includes firmographic data
- Well-documented API

**Cons:**
- Most expensive option
- Overkill for basic IP-to-company needs
- May have rate limits

---

### Option 2: IPinfo.io (Recommended)

**Capabilities:**
- IP geolocation (city, region, country, coordinates)
- ASN (Autonomous System Number) data
- Company/organization name from IP
- ISP identification
- Privacy detection (VPN, proxy, hosting)
- Abuse contact information
- IP ranges for companies

**Data Provided:**
- IP address
- City, region, country, postal code
- Latitude/longitude
- Organization name (company or ISP)
- ASN (Autonomous System Number)
- ASN organization
- Company domain (for business IPs)
- Connection type (business, residential, hosting)
- Privacy flags (VPN, proxy, Tor, hosting)
- Abuse contact email

**Pricing:**
- Free tier: 50,000 requests/month
- Basic: $249/month - 250,000 requests
- Standard: $499/month - 500,000 requests
- Business: $999/month - 1,000,000 requests
- Enterprise: Custom pricing

**Pros:**
- Excellent balance of features and cost
- High request limits
- Fast response times (<30ms)
- Good company identification
- Privacy detection included
- Generous free tier for testing

**Cons:**
- Less detailed firmographic data than Clearbit
- Company data limited to organization name and domain

---

### Option 3: MaxMind GeoIP2

**Capabilities:**
- IP geolocation (city, country, coordinates)
- ISP/Organization name
- Connection type
- Anonymous IP detection
- Downloadable database (no per-query charges)

**Data Provided:**
- City, region, country, postal code
- Latitude/longitude
- ISP name
- Organization name
- Connection type (cable, cellular, corporate)
- Anonymous IP flags

**Pricing:**
- GeoIP2 Precision (API): $0.0005 per query
- GeoIP2 Database (downloadable): $180-$540/year
- ISP Database: $540/year

**Pros:**
- Downloadable database option (no per-query costs)
- Very fast lookups (local database)
- Predictable pricing
- No rate limits with database

**Cons:**
- Less detailed company data
- Database requires monthly updates
- Organization names less accurate than IPinfo

---

### Option 4: IP2Location

**Capabilities:**
- IP geolocation
- ISP and organization identification
- Usage type detection
- Proxy/VPN detection

**Data Provided:**
- Country, region, city, postal code
- Latitude/longitude
- ISP name
- Organization/company name
- Domain name
- Usage type (commercial, residential, government)
- Proxy/VPN detection

**Pricing:**
- Free tier: 500 queries/day
- Starter: $49/month - 30,000 queries
- Plus: $99/month - 100,000 queries
- Premium: $199/month - 300,000 queries

**Pros:**
- Affordable pricing
- Good coverage
- Usage type detection

**Cons:**
- Lower accuracy than IPinfo or Clearbit
- Smaller database
- Slower updates

---

## Part 2: Recommended Solution Architecture

### Primary Service: IPinfo.io

**Rationale:**
1. Best balance of cost, accuracy, and features
2. Generous free tier for initial testing
3. High request limits suitable for agency use
4. Fast API response times
5. Privacy detection helps filter out VPNs/proxies
6. Company domain extraction for business IPs

### Fallback Service: MaxMind GeoIP2 Database

**Rationale:**
1. Local database for offline lookups
2. No per-query costs
3. Backup when API is unavailable
4. Basic geolocation always available

---

## Part 3: Data Enrichment Flow

### Step 1: IP Capture
```
User visits client website
↓
Server captures IP address from request
↓
Store IP in tracking event data
```

### Step 2: IP Lookup & Enrichment
```
IP address received
↓
Check if IP is in cache (Redis/database)
  ├─ Yes → Return cached company data
  └─ No → Proceed to lookup
↓
Call IPinfo.io API with IP address
↓
Receive enriched data:
  - Company/organization name
  - Domain
  - Location (city, region, country)
  - ASN information
  - Connection type
  - Privacy flags
↓
Cache result for 24-48 hours
↓
Return enriched data to tracking system
```

### Step 3: Company Identification Logic
```
Analyze IPinfo response
↓
Check "org" field for company name
↓
Check "company" field (if available in plan)
↓
Determine if IP is:
  ├─ Business IP (company identified)
  ├─ ISP/Residential (consumer)
  ├─ Hosting/Cloud (server, bot)
  └─ VPN/Proxy (privacy tool)
↓
Tag visitor accordingly
↓
Store enriched data with event
```

---

## Part 4: Data Structure

### Enriched IP Data Object

```json
{
  "ip": "8.8.8.8",
  "hostname": "dns.google",
  "city": "Mountain View",
  "region": "California",
  "country": "US",
  "country_name": "United States",
  "postal": "94035",
  "latitude": 37.386,
  "longitude": -122.0838,
  "timezone": "America/Los_Angeles",
  "org": "AS15169 Google LLC",
  "asn": {
    "asn": "AS15169",
    "name": "Google LLC",
    "domain": "google.com",
    "route": "8.8.8.0/24",
    "type": "hosting"
  },
  "company": {
    "name": "Google LLC",
    "domain": "google.com",
    "type": "hosting"
  },
  "privacy": {
    "vpn": false,
    "proxy": false,
    "tor": false,
    "relay": false,
    "hosting": true
  },
  "abuse": {
    "address": "US, CA, Mountain View, 1600 Amphitheatre Parkway, 94043",
    "country": "US",
    "email": "network-abuse@google.com",
    "name": "Abuse",
    "network": "8.8.8.0/24",
    "phone": "+1-650-253-0000"
  },
  "visitor_type": "business",
  "is_identifiable": true
}
```

---

## Part 5: Visitor Classification System

### Classification Rules

**Business Visitor (High Value)**
- Company name identified in "org" or "company" field
- Not flagged as ISP/residential
- Not using VPN/proxy
- ASN type is "business" or "education"

**Consumer Visitor (Standard Value)**
- ISP identified (Comcast, AT&T, Verizon, etc.)
- Residential connection type
- No company domain identified

**Bot/Server (Filter Out)**
- Hosting provider identified
- Cloud provider (AWS, Azure, GCP)
- ASN type is "hosting"

**Privacy User (Unknown)**
- VPN, proxy, or Tor detected
- Cannot reliably identify

### Tagging Strategy

```javascript
function classifyVisitor(ipData) {
  if (ipData.privacy.vpn || ipData.privacy.proxy || ipData.privacy.tor) {
    return {
      type: 'privacy_user',
      identifiable: false,
      priority: 'low'
    };
  }
  
  if (ipData.privacy.hosting || ipData.asn.type === 'hosting') {
    return {
      type: 'bot_or_server',
      identifiable: false,
      priority: 'exclude'
    };
  }
  
  if (ipData.company && ipData.company.name && ipData.company.domain) {
    return {
      type: 'business',
      identifiable: true,
      priority: 'high',
      company_name: ipData.company.name,
      company_domain: ipData.company.domain
    };
  }
  
  if (isISP(ipData.org)) {
    return {
      type: 'consumer',
      identifiable: false,
      priority: 'standard'
    };
  }
  
  return {
    type: 'unknown',
    identifiable: false,
    priority: 'low'
  };
}

function isISP(orgName) {
  const ispKeywords = [
    'Comcast', 'AT&T', 'Verizon', 'Charter', 'Cox',
    'Spectrum', 'CenturyLink', 'Frontier', 'Optimum',
    'Xfinity', 'T-Mobile', 'Sprint', 'Vodafone', 'BT',
    'Virgin', 'Sky', 'TalkTalk', 'Orange', 'Telefonica'
  ];
  
  return ispKeywords.some(isp => orgName.includes(isp));
}
```

---

## Part 6: Caching Strategy

### Why Cache?

1. **Cost Reduction**: Avoid redundant API calls for same IPs
2. **Performance**: Instant lookups for cached IPs
3. **Rate Limit Management**: Stay within API quotas
4. **Reliability**: Serve cached data if API is down

### Cache Implementation

**Storage Options:**
1. **Redis** (Recommended)
   - Fast in-memory lookups
   - TTL (time-to-live) support
   - Distributed caching
   - Easy to scale

2. **Database Table**
   - Persistent storage
   - Queryable for analytics
   - Slower than Redis

3. **Hybrid Approach**
   - Redis for hot cache (recent IPs)
   - Database for long-term storage

### Cache Key Structure

```
ip_enrichment:{ip_address}
```

Example:
```
ip_enrichment:8.8.8.8
```

### Cache TTL (Time-to-Live)

- **Business IPs**: 7 days (company data rarely changes)
- **Consumer IPs**: 24 hours (dynamic IPs change frequently)
- **VPN/Proxy IPs**: 6 hours (users may switch servers)
- **Unknown IPs**: 3 days

### Cache Invalidation

- Manual invalidation for known data changes
- Automatic expiration via TTL
- LRU (Least Recently Used) eviction for memory management

---

## Part 7: API Integration Code Example

### IPinfo.io Integration (PHP)

```php
<?php

class IPEnrichmentService {
    private $apiKey;
    private $cache;
    private $baseUrl = 'https://ipinfo.io/';
    
    public function __construct($apiKey, $cacheInstance) {
        $this->apiKey = $apiKey;
        $this->cache = $cacheInstance;
    }
    
    /**
     * Enrich IP address with company and location data
     */
    public function enrichIP($ipAddress) {
        // Check cache first
        $cacheKey = "ip_enrichment:{$ipAddress}";
        $cachedData = $this->cache->get($cacheKey);
        
        if ($cachedData !== false) {
            return json_decode($cachedData, true);
        }
        
        // Make API call
        $url = $this->baseUrl . $ipAddress . '?token=' . $this->apiKey;
        $response = $this->makeRequest($url);
        
        if ($response === false) {
            // Fallback to basic data
            return $this->getBasicIPData($ipAddress);
        }
        
        $data = json_decode($response, true);
        
        // Enrich with classification
        $data['visitor_classification'] = $this->classifyVisitor($data);
        
        // Cache the result
        $ttl = $this->getCacheTTL($data);
        $this->cache->set($cacheKey, json_encode($data), $ttl);
        
        return $data;
    }
    
    /**
     * Classify visitor based on IP data
     */
    private function classifyVisitor($ipData) {
        // Check for privacy tools
        if (isset($ipData['privacy'])) {
            if ($ipData['privacy']['vpn'] || $ipData['privacy']['proxy'] || $ipData['privacy']['tor']) {
                return [
                    'type' => 'privacy_user',
                    'identifiable' => false,
                    'priority' => 'low'
                ];
            }
            
            if ($ipData['privacy']['hosting']) {
                return [
                    'type' => 'bot_or_server',
                    'identifiable' => false,
                    'priority' => 'exclude'
                ];
            }
        }
        
        // Check for company
        if (isset($ipData['company']) && !empty($ipData['company']['name'])) {
            return [
                'type' => 'business',
                'identifiable' => true,
                'priority' => 'high',
                'company_name' => $ipData['company']['name'],
                'company_domain' => $ipData['company']['domain'] ?? null
            ];
        }
        
        // Check if ISP
        if ($this->isISP($ipData['org'] ?? '')) {
            return [
                'type' => 'consumer',
                'identifiable' => false,
                'priority' => 'standard'
            ];
        }
        
        return [
            'type' => 'unknown',
            'identifiable' => false,
            'priority' => 'low'
        ];
    }
    
    /**
     * Check if organization is an ISP
     */
    private function isISP($orgName) {
        $ispKeywords = [
            'Comcast', 'AT&T', 'Verizon', 'Charter', 'Cox',
            'Spectrum', 'CenturyLink', 'Frontier', 'Optimum',
            'Xfinity', 'T-Mobile', 'Sprint', 'Vodafone', 'BT'
        ];
        
        foreach ($ispKeywords as $keyword) {
            if (stripos($orgName, $keyword) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Determine cache TTL based on visitor type
     */
    private function getCacheTTL($ipData) {
        $classification = $ipData['visitor_classification'] ?? [];
        
        switch ($classification['type'] ?? 'unknown') {
            case 'business':
                return 7 * 24 * 3600; // 7 days
            case 'consumer':
                return 24 * 3600; // 24 hours
            case 'privacy_user':
                return 6 * 3600; // 6 hours
            default:
                return 3 * 24 * 3600; // 3 days
        }
    }
    
    /**
     * Make HTTP request to API
     */
    private function makeRequest($url) {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json'
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode !== 200) {
            return false;
        }
        
        return $response;
    }
    
    /**
     * Fallback to basic IP data when API fails
     */
    private function getBasicIPData($ipAddress) {
        return [
            'ip' => $ipAddress,
            'visitor_classification' => [
                'type' => 'unknown',
                'identifiable' => false,
                'priority' => 'low'
            ]
        ];
    }
}

// Usage example
$cache = new Redis();
$cache->connect('127.0.0.1', 6379);

$enrichment = new IPEnrichmentService('YOUR_IPINFO_API_KEY', $cache);
$visitorData = $enrichment->enrichIP($_SERVER['REMOTE_ADDR']);

// Now you have enriched visitor data
if ($visitorData['visitor_classification']['type'] === 'business') {
    $companyName = $visitorData['visitor_classification']['company_name'];
    $companyDomain = $visitorData['visitor_classification']['company_domain'];
    
    // Log high-value business visitor
    error_log("Business visitor from: {$companyName} ({$companyDomain})");
}
```

---

## Part 8: Cost Analysis

### Scenario: Agency with 50 Client Sites

**Assumptions:**
- Average 10,000 unique visitors per site per month
- 500,000 total unique IPs per month across all clients
- 30% repeat visitors (cached lookups)
- 350,000 API calls per month

### IPinfo.io Pricing

**Standard Plan: $499/month**
- 500,000 requests included
- Fits perfectly within limits
- $0.001 per additional request

**Annual Cost:** $5,988/year

**Cost per Client:** $99.80/month ($499 ÷ 50 clients)

### Revenue Model

**Charge clients:** $25-50/month for IP enrichment feature
- 50 clients × $35/month = $1,750/month revenue
- Cost: $499/month
- **Profit: $1,251/month ($15,012/year)**

### ROI Calculation

**Investment:** $499/month
**Revenue:** $1,750/month
**ROI:** 251% (3.5x return)

---

## Part 9: Privacy & Compliance

### GDPR Compliance

**IP Address as PII:**
- IP addresses are considered personal data under GDPR
- Must have legal basis for processing (legitimate interest)
- Must inform users in privacy policy
- Must allow opt-out

**Mitigation Strategies:**
1. **Anonymize IPs**: Hash or truncate last octet
2. **Consent**: Obtain consent for tracking
3. **Legitimate Interest**: Document business justification
4. **Data Minimization**: Only collect necessary data
5. **Retention Limits**: Delete old IP data after 90 days

### CCPA Compliance

**Requirements:**
- Disclose IP collection in privacy policy
- Provide opt-out mechanism
- Do not sell IP data to third parties

### Best Practices

1. **Transparency**: Clear privacy policy
2. **Consent Management**: Cookie consent banner
3. **Data Security**: Encrypt IP data in transit and at rest
4. **Access Controls**: Limit who can view IP data
5. **Audit Logs**: Track IP data access

---

## Part 10: Implementation Roadmap

### Phase 1: MVP (Weeks 1-2)
- [ ] Set up IPinfo.io account
- [ ] Implement basic IP lookup
- [ ] Create caching layer (Redis)
- [ ] Build visitor classification logic
- [ ] Test with sample IPs

### Phase 2: Integration (Weeks 3-4)
- [ ] Integrate with Warp tracking script
- [ ] Add IP enrichment to event pipeline
- [ ] Store enriched data in database
- [ ] Create API endpoint for dashboard

### Phase 3: Dashboard (Weeks 5-6)
- [ ] Build company visitor report
- [ ] Create visitor classification charts
- [ ] Add geographic heatmap
- [ ] Implement filtering and search

### Phase 4: Optimization (Weeks 7-8)
- [ ] Optimize cache hit rate
- [ ] Implement batch processing
- [ ] Add error handling and retries
- [ ] Performance testing and tuning

### Phase 5: Launch (Week 9)
- [ ] Beta testing with select clients
- [ ] Gather feedback
- [ ] Fix bugs and refine
- [ ] Full rollout

---

## Summary

**Recommended Solution:**
- **Primary**: IPinfo.io Standard Plan ($499/month)
- **Caching**: Redis for performance and cost savings
- **Classification**: Business, Consumer, Bot, Privacy User
- **Pricing**: $25-50/month per client
- **ROI**: 251% (highly profitable)

**Key Benefits:**
1. Identify high-value business visitors
2. Enrich analytics with company data
3. Improve targeting and personalization
4. Increase conversion rates
5. Competitive advantage for agency

**Next Steps:**
1. Sign up for IPinfo.io free trial
2. Test IP enrichment with sample data
3. Build MVP integration
4. Design dashboard mockups
5. Pilot with 3-5 clients
