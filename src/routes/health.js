const express = require('express');
const router = express.Router();
const db = require('../../config/database');
const redisClient = require('../../config/redis');

// Basic health check
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Beacon by Hype Insight',
  });
});

// Detailed health check with database and Redis status
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Beacon by Hype Insight',
    checks: {
      database: 'unknown',
      redis: 'unknown',
    },
  };

  // Check PostgreSQL
  try {
    await db.query('SELECT 1');
    health.checks.database = 'connected';
  } catch (err) {
    health.checks.database = 'disconnected';
    health.status = 'degraded';
  }

  // Check Redis
  try {
    await redisClient.ping();
    health.checks.redis = 'connected';
  } catch (err) {
    health.checks.redis = 'disconnected';
    health.status = 'degraded';
  }

  const statusCode = health.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(health);
});

module.exports = router;
