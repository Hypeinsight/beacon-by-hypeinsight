/**
 * Sites Routes: REST API endpoints for site management.
 *
 * WHY: Defines the API surface for site CRUD operations.
 * Enforces multi-tenant isolation via authenticated user's agency.
 */
const express = require('express');
const router = express.Router();
const sitesController = require('../controllers/sitesController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route POST /api/sites
 * @desc Create a new site
 * @auth Required
 * @body {name, domain, config?}
 * @returns {object} Created site
 */
router.post('/', verifyJWT, sitesController.createSite);

/**
 * @route GET /api/sites
 * @desc Get all sites for authenticated user's agency
 * @auth Required
 * @query {status?, limit?, offset?}
 * @returns {array} List of sites
 */
router.get('/', verifyJWT, sitesController.getSites);

/**
 * @route GET /api/sites/:id
 * @desc Get site by ID (for user's agency only)
 * @auth Required
 * @param {string} id - Site ID
 * @returns {object} Site
 */
router.get('/:id', verifyJWT, sitesController.getSite);

/**
 * @route PUT /api/sites/:id
 * @desc Update site (for user's agency only)
 * @auth Required
 * @param {string} id - Site ID
 * @body {name?, domain?, config?, status?}
 * @returns {object} Updated site
 */
router.put('/:id', verifyJWT, sitesController.updateSite);

/**
 * @route DELETE /api/sites/:id
 * @desc Delete site (soft delete, for user's agency only)
 * @auth Required
 * @param {string} id - Site ID
 * @returns {object} Success message
 */
router.delete('/:id', verifyJWT, sitesController.deleteSite);

/**
 * @route GET /api/sites/:id/script
 * @desc Get tracking script snippet for a site
 * @param {string} id - Site ID
 * @query {agencyId?} - For agency isolation
 * @returns {object} Script snippet
 */
router.get('/:id/script', sitesController.getTrackingScript);

/**
 * @route GET /api/sites/:id/stats
 * @desc Get site statistics
 * @param {string} id - Site ID
 * @query {agencyId?} - For agency isolation
 * @returns {object} Site statistics
 */
router.get('/:id/stats', sitesController.getSiteStats);

/**
 * @route PUT /api/sites/:id/destinations
 * @desc Update site destination configs (GA4, Meta, Google Ads)
 * @auth Required
 * @param {string} id - Site ID
 * @body {destinations} - Destination configs object
 * @returns {object} Success message
 */
router.put('/:id/destinations', verifyJWT, sitesController.updateDestinations);

module.exports = router;
