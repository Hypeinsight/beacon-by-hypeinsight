const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * GET /api/debug/events
 * Returns aggregated event data for dashboard (filtered by user's agency)
 * Requires: Authentication
 */
router.get('/events', verifyJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    // Get sites for this agency
    const sitesResult = await db.query(
      'SELECT id FROM sites WHERE agency_id = $1 AND deleted_at IS NULL',
      [agencyId]
    );
    
    const siteIds = sitesResult.rows.map(s => s.id);
    
    if (siteIds.length === 0) {
      // User has no sites, return empty stats
      return res.json({
        total: 0,
        pageViews: 0,
        clicks: 0,
        forms: 0,
        visitors: 0,
        events: [],
      });
    }
    
    // Get total count for user's sites
    const totalResult = await db.query(
      'SELECT COUNT(*) as count FROM events WHERE site_id = ANY($1)',
      [siteIds]
    );
    const total = parseInt(totalResult.rows[0].count);

    // Get counts by event type for user's sites
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE event_name = 'page_view') as page_views,
        COUNT(*) FILTER (WHERE event_name = 'click') as clicks,
        COUNT(*) FILTER (WHERE event_name = 'form_submit') as forms,
        COUNT(DISTINCT client_id) as visitors
      FROM events
      WHERE site_id = ANY($1)
    `, [siteIds]);

    // Get recent events (last 500) for user's sites
    const eventsResult = await db.query(`
      SELECT 
        event_name,
        event_timestamp,
        client_id,
        page_title,
        browser,
        operating_system,
        ip_city,
        ip_country,
        ip_company_name,
        visitor_type,
        session_number,
        is_first_visit,
        time_on_page_sec as time_on_page,
        engagement_time_msec as engagement_time,
        scroll_depth_percent as scroll_depth,
        properties,
        properties->>'element_text' as element_text,
        properties->>'element_type' as element_type,
        properties->>'form_id' as form_id,
        properties->>'utm_source' as utm_source,
        properties->>'utm_medium' as utm_medium,
        properties->>'utm_campaign' as utm_campaign,
        properties->>'page_referrer' as page_referrer
      FROM events
      WHERE site_id = ANY($1)
      ORDER BY server_timestamp DESC
      LIMIT 500
    `, [siteIds]);

    res.json({
      total,
      pageViews: parseInt(statsResult.rows[0].page_views) || 0,
      clicks: parseInt(statsResult.rows[0].clicks) || 0,
      forms: parseInt(statsResult.rows[0].forms) || 0,
      visitors: parseInt(statsResult.rows[0].visitors) || 0,
      events: eventsResult.rows,
    });
  } catch (error) {
    console.error('Debug API error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/debug/test-ip/:ip
 * Test IP enrichment for any IP address
 */
router.get('/test-ip/:ip', async (req, res) => {
  try {
    const { enrichIP } = require('../services/ipEnrichmentService');
    const result = await enrichIP(req.params.ip);
    res.json(result);
  } catch (error) {
    console.error('IP test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
