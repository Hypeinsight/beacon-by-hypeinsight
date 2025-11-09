/**
 * Beacon Tracking Script - Development Version
 * By Hype Insight
 * Version: 1.0.0
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
  const VERSION = '1.0.0';
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
   * Get UTM parameters from URL or sessionStorage
   */
  function getUTMParams() {
    const params = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: params.get('utm_source') || sessionStorage.getItem(STORAGE_PREFIX + 'utm_source'),
      utm_medium: params.get('utm_medium') || sessionStorage.getItem(STORAGE_PREFIX + 'utm_medium'),
      utm_campaign: params.get('utm_campaign') || sessionStorage.getItem(STORAGE_PREFIX + 'utm_campaign'),
      utm_term: params.get('utm_term') || sessionStorage.getItem(STORAGE_PREFIX + 'utm_term'),
      utm_content: params.get('utm_content') || sessionStorage.getItem(STORAGE_PREFIX + 'utm_content'),
      gclid: params.get('gclid') || sessionStorage.getItem(STORAGE_PREFIX + 'gclid'),
      fbclid: params.get('fbclid') || sessionStorage.getItem(STORAGE_PREFIX + 'fbclid'),
      ttclid: params.get('ttclid') || sessionStorage.getItem(STORAGE_PREFIX + 'ttclid'),
    };

    // Persist UTM params in session
    Object.keys(utm).forEach(key => {
      if (utm[key]) {
        sessionStorage.setItem(STORAGE_PREFIX + key, utm[key]);
      }
    });

    return utm;
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
   * Build base event data
   */
  function buildEventData(eventName, properties = {}) {
    const utm = getUTMParams();
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
        ...utm,
        ...properties,
      },
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
   * Track form submissions
   */
  function trackFormSubmit(event) {
    const form = event.target;
    track('form_submit', {
      form_id: form.id || null,
      form_name: form.name || null,
      form_action: form.action || null,
    });
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
    document.addEventListener('submit', trackFormSubmit, true);
    window.addEventListener('beforeunload', trackUnload);
    window.addEventListener('pagehide', trackUnload);

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
      default:
        console.warn('Unknown Beacon command:', command);
    }
  };

  // Process queued commands
  if (window.beacon && window.beacon.q) {
    window.beacon.q.forEach(args => window.beacon(...args));
  }

})(window, document);
