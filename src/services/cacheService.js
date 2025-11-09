const redisClient = require('../../config/redis');

const CACHE_TTL = 3600; // 1 hour in seconds
const MAX_CACHED_EVENTS = 10;

// Cache user event
const cacheUserEvent = async (userId, event) => {
  try {
    const key = `user:${userId}:events`;
    const eventJson = JSON.stringify(event);

    // Add to list (most recent first)
    await redisClient.lPush(key, eventJson);

    // Trim to keep only the most recent events
    await redisClient.lTrim(key, 0, MAX_CACHED_EVENTS - 1);

    // Set expiration
    await redisClient.expire(key, CACHE_TTL);
  } catch (error) {
    console.error('Cache error:', error);
    // Don't throw - caching is not critical
  }
};

// Get cached user events
const getCachedUserEvents = async (userId) => {
  try {
    const key = `user:${userId}:events`;
    const events = await redisClient.lRange(key, 0, -1);

    if (events && events.length > 0) {
      return events.map(e => JSON.parse(e));
    }

    return null;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
};

// Cache session data
const cacheSessionData = async (sessionId, data) => {
  try {
    const key = `session:${sessionId}`;
    await redisClient.set(key, JSON.stringify(data), {
      EX: CACHE_TTL,
    });
  } catch (error) {
    console.error('Cache error:', error);
  }
};

// Get cached session data
const getCachedSessionData = async (sessionId) => {
  try {
    const key = `session:${sessionId}`;
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Cache error:', error);
    return null;
  }
};

// Increment event counter
const incrementEventCounter = async (eventName) => {
  try {
    const key = `counter:${eventName}`;
    await redisClient.incr(key);
  } catch (error) {
    console.error('Cache error:', error);
  }
};

// Get event counter
const getEventCounter = async (eventName) => {
  try {
    const key = `counter:${eventName}`;
    const count = await redisClient.get(key);
    return parseInt(count) || 0;
  } catch (error) {
    console.error('Cache error:', error);
    return 0;
  }
};

module.exports = {
  cacheUserEvent,
  getCachedUserEvents,
  cacheSessionData,
  getCachedSessionData,
  incrementEventCounter,
  getEventCounter,
};
