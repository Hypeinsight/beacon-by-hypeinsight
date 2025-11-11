/**
 * Sites Controller: handles HTTP requests for site management.
 *
 * WHY: Separates HTTP layer from business logic, handles validation and error responses.
 */
const sitesService = require('../services/sitesService');

/**
 * Create a new site
 * POST /api/sites
 * @param {object} req - Express request (authenticated)
 * @param {object} res - Express response
 */
const createSite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, domain, config } = req.body;
    
    // Validation
    if (!name || !domain) {
      return res.status(400).json({
        success: false,
        error: 'Name and domain are required',
      });
    }
    
    // Get user's agency
    const db = require('../../config/database');
    const userResult = await db.query(
      'SELECT agency_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    const site = await sitesService.createSite({ name, domain, agencyId, config });
    
    res.status(201).json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error creating site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create site',
    });
  }
};

/**
 * Get site by ID
 * GET /api/sites/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getSite = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.query.agencyId;
    
    const site = await sitesService.getSiteById(id, agencyId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error fetching site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site',
    });
  }
};

/**
 * Get all sites with optional filtering (filtered by user's agency)
 * GET /api/sites
 * @param {object} req - Express request (authenticated)
 * @param {object} res - Express response
 */
const getSites = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit, offset } = req.query;
    
    // Get user's agency
    const db = require('../../config/database');
    const userResult = await db.query(
      'SELECT agency_id FROM users WHERE id = $1',
      [userId]
    );
    
    if (!userResult.rows.length) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    const agencyId = userResult.rows[0].agency_id;
    
    const sites = await sitesService.getSites({
      agencyId,
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    res.json({
      success: true,
      data: sites,
      count: sites.length,
    });
  } catch (error) {
    console.error('Error fetching sites:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sites',
    });
  }
};

/**
 * Update site
 * PUT /api/sites/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const updateSite = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const agencyId = req.query.agencyId;
    
    const site = await sitesService.updateSite(id, updates, agencyId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    res.json({
      success: true,
      data: site,
    });
  } catch (error) {
    console.error('Error updating site:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update site',
    });
  }
};

/**
 * Delete site (soft delete)
 * DELETE /api/sites/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const deleteSite = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.query.agencyId;
    
    const deleted = await sitesService.deleteSite(id, agencyId);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Site deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting site:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete site',
    });
  }
};

/**
 * Get tracking script for a site
 * GET /api/sites/:id/script
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getTrackingScript = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.query.agencyId;
    
    const site = await sitesService.getSiteById(id, agencyId);
    
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    // Generate script with proper server URL
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    const script = sitesService.generateTrackingScript(site.script_id, serverUrl);
    
    res.json({
      success: true,
      data: {
        scriptId: site.script_id,
        script,
      },
    });
  } catch (error) {
    console.error('Error generating tracking script:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate tracking script',
    });
  }
};

/**
 * Get site statistics
 * GET /api/sites/:id/stats
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getSiteStats = async (req, res) => {
  try {
    const { id } = req.params;
    const agencyId = req.query.agencyId;
    
    // Verify site exists and agency has access
    const site = await sitesService.getSiteById(id, agencyId);
    if (!site) {
      return res.status(404).json({
        success: false,
        error: 'Site not found',
      });
    }
    
    const stats = await sitesService.getSiteStats(id);
    
    res.json({
      success: true,
      data: {
        site: {
          id: site.id,
          name: site.name,
          domain: site.domain,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching site stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch site statistics',
    });
  }
};

module.exports = {
  createSite,
  getSite,
  getSites,
  updateSite,
  deleteSite,
  getTrackingScript,
  getSiteStats,
};
