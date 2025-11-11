/**
 * Auth Routes: authentication and user account endpoints
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route POST /api/auth/register
 * @desc Register new user (creates new agency if agencyId not provided)
 * @body {email, password, name, agencyId?}
 * @returns {object} User object and JWT token
 */
router.post('/register', authController.register);

/**
 * @route POST /api/auth/login
 * @desc Login user
 * @body {email, password}
 * @returns {object} User object and JWT token
 */
router.post('/login', authController.login);

/**
 * @route GET /api/auth/me
 * @desc Get current authenticated user
 * @header {string} Authorization - Bearer token
 * @returns {object} Current user data
 */
router.get('/me', verifyJWT, authController.getCurrentUser);

/**
 * @route POST /api/auth/logout
 * @desc Logout user (clears cookie)
 * @returns {object} Success message
 */
router.post('/logout', authController.logout);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @header {string} Authorization - Bearer token
 * @body {currentPassword, newPassword, confirmPassword}
 * @returns {object} Success message
 */
router.post('/change-password', verifyJWT, authController.changePassword);

module.exports = router;
