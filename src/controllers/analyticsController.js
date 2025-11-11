/**
 * Analytics Controller: dashboard data endpoints
 */
const analyticsService = require('../services/analyticsService');

/**
 * Get overview metrics
 */
const getOverviewMetrics = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getOverviewMetrics(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get traffic sources
 */
const getTrafficSources = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getTrafficSources(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get device breakdown
 */
const getDeviceBreakdown = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getDeviceBreakdown(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get geographic distribution
 */
const getGeographicDistribution = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getGeographicDistribution(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get time series data
 */
const getTimeSeriesData = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30, groupBy = 'day' } = req.query;

    const data = await analyticsService.getTimeSeriesData(siteId, parseInt(dateRange), groupBy);

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get funnel analysis
 */
const getFunnelAnalysis = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30, events } = req.query;
    const eventSequence = events ? events.split(',') : ['page_view', 'click'];

    const data = await analyticsService.getFunnelAnalysis(siteId, eventSequence, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get bounce rate
 */
const getBounceRate = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getBounceRate(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get visitor segmentation
 */
const getVisitorSegmentation = async (req, res, next) => {
  try {
    const { siteId } = req.params;
    const { dateRange = 30 } = req.query;

    const data = await analyticsService.getVisitorSegmentation(siteId, parseInt(dateRange));

    res.json({
      status: 'success',
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOverviewMetrics,
  getTrafficSources,
  getDeviceBreakdown,
  getGeographicDistribution,
  getTimeSeriesData,
  getFunnelAnalysis,
  getBounceRate,
  getVisitorSegmentation,
};
