/**
 * Analytics Routes: dashboard and reporting endpoints
 */
const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route GET /api/analytics/:siteId/overview
 * @desc Get overview metrics
 */
router.get('/:siteId/overview', verifyJWT, analyticsController.getOverviewMetrics);

/**
 * @route GET /api/analytics/:siteId/traffic-sources
 * @desc Get traffic sources breakdown
 */
router.get('/:siteId/traffic-sources', verifyJWT, analyticsController.getTrafficSources);

/**
 * @route GET /api/analytics/:siteId/devices
 * @desc Get device breakdown
 */
router.get('/:siteId/devices', verifyJWT, analyticsController.getDeviceBreakdown);

/**
 * @route GET /api/analytics/:siteId/geography
 * @desc Get geographic distribution
 */
router.get('/:siteId/geography', verifyJWT, analyticsController.getGeographicDistribution);

/**
 * @route GET /api/analytics/:siteId/timeseries
 * @desc Get time series data
 */
router.get('/:siteId/timeseries', verifyJWT, analyticsController.getTimeSeriesData);

/**
 * @route GET /api/analytics/:siteId/funnel
 * @desc Get funnel analysis
 */
router.get('/:siteId/funnel', verifyJWT, analyticsController.getFunnelAnalysis);

/**
 * @route GET /api/analytics/:siteId/bounce-rate
 * @desc Get bounce rate
 */
router.get('/:siteId/bounce-rate', verifyJWT, analyticsController.getBounceRate);

/**
 * @route GET /api/analytics/:siteId/visitor-segmentation
 * @desc Get visitor segmentation
 */
router.get('/:siteId/visitor-segmentation', verifyJWT, analyticsController.getVisitorSegmentation);

module.exports = router;
