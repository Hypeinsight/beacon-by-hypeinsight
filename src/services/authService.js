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
 * Request password reset - sends email with reset token
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
const requestPasswordReset = async (email) => {
  const crypto = require('crypto');
  const sgMail = require('@sendgrid/mail');
  
  // Check if user exists
  const result = await db.query(
    'SELECT id, name FROM dashboard_users WHERE email = $1 AND status = $2',
    [email, 'active']
  );

  if (result.rows.length === 0) {
    // Don't reveal if email doesn't exist
    return;
  }

  const user = result.rows[0];
  
  // Generate reset token (32 random bytes)
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token in database
  await db.query(
    'UPDATE dashboard_users SET reset_token = $1, reset_token_expiry = $2 WHERE id = $3',
    [resetToken, resetTokenExpiry, user.id]
  );

  // Send email with reset link
  const apiKey = process.env.SENDGRID_API_KEY;
  if (apiKey) {
    sgMail.setApiKey(apiKey);
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    const msg = {
      to: email,
      from: process.env.FROM_EMAIL || 'noreply@beacon.com',
      subject: 'Reset Your Beacon Password',
      html: `
        <h1>Password Reset Request</h1>
        <p>Hi ${user.name},</p>
        <p>We received a request to reset your password. Click the link below to reset it:</p>
        <p><a href="${resetUrl}" style="background-color: #46B646; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a></p>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>Thanks,<br>The Beacon Team</p>
      `,
    };

    await sgMail.send(msg);
    console.log('Password reset email sent to:', email);
  } else {
    console.log('SendGrid not configured. Reset token:', resetToken);
  }
};

/**
 * Reset password with token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const resetPassword = async (token, newPassword) => {
  if (!token || !newPassword) {
    throw new Error('Token and password are required');
  }

  // Find user with valid token
  const result = await db.query(
    'SELECT id FROM dashboard_users WHERE reset_token = $1 AND reset_token_expiry > NOW() AND status = $2',
    [token, 'active']
  );

  if (result.rows.length === 0) {
    throw new Error('Invalid or expired reset token');
  }

  const user = result.rows[0];

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and clear reset token
  await db.query(
    'UPDATE dashboard_users SET password_hash = $1, reset_token = NULL, reset_token_expiry = NULL WHERE id = $2',
    [passwordHash, user.id]
  );
};

module.exports = {
  registerUser,
  loginUser,
  verifyToken,
  generateToken,
  getUserById,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
