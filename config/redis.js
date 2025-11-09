const { createClient } = require('redis');
require('dotenv').config();

// Support both REDIS_URL (Render) and individual config (local dev)
let redisClient;

if (process.env.REDIS_URL) {
  // Production: use connection string from Render
  redisClient = createClient({
    url: process.env.REDIS_URL,
  });
} else {
  // Development: use individual config
  const redisConfig = {
    socket: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      tls: process.env.REDIS_HOST?.includes('upstash.io') ? true : false,
    },
    password: process.env.REDIS_PASSWORD || undefined,
    database: parseInt(process.env.REDIS_DB) || 0,
  };
  redisClient = createClient(redisConfig);
}

redisClient.on('connect', () => {
  console.log('Connected to Redis');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

// Connect to Redis
(async () => {
  try {
    await redisClient.connect();
  } catch (err) {
    console.error('Failed to connect to Redis:', err);
  }
})();

module.exports = redisClient;
