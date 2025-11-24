/**
 * Scoring Routes: REST API endpoints for visitor scoring management
 *
 * WHY: Defines the API surface for scoring CRUD operations
 */
const express = require('express');
const router = express.Router();
const scoringController = require('../controllers/scoringController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route GET /api/sites/:siteId/scoring-rules
 * @desc Get all scoring rules for a site
 * @auth Required
 * @param {string} siteId - Site ID
 * @returns {array} List of scoring rules
 */
router.get('/sites/:siteId/scoring-rules', verifyJWT, scoringController.getScoringRules);

/**
 * @route PUT /api/sites/:siteId/scoring-rules
 * @desc Create or update scoring rules (batch)
 * @auth Required
 * @param {string} siteId - Site ID
 * @body {array} rules - Array of scoring rules
 * @returns {object} Updated rules
 */
router.put('/sites/:siteId/scoring-rules', verifyJWT, scoringController.updateScoringRules);

/**
 * @route DELETE /api/sites/:siteId/scoring-rules/:ruleId
 * @desc Delete a scoring rule
 * @auth Required
 * @param {string} siteId - Site ID
 * @param {string} ruleId - Rule ID
 * @returns {object} Success message
 */
router.delete('/sites/:siteId/scoring-rules/:ruleId', verifyJWT, scoringController.deleteScoringRule);

/**
 * @route GET /api/sites/:siteId/visitors/:clientId/score
 * @desc Get visitor score and history
 * @auth Required
 * @param {string} siteId - Site ID
 * @param {string} clientId - Client ID
 * @returns {object} Score and history
 */
router.get('/sites/:siteId/visitors/:clientId/score', verifyJWT, scoringController.getVisitorScore);

/**
 * @route GET /api/sites/:siteId/top-scored-visitors
 * @desc Get top scored visitors for a site
 * @auth Required
 * @param {string} siteId - Site ID
 * @query {number} limit - Max results (default 50)
 * @returns {array} Top scored visitors
 */
router.get('/sites/:siteId/top-scored-visitors', verifyJWT, scoringController.getTopScoredVisitors);

/**
 * @route GET /api/sites/:siteId/ai-suggested-scores
 * @desc Get AI-suggested scores for detected events
 * @auth Required
 * @param {string} siteId - Site ID
 * @returns {array} AI-suggested scores for each event
 */
router.get('/sites/:siteId/ai-suggested-scores', verifyJWT, scoringController.getAISuggestedScores);

module.exports = router;
