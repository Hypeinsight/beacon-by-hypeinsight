/**
 * Tracking Service: handles event normalization, enrichment, and persistence.
 *
 * WHY: Centralizes all event processing so controllers remain thin and we can
 * consistently apply IP enrichment, user-agent parsing, validation, and mapping
 * to the database schema (65+ data points). This makes the pipeline testable and
 * easier to evolve as the schema grows.
 */
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const { enrichIP } = require('./ipEnrichmentService');
const { parseUserAgent } = require('../utils/userAgentParser');
const destinationManager = require('./destinations/destinationManager');
const scoringService = require('./scoringService');

/**
 * Look up site UUID from script_id
 * @param {string} scriptId - The script_id from the tracking script
 * @returns {Promise<string|null>} Site UUID or null if not found
 */
async function getSiteUUIDFromScriptId(scriptId) {
  if (!scriptId) return null;
  try {
    const result = await db.query('SELECT id FROM sites WHERE script_id = $1 AND status = $2', [scriptId, 'active']);
    return result.rows[0]?.id || null;
  } catch (err) {
    console.error('Error looking up site:', err);
    return null;
  }
}

/**
 * Normalize timestamp to milliseconds since epoch (BIGINT)
 * Accepts number, ISO string, or undefined (uses Date.now()).
 * @param {number|string|undefined} ts
 * @returns {number}
 */
