/**
 * Companies Routes: B2B lead tracking and insights
 */
const express = require('express');
const router = express.Router();
const companiesController = require('../controllers/companiesController');
const { verifyJWT } = require('../middleware/authMiddleware');

/**
 * @route GET /api/companies
 * @desc Get all companies with optional filtering
 * @query {string} leadStatus - Filter by lead status (hot, warm, cold)
 * @query {string} domain - Search by domain
 * @query {string} sortBy - Sort by field
 * @query {number} limit, offset - Pagination
 */
router.get('/', verifyJWT, companiesController.getCompanies);

/**
 * @route GET /api/companies/:companyId
 * @desc Get company details with engagement data
 * @param {string} companyId - Company ID
 */
router.get('/:companyId', verifyJWT, companiesController.getCompanyDetails);

/**
 * @route GET /api/companies/export/csv
 * @desc Export companies as CSV
 * @query {string} leadStatus - Filter by lead status
 */
router.get('/export/csv', verifyJWT, companiesController.exportCompanies);

module.exports = router;
