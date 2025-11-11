/**
 * Auth Middleware: JWT verification and role-based access control
 */
const { verifyToken } = require('../services/authService');

/**
 * Verify JWT token from Authorization header or cookies
 * Attaches user info to req.user
 */
const verifyJWT = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'No token provided. Please log in.',
      });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid token',
    });
  }
};

/**
 * Check if user has required role(s)
 * @param  {...string} allowedRoles - Roles that are allowed to access
 * @returns {Function} Middleware function
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Insufficient permissions. Required role: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};

/**
 * Check if user is part of the requested agency
 * Verifies that user's agencyId matches the requested agencyId
 * (unless user is super_admin)
 */
const requireAgencyAccess = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      status: 'error',
      message: 'Not authenticated',
    });
  }

  // Super admins can access any agency
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Extract agencyId from URL params or query
  const requestedAgencyId = req.params.agencyId || req.query.agencyId;

  if (!requestedAgencyId) {
    return res.status(400).json({
      status: 'error',
      message: 'Agency ID is required',
    });
  }

  // Check if user's agency matches requested agency
  if (req.user.agencyId !== requestedAgencyId) {
    return res.status(403).json({
      status: 'error',
      message: 'You do not have access to this agency',
    });
  }

  next();
};

/**
 * Require super admin role
 */
const requireSuperAdmin = requireRole('super_admin');

/**
 * Optional auth - verifies token if provided, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;

    if (token) {
      const decoded = verifyToken(token);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token invalid, but we don't care - it's optional
    next();
  }
};

module.exports = {
  verifyJWT,
  requireRole,
  requireAgencyAccess,
  requireSuperAdmin,
  optionalAuth,
};