function toMillis(ts) {
  if (typeof ts === 'number') return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return Number.isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

/**
 * Build an INSERT for events table. Only includes columns we have data for;
 * everything else defaults to NULL or DB defaults.
 * @param {object} e - normalized event object with all known fields
 * @returns {{text: string, values: any[]}}
 */
function buildInsertQuery(e) {
  const columns = [
    'site_id', 'event_name', 'event_id', 'event_timestamp', 'script_version',
    'client_id', 'user_id', 'session_id', 'email_hash', 'phone_hash', 'first_name_hash', 'last_name_hash',
    'user_agent', 'device_category', 'browser', 'browser_version', 'operating_system', 'screen_resolution', 'viewport_size', 'device_pixel_ratio', 'language', 'timezone',
    'ip_address', 'ip_city', 'ip_region', 'ip_country', 'ip_postal_code', 'ip_latitude', 'ip_longitude', 'ip_timezone', 'ip_organization', 'ip_asn', 'ip_asn_name', 'ip_asn_domain', 'ip_company_name', 'ip_company_domain', 'ip_connection_type', 'ip_is_vpn', 'ip_is_proxy', 'ip_is_tor', 'ip_is_hosting', 'visitor_type',
    'page_url', 'page_path', 'page_title', 'page_hostname', 'page_referrer', 'referrer_hostname',
    'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ttclid',
    'engagement_time_msec', 'scroll_depth_percent', 'scroll_depth_pixels', 'time_on_page_sec', 'is_first_visit', 'session_number', 'page_view_number', 'is_bounce',
    'ecommerce_data', 'lead_data', 'properties'
  ];

  const values = columns.map((c) => e[c] !== undefined ? e[c] : null);
  const params = values.map((_, idx) => `$${idx + 1}`);
  return {
    text: `INSERT INTO events (${columns.join(', ')}) VALUES (${params.join(', ')}) RETURNING id, event_id`,
    values,
  };
}

/**
 * Normalize raw input (controller payload) into event record ready for DB.
 * Performs IP enrichment and UA parsing.
 * @param {object} input - Raw event data from controller/request
 * @returns {Promise<object>} normalized event ready to insert
 */
async function normalizeEvent(input) {
  const {
    event, // event_name
    userId, sessionId, clientId, siteId,
    emailHash, phoneHash, firstNameHash, lastNameHash,
    timestamp, // client-side timestamp (ms or ISO)
    scriptVersion,
    userAgent,
    ipAddress,
    properties = {}, // catch-all extra data
    ecommerce = null,
    lead = null,
  } = input || {};

  // 1) Look up site UUID from script_id
  const siteUUID = await getSiteUUIDFromScriptId(siteId);
  if (!siteUUID) {
    throw new Error(`Invalid or inactive site: ${siteId}`);
  }

  // 2) Enrich IP (best-effort)
  const ipData = await enrichIP(ipAddress || '');

  // 3) Parse user agent
  const ua = parseUserAgent(userAgent || '');

  // 4) Extract optional page/referrer/utm/engagement fields from properties or top-level
  const pick = (k, fallback = null) => (input && input[k] !== undefined ? input[k] : (properties && properties[k] !== undefined ? properties[k] : fallback));

  const normalized = {
    // Core metadata
    site_id: siteUUID,
    event_name: event || 'custom_event',
    event_id: input.eventId || uuidv4(),
    event_timestamp: toMillis(timestamp),
    script_version: scriptVersion || pick('script_version', null),

    // User identification
    client_id: clientId || pick('client_id', null),
    user_id: userId || null,
    session_id: sessionId || pick('session_id', null),
    email_hash: emailHash || pick('email_hash', null),
    phone_hash: phoneHash || pick('phone_hash', null),
    first_name_hash: firstNameHash || pick('first_name_hash', null),
    last_name_hash: lastNameHash || pick('last_name_hash', null),

    // Device & browser
    user_agent: userAgent || null,
    device_category: ua.device_category || null,
    browser: ua.browser || null,
    browser_version: ua.browser_version || null,
    operating_system: ua.operating_system || null,
    screen_resolution: pick('screen_resolution', null),
    viewport_size: pick('viewport_size', null),
    device_pixel_ratio: pick('device_pixel_ratio', null),
    language: pick('language', null),
    timezone: pick('timezone', null),

    // IP & geo (from enrichment)
    ip_address: ipAddress || null,
    ip_city: ipData.city || null,
    ip_region: ipData.region || null,
    ip_country: ipData.country || null,
    ip_postal_code: ipData.postal_code || null,
    ip_latitude: ipData.latitude || null,
    ip_longitude: ipData.longitude || null,
    ip_timezone: ipData.timezone || null,
    ip_organization: ipData.organization || null,
    ip_asn: ipData.asn || null,
    ip_asn_name: ipData.asn_name || null,
    ip_asn_domain: ipData.asn_domain || null,
    ip_company_name: ipData.company_name || null,
    ip_company_domain: ipData.company_domain || null,
    ip_connection_type: ipData.connection_type || null,
    ip_is_vpn: ipData.is_vpn || false,
    ip_is_proxy: ipData.is_proxy || false,
    ip_is_tor: ipData.is_tor || false,
    ip_is_hosting: ipData.is_hosting || false,
    visitor_type: ipData.visitor_type || null,

    // Page & referral
    page_url: pick('page_url', null),
    page_path: pick('page_path', null),
    page_title: pick('page_title', null),
    page_hostname: pick('page_hostname', null),
    page_referrer: pick('page_referrer', null),
    referrer_hostname: pick('referrer_hostname', null),
    utm_source: pick('utm_source', null),
    utm_medium: pick('utm_medium', null),
    utm_campaign: pick('utm_campaign', null),
    utm_term: pick('utm_term', null),
    utm_content: pick('utm_content', null),
    gclid: pick('gclid', null),
    fbclid: pick('fbclid', null),
    ttclid: pick('ttclid', null),

    // Engagement & behavior
    engagement_time_msec: pick('engagement_time_msec', null),
    scroll_depth_percent: pick('scroll_depth_percent', null),
    scroll_depth_pixels: pick('scroll_depth_pixels', null),
    time_on_page_sec: pick('time_on_page_sec', null),
    is_first_visit: pick('is_first_visit', null),
    session_number: pick('session_number', null),
    page_view_number: pick('page_view_number', null),
    is_bounce: pick('is_bounce', null),

    // Flexible JSON payloads
    ecommerce_data: ecommerce || pick('ecommerce_data', null),
    lead_data: lead || pick('lead_data', null),
    properties: properties || {},
  };

  return normalized;
}

/**
 * Save a single event to the database with enrichment and mapping.
 * Marks site as connected if it's receiving its first event.
 * @param {object} eventData - raw event from controller (includes ipAddress, userAgent)
 * @returns {Promise<object>} inserted row (id, event_id)
 * @example
 * await saveEvent({ event: 'page_view', sessionId: 's1', userId: 'u1', ipAddress: '8.8.8.8', userAgent: '...' });
 */
const saveEvent = async (eventData) => {
  const e = await normalizeEvent(eventData);
  const { text, values } = buildInsertQuery(e);
  const result = await db.query(text, values);
  
  // Mark site as connected if first event
  if (e.site_id) {
    try {
      const siteCheck = await db.query(
        'SELECT is_connected, config FROM sites WHERE id = $1',
        [e.site_id]
      );
      
      if (siteCheck.rows.length && !siteCheck.rows[0].is_connected) {
        await db.query(
          'UPDATE sites SET is_connected = true, first_event_at = NOW() WHERE id = $1',
          [e.site_id]
        );
      }
      
      // Forward event to configured destinations (GA4, Meta, Google Ads)
      if (siteCheck.rows.length && siteCheck.rows[0].config) {
        try {
          // Get agency config for System User tokens
          let agencyConfig = null;
          try {
            const agencyResult = await db.query(
              'SELECT config FROM agencies WHERE id = (SELECT agency_id FROM sites WHERE id = $1)',
              [e.site_id]
            );
            if (agencyResult.rows.length > 0) {
              agencyConfig = agencyResult.rows[0].config;
            }
          } catch (agencyErr) {
            console.error('Error fetching agency config:', agencyErr);
          }
          
          await destinationManager.routeEvent(e, siteCheck.rows[0].config, agencyConfig);
        } catch (destErr) {
          console.error('Destination forwarding failed:', destErr);
          // Don't fail tracking if destination fails
        }
      }
    } catch (err) {
      console.error('Error marking site as connected:', err);
      // Don't fail the event tracking if site update fails
    }
  }
  
  // Update visitor score based on event (async, non-blocking)
  if (e.site_id && e.client_id && e.event_name) {
    scoringService.updateVisitorScore(
      e.site_id,
      e.client_id,
      e.session_id,
      e.event_name,
      e.event_id
    ).catch(err => {
      console.error('Error updating visitor score:', err);
      // Don't fail tracking if scoring fails
    });
  }
  
  return result.rows[0];
};

/**
 * Save multiple events in a transaction. Reuses ip/userAgent and enriches per event.
 * Marks sites as connected if receiving their first events.
 * @param {Array<object>} events - array of raw events (each can override fields)
 * @param {string} ipAddress - request IP address fallback for all events
 * @param {string} userAgent - request user agent fallback for all events
 * @returns {Promise<Array<object>>} inserted rows (id, event_id)
 */
const saveBatchEvents = async (events, ipAddress, userAgent) => {
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    const normalizedEvents = [];
    const siteIds = new Set();
      
      for (const ev of events) {
        const e = await normalizeEvent({
          ...ev,
          ipAddress: ev.ipAddress || ipAddress,
          userAgent: ev.userAgent || userAgent,
        });
        const { text, values } = buildInsertQuery(e);
        const res = await client.query(text, values);
        results.push(res.rows[0]);
        normalizedEvents.push(e);
        if (e.site_id) siteIds.add(e.site_id);
      }
      
      // Mark sites as connected if first events and forward to destinations
      for (const siteId of siteIds) {
        try {
          const siteCheck = await client.query(
            'SELECT is_connected, config FROM sites WHERE id = $1',
            [siteId]
          );
          
          if (siteCheck.rows.length && !siteCheck.rows[0].is_connected) {
            await client.query(
              'UPDATE sites SET is_connected = true, first_event_at = NOW() WHERE id = $1',
              [siteId]
            );
          }
          
          // Forward events to configured destinations (GA4, Meta, Google Ads)
          if (siteCheck.rows.length && siteCheck.rows[0].config) {
            const siteConfig = siteCheck.rows[0].config;
            
            // Get agency config for System User tokens
            let agencyConfig = null;
            try {
              const agencyResult = await client.query(
                'SELECT config FROM agencies WHERE id = (SELECT agency_id FROM sites WHERE id = $1)',
                [siteId]
              );
              if (agencyResult.rows.length > 0) {
                agencyConfig = agencyResult.rows[0].config;
              }
            } catch (agencyErr) {
              console.error('Error fetching agency config:', agencyErr);
            }
            
            // Forward each event for this site
            for (const normalizedEvent of normalizedEvents) {
              if (normalizedEvent.site_id === siteId) {
                try {
                  await destinationManager.routeEvent(normalizedEvent, siteConfig, agencyConfig);
                } catch (destErr) {
                  console.error('Destination forwarding failed for batch event:', destErr);
                }
              }
            }
          }
        } catch (err) {
          console.error('Error marking site as connected:', err);
        }
      }
      
      // Update visitor scores for all events (async, non-blocking after commit)
      setImmediate(() => {
        for (const e of normalizedEvents) {
          if (e.site_id && e.client_id && e.event_name) {
            scoringService.updateVisitorScore(
              e.site_id,
              e.client_id,
              e.session_id,
              e.event_name,
              e.event_id
            ).catch(err => {
              console.error('Error updating visitor score for batch event:', err);
            });
          }
        }
      });
      
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get events by user ID, newest first.
 * @param {string} userId
 * @param {number} [limit=50]
 * @param {number} [offset=0]
 * @returns {Promise<Array<object>>}
 */
const getEventsByUser = async (userId, limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM events
    WHERE user_id = $1
    ORDER BY server_timestamp DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [userId, limit, offset]);
  return result.rows;
};

/**
 * Get events by session ID, newest first.
 * @param {string} sessionId
 * @param {number} [limit=50]
 * @param {number} [offset=0]
 * @returns {Promise<Array<object>>}
 */
const getEventsBySession = async (sessionId, limit = 50, offset = 0) => {
  const query = `
    SELECT * FROM events
    WHERE session_id = $1
    ORDER BY server_timestamp DESC
    LIMIT $2 OFFSET $3
  `;
  const result = await db.query(query, [sessionId, limit, offset]);
  return result.rows;
};

module.exports = {
  saveEvent,
  saveBatchEvents,
  getEventsByUser,
  getEventsBySession,
};
