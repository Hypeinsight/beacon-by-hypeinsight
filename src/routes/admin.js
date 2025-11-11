/**
 * Admin Routes: system-wide oversight endpoints (super_admin only)
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyJWT, requireSuperAdmin } = require('../middleware/authMiddleware');

/**
 * @route GET /api/admin/agencies
 * @desc Get all agencies with stats
 * @access Private - Super Admin
 * @query {number} limit, offset
 */
router.get('/agencies', verifyJWT, requireSuperAdmin, adminController.getAllAgencies);

/**
 * @route GET /api/admin/agencies/:agencyId
 * @desc Get agency details with users, sites, and event count
 * @access Private - Super Admin
 * @param {string} agencyId - Agency ID
 */
router.get('/agencies/:agencyId', verifyJWT, requireSuperAdmin, adminController.getAgencyDetails);

/**
 * @route GET /api/admin/stats
 * @desc Get system-wide statistics
 * @access Private - Super Admin
 */
router.get('/stats', verifyJWT, requireSuperAdmin, adminController.getSystemStats);

module.exports = router;
