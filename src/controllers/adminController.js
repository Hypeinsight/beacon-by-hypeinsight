/**
 * Admin Controller: system-wide oversight endpoints (super_admin only)
 */
const adminService = require('../services/adminService');

/**
 * Get all agencies
 */
const getAllAgencies = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await adminService.getAllAgencies(
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get agency details
 */
const getAgencyDetails = async (req, res, next) => {
  try {
    const { agencyId } = req.params;

    const result = await adminService.getAgencyDetails(agencyId);

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Get system statistics
 */
const getSystemStats = async (req, res, next) => {
  try {
    const stats = await adminService.getSystemStats();

    res.json({
      status: 'success',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllAgencies,
  getAgencyDetails,
  getSystemStats,
};
