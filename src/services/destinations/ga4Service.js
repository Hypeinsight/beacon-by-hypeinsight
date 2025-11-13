/**
 * GA4 Integration: Google Analytics 4 Measurement Protocol v2
 */
const axios = require('axios');

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

/**
 * Map event data to GA4 format
 */
const mapEventToGA4 = (eventData) => {
  // Prefix event name with 'beacon_' to avoid conflicts with native GA4 tracking
  const eventName = eventData.event || 'page_view';
  const ga4EventName = `beacon_${eventName}`;
  
  const params = {
    client_id: eventData.client_id || eventData.clientId || 'unknown',
    events: [
      {
        name: ga4EventName,
        params: {
          page_location: eventData.page_url,
          page_path: eventData.page_path,
          page_title: eventData.page_title,
          session_id: eventData.session_id || eventData.sessionId,
          engagement_time_msec: eventData.engagement_time_msec || 100,
          ...(eventData.user_id && { user_id: eventData.user_id }),
          // UTM parameters
          ...(eventData.utm_source && { utm_source: eventData.utm_source }),
          ...(eventData.utm_medium && { utm_medium: eventData.utm_medium }),
          ...(eventData.utm_campaign && { utm_campaign: eventData.utm_campaign }),
          ...(eventData.utm_term && { utm_term: eventData.utm_term }),
          ...(eventData.utm_content && { utm_content: eventData.utm_content }),
        },
      },
    ],
  };

  return params;
};

/**
 * Send event to GA4
 */
const sendEvent = async (eventData, config) => {
  if (!config.measurementId || !config.apiSecret) {
    throw new Error('GA4 measurement ID and API secret required');
  }

  const payload = mapEventToGA4(eventData);

  try {
    await axios.post(
      `${GA4_ENDPOINT}?measurement_id=${config.measurementId}&api_secret=${config.apiSecret}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      }
    );

    return { success: true };
  } catch (error) {
    throw new Error(`GA4 delivery failed: ${error.message}`);
  }
};

module.exports = {
  sendEvent,
  mapEventToGA4,
};
