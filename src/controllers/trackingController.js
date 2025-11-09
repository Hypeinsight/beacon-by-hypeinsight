/**
 * Tracking Controller: handles HTTP requests for event tracking.
 *
 * WHY: Thin layer that validates input, extracts request metadata (IP, UA),
 * and delegates to trackingService for enrichment and persistence.
 */
const trackingService = require('../services/trackingService');
const cacheService = require('../services/cacheService');

/**
 * Track a single event.
 * Captures IP from request, merges body fields, and saves with full enrichment.
 *
 * @param {object} req - Express request
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
const trackEvent = async (req, res, next) => {
  try {
    // Extract IP address (check for proxied requests)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    
    // Build event data with all possible fields from request body
    const eventData = {
      // Core event fields
      event: req.body.event,
      siteId: req.body.siteId || req.body.site_id,
      
      // User identification
      userId: req.body.userId || req.body.user_id,
      sessionId: req.body.sessionId || req.body.session_id,
      clientId: req.body.clientId || req.body.client_id,
      
      // Hashed PII (if provided)
      emailHash: req.body.emailHash || req.body.email_hash,
      phoneHash: req.body.phoneHash || req.body.phone_hash,
      firstNameHash: req.body.firstNameHash || req.body.first_name_hash,
      lastNameHash: req.body.lastNameHash || req.body.last_name_hash,
      
      // Timestamps
      timestamp: req.body.timestamp,
      scriptVersion: req.body.scriptVersion || req.body.script_version,
      
      // Server-captured data
      ipAddress,
      userAgent: req.get('user-agent'),
      
      // E-commerce and lead data
      ecommerce: req.body.ecommerce,
      lead: req.body.lead,
      
      // Catch-all properties (includes page, utm, engagement, etc.)
      properties: req.body.properties || {},
      
      // Also merge top-level fields into properties for flexibility
      ...req.body,
    };

    const result = await trackingService.saveEvent(eventData);

    // Cache recent events for quick access (optional)
    if (eventData.userId) {
      await cacheService.cacheUserEvent(eventData.userId, result);
    }

    res.status(201).json({
      status: 'success',
      data: {
        eventId: result.event_id,
        tracked: true,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Track multiple events in a single batch request.
 * Each event can have its own fields, but IP/UA are shared from request.
 *
 * @param {object} req - Express request with req.body.events array
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
const trackBatch = async (req, res, next) => {
  try {
    const events = req.body.events || [];

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Events array is required and must not be empty',
      });
    }

    // Extract IP address (check for proxied requests)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    
    const results = await trackingService.saveBatchEvents(events, ipAddress, req.get('user-agent'));

    res.status(201).json({
      status: 'success',
      data: {
        tracked: results.length,
        eventIds: results.map(r => r.id),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get events by user ID with pagination.
 * Tries cache first for better performance.
 *
 * @param {object} req - Express request with params.userId
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
const getEventsByUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Try to get from cache first
    const cachedEvents = await cacheService.getCachedUserEvents(userId);
    if (cachedEvents) {
      return res.json({
        status: 'success',
        data: {
          events: cachedEvents,
          source: 'cache',
        },
      });
    }

    // Get from database
    const events = await trackingService.getEventsByUser(userId, parseInt(limit), parseInt(offset));

    res.json({
      status: 'success',
      data: {
        events,
        source: 'database',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get events by session ID with pagination.
 *
 * @param {object} req - Express request with params.sessionId
 * @param {object} res - Express response
 * @param {function} next - Express next middleware
 * @returns {Promise<void>}
 */
const getEventsBySession = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const events = await trackingService.getEventsBySession(sessionId, parseInt(limit), parseInt(offset));

    res.json({
      status: 'success',
      data: {
        events,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  trackEvent,
  trackBatch,
  getEventsByUser,
  getEventsBySession,
};
