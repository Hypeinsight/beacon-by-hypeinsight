/**
 * Admin Service: super admin operations
 */
const db = require('../../config/database');

/**
 * Get all agencies (super_admin only)
 */
const getAllAgencies = async (limit = 50, offset = 0) => {
  const result = await db.query(
    `SELECT 
      a.id, a.name, a.email, a.status, a.created_at,
      COUNT(DISTINCT s.id) as site_count,
      COUNT(DISTINCT u.id) as user_count
     FROM agencies a
     LEFT JOIN sites s ON a.id = s.agency_id
     LEFT JOIN dashboard_users u ON a.id = u.agency_id
     GROUP BY a.id
     ORDER BY a.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await db.query('SELECT COUNT(*) FROM agencies');

  return {
    agencies: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Get agency details with statistics
 */
const getAgencyDetails = async (agencyId) => {
  const agencyResult = await db.query(
    `SELECT 
      a.*, 
      COUNT(DISTINCT s.id) as site_count
     FROM agencies a
     LEFT JOIN sites s ON a.id = s.agency_id
     WHERE a.id = $1
     GROUP BY a.id`,
    [agencyId]
  );

  if (agencyResult.rows.length === 0) {
    throw new Error('Agency not found');
  }

  const agency = agencyResult.rows[0];

  // Get users
  const usersResult = await db.query(
    `SELECT id, email, name, role, status, last_login
     FROM dashboard_users
     WHERE agency_id = $1`,
    [agencyId]
  );

  // Get sites
  const sitesResult = await db.query(
    `SELECT id, name, domain, script_id, status, created_at
     FROM sites
     WHERE agency_id = $1`,
    [agencyId]
  );

  // Get events count
  const eventsResult = await db.query(
    `SELECT COUNT(*) as event_count
     FROM events e
     JOIN sites s ON e.site_id = s.id
     WHERE s.agency_id = $1`,
    [agencyId]
  );

  return {
    agency,
    users: usersResult.rows,
    sites: sitesResult.rows,
    eventCount: parseInt(eventsResult.rows[0].event_count),
  };
};

/**
 * Get system statistics
 */
const getSystemStats = async () => {
  const agenciesResult = await db.query('SELECT COUNT(*) FROM agencies WHERE status = $1', ['active']);
  const usersResult = await db.query('SELECT COUNT(*) FROM dashboard_users WHERE status = $1', ['active']);
  const sitesResult = await db.query('SELECT COUNT(*) FROM sites WHERE status = $1', ['active']);
  const eventsResult = await db.query('SELECT COUNT(*) FROM events');
  const companiesResult = await db.query('SELECT COUNT(*) FROM companies');

  return {
    totalAgencies: parseInt(agenciesResult.rows[0].count),
    totalUsers: parseInt(usersResult.rows[0].count),
    totalSites: parseInt(sitesResult.rows[0].count),
    totalEvents: parseInt(eventsResult.rows[0].count),
    totalCompanies: parseInt(companiesResult.rows[0].count),
  };
};

module.exports = {
  getAllAgencies,
  getAgencyDetails,
  getSystemStats,
};
