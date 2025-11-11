/**
 * Users Controller: user management endpoints for admins
 */
const userService = require('../services/userService');

/**
 * Get all users (super_admin only)
 */
const getAllUsers = async (req, res, next) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await userService.getAllUsers(
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
 * Get users by agency
 */
const getUsersByAgency = async (req, res, next) => {
  try {
    const { agencyId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await userService.getUsersByAgency(
      agencyId,
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
 * Create user (admin only)
 */
const createUser = async (req, res, next) => {
  try {
    const { email, name, role, agencyId } = req.body;

    // Validate
    if (!email || !name || !role || !agencyId) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, name, role, and agencyId are required',
      });
    }

    if (!['super_admin', 'agency_admin', 'agency_manager', 'client_user'].includes(role)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid role',
      });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    const user = await userService.createUser(
      { email, name, role, agencyId },
      tempPassword
    );

    res.status(201).json({
      status: 'success',
      data: {
        user,
        temporaryPassword: tempPassword,
        message: 'User created. Share the temporary password with the user.',
      },
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        status: 'error',
        message: error.message,
      });
    }
    next(error);
  }
};

/**
 * Update user
 */
const updateUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { name, role, status } = req.body;

    const user = await userService.updateUser(userId, { name, role, status });

    res.json({
      status: 'success',
      data: user,
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
 * Delete user (soft delete)
 */
const deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;

    await userService.deleteUser(userId);

    res.json({
      status: 'success',
      message: 'User deactivated successfully',
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
 * Reset user password (admin only)
 */
const resetUserPassword = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const tempPassword = await userService.resetUserPassword(userId);

    res.json({
      status: 'success',
      data: {
        temporaryPassword: tempPassword,
        message: 'Password reset. Share the temporary password with the user.',
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUsersByAgency,
  createUser,
  updateUser,
  deleteUser,
  resetUserPassword,
};
