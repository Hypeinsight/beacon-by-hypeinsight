const express = require('express');
const router = express.Router();
const db = require('../../config/database');

/**
 * GET /api/debug/events
 * Returns aggregated event data for dashboard
 */
router.get('/events', async (req, res) => {
  try {
    // Get total count
    const totalResult = await db.query('SELECT COUNT(*) as count FROM events');
    const total = parseInt(totalResult.rows[0].count);

    // Get counts by event type
    const statsResult = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE event_name = 'page_view') as page_views,
        COUNT(*) FILTER (WHERE event_name = 'click') as clicks,
        COUNT(*) FILTER (WHERE event_name = 'form_submit') as forms,
        COUNT(DISTINCT client_id) as visitors
      FROM events
    `);

    // Get recent events (last 50)
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
        time_on_page_sec as time_on_page,
        engagement_time_msec as engagement_time,
        scroll_depth_percent as scroll_depth,
        properties->>'element_text' as element_text,
        properties->>'element_type' as element_type,
        properties->>'form_id' as form_id,
        properties->>'utm_source' as utm_source,
        properties->>'utm_medium' as utm_medium,
        properties->>'utm_campaign' as utm_campaign,
        properties->>'page_referrer' as page_referrer
      FROM events
      ORDER BY server_timestamp DESC
      LIMIT 500
    `);

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
