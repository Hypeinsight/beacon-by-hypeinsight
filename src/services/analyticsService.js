/**
 * Analytics Service: data aggregation for dashboards
 */
const db = require('../../config/database');

/**
 * Get overview metrics for a site or agency
 */
const getOverviewMetrics = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  // Total events
  const eventsResult = await db.query(
    `SELECT COUNT(*) as total, COUNT(DISTINCT session_id) as sessions, COUNT(DISTINCT client_id) as visitors
     FROM events
     WHERE site_id = $1 AND server_timestamp >= $2`,
    [siteId, startDate]
  );

  // Page views
  const pageViewsResult = await db.query(
    `SELECT COUNT(*) as page_views FROM events
     WHERE site_id = $1 AND event_name = 'page_view' AND server_timestamp >= $2`,
    [siteId, startDate]
  );

  // Top pages
  const topPagesResult = await db.query(
    `SELECT page_path, COUNT(*) as views FROM events
     WHERE site_id = $1 AND event_name = 'page_view' AND server_timestamp >= $2
     GROUP BY page_path
     ORDER BY views DESC
     LIMIT 10`,
    [siteId, startDate]
  );

  // Top referrers
  const topReferrersResult = await db.query(
    `SELECT referrer_hostname, COUNT(*) as count FROM events
     WHERE site_id = $1 AND referrer_hostname IS NOT NULL AND server_timestamp >= $2
     GROUP BY referrer_hostname
     ORDER BY count DESC
     LIMIT 5`,
    [siteId, startDate]
  );

  return {
    totalEvents: parseInt(eventsResult.rows[0].total),
    totalSessions: parseInt(eventsResult.rows[0].sessions),
    uniqueVisitors: parseInt(eventsResult.rows[0].visitors),
    pageViews: parseInt(pageViewsResult.rows[0].page_views),
    topPages: topPagesResult.rows,
    topReferrers: topReferrersResult.rows,
  };
};

/**
 * Get traffic sources breakdown
 */
const getTrafficSources = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT 
      utm_source, 
      utm_medium,
      COUNT(*) as visitors,
      COUNT(DISTINCT session_id) as sessions,
      SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as pageviews
     FROM events
     WHERE site_id = $1 AND server_timestamp >= $2
     GROUP BY utm_source, utm_medium
     ORDER BY visitors DESC`,
    [siteId, startDate]
  );

  return result.rows;
};

/**
 * Get device breakdown
 */
const getDeviceBreakdown = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT 
      device_category,
      browser,
      operating_system,
      COUNT(*) as count,
      COUNT(DISTINCT session_id) as sessions
     FROM events
     WHERE site_id = $1 AND device_category IS NOT NULL AND server_timestamp >= $2
     GROUP BY device_category, browser, operating_system
     ORDER BY count DESC`,
    [siteId, startDate]
  );

  return result.rows;
};

/**
 * Get geographic distribution
 */
const getGeographicDistribution = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT 
      ip_country,
      ip_region,
      ip_city,
      COUNT(*) as visitors,
      COUNT(DISTINCT session_id) as sessions
     FROM events
     WHERE site_id = $1 AND ip_country IS NOT NULL AND server_timestamp >= $2
     GROUP BY ip_country, ip_region, ip_city
     ORDER BY visitors DESC
     LIMIT 50`,
    [siteId, startDate]
  );

  return result.rows;
};

/**
 * Get time series data
 */
const getTimeSeriesData = async (siteId, dateRange = 30, groupBy = 'day') => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  let groupFormat;
  if (groupBy === 'hour') {
    groupFormat = "TO_CHAR(server_timestamp, 'YYYY-MM-DD HH:00')";
  } else if (groupBy === 'week') {
    groupFormat = "TO_CHAR(server_timestamp, 'YYYY-WW')";
  } else {
    groupFormat = "DATE(server_timestamp)";
  }

  const result = await db.query(
    `SELECT 
      ${groupFormat} as period,
      COUNT(*) as events,
      COUNT(DISTINCT session_id) as sessions,
      COUNT(DISTINCT client_id) as visitors,
      SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as pageviews
     FROM events
     WHERE site_id = $1 AND server_timestamp >= $2
     GROUP BY ${groupFormat}
     ORDER BY period ASC`,
    [siteId, startDate]
  );

  return result.rows;
};

/**
 * Get funnel analysis
 */
const getFunnelAnalysis = async (siteId, eventSequence = ['page_view', 'click', 'scroll'], dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const funnelSteps = [];

  for (let i = 0; i < eventSequence.length; i++) {
    const event = eventSequence[i];

    // Get users who completed this step and all previous steps
    let query = `
      SELECT COUNT(DISTINCT s.session_id) as count
      FROM sessions s
      WHERE s.site_id = $1 AND s.start_time >= $2
    `;

    const params = [siteId, startDate];

    for (let j = 0; j <= i; j++) {
      query += ` AND EXISTS (
        SELECT 1 FROM events e WHERE e.session_id = s.session_id
        AND e.event_name = $${j + 3} AND e.server_timestamp >= $2
      )`;
      params.push(eventSequence[j]);
    }

    const result = await db.query(query, params);
    funnelSteps.push({
      step: i + 1,
      event: event,
      count: parseInt(result.rows[0].count),
    });
  }

  // Calculate drop-off rates
  const withDropoff = funnelSteps.map((step, i) => {
    const prevCount = i > 0 ? funnelSteps[i - 1].count : funnelSteps[i].count;
    const dropoffRate = prevCount > 0 ? ((prevCount - step.count) / prevCount * 100).toFixed(1) : 0;
    return {
      ...step,
      dropoffRate: parseFloat(dropoffRate),
    };
  });

  return withDropoff;
};

/**
 * Get bounce rate
 */
const getBounceRate = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT 
      COUNT(*) as total_sessions,
      SUM(CASE WHEN is_bounce = true THEN 1 ELSE 0 END) as bounced
     FROM sessions
     WHERE site_id = $1 AND start_time >= $2`,
    [siteId, startDate]
  );

  const total = parseInt(result.rows[0].total_sessions);
  const bounced = parseInt(result.rows[0].bounced) || 0;

  return {
    totalSessions: total,
    bouncedSessions: bounced,
    bounceRate: total > 0 ? ((bounced / total) * 100).toFixed(1) : 0,
  };
};

/**
 * Get visitor segmentation
 */
const getVisitorSegmentation = async (siteId, dateRange = 30) => {
  const startDate = new Date(Date.now() - dateRange * 24 * 60 * 60 * 1000);

  const result = await db.query(
    `SELECT 
      visitor_type,
      COUNT(*) as count,
      COUNT(DISTINCT session_id) as sessions,
      SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as pageviews
     FROM events
     WHERE site_id = $1 AND server_timestamp >= $2
     GROUP BY visitor_type`,
    [siteId, startDate]
  );

  return result.rows;
};

module.exports = {
  getOverviewMetrics,
  getTrafficSources,
  getDeviceBreakdown,
  getGeographicDistribution,
  getTimeSeriesData,
  getFunnelAnalysis,
  getBounceRate,
  getVisitorSegmentation,
};
