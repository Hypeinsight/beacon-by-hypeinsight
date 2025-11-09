const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');
const { trackEventValidation, validate } = require('../middleware/validation');

// Handle OPTIONS preflight for CORS
router.options('/event', (req, res) => res.sendStatus(204));
router.options('/batch', (req, res) => res.sendStatus(204));

// Track event endpoint
router.post('/event', trackEventValidation, validate, trackingController.trackEvent);

// Batch track events endpoint
router.post('/batch', trackingController.trackBatch);

// Get events by user
router.get('/user/:userId', trackingController.getEventsByUser);

// Get events by session
router.get('/session/:sessionId', trackingController.getEventsBySession);

module.exports = router;
