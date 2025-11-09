/**
 * Sites Service: handles site management business logic.
 *
 * WHY: Centralizes site CRUD operations, script generation, and agency isolation.
 * This enables multi-tenant architecture where each agency can manage multiple client sites.
 */
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique script ID for a site
 * @returns {string} Unique script ID (8 characters)
 */
function generateScriptId() {
  return uuidv4().replace(/-/g, '').substring(0, 16);
}

/**
 * Create a new site
 * @param {object} siteData - Site data
 * @param {string} siteData.name - Site name
 * @param {string} siteData.domain - Site domain
 * @param {string} [siteData.agencyId] - Agency ID (for multi-tenant)
 * @param {object} [siteData.config] - Site configuration
 * @returns {Promise<object>} Created site
 * @example
 * const site = await createSite({
 *   name: 'My Website',
 *   domain: 'example.com',
 *   agencyId: 'agency-123'
 * });
 */
const createSite = async (siteData) => {
  const { name, domain, agencyId, config = {} } = siteData;
  
  const scriptId = generateScriptId();
  
  const query = `
    INSERT INTO sites (id, agency_id, name, domain, script_id, config, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  
  const values = [
    uuidv4(),
    agencyId || null,
    name,
    domain,
    scriptId,
    JSON.stringify(config),
    'active',
  ];
  
  const result = await db.query(query, values);
  return result.rows[0];
};

/**
 * Get site by ID
 * @param {string} siteId - Site ID
 * @param {string} [agencyId] - Agency ID for isolation (optional)
 * @returns {Promise<object|null>} Site or null if not found
 */
const getSiteById = async (siteId, agencyId = null) => {
  let query = 'SELECT * FROM sites WHERE id = $1';
  const values = [siteId];
  
  if (agencyId) {
    query += ' AND agency_id = $2';
    values.push(agencyId);
  }
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Get site by script ID
 * @param {string} scriptId - Script ID
 * @returns {Promise<object|null>} Site or null if not found
 */
const getSiteByScriptId = async (scriptId) => {
  const query = 'SELECT * FROM sites WHERE script_id = $1';
  const result = await db.query(query, [scriptId]);
  return result.rows[0] || null;
};

/**
 * Get all sites (with optional agency filtering)
 * @param {object} options - Query options
 * @param {string} [options.agencyId] - Filter by agency
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit=50] - Results limit
 * @param {number} [options.offset=0] - Results offset
 * @returns {Promise<Array<object>>} Array of sites
 */
const getSites = async (options = {}) => {
  const { agencyId, status, limit = 50, offset = 0 } = options;
  
  let query = 'SELECT * FROM sites WHERE 1=1';
  const values = [];
  let paramCount = 1;
  
  if (agencyId) {
    query += ` AND agency_id = $${paramCount++}`;
    values.push(agencyId);
  }
  
  if (status) {
    query += ` AND status = $${paramCount++}`;
    values.push(status);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
  values.push(limit, offset);
  
  const result = await db.query(query, values);
  return result.rows;
};

/**
 * Update site
 * @param {string} siteId - Site ID
 * @param {object} updates - Fields to update
 * @param {string} [agencyId] - Agency ID for isolation
 * @returns {Promise<object|null>} Updated site or null
 */
const updateSite = async (siteId, updates, agencyId = null) => {
  const allowedFields = ['name', 'domain', 'config', 'status'];
  const updateFields = [];
  const values = [];
  let paramCount = 1;
  
  // Build SET clause dynamically
  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      updateFields.push(`${key} = $${paramCount++}`);
      values.push(key === 'config' ? JSON.stringify(updates[key]) : updates[key]);
    }
  });
  
  if (updateFields.length === 0) {
    throw new Error('No valid fields to update');
  }
  
  // Add updated_at
  updateFields.push(`updated_at = NOW()`);
  
  // Build WHERE clause
  let query = `UPDATE sites SET ${updateFields.join(', ')} WHERE id = $${paramCount++}`;
  values.push(siteId);
  
  if (agencyId) {
    query += ` AND agency_id = $${paramCount++}`;
    values.push(agencyId);
  }
  
  query += ' RETURNING *';
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Delete site (soft delete by setting status to 'deleted')
 * @param {string} siteId - Site ID
 * @param {string} [agencyId] - Agency ID for isolation
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
const deleteSite = async (siteId, agencyId = null) => {
  let query = `UPDATE sites SET status = 'deleted', updated_at = NOW() WHERE id = $1`;
  const values = [siteId];
  
  if (agencyId) {
    query += ' AND agency_id = $2';
    values.push(agencyId);
  }
  
  const result = await db.query(query, values);
  return result.rowCount > 0;
};

/**
 * Generate tracking script snippet for a site
 * @param {string} scriptId - Site script ID
 * @param {string} [serverUrl] - Beacon server URL
 * @returns {string} HTML script snippet
 */
const generateTrackingScript = (scriptId, serverUrl = 'http://localhost:3000') => {
  return `<!-- Beacon Tracking Script -->
<script>
  (function(w,d,s,o,f,js,fjs){
    w['BeaconObject']=o;w[o]=w[o]||function(){(w[o].q=w[o].q||[]).push(arguments)};
    js=d.createElement(s),fjs=d.getElementsByTagName(s)[0];
    js.id=o;js.src=f;js.async=1;fjs.parentNode.insertBefore(js,fjs);
  }(window,document,'script','beacon','${serverUrl}/beacon.js'));
  beacon('init', '${scriptId}');
</script>`;
};

/**
 * Get site statistics (event count, etc.)
 * @param {string} siteId - Site ID
 * @returns {Promise<object>} Site statistics
 */
const getSiteStats = async (siteId) => {
  const query = `
    SELECT 
      COUNT(*) as total_events,
      COUNT(DISTINCT session_id) as total_sessions,
      COUNT(DISTINCT client_id) as total_visitors,
      MAX(server_timestamp) as last_event
    FROM events
    WHERE site_id = $1
  `;
  
  const result = await db.query(query, [siteId]);
  return result.rows[0] || {
    total_events: 0,
    total_sessions: 0,
    total_visitors: 0,
    last_event: null,
  };
};

module.exports = {
  createSite,
  getSiteById,
  getSiteByScriptId,
  getSites,
  updateSite,
  deleteSite,
  generateTrackingScript,
  getSiteStats,
};
