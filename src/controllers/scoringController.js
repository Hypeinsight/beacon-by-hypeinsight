/**
 * Scoring Controller: handles HTTP requests for visitor scoring management
 *
 * WHY: Separates HTTP layer from business logic for scoring operations
 */
const scoringService = require('../services/scoringService');
const db = require('../../config/database');

/**
 * Get all scoring rules for a site
 * GET /api/sites/:siteId/scoring-rules
 */
const getScoringRules = async (req, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user.id;
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    const rules = await scoringService.getAllScoringRules(siteId);
    
    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Error fetching scoring rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch scoring rules'
    });
  }
};

/**
 * Create or update scoring rules (batch)
 * PUT /api/sites/:siteId/scoring-rules
 */
const updateScoringRules = async (req, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user.id;
    const { rules } = req.body;
    
    if (!Array.isArray(rules)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Rules must be an array' 
      });
    }
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    // Upsert all rules
    const updatedRules = [];
    for (const rule of rules) {
      const { eventName, scoreValue, description, active } = rule;
      
      if (!eventName || scoreValue === undefined) {
        continue; // Skip invalid rules
      }
      
      const updated = await scoringService.upsertScoringRule(
        siteId,
        eventName,
        parseInt(scoreValue, 10),
        description || null,
        active !== false
      );
      
      updatedRules.push(updated);
    }
    
    res.json({
      success: true,
      message: 'Scoring rules updated successfully',
      data: updatedRules
    });
  } catch (error) {
    console.error('Error updating scoring rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update scoring rules'
    });
  }
};

/**
 * Delete a scoring rule
 * DELETE /api/sites/:siteId/scoring-rules/:ruleId
 */
const deleteScoringRule = async (req, res) => {
  try {
    const { siteId, ruleId } = req.params;
    const userId = req.user.id;
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    const deleted = await scoringService.deleteScoringRule(ruleId, siteId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Scoring rule not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scoring rule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete scoring rule'
    });
  }
};

/**
 * Get visitor score
 * GET /api/sites/:siteId/visitors/:clientId/score
 */
const getVisitorScore = async (req, res) => {
  try {
    const { siteId, clientId } = req.params;
    const userId = req.user.id;
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    const score = await scoringService.getVisitorScore(siteId, clientId);
    const history = await scoringService.getScoreHistory(siteId, clientId, 50);
    
    res.json({
      success: true,
      data: {
        score,
        history
      }
    });
  } catch (error) {
    console.error('Error fetching visitor score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor score'
    });
  }
};

/**
 * Get top scored visitors for a site
 * GET /api/sites/:siteId/top-scored-visitors
 */
const getTopScoredVisitors = async (req, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user.id;
    const { limit = 50 } = req.query;
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    const visitors = await scoringService.getTopScoredVisitors(siteId, parseInt(limit, 10));
    
    res.json({
      success: true,
      data: visitors
    });
  } catch (error) {
    console.error('Error fetching top scored visitors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top scored visitors'
    });
  }
};

/**
 * Get AI-suggested scores for detected events
 * GET /api/sites/:siteId/ai-suggested-scores
 */
const getAISuggestedScores = async (req, res) => {
  try {
    const { siteId } = req.params;
    const userId = req.user.id;
    
    // Verify site belongs to user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const siteResult = await db.query(
      'SELECT id FROM sites WHERE id = $1 AND agency_id = $2',
      [siteId, agencyId]
    );
    
    if (!siteResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Site not found' });
    }
    
    // Get detected events
    const eventsResult = await db.query(
      `SELECT DISTINCT event_name, COUNT(*) as event_count
       FROM events 
       WHERE site_id = $1
       GROUP BY event_name
       ORDER BY event_count DESC`,
      [siteId]
    );
    
    // Calculate AI scores for each event
    const suggestions = eventsResult.rows.map(row => {
      const aiScore = scoringService.calculateAIScore(row.event_name);
      return {
        eventName: row.event_name,
        suggestedScore: aiScore,
        eventCount: parseInt(row.event_count)
      };
    });
    
    res.json({
      success: true,
      data: suggestions
    });
  } catch (error) {
    console.error('Error getting AI suggested scores:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get AI suggested scores'
    });
  }
};

module.exports = {
  getScoringRules,
  updateScoringRules,
  deleteScoringRule,
  getVisitorScore,
  getTopScoredVisitors,
  getAISuggestedScores,
};
