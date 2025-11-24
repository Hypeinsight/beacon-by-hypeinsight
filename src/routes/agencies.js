/**
 * Agencies Routes: REST API endpoints for agency management.
 *
 * WHY: Defines the API surface for agency CRUD operations in multi-tenant setup.
 * Agencies can manage multiple sites and have API key authentication.
 */
const express = require('express');
const router = express.Router();
const agenciesController = require('../controllers/agenciesController');
const agencySettingsController = require('../controllers/agencySettingsController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route POST /api/agencies
 * @desc Create a new agency
 * @body {name, email?, config?}
 * @returns {object} Created agency with API key
 */
router.post('/', agenciesController.createAgency);

/**
 * @route GET /api/agencies
 * @desc Get all agencies
 * @query {status?, limit?, offset?}
 * @returns {array} List of agencies
 */
router.get('/', agenciesController.getAgencies);

/**
 * @route GET /api/agencies/:id
 * @desc Get agency by ID
 * @param {string} id - Agency ID
 * @returns {object} Agency
 */
router.get('/:id', agenciesController.getAgency);

/**
 * @route PUT /api/agencies/:id
 * @desc Update agency
 * @param {string} id - Agency ID
 * @body {name?, email?, config?, status?}
 * @returns {object} Updated agency
 */
router.put('/:id', agenciesController.updateAgency);

/**
 * @route DELETE /api/agencies/:id
 * @desc Delete agency (soft delete)
 * @param {string} id - Agency ID
 * @returns {object} Success message
 */
router.delete('/:id', agenciesController.deleteAgency);

/**
 * @route POST /api/agencies/:id/regenerate-key
 * @desc Regenerate API key for an agency
 * @param {string} id - Agency ID
 * @returns {object} Agency with new API key
 */
router.post('/:id/regenerate-key', agenciesController.regenerateApiKey);

/**
 * @route GET /api/agencies/:id/stats
 * @desc Get agency statistics
 * @param {string} id - Agency ID
 * @returns {object} Agency statistics (site count, event count)
 */
router.get('/:id/stats', agenciesController.getAgencyStats);

/**
 * Agency Settings Routes (authenticated)
 */

/**
 * @route GET /api/agencies/settings
 * @desc Get agency settings including Meta System User token status
 * @auth Required
 * @returns {object} Agency settings
 */
router.get('/settings', verifyJWT, agencySettingsController.getAgencySettings);

/**
 * @route PUT /api/agencies/settings/meta-token
 * @desc Update agency Meta System User token
 * @auth Required
 * @body {systemUserToken}
 * @returns {object} Success message
 */
router.put('/settings/meta-token', verifyJWT, agencySettingsController.updateMetaSystemUserToken);

/**
 * @route DELETE /api/agencies/settings/meta-token
 * @desc Delete agency Meta System User token
 * @auth Required
 * @returns {object} Success message
 */
router.delete('/settings/meta-token', verifyJWT, agencySettingsController.deleteMetaSystemUserToken);

module.exports = router;
