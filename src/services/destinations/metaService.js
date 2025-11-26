/**
 * Meta Integration: Facebook Conversions API
 */
const axios = require('axios');
const crypto = require('crypto');

const META_ENDPOINT = 'https://graph.facebook.com/v18.0';

/**
 * Hash PII for enhanced matching
 */
const hashPII = (value) => {
  if (!value) return null;
  return crypto.createHash('sha256').update(value.toLowerCase().trim()).digest('hex');
};

/**
 * Map event data to Meta format
 */
const mapEventToMeta = (eventData, actionSource = 'website') => {
  return {
    data: [
      {
        event_name: eventData.event === 'page_view' ? 'PageView' : eventData.event,
        event_time: Math.floor(eventData.timestamp / 1000),
        action_source: actionSource,
        event_id: eventData.eventId,
        user_data: {
          // Hashed PII for enhanced matching
          em: eventData.email_hash,
          ph: eventData.phone_hash,
          fn: eventData.first_name_hash,
          ln: eventData.last_name_hash,
          // Device info
          client_ip_address: eventData.ip_address,
          client_user_agent: eventData.user_agent,
          fbc: eventData.fbclid ? `fb.1.${Date.now()}.${eventData.fbclid}` : null,
          fbp: `fb.1.${Date.now()}.${eventData.clientId}`,
        },
        custom_data: {
          value: eventData.properties?.value,
          currency: eventData.properties?.currency || 'USD',
          content_name: eventData.page_title,
          content_type: 'product',
        },
        ...(eventData.ecommerce_data && {
          custom_data: {
            ...eventData.ecommerce_data,
          },
        }),
      },
    ],
  };
};

/**
 * Send event to Meta
 * Supports both site-level tokens and agency-level System User tokens
 * Priority: site-level token → agency-level token
 */
const sendEvent = async (eventData, config, agencyConfig = null) => {
  // Support both datasetId and pixelId for backward compatibility
  const datasetId = config.datasetId || config.pixelId;
  
  if (!datasetId) {
    throw new Error('Meta Dataset ID (or Pixel ID) required');
  }

  // Determine which access token to use
  // Priority: site-level token > agency-level System User token
  let accessToken = config.accessToken;
  
  if (!accessToken && agencyConfig?.meta?.systemUserToken) {
    accessToken = agencyConfig.meta.systemUserToken;
    console.log('[Meta] Using agency-level System User token');
  }
  
  if (!accessToken) {
    throw new Error('Meta access token required (either site-level or agency System User token)');
  }

  // Use configured action_source or default to 'website'
  const actionSource = config.actionSource || 'website';
  const payload = mapEventToMeta(eventData, actionSource);

  try {
    await axios.post(
      `${META_ENDPOINT}/${datasetId}/events`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        timeout: 5000,
      }
    );

    return { success: true };
  } catch (error) {
    throw new Error(`Meta delivery failed: ${error.message}`);
  }
};

module.exports = {
  sendEvent,
  mapEventToMeta,
  hashPII,
};
