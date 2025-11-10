/**
 * Beacon Tracking Script - Development Version
 * By Hype Insight
 * Version: 2.3.1
 *
 * This script collects user behavior data and sends it to the Beacon tracking server.
 * All data is collected server-side to bypass browser privacy restrictions.
 *
 * Usage:
 * <script>
 *   (function(w,d,s,o,f,js,fjs){
 *     w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
 *     js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
 *     js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
 *   }(window,document,'script','beacon','https://your-domain.com/beacon.js'));
 *   beacon('init', 'YOUR_SITE_ID');
 * </script>
 */

(function(window, document) {
  'use strict';

  // Configuration
  const VERSION = '2.3.1';
  const API_ENDPOINT = window.beaconConfig?.endpoint || 'http://localhost:3000/api/track';
  const BATCH_ENDPOINT = window.beaconConfig?.batchEndpoint || 'http://localhost:3000/api/track/batch';
  const BATCH_SIZE = 10;
  const BATCH_INTERVAL = 5000; // 5 seconds
  const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  const STORAGE_PREFIX = '_beacon_';

  // State
  let initialized = false;
  let siteId = null;
  let clientId = null;
  let sessionId = null;
  let sessionNumber = 0;
  let pageViewNumber = 0;
  let eventQueue = [];
  let batchTimer = null;
  let pageLoadTime = Date.now();
  let lastActivityTime = Date.now();
  let isFirstVisit = false;

  /**
   * Generate a UUID v4
   */
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Get or create client ID (persists for 2 years)
   */
  function getClientId() {
    const key = STORAGE_PREFIX + 'client_id';
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(key, id);
      isFirstVisit = true;
    }
    return id;
  }

  /**
   * Get or create session ID (expires after 30 minutes of inactivity)
   */
  function getSessionId() {
    const key = STORAGE_PREFIX + 'session_id';
    const timeKey = STORAGE_PREFIX + 'session_time';
    const numKey = STORAGE_PREFIX + 'session_number';
    
    const lastTime = parseInt(localStorage.getItem(timeKey) || '0');
    const now = Date.now();
    
    // Check if session expired
    if (now - lastTime > SESSION_TIMEOUT) {
      const id = generateUUID();
      const num = parseInt(localStorage.getItem(numKey) || '0') + 1;
      localStorage.setItem(key, id);
      localStorage.setItem(numKey, num.toString());
      sessionNumber = num;
      return id;
    }
    
    // Use existing session
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(key, id);
      localStorage.setItem(numKey, '1');
      sessionNumber = 1;
    } else {
      sessionNumber = parseInt(localStorage.getItem(numKey) || '1');
    }
    
    return id;
  }

  /**
   * Update session activity time
   */
  function updateSessionActivity() {
    const timeKey = STORAGE_PREFIX + 'session_time';
    localStorage.setItem(timeKey, Date.now().toString());
    lastActivityTime = Date.now();
  }

  /**
   * Get UTM parameters and track first/last touch attribution
   */
  function getAttributionData() {
    const params = new URLSearchParams(window.location.search);
    const referrer = document.referrer;
    
    // Current source data
    const currentSource = {
      utm_source: params.get('utm_source'),
      utm_medium: params.get('utm_medium'),
      utm_campaign: params.get('utm_campaign'),
      utm_term: params.get('utm_term'),
      utm_content: params.get('utm_content'),
      gclid: params.get('gclid'),
      fbclid: params.get('fbclid'),
      ttclid: params.get('ttclid'),
      referrer: referrer || null,
      referrer_hostname: referrer ? new URL(referrer).hostname : null,
    };
    
    // Check if this is a new source (has UTMs or external referrer)
    const hasNewSource = currentSource.utm_source || currentSource.gclid || currentSource.fbclid || 
      (currentSource.referrer && currentSource.referrer_hostname !== window.location.hostname);
    
    // FIRST TOUCH: Store forever in localStorage (never changes)
    const firstTouchKey = STORAGE_PREFIX + 'first_touch';
    let firstTouch = localStorage.getItem(firstTouchKey);
    if (!firstTouch && hasNewSource) {
      firstTouch = JSON.stringify(currentSource);
      localStorage.setItem(firstTouchKey, firstTouch);
    }
    
    // LAST TOUCH: Store in sessionStorage (updates each session)
    const lastTouchKey = STORAGE_PREFIX + 'last_touch';
    if (hasNewSource) {
      sessionStorage.setItem(lastTouchKey, JSON.stringify(currentSource));
    }
    
    // Parse stored attributions
    const firstTouchData = firstTouch ? JSON.parse(firstTouch) : {};
    const lastTouchData = sessionStorage.getItem(lastTouchKey) ? JSON.parse(sessionStorage.getItem(lastTouchKey)) : currentSource;
    
    return {
      // Last touch (current session source)
      utm_source: lastTouchData.utm_source,
      utm_medium: lastTouchData.utm_medium,
      utm_campaign: lastTouchData.utm_campaign,
      utm_term: lastTouchData.utm_term,
      utm_content: lastTouchData.utm_content,
      gclid: lastTouchData.gclid,
      fbclid: lastTouchData.fbclid,
      ttclid: lastTouchData.ttclid,
      
      // First touch (original source)
      first_utm_source: firstTouchData.utm_source,
      first_utm_medium: firstTouchData.utm_medium,
      first_utm_campaign: firstTouchData.utm_campaign,
      first_referrer: firstTouchData.referrer,
      first_referrer_hostname: firstTouchData.referrer_hostname,
    };
  }

  /**
   * Build base event data
   */
  function buildEventData(eventName, properties = {}) {
    const attribution = getAttributionData();
    const device = getDeviceData();
    const page = getPageData();

    return {
      event: eventName,
      siteId: siteId,
      clientId: clientId,
      sessionId: sessionId,
      timestamp: Date.now(),
      scriptVersion: VERSION,
      is_first_visit: isFirstVisit,
      session_number: sessionNumber,
      page_view_number: pageViewNumber,
      properties: {
        ...device,
        ...page,
        ...attribution,
        ...properties,
      },
    };
  }

  /**
   * Get device and browser data
   */
  function getDeviceData() {
    return {
      screen_resolution: screen.width + 'x' + screen.height,
      viewport_size: window.innerWidth + 'x' + window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio || 1,
      language: navigator.language || navigator.userLanguage,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Get page data
   */
  function getPageData() {
    return {
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      page_hostname: window.location.hostname,
      page_referrer: document.referrer || null,
      referrer_hostname: document.referrer ? new URL(document.referrer).hostname : null,
    };
  }


  /**
   * Send event to server
   */
  function sendEvent(eventData) {
    if (!navigator.sendBeacon) {
      // Fallback to fetch
      fetch(API_ENDPOINT + '/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true,
      }).catch(err => console.error('Beacon tracking error:', err));
    } else {
      const blob = new Blob([JSON.stringify(eventData)], { type: 'application/json' });
      navigator.sendBeacon(API_ENDPOINT + '/event', blob);
    }
  }

  /**
   * Add event to queue and process batch
   */
  function queueEvent(eventData) {
    eventQueue.push(eventData);
    
    if (eventQueue.length >= BATCH_SIZE) {
      flushQueue();
    } else if (!batchTimer) {
      batchTimer = setTimeout(flushQueue, BATCH_INTERVAL);
    }
  }

  /**
   * Flush event queue
   */
  function flushQueue() {
    if (eventQueue.length === 0) return;

    const events = eventQueue.splice(0);
    clearTimeout(batchTimer);
    batchTimer = null;

    fetch(BATCH_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    }).catch(err => console.error('Beacon batch error:', err));
  }

  /**
   * Track page view
   */
  function trackPageView() {
    pageViewNumber++;
    const eventData = buildEventData('page_view', {
      time_on_page_sec: 0,
    });
    queueEvent(eventData);
    updateSessionActivity();
  }

  /**
   * Track custom event
   */
  function track(eventName, properties = {}) {
    if (!initialized) {
      console.warn('Beacon not initialized. Call beacon("init", "SITE_ID") first.');
      return;
    }

    const eventData = buildEventData(eventName, properties);
    queueEvent(eventData);
    updateSessionActivity();
  }

  // Removed useless user_engagement tracking - it provides no value without actual interaction context

  /**
   * Track scroll depth
   */
  let maxScrollDepth = 0;
  function trackScroll() {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const scrollPercent = Math.floor((scrollTop / docHeight) * 100);
    
    if (scrollPercent > maxScrollDepth) {
      maxScrollDepth = scrollPercent;
      
      // Track at 25%, 50%, 75%, 100%
      if ([25, 50, 75, 100].includes(scrollPercent)) {
        track('scroll', {
          scroll_depth_percent: scrollPercent,
          scroll_depth_pixels: scrollTop,
        });
      }
    }
  }

  /**
   * Track clicks
   */
  function trackClick(event) {
    const element = event.target;
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'a' || tagName === 'button') {
      track('click', {
        element_type: tagName,
        element_text: element.textContent?.trim().substring(0, 100),
        element_id: element.id || null,
        element_class: element.className || null,
        target_url: element.href || null,
      });
    }
  }

  /**
   * Track form submissions (only successful ones)
   * Uses submit event which fires BEFORE validation, so we need to check validity
   */
  function trackFormSubmit(event) {
    const form = event.target;
    
    // Check if form is valid (HTML5 validation)
    if (form.checkValidity && !form.checkValidity()) {
      // Track form error
      trackFormError(form);
      return; // Don't track invalid form submissions
    }
    
    // For custom validation: only track if the submit wasn't prevented
    // We check after 100ms to see if an error message appeared
    setTimeout(() => {
      // If default was prevented or an error banner is visible, it's an error
      if (event.defaultPrevented) {
        return; // Form submission was blocked
      }
      
      // Check if error messages are visible (common pattern)
      const errorBanners = document.querySelectorAll('[class*="error"], [class*="alert"]');
      let hasVisibleError = false;
      errorBanners.forEach(el => {
        if (el.offsetParent !== null && el.textContent.includes('required')) {
          hasVisibleError = true;
        }
      });
      
      if (!hasVisibleError) {
        // No errors detected, track successful submit
        track('form_submit', {
          form_id: form.id || null,
          form_name: form.name || null,
          form_action: form.action || null,
        });
      }
    }, 100);
  }

  /**
   * Track form validation errors
   */
  function trackFormError(form) {
    const invalidFields = [];
    const errorMessages = [];
    
    // Get all invalid fields
    const fields = form.querySelectorAll('input, select, textarea');
    fields.forEach(field => {
      if (!field.validity.valid) {
        invalidFields.push({
          name: field.name || field.id || field.type,
          type: field.type,
          error: field.validationMessage
        });
        errorMessages.push(field.validationMessage);
      }
    });
    
    track('form_error', {
      form_id: form.id || null,
      form_name: form.name || null,
      invalid_field_count: invalidFields.length,
      invalid_fields: invalidFields,
      error_messages: errorMessages.join(', ')
    });
  }

  /**
   * Track e-commerce events
   */
  function trackEcommerce(eventName, productData) {
    if (!initialized) {
      console.warn('Beacon not initialized. Call beacon("init", "SITE_ID") first.');
      return;
    }
    
    const eventData = buildEventData(eventName, {});
    eventData.ecommerce = productData;
    queueEvent(eventData);
    updateSessionActivity();
  }

  /**
   * Universal form tracking
   * Only tracks successful submits - tracks error if error message appears
   */
  function setupFormTracking() {
    let lastFormSubmit = null;
    
    // Detect form submission attempts
    document.addEventListener('submit', function(e) {
      const form = e.target;
      if (form.tagName === 'FORM') {
        lastFormSubmit = {
          form_id: form.id || null,
          form_name: form.name || null,
          timestamp: Date.now()
        };
        
        // After 500ms, check if error messages are visible
        setTimeout(function() {
          if (!lastFormSubmit) return;
          
          // Check for visible error elements
          const errorElements = document.querySelectorAll('[class*="error"], [class*="alert"], [role="alert"]');
          let errorFound = false;
          
          errorElements.forEach(function(el) {
            if (el.offsetParent !== null) { // Is visible
              const text = el.textContent.toLowerCase();
              if (text.includes('required') || text.includes('error') || text.includes('invalid') || text.includes('must')) {
                if (!errorFound) { // Only track first error found
                  errorFound = true;
                  track('form_error', {
                    form_id: lastFormSubmit.form_id,
                    form_name: lastFormSubmit.form_name,
                    error_message: el.textContent.substring(0, 200)
                  });
                }
              }
            }
          });
          
          // If no error found, track successful submit
          if (!errorFound) {
            track('form_submit', {
              form_id: lastFormSubmit.form_id,
              form_name: lastFormSubmit.form_name
            });
          }
          
          lastFormSubmit = null;
        }, 500);
      }
    }, true);
  }

  /**
   * Track page unload
   */
  function trackUnload() {
    const timeOnPage = Math.floor((Date.now() - pageLoadTime) / 1000);
    const eventData = buildEventData('page_unload', {
      time_on_page_sec: timeOnPage,
      scroll_depth_percent: maxScrollDepth,
    });
    sendEvent(eventData); // Send immediately, don't queue
    flushQueue(); // Flush any pending events
  }

  /**
   * Set up dataLayer listener for e-commerce tracking
   * Works with Google Tag Manager, Shopify, WooCommerce, etc.
   * Supports both formats:
   * - Object: dataLayer.push({event: 'add_to_cart', ecommerce: {...}})
   * - GTM Args: dataLayer.push('event', 'add_to_cart', {...})
   */
  function setupDataLayerTracking() {
    // Create dataLayer if it doesn't exist
    window.dataLayer = window.dataLayer || [];
    
    // Helper to process a single event
    function processEvent(eventName, eventData) {
      console.log('[Beacon] dataLayer event detected:', eventName, eventData);
      
      // Ignore GTM internal events
      if (eventName.startsWith('gtm.')) {
        return;
      }
      
      // Track ALL events as custom events with the dataLayer data
      console.log('[Beacon] Tracking dataLayer event:', eventName);
      
      // Send immediately (don't queue) to prevent loss on form redirects
      if (!initialized) {
        console.warn('Beacon not initialized. Call beacon("init", "SITE_ID") first.');
        return;
      }
      
      const eventDataToSend = buildEventData('datalayer_' + eventName, eventData);
      sendEvent(eventDataToSend); // Send immediately, don't queue
      updateSessionActivity();
    }
    
    // Intercept dataLayer.push()
    var originalPush = window.dataLayer.push;
    window.dataLayer.push = function() {
      console.log('[Beacon] dataLayer.push called with:', arguments);
      var result = originalPush.apply(window.dataLayer, arguments);
      
      // Process each argument
      for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i];
        
        // GTM sometimes wraps in another Arguments object
        if (arg && typeof arg === 'object' && arg.length !== undefined && !Array.isArray(arg)) {
          // It's an Arguments-like object, check if it contains GTM format
          if (arg.length >= 3 && arg[0] === 'event' && typeof arg[1] === 'string') {
            console.log('[Beacon] Detected wrapped GTM format:', arg[1]);
            var eventName = arg[1];
            var eventData = arg[2] || {};
            processEvent(eventName, eventData);
            continue;
          }
        }
        
        // Direct GTM argument format: dataLayer.push('event', 'add_to_cart', {...})
        if (arguments.length >= 3 && arguments[0] === 'event' && typeof arguments[1] === 'string') {
          console.log('[Beacon] Detected direct GTM format:', arguments[1]);
          var eventName = arguments[1];
          var eventData = arguments[2] || {};
          processEvent(eventName, eventData);
          break;
        }
        
        // Standard object format: dataLayer.push({event: 'add_to_cart', ecommerce: {...}})
        if (arg && typeof arg === 'object' && arg.event) {
          console.log('[Beacon] Detected object format:', arg.event);
          processEvent(arg.event, arg);
        }
      }
      
      return result;
    };
    
    // Process any events already in dataLayer before we loaded
    if (window.dataLayer.length > 0) {
      window.dataLayer.forEach(function(event) {
        if (event && event.event && event.ecommerce) {
          // Re-push to trigger our interceptor
          window.dataLayer.push(event);
        }
      });
    }
  }

  /**
   * Initialize tracking
   */
  function init(id, options = {}) {
    if (initialized) return;

    siteId = id;
    clientId = getClientId();
    sessionId = getSessionId();
    initialized = true;

    // Track page view
    trackPageView();

    // Set up event listeners
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('click', trackClick, true);
    window.addEventListener('beforeunload', trackUnload);
    window.addEventListener('pagehide', trackUnload);
    
    // Set up universal form tracking
    setupFormTracking();
    
    // Set up dataLayer tracking
    setupDataLayerTracking();

    // Update activity on user interaction
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, updateSessionActivity, { passive: true });
    });

    console.log('Beacon initialized:', { siteId, clientId, sessionId });
  }

  /**
   * Public API
   */
  window.beacon = function(command, ...args) {
    switch (command) {
      case 'init':
        init(args[0], args[1]);
        break;
      case 'track':
        track(args[0], args[1]);
        break;
      case 'ecommerce':
        trackEcommerce(args[0], args[1]);
        break;
      default:
        console.warn('Unknown Beacon command:', command);
    }
  };

  // Process queued commands
  if (window.beacon && window.beacon.q) {
    window.beacon.q.forEach(args => window.beacon(...args));
  }

})(window, document);
