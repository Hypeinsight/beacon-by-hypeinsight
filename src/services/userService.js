/**
 * User Service: user management for admins
 */
const db = require('../../config/database');
const authService = require('./authService');

/**
 * Get all users (super_admin only)
 * @returns {Promise<Array>} List of all users
 */
const getAllUsers = async (limit = 50, offset = 0) => {
  const result = await db.query(
    `SELECT id, email, name, role, agency_id, status, created_at, last_login
     FROM dashboard_users
     ORDER BY created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await db.query('SELECT COUNT(*) FROM dashboard_users');

  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Get users by agency
 * @param {string} agencyId - Agency ID
 * @returns {Promise<Array>} List of users in agency
 */
const getUsersByAgency = async (agencyId, limit = 50, offset = 0) => {
  const result = await db.query(
    `SELECT id, email, name, role, agency_id, status, created_at, last_login
     FROM dashboard_users
     WHERE agency_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3`,
    [agencyId, limit, offset]
  );

  const countResult = await db.query(
    'SELECT COUNT(*) FROM dashboard_users WHERE agency_id = $1',
    [agencyId]
  );

  return {
    users: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
};

/**
 * Create user (admin only)
 * @param {object} userData - { email, name, role, agencyId }
 * @param {string} temporaryPassword - Auto-generated temporary password
 * @returns {Promise<object>} Created user
 */
const createUser = async (userData, temporaryPassword) => {
  const { email, name, role, agencyId } = userData;

  if (!email || !name || !role || !agencyId) {
    throw new Error('Email, name, role, and agencyId are required');
  }

  // Check if user already exists
  const existingUser = await db.query(
    'SELECT id FROM dashboard_users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // Verify agency exists
  const agencyCheck = await db.query('SELECT id FROM agencies WHERE id = $1', [agencyId]);
  if (agencyCheck.rows.length === 0) {
    throw new Error('Agency not found');
  }

  // Hash password
  const passwordHash = await require('bcrypt').hash(temporaryPassword, 10);

  // Create user
  const result = await db.query(
    `INSERT INTO dashboard_users (id, agency_id, email, password_hash, name, role, status)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, 'active')
     RETURNING id, email, name, role, agency_id, status, created_at`,
    [agencyId, email, passwordHash, name, role]
  );

  return result.rows[0];
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {object} updates - { name?, role?, status? }
 * @returns {Promise<object>} Updated user
 */
const updateUser = async (userId, updates) => {
  const { name, role, status } = updates;

  const allowedUpdates = { name, role, status };
  const updates_array = Object.keys(allowedUpdates)
    .filter(k => allowedUpdates[k] !== undefined)
    .map((k, i) => `${k} = $${i + 1}`);

  if (updates_array.length === 0) {
    throw new Error('No valid updates provided');
  }

  const values = Object.values(allowedUpdates).filter(v => v !== undefined);
  values.push(userId);

  const result = await db.query(
    `UPDATE dashboard_users
     SET ${updates_array.join(', ')}
     WHERE id = $${values.length}
     RETURNING id, email, name, role, agency_id, status`,
    values
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * Delete user (soft delete - deactivate)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const deleteUser = async (userId) => {
  const result = await db.query(
    'UPDATE dashboard_users SET status = $1 WHERE id = $2 RETURNING id',
    ['inactive', userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }
};

/**
 * Reset user password (admin only)
 * @param {string} userId - User ID
 * @returns {Promise<string>} Temporary password
 */
const resetUserPassword = async (userId) => {
  const tempPassword = authService.resetPassword(userId);
  return tempPassword;
};

module.exports = {
  getAllUsers,
  getUsersByAgency,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
};
