/**
 * Scoring Service: handles visitor scoring based on event activities
 * 
 * WHY: Centralizes scoring logic for tracking high-value visitor actions.
 * Allows customizable scoring rules per event type to identify engaged visitors.
 */
const db = require('../../config/database');
const { v4: uuidv4 } = require('uuid');

/**
 * Get active scoring rules for a site
 * @param {string} siteId - Site UUID
 * @returns {Promise<Array>} Array of scoring rules
 */
async function getScoringRules(siteId) {
  try {
    const result = await db.query(
      `SELECT id, event_name, score_value, description, active
       FROM event_scoring_rules
       WHERE site_id = $1 AND active = true
       ORDER BY event_name ASC`,
      [siteId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    return [];
  }
}

/**
 * Get all scoring rules for a site (including inactive)
 * @param {string} siteId - Site UUID
 * @returns {Promise<Array>} Array of all scoring rules
 */
async function getAllScoringRules(siteId) {
  try {
    const result = await db.query(
      `SELECT id, event_name, score_value, description, active
       FROM event_scoring_rules
       WHERE site_id = $1
       ORDER BY event_name ASC`,
      [siteId]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching all scoring rules:', error);
    return [];
  }
}

/**
 * Create or update a scoring rule
 * @param {string} siteId - Site UUID
 * @param {string} eventName - Event name
 * @param {number} scoreValue - Score value
 * @param {string} description - Optional description
 * @param {boolean} active - Whether rule is active
 * @returns {Promise<object>} Created/updated rule
 */
async function upsertScoringRule(siteId, eventName, scoreValue, description = null, active = true) {
  try {
    const result = await db.query(
      `INSERT INTO event_scoring_rules (id, site_id, event_name, score_value, description, active)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (site_id, event_name)
       DO UPDATE SET 
         score_value = $4,
         description = $5,
         active = $6,
         updated_at = NOW()
       RETURNING *`,
      [uuidv4(), siteId, eventName, scoreValue, description, active]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error upserting scoring rule:', error);
    throw error;
  }
}

/**
 * Delete a scoring rule
 * @param {string} ruleId - Rule UUID
 * @param {string} siteId - Site UUID (for verification)
 * @returns {Promise<boolean>} Success
 */
async function deleteScoringRule(ruleId, siteId) {
  try {
    const result = await db.query(
      'DELETE FROM event_scoring_rules WHERE id = $1 AND site_id = $2 RETURNING id',
      [ruleId, siteId]
    );
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    return false;
  }
}

/**
 * Calculate score for an event based on active rules
 * @param {string} siteId - Site UUID
 * @param {string} eventName - Event name
 * @returns {Promise<number>} Score value (0 if no rule found)
 */
async function calculateEventScore(siteId, eventName) {
  try {
    const result = await db.query(
      `SELECT score_value 
       FROM event_scoring_rules 
       WHERE site_id = $1 AND event_name = $2 AND active = true`,
      [siteId, eventName]
    );
    
    return result.rows.length > 0 ? result.rows[0].score_value : 0;
  } catch (error) {
    console.error('Error calculating event score:', error);
    return 0;
  }
}

/**
 * Update visitor score after an event
 * @param {string} siteId - Site UUID
 * @param {string} clientId - Client ID
 * @param {string} sessionId - Session ID
 * @param {string} eventName - Event name
 * @param {string} eventId - Event ID (for history tracking)
 * @returns {Promise<object|null>} Updated visitor score record
 */
async function updateVisitorScore(siteId, clientId, sessionId, eventName, eventId) {
  try {
    // Get score for this event
    const scoreChange = await calculateEventScore(siteId, eventName);
    
    // If no scoring rule or score is 0, skip
    if (scoreChange === 0) {
      return null;
    }
    
    // Upsert visitor score
    const visitorResult = await db.query(
      `INSERT INTO visitor_scores (id, site_id, client_id, session_id, total_score, score_breakdown, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (site_id, client_id)
       DO UPDATE SET
         total_score = visitor_scores.total_score + $5,
         score_breakdown = jsonb_set(
           COALESCE(visitor_scores.score_breakdown, '{}'::jsonb),
           ARRAY[$7::text],
           to_jsonb(COALESCE((visitor_scores.score_breakdown->>$7)::int, 0) + 1)
         ),
         session_id = $4,
         last_updated = NOW()
       RETURNING *`,
      [
        uuidv4(),
        siteId,
        clientId,
        sessionId,
        scoreChange,
        JSON.stringify({ [eventName]: 1 }),
        eventName
      ]
    );
    
    const visitorScore = visitorResult.rows[0];
    
    // Record in score history
    await db.query(
      `INSERT INTO score_history (id, visitor_score_id, event_name, score_change, total_score_after, event_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [uuidv4(), visitorScore.id, eventName, scoreChange, visitorScore.total_score, eventId]
    );
    
    return visitorScore;
  } catch (error) {
    console.error('Error updating visitor score:', error);
    return null;
  }
}

/**
 * Get visitor score
 * @param {string} siteId - Site UUID
 * @param {string} clientId - Client ID
 * @returns {Promise<object|null>} Visitor score record
 */
async function getVisitorScore(siteId, clientId) {
  try {
    const result = await db.query(
      `SELECT * FROM visitor_scores 
       WHERE site_id = $1 AND client_id = $2`,
      [siteId, clientId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error('Error fetching visitor score:', error);
    return null;
  }
}

/**
 * Get score history for a visitor
 * @param {string} siteId - Site UUID
 * @param {string} clientId - Client ID
 * @param {number} limit - Max records to return
 * @returns {Promise<Array>} Score history records
 */
async function getScoreHistory(siteId, clientId, limit = 50) {
  try {
    const result = await db.query(
      `SELECT sh.* 
       FROM score_history sh
       JOIN visitor_scores vs ON sh.visitor_score_id = vs.id
       WHERE vs.site_id = $1 AND vs.client_id = $2
       ORDER BY sh.created_at DESC
       LIMIT $3`,
      [siteId, clientId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching score history:', error);
    return [];
  }
}

/**
 * Get top scored visitors for a site
 * @param {string} siteId - Site UUID
 * @param {number} limit - Max records to return
 * @returns {Promise<Array>} Top scored visitors
 */
async function getTopScoredVisitors(siteId, limit = 50) {
  try {
    const result = await db.query(
      `SELECT * FROM top_scored_visitors
       WHERE site_id = $1
       ORDER BY total_score DESC
       LIMIT $2`,
      [siteId, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Error fetching top scored visitors:', error);
    return [];
  }
}

module.exports = {
  getScoringRules,
  getAllScoringRules,
  upsertScoringRule,
  deleteScoringRule,
  calculateEventScore,
  updateVisitorScore,
  getVisitorScore,
  getScoreHistory,
  getTopScoredVisitors,
};
