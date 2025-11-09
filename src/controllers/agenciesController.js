/**
 * Agencies Controller: handles HTTP requests for agency management.
 *
 * WHY: Separates HTTP layer from business logic, handles validation and error responses.
 */
const agenciesService = require('../services/agenciesService');

/**
 * Create a new agency
 * POST /api/agencies
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const createAgency = async (req, res) => {
  try {
    const { name, email, config } = req.body;
    
    // Validation
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Agency name is required',
      });
    }
    
    const agency = await agenciesService.createAgency({ name, email, config });
    
    res.status(201).json({
      success: true,
      data: agency,
      message: 'Agency created successfully. Save the API key - it will not be shown again.',
    });
  } catch (error) {
    console.error('Error creating agency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create agency',
    });
  }
};

/**
 * Get agency by ID
 * GET /api/agencies/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAgency = async (req, res) => {
  try {
    const { id } = req.params;
    
    const agency = await agenciesService.getAgencyById(id);
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found',
      });
    }
    
    res.json({
      success: true,
      data: agency,
    });
  } catch (error) {
    console.error('Error fetching agency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency',
    });
  }
};

/**
 * Get all agencies with optional filtering
 * GET /api/agencies
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAgencies = async (req, res) => {
  try {
    const { status, limit, offset } = req.query;
    
    const agencies = await agenciesService.getAgencies({
      status,
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
    });
    
    res.json({
      success: true,
      data: agencies,
      count: agencies.length,
    });
  } catch (error) {
    console.error('Error fetching agencies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agencies',
    });
  }
};

/**
 * Update agency
 * PUT /api/agencies/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const updateAgency = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const agency = await agenciesService.updateAgency(id, updates);
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found',
      });
    }
    
    res.json({
      success: true,
      data: agency,
    });
  } catch (error) {
    console.error('Error updating agency:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update agency',
    });
  }
};

/**
 * Delete agency (soft delete)
 * DELETE /api/agencies/:id
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const deleteAgency = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await agenciesService.deleteAgency(id);
    
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found',
      });
    }
    
    res.json({
      success: true,
      message: 'Agency deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting agency:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete agency',
    });
  }
};

/**
 * Regenerate API key for an agency
 * POST /api/agencies/:id/regenerate-key
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const regenerateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    
    const agency = await agenciesService.regenerateApiKey(id);
    
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found',
      });
    }
    
    res.json({
      success: true,
      data: agency,
      message: 'API key regenerated successfully. Save it - it will not be shown again.',
    });
  } catch (error) {
    console.error('Error regenerating API key:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to regenerate API key',
    });
  }
};

/**
 * Get agency statistics
 * GET /api/agencies/:id/stats
 * @param {object} req - Express request
 * @param {object} res - Express response
 */
const getAgencyStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify agency exists
    const agency = await agenciesService.getAgencyById(id);
    if (!agency) {
      return res.status(404).json({
        success: false,
        error: 'Agency not found',
      });
    }
    
    const stats = await agenciesService.getAgencyStats(id);
    
    res.json({
      success: true,
      data: {
        agency: {
          id: agency.id,
          name: agency.name,
        },
        stats,
      },
    });
  } catch (error) {
    console.error('Error fetching agency stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch agency statistics',
    });
  }
};

module.exports = {
  createAgency,
  getAgency,
  getAgencies,
  updateAgency,
  deleteAgency,
  regenerateApiKey,
  getAgencyStats,
};
