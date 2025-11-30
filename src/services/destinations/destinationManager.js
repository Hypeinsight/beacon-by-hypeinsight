/**
 * Destination Manager: route events to configured platforms
 * DEPLOYED: 2025-11-30 01:58 UTC
 */
const ga4Service = require('./ga4Service');
const metaService = require('./metaService');
const googleAdsService = require('./googleAdsService');

console.log('[Destination Manager] Loaded - Version 2025-11-30 01:58 UTC');

/**
 * Send event to all configured destinations
 * @param {object} eventData - Normalized event data
 * @param {object} siteConfig - Site configuration including destinations
 * @param {object} agencyConfig - Agency-level configuration (optional)
 */
const routeEvent = async (eventData, siteConfig, agencyConfig = null) => {
  if (!siteConfig || !siteConfig.destinations) {
    return { success: true, delivered: 0 };
  }

  const { destinations } = siteConfig;
  let delivered = 0;
  const results = {};

  // DEBUG: Log entire config to see what's actually there
  console.log('[DEBUG] Full siteConfig:', JSON.stringify(siteConfig, null, 2));
  console.log('[DEBUG] destinations.meta exists?', !!destinations?.meta);
  console.log('[DEBUG] destinations.meta.enabled?', destinations?.meta?.enabled);

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
    // Check if event should be forwarded (same as GA4)
    const allowedEvents = destinations.meta.events || ['*'];
    const eventName = eventData.event_name || eventData.event;
    const shouldForward = allowedEvents.includes('*') || allowedEvents.includes(eventName);
    
    console.log('[Meta] Event check:', {
      event: eventData.event_name || eventData.event,
      allowedEvents,
      shouldForward,
      enabled: destinations.meta.enabled
    });
    
    if (shouldForward) {
      try {
        console.log('[Meta] Sending event to Meta:', eventName);
        await metaService.sendEvent(eventData, destinations.meta, agencyConfig);
        delivered++;
        results.meta = { success: true };
        console.log('[Meta] Event sent successfully');
      } catch (error) {
        results.meta = { success: false, error: error.message };
        console.error('[Meta] Delivery failed:', error.message);
      }
    } else {
      console.log('[Meta] Event not forwarded (filtered out)');
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
