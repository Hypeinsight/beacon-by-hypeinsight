/**
 * Users Routes: user management endpoints
 */
const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { verifyJWT, requireSuperAdmin, requireRole, requireAgencyAccess } = require('../middleware/authMiddleware');

/**
 * @route GET /api/users
 * @desc Get all users (super_admin only)
 * @access Private - Super Admin
 * @query {number} limit, offset
 */
router.get('/', verifyJWT, requireSuperAdmin, usersController.getAllUsers);

/**
 * @route GET /api/users/agency/:agencyId
 * @desc Get users by agency
 * @access Private - Super Admin or Agency Admin
 * @param {string} agencyId - Agency ID
 * @query {number} limit, offset
 */
router.get(
  '/agency/:agencyId',
  verifyJWT,
  requireAgencyAccess,
  usersController.getUsersByAgency
);

/**
 * @route POST /api/users
 * @desc Create new user (admin only)
 * @access Private - Super Admin or Agency Admin
 * @body {email, name, role, agencyId}
 */
router.post('/', verifyJWT, requireSuperAdmin, usersController.createUser);

/**
 * @route PUT /api/users/:userId
 * @desc Update user
 * @access Private - Super Admin or Agency Admin
 * @param {string} userId - User ID
 * @body {name?, role?, status?}
 */
router.put('/:userId', verifyJWT, usersController.updateUser);

/**
 * @route DELETE /api/users/:userId
 * @desc Delete user (soft delete)
 * @access Private - Super Admin or Agency Admin
 * @param {string} userId - User ID
 */
router.delete('/:userId', verifyJWT, requireSuperAdmin, usersController.deleteUser);

/**
 * @route POST /api/users/:userId/reset-password
 * @desc Reset user password
 * @access Private - Super Admin or Agency Admin
 * @param {string} userId - User ID
 */
router.post(
  '/:userId/reset-password',
  verifyJWT,
  requireSuperAdmin,
  usersController.resetUserPassword
);

module.exports = router;
