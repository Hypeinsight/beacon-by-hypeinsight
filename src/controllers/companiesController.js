/**
 * Companies Controller: B2B lead and company insights
 */
const companyService = require('../services/companyService');

/**
 * Get all companies with optional filtering
 */
const getCompanies = async (req, res, next) => {
  try {
    const { leadStatus, domain, sortBy, limit = 50, offset = 0 } = req.query;

    const result = await companyService.getCompanies(
      req.user.agencyId,
      { leadStatus, domain, sortBy },
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
 * Get company details
 */
const getCompanyDetails = async (req, res, next) => {
  try {
    const { companyId } = req.params;

    const result = await companyService.getCompanyDetails(companyId);

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
 * Export companies as CSV
 */
const exportCompanies = async (req, res, next) => {
  try {
    const { leadStatus } = req.query;

    const csv = await companyService.exportCompanies({ leadStatus });

    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', 'attachment; filename="companies.csv"');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCompanies,
  getCompanyDetails,
  exportCompanies,
};
