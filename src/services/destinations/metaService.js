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
const mapEventToMeta = (eventData, actionSource = 'website', eventPrefix = 'beacon') => {
  // Map event name to Meta format
  const eventName = eventData.event_name || eventData.event;
  
  // Standard Meta events should keep their format, custom events get prefix
  let metaEventName;
  if (eventName === 'page_view') {
    metaEventName = 'PageView';
  } else if (['Purchase', 'Lead', 'CompleteRegistration', 'AddToCart', 'InitiateCheckout', 'ViewContent'].includes(eventName)) {
    // Keep standard Meta event names as-is
    metaEventName = eventName;
  } else {
    // Add custom prefix to custom events for identification
    metaEventName = eventPrefix ? `${eventPrefix}_${eventName}` : eventName;
  }
  
  // Convert timestamp (milliseconds) to Unix timestamp (seconds)
  const eventTime = Math.floor((eventData.event_timestamp || eventData.timestamp || Date.now()) / 1000);
  
  return {
    data: [
      {
        event_name: metaEventName,
        event_time: eventTime,
        action_source: actionSource,
        event_id: eventData.event_id || eventData.eventId,
        user_data: {
          // Hashed PII for enhanced matching
          em: eventData.email_hash || null,
          ph: eventData.phone_hash || null,
          fn: eventData.first_name_hash || null,
          ln: eventData.last_name_hash || null,
          // Device info
          client_ip_address: eventData.ip_address || null,
          client_user_agent: eventData.user_agent || null,
          fbc: eventData.fbclid ? `fb.1.${Date.now()}.${eventData.fbclid}` : null,
          fbp: eventData.client_id ? `fb.1.${Date.now()}.${eventData.client_id}` : null,
        },
        custom_data: {
          value: eventData.properties?.value || null,
          currency: eventData.properties?.currency || 'USD',
          content_name: eventData.page_title || null,
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
  const eventPrefix = config.eventPrefix || 'beacon';
  const payload = mapEventToMeta(eventData, actionSource, eventPrefix);

  try {
    const response = await axios.post(
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

    console.log('[Meta] Event sent successfully to Dataset:', datasetId);
    return { success: true };
  } catch (error) {
    // Log detailed error info
    console.error('[Meta] Delivery failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      error: error.response?.data,
      eventName: eventData.event_name,
      datasetId: datasetId
    });
    throw new Error(`Meta delivery failed: ${error.message}`);
  }
};

module.exports = {
  sendEvent,
  mapEventToMeta,
  hashPII,
};
