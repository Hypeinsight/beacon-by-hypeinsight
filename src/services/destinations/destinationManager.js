/**
 * Destination Manager: route events to configured platforms
 */
const ga4Service = require('./ga4Service');
const metaService = require('./metaService');
const googleAdsService = require('./googleAdsService');

/**
 * Send event to all configured destinations
 */
const routeEvent = async (eventData, siteConfig) => {
  if (!siteConfig || !siteConfig.destinations) {
    return { success: true, delivered: 0 };
  }

  const { destinations } = siteConfig;
  let delivered = 0;
  const results = {};

  // GA4
  if (destinations.ga4 && destinations.ga4.enabled) {
    // Check if event should be forwarded
    const allowedEvents = destinations.ga4.events || ['*'];
    const eventName = eventData.event_name || eventData.event;
    const shouldForward = allowedEvents.includes('*') || allowedEvents.includes(eventName);
    
    console.log('[GA4] Event check:', {
      event: eventData.event_name || eventData.event,
      allowedEvents,
      shouldForward,
      enabled: destinations.ga4.enabled
    });
    
    if (shouldForward) {
      try {
        console.log('[GA4] Sending event to GA4:', eventName);
        await ga4Service.sendEvent(eventData, destinations.ga4);
        delivered++;
        results.ga4 = { success: true };
        console.log('[GA4] Event sent successfully');
      } catch (error) {
        results.ga4 = { success: false, error: error.message };
        console.error('[GA4] Delivery failed:', error.message);
      }
    } else {
      console.log('[GA4] Event not forwarded (filtered out)');
    }
  } else {
    console.log('[GA4] Not enabled or not configured');
  }

  // Meta
  if (destinations.meta && destinations.meta.enabled) {
    try {
      await metaService.sendEvent(eventData, destinations.meta);
      delivered++;
      results.meta = { success: true };
    } catch (error) {
      results.meta = { success: false, error: error.message };
      console.error('Meta delivery failed:', error);
    }
  }

  // Google Ads
  if (destinations.googleAds && destinations.googleAds.enabled) {
    try {
      await googleAdsService.sendEvent(eventData, destinations.googleAds);
      delivered++;
      results.googleAds = { success: true };
    } catch (error) {
      results.googleAds = { success: false, error: error.message };
      console.error('Google Ads delivery failed:', error);
    }
  }

  return { success: true, delivered, results };
};

module.exports = {
  routeEvent,
};
