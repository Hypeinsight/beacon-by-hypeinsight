/**
 * Agencies Service: handles agency management business logic.
 *
 * WHY: Centralizes agency CRUD operations for multi-tenant support.
 * Agencies can manage multiple sites and have isolated data access.
 */
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcrypt');

/**
 * Create a new agency
 * @param {object} agencyData - Agency data
 * @param {string} agencyData.name - Agency name
 * @param {string} [agencyData.email] - Agency contact email
 * @param {string} [agencyData.apiKey] - Custom API key (auto-generated if not provided)
 * @param {object} [agencyData.config] - Agency configuration
 * @returns {Promise<object>} Created agency
 * @example
 * const agency = await createAgency({
 *   name: 'Marketing Agency Inc',
 *   email: 'contact@agency.com'
 * });
 */
const createAgency = async (agencyData) => {
  const { name, email, apiKey, config = {} } = agencyData;
  
  // Generate API key if not provided
  const generatedApiKey = apiKey || `beacon_${uuidv4().replace(/-/g, '')}`;
  
  // Hash the API key for secure storage
  const hashedApiKey = await bcrypt.hash(generatedApiKey, 10);
  
  const query = `
    INSERT INTO agencies (id, name, email, api_key, config, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, name, email, config, status, created_at, updated_at
  `;
  
  const values = [
    uuidv4(),
    name,
    email || null,
    hashedApiKey,
    JSON.stringify(config),
    'active',
  ];
  
  const result = await db.query(query, values);
  
  // Return agency with plain API key (only time it's visible)
  return {
    ...result.rows[0],
    apiKey: generatedApiKey, // Include plain key in response
  };
};

/**
 * Get agency by ID
 * @param {string} agencyId - Agency ID
 * @returns {Promise<object|null>} Agency or null if not found
 */
const getAgencyById = async (agencyId) => {
  const query = 'SELECT id, name, email, config, status, created_at, updated_at FROM agencies WHERE id = $1';
  const result = await db.query(query, [agencyId]);
  return result.rows[0] || null;
};

/**
 * Get agency by API key
 * @param {string} apiKey - Plain API key
 * @returns {Promise<object|null>} Agency or null if not found
 * @description Used for authentication - verifies API key against hashed version
 */
const getAgencyByApiKey = async (apiKey) => {
  // Get all agencies (in production, this should be optimized)
  const query = 'SELECT * FROM agencies WHERE status = $1';
  const result = await db.query(query, ['active']);
  
  // Compare provided key against hashed keys
  for (const agency of result.rows) {
    const match = await bcrypt.compare(apiKey, agency.api_key);
    if (match) {
      // Return agency without api_key field
      const { api_key, ...agencyData } = agency;
      return agencyData;
    }
  }
  
  return null;
};

/**
 * Get all agencies
 * @param {object} options - Query options
 * @param {string} [options.status] - Filter by status
 * @param {number} [options.limit=50] - Results limit
 * @param {number} [options.offset=0] - Results offset
 * @returns {Promise<Array<object>>} Array of agencies
 */
const getAgencies = async (options = {}) => {
  const { status, limit = 50, offset = 0 } = options;
  
  let query = 'SELECT id, name, email, config, status, created_at, updated_at FROM agencies WHERE 1=1';
  const values = [];
  let paramCount = 1;
  
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
 * Update agency
 * @param {string} agencyId - Agency ID
 * @param {object} updates - Fields to update
 * @returns {Promise<object|null>} Updated agency or null
 */
const updateAgency = async (agencyId, updates) => {
  const allowedFields = ['name', 'email', 'config', 'status'];
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
  
  // Build query
  let query = `UPDATE agencies SET ${updateFields.join(', ')} WHERE id = $${paramCount++}`;
  values.push(agencyId);
  
  query += ' RETURNING id, name, email, config, status, created_at, updated_at';
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
};

/**
 * Regenerate API key for an agency
 * @param {string} agencyId - Agency ID
 * @returns {Promise<object>} Agency with new API key
 */
const regenerateApiKey = async (agencyId) => {
  const newApiKey = `beacon_${uuidv4().replace(/-/g, '')}`;
  const hashedApiKey = await bcrypt.hash(newApiKey, 10);
  
  const query = `
    UPDATE agencies 
    SET api_key = $1, updated_at = NOW() 
    WHERE id = $2 
    RETURNING id, name, email, config, status, created_at, updated_at
  `;
  
  const result = await db.query(query, [hashedApiKey, agencyId]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  return {
    ...result.rows[0],
    apiKey: newApiKey, // Return plain key
  };
};

/**
 * Delete agency (soft delete)
 * @param {string} agencyId - Agency ID
 * @returns {Promise<boolean>} True if deleted, false if not found
 */
const deleteAgency = async (agencyId) => {
  const query = `UPDATE agencies SET status = 'deleted', updated_at = NOW() WHERE id = $1`;
  const result = await db.query(query, [agencyId]);
  return result.rowCount > 0;
};

/**
 * Get agency statistics (site count, event count, etc.)
 * @param {string} agencyId - Agency ID
 * @returns {Promise<object>} Agency statistics
 */
const getAgencyStats = async (agencyId) => {
  const siteCountQuery = `
    SELECT COUNT(*) as site_count
    FROM sites
    WHERE agency_id = $1 AND status = 'active'
  `;
  
  const eventCountQuery = `
    SELECT COUNT(*) as event_count
    FROM events e
    JOIN sites s ON e.site_id = s.id
    WHERE s.agency_id = $1
  `;
  
  const [siteResult, eventResult] = await Promise.all([
    db.query(siteCountQuery, [agencyId]),
    db.query(eventCountQuery, [agencyId]),
  ]);
  
  return {
    siteCount: parseInt(siteResult.rows[0].site_count, 10),
    eventCount: parseInt(eventResult.rows[0].event_count, 10),
  };
};

module.exports = {
  createAgency,
  getAgencyById,
  getAgencyByApiKey,
  getAgencies,
  updateAgency,
  regenerateApiKey,
  deleteAgency,
  getAgencyStats,
};
