/**
 * Google Ads Integration: Offline Conversion Import
 */
const axios = require('axios');

const GOOGLE_ADS_ENDPOINT = 'https://googleads.googleapis.com/v15';

/**
 * Map event data to Google Ads format
 */
const mapEventToGoogleAds = (eventData) => {
  return {
    conversions: [
      {
        gclid: eventData.gclid,
        conversionAction: eventData.conversionAction,
        conversionDateTime: new Date(eventData.timestamp).toISOString(),
        conversionValue: eventData.conversionValue || 0,
        currencyCode: eventData.currency || 'USD',
        // Optional: user identifiers for enhanced conversions
        userIdentifiers: [
          {
            hashedEmail: eventData.email_hash,
            hashedPhoneNumber: eventData.phone_hash,
            userAgent: eventData.user_agent,
            ipAddress: eventData.ip_address,
          },
        ],
        customVariables: [
          {
            key: 'event_name',
            value: eventData.event,
          },
          {
            key: 'page_url',
            value: eventData.page_url,
          },
        ],
      },
    ],
  };
};

/**
 * Send event to Google Ads
 */
const sendEvent = async (eventData, config) => {
  if (!config.customerId || !config.accessToken || !config.conversionAction) {
    throw new Error('Google Ads customer ID, access token, and conversion action required');
  }

  // Only send if GCLID present (for click tracking)
  if (!eventData.gclid) {
    return { success: true, skipped: true, reason: 'No GCLID' };
  }

  const payload = mapEventToGoogleAds({
    ...eventData,
    conversionAction: config.conversionAction,
  });

  try {
    await axios.post(
      `${GOOGLE_ADS_ENDPOINT}/customers/${config.customerId}/conversionUploads:upload`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.accessToken}`,
          'developer-token': config.developerToken,
        },
        timeout: 5000,
      }
    );

    return { success: true };
  } catch (error) {
    throw new Error(`Google Ads delivery failed: ${error.message}`);
  }
};

module.exports = {
  sendEvent,
  mapEventToGoogleAds,
};
