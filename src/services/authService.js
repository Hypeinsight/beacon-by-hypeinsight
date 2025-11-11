/**
 * Auth Service: handles user authentication, JWT tokens, and password management
 *
 * WHY: Centralized auth logic for registration, login, token verification, and password management.
 * Keeps controllers thin and makes auth testable and reusable.
 */
const db = require('../../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';
const BCRYPT_ROUNDS = 10;

/**
 * Register a new user (client or admin)
 * @param {object} userData - { email, password, name, agencyId?, role? }
 * @returns {Promise<object>} User object with token
 */
const registerUser = async (userData) => {
  const { email, password, name, agencyId, role = 'agency_admin' } = userData;

  // Validate required fields
  if (!email || !password || !name) {
    throw new Error('Email, password, and name are required');
  }

  // Check if user already exists
  const existingUser = await db.query(
    'SELECT id FROM dashboard_users WHERE email = $1',
    [email]
  );

  if (existingUser.rows.length > 0) {
    throw new Error('User with this email already exists');
  }

  // If agencyId not provided, create a new agency for this user
  let finalAgencyId = agencyId;
  if (!finalAgencyId) {
    // User is creating their own agency
    const agencyResult = await db.query(
      'INSERT INTO agencies (name, email) VALUES ($1, $2) RETURNING id',
      [name, email]
    );
    finalAgencyId = agencyResult.rows[0].id;
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const result = await db.query(
    `INSERT INTO dashboard_users (id, agency_id, email, password_hash, name, role, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, name, role, agency_id, created_at`,
    [uuidv4(), finalAgencyId, email, passwordHash, name, role, 'active']
  );

  const user = result.rows[0];

  // Generate JWT token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agencyId: user.agency_id,
    },
    token,
  };
};

/**
 * Login user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<object>} User object with token
 */
const loginUser = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const result = await db.query(
    'SELECT * FROM dashboard_users WHERE email = $1 AND status = $2',
    [email, 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid email or password');
  }

  const user = result.rows[0];

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Invalid email or password');
  }

  // Update last_login
  await db.query(
    'UPDATE dashboard_users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate JWT token
  const token = generateToken(user);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      agencyId: user.agency_id,
    },
    token,
  };
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Generate JWT token for user
 * @param {object} user - User object from database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      agencyId: user.agency_id,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User object
 */
const getUserById = async (userId) => {
  const result = await db.query(
    'SELECT id, email, name, role, agency_id, status, created_at, last_login FROM dashboard_users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password for verification
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  if (!currentPassword || !newPassword) {
    throw new Error('Current and new passwords are required');
  }

  const result = await db.query(
    'SELECT password_hash FROM dashboard_users WHERE id = $1',
    [userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = result.rows[0];

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isPasswordValid) {
    throw new Error('Current password is incorrect');
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password
  await db.query(
    'UPDATE dashboard_users SET password_hash = $1 WHERE id = $2',
    [newPasswordHash, userId]
  );
};

/**
 * Request password reset (admin only - generates temporary password)
 * @param {string} userId - User ID to reset
 * @returns {Promise<string>} Temporary password
 */
const resetPassword = async (userId) => {
  const tempPassword = generateRandomPassword();
  const passwordHash = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS);

  await db.query(
    'UPDATE dashboard_users SET password_hash = $1 WHERE id = $2',
    [passwordHash, userId]
  );

  return tempPassword;
};

/**
 * Generate random password
 * @returns {string} Random password
 */
const generateRandomPassword = () => {
  return Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  generateToken,
  getUserById,
  changePassword,
  resetPassword,
};
