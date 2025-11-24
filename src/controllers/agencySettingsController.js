/**
 * Agency Settings Controller: Manage agency-level configurations
 * Including Meta System User tokens for multi-site management
 */
const db = require('../../config/database');

/**
 * Get agency settings
 * GET /api/agency/settings
 */
const getAgencySettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    // Get agency config
    const agencyResult = await db.query(
      'SELECT config FROM agencies WHERE id = $1',
      [agencyId]
    );
    
    if (!agencyResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }
    
    const config = agencyResult.rows[0].config || {};
    
    // Return config but mask sensitive tokens (show only last 4 chars)
    const safeConfig = {
      meta: config.meta ? {
        systemUserToken: config.meta.systemUserToken 
          ? `****${config.meta.systemUserToken.slice(-4)}` 
          : null,
        hasToken: !!config.meta.systemUserToken
      } : null
    };
    
    res.json({
      success: true,
      data: safeConfig
    });
  } catch (error) {
    console.error('Error fetching agency settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency settings'
    });
  }
};

/**
 * Update agency Meta System User token
 * PUT /api/agency/settings/meta-token
 */
const updateMetaSystemUserToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { systemUserToken } = req.body;
    
    if (!systemUserToken) {
      return res.status(400).json({
        success: false,
        error: 'System User token is required'
      });
    }
    
    // Get user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    // Get current agency config
    const agencyResult = await db.query(
      'SELECT config FROM agencies WHERE id = $1',
      [agencyId]
    );
    
    if (!agencyResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }
    
    const currentConfig = agencyResult.rows[0].config || {};
    
    // Update Meta config
    const updatedConfig = {
      ...currentConfig,
      meta: {
        ...currentConfig.meta,
        systemUserToken: systemUserToken.trim()
      }
    };
    
    // Save to database
    await db.query(
      'UPDATE agencies SET config = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedConfig), agencyId]
    );
    
    res.json({
      success: true,
      message: 'Meta System User token updated successfully',
      data: {
        hasToken: true
      }
    });
  } catch (error) {
    console.error('Error updating Meta System User token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update Meta System User token'
    });
  }
};

/**
 * Delete agency Meta System User token
 * DELETE /api/agency/settings/meta-token
 */
const deleteMetaSystemUserToken = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's agency
    const userResult = await db.query(
      'SELECT agency_id FROM dashboard_users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    // Get current agency config
    const agencyResult = await db.query(
      'SELECT config FROM agencies WHERE id = $1',
      [agencyId]
    );
    
    if (!agencyResult.rows.length) {
      return res.status(404).json({ success: false, error: 'Agency not found' });
    }
    
    const currentConfig = agencyResult.rows[0].config || {};
    
    // Remove Meta System User token
    const updatedConfig = {
      ...currentConfig,
      meta: {
        ...currentConfig.meta,
        systemUserToken: null
      }
    };
    
    // Save to database
    await db.query(
      'UPDATE agencies SET config = $1, updated_at = NOW() WHERE id = $2',
      [JSON.stringify(updatedConfig), agencyId]
    );
    
    res.json({
      success: true,
      message: 'Meta System User token removed successfully'
    });
  } catch (error) {
    console.error('Error deleting Meta System User token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete Meta System User token'
    });
  }
};

module.exports = {
  getAgencySettings,
  updateMetaSystemUserToken,
  deleteMetaSystemUserToken,
};
