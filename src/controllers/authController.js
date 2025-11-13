/**
 * Auth Controller: handles HTTP requests for authentication
 */
const authService = require('../services/authService');

/**
 * Register new user (create account)
 */
const register = async (req, res, next) => {
  try {
    const { email, password, name, agencyId } = req.body;

    // Basic validation
    if (!email || !password || !name) {
      return res.status(400).json({
        status: 'error',
        message: 'Email, password, and name are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'Password must be at least 8 characters',
      });
    }

    const result = await authService.registerUser({
      email,
      password,
      name,
      agencyId,
    });

    // Set token in HTTP-only cookie (optional)
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email and password are required',
      });
    }

    const result = await authService.loginUser(email, password);

    // Set token in HTTP-only cookie (optional)
    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    // Don't reveal if email doesn't exist for security
    if (error.message.includes('Invalid')) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials',
      });
    }
    next(error);
  }
};

/**
 * Get current user (verify token)
 */
const getCurrentUser = async (req, res, next) => {
  try {
    const user = await authService.getUserById(req.user.id);

    res.json({
      status: 'success',
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        agencyId: user.agency_id,
        status: user.status,
        lastLogin: user.last_login,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout user
 */
const logout = (req, res) => {
  res.clearCookie('token');
  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
};

/**
 * Change password
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Current password, new password, and confirmation are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New passwords do not match',
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        status: 'error',
        message: 'New password must be at least 8 characters',
      });
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      status: 'success',
      message: 'Password changed successfully',
    });
  } catch (error) {
    if (error.message.includes('incorrect')) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect',
      });
    }
    next(error);
  }
};

/**
 * Request password reset (send email with token)
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Email is required',
      });
    }

    await authService.requestPasswordReset(email);

    // Always return success (don't reveal if email exists)
    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Don't expose errors to user
    res.json({
      success: true,
      message: 'If that email exists, a reset link has been sent',
    });
  }
};

/**
 * Reset password with token
 */
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        error: 'Token and password are required',
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      });
    }

    await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    if (error.message.includes('Invalid') || error.message.includes('expired')) {
      return res.status(400).json({
        error: 'Invalid or expired reset token',
      });
    }
    next(error);
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  logout,
  changePassword,
  forgotPassword,
  resetPassword,
};
