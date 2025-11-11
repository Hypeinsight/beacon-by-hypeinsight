/**
 * Company Service: B2B company tracking and lead scoring
 */
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Calculate engagement score for a company
 */
const calculateEngagementScore = (metrics) => {
  let score = 0;

  // Recency (0-30 points): boost if visited recently
  const daysSinceLastSeen = Math.floor(
    (Date.now() - new Date(metrics.last_seen).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSinceLastSeen === 0) score += 30;
  else if (daysSinceLastSeen <= 7) score += 25;
  else if (daysSinceLastSeen <= 30) score += 15;
  else if (daysSinceLastSeen <= 90) score += 5;

  // Frequency (0-30 points): multiple visits = higher interest
  if (metrics.total_visits >= 50) score += 30;
  else if (metrics.total_visits >= 20) score += 25;
  else if (metrics.total_visits >= 10) score += 15;
  else if (metrics.total_visits >= 5) score += 10;
  else if (metrics.total_visits >= 2) score += 5;

  // Engagement (0-20 points): time on site indicates interest
  const avgTimePerVisit = metrics.total_visits > 0 ? metrics.duration_sec / metrics.total_visits : 0;
  if (avgTimePerVisit >= 300) score += 20; // 5+ minutes
  else if (avgTimePerVisit >= 180) score += 15; // 3+ minutes
  else if (avgTimePerVisit >= 60) score += 10; // 1+ minute
  else if (avgTimePerVisit >= 30) score += 5; // 30+ seconds

  // Pages (0-10 points): more pages = deeper exploration
  const avgPagesPerVisit = metrics.total_visits > 0 ? metrics.total_pageviews / metrics.total_visits : 0;
  if (avgPagesPerVisit >= 10) score += 10;
  else if (avgPagesPerVisit >= 5) score += 8;
  else if (avgPagesPerVisit >= 3) score += 6;
  else if (avgPagesPerVisit >= 2) score += 4;
  else if (avgPagesPerVisit >= 1) score += 2;

  // Conversions (0-10 points): if they convert, they're hot
  if (metrics.total_events >= 50) score += 10;
  else if (metrics.total_events >= 20) score += 8;
  else if (metrics.total_events >= 10) score += 6;
  else if (metrics.total_events >= 5) score += 4;
  else if (metrics.total_events >= 1) score += 2;

  return Math.min(score, 100); // Cap at 100
};

/**
 * Classify lead status based on engagement score
 */
const classifyLeadStatus = (score) => {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
};

/**
 * Upsert company from event data
 */
const upsertCompanyFromEvent = async (eventData) => {
  if (!eventData.ip_company_domain && !eventData.ip_company_name) {
    return null; // No company data
  }

  const domain = eventData.ip_company_domain || eventData.ip_company_name;

  // Check if company exists
  const existingResult = await db.query(
    'SELECT id FROM companies WHERE domain = $1',
    [domain]
  );

  if (existingResult.rows.length > 0) {
    // Company exists, will be updated by metrics
    return existingResult.rows[0].id;
  }

  // Create new company
  const result = await db.query(
    `INSERT INTO companies (id, name, domain, city, region, country, first_seen, last_seen, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), NOW())
     RETURNING id`,
    [uuidv4(), eventData.ip_company_name || domain, domain, eventData.ip_city, eventData.ip_region, eventData.ip_country]
  );

  return result.rows[0].id;
};

/**
 * Update company metrics
 */
const updateCompanyMetrics = async (companyDomain) => {
  if (!companyDomain) return;

  // Get all events for this company
  const eventsResult = await db.query(
    `SELECT 
      COUNT(DISTINCT session_id) as unique_sessions,
      COUNT(*) as total_events,
      SUM(CASE WHEN event_name = 'page_view' THEN 1 ELSE 0 END) as page_views,
      MAX(server_timestamp) as last_seen
     FROM events e
     JOIN sites s ON e.site_id = s.id
     WHERE e.ip_company_domain = $1`,
    [companyDomain]
  );

  if (eventsResult.rows.length === 0) return;

  const metrics = eventsResult.rows[0];

  // Get sessions to calculate duration
  const sessionsResult = await db.query(
    `SELECT SUM(COALESCE(duration_sec, 0)) as total_duration
     FROM sessions
     WHERE company_id IN (SELECT id FROM companies WHERE domain = $1)`,
    [companyDomain]
  );

  const totalDuration = sessionsResult.rows[0]?.total_duration || 0;

  // Calculate engagement score
  const engagementScore = calculateEngagementScore({
    total_visits: metrics.unique_sessions || 0,
    total_pageviews: metrics.page_views || 0,
    total_events: metrics.total_events || 0,
    duration_sec: totalDuration,
    last_seen: metrics.last_seen || new Date(),
  });

  const leadStatus = classifyLeadStatus(engagementScore);

  // Update company
  await db.query(
    `UPDATE companies
     SET total_visits = $1,
         total_pageviews = $2,
         total_events = $3,
         engagement_score = $4,
         lead_status = $5,
         last_seen = NOW(),
         updated_at = NOW()
     WHERE domain = $6`,
    [metrics.unique_sessions || 0, metrics.page_views || 0, metrics.total_events || 0, engagementScore, leadStatus, companyDomain]
  );
};

/**
 * Get all companies with optional filtering
 */
const getCompanies = async (agencyId, filters = {}, limit = 50, offset = 0) => {
  const { leadStatus, domain, sortBy = 'engagement_score' } = filters;

  let query = `
    SELECT c.*, COUNT(DISTINCT e.session_id) as sessions
    FROM companies c
    LEFT JOIN events e ON c.id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (leadStatus) {
    query += ` AND c.lead_status = $${params.length + 1}`;
    params.push(leadStatus);
  }

  if (domain) {
    query += ` AND c.domain ILIKE $${params.length + 1}`;
    params.push(`%${domain}%`);
  }

  query += ` GROUP BY c.id ORDER BY ${sortBy} DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);

  const countQuery = `
    SELECT COUNT(*) FROM companies WHERE 1=1
    ${leadStatus ? `AND lead_status = $1` : ''}
    ${domain ? `AND domain ILIKE $${leadStatus ? 2 : 1}` : ''}
  `;
  const countParams = [];
  if (leadStatus) countParams.push(leadStatus);
  if (domain) countParams.push(`%${domain}%`);

  const countResult = await db.query(countQuery, countParams);

  return {
    companies: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Get company details
 */
const getCompanyDetails = async (companyId) => {
  const companyResult = await db.query(
    'SELECT * FROM companies WHERE id = $1',
    [companyId]
  );

  if (companyResult.rows.length === 0) {
    throw new Error('Company not found');
  }

  const company = companyResult.rows[0];

  // Get recent sessions
  const sessionsResult = await db.query(
    `SELECT id, entry_page, exit_page, duration_sec, device_category, browser, start_time
     FROM sessions
     WHERE company_id = $1
     ORDER BY start_time DESC
     LIMIT 10`,
    [companyId]
  );

  // Get engagement timeline
  const timelineResult = await db.query(
    `SELECT DATE(server_timestamp) as date, COUNT(*) as events
     FROM events e
     WHERE e.ip_company_domain = $1
     GROUP BY DATE(server_timestamp)
     ORDER BY date DESC
     LIMIT 30`,
    [company.domain]
  );

  return {
    company,
    recentSessions: sessionsResult.rows,
    engagementTimeline: timelineResult.rows,
  };
};

/**
 * Export companies as CSV
 */
const exportCompanies = async (filters = {}) => {
  const { leadStatus } = filters;

  let query = 'SELECT name, domain, city, region, country, total_visits, total_pageviews, engagement_score, lead_status, last_seen FROM companies WHERE 1=1';
  const params = [];

  if (leadStatus) {
    query += ` AND lead_status = $${params.length + 1}`;
    params.push(leadStatus);
  }

  query += ' ORDER BY engagement_score DESC';

  const result = await db.query(query, params);

  // Convert to CSV
  const headers = ['Name', 'Domain', 'City', 'Region', 'Country', 'Visits', 'Pageviews', 'Engagement Score', 'Lead Status', 'Last Seen'];
  const rows = result.rows.map(c => [
    c.name,
    c.domain,
    c.city,
    c.region,
    c.country,
    c.total_visits,
    c.total_pageviews,
    c.engagement_score,
    c.lead_status,
    c.last_seen,
  ]);

  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(cell => `"${cell || ''}"`).join(',') + '\n';
  });

  return csv;
};

module.exports = {
  calculateEngagementScore,
  classifyLeadStatus,
  upsertCompanyFromEvent,
  updateCompanyMetrics,
  getCompanies,
  getCompanyDetails,
  exportCompanies,
};
