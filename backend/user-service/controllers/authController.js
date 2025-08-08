const authService = require('../services/authService');
const { catchAsync } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');
const { createSendToken } = require('../middleware/auth');

class AuthController {
  register = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const userData = {
      full_name: req.body.full_name,
      email: req.body.email,
      password: req.body.password,
      phone: req.body.phone,
      role: req.body.role || 'student'
    };

    const result = await authService.register(userData);
    
    // Set cookie and send response
    createSendToken(result.user, 201, res);
  });

  login = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { email, password } = req.body;
    
    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const result = await authService.login(email, password);
    
    // Set cookie and send response
    createSendToken(result.user, 200, res);
  });

  logout = catchAsync(async (req, res) => {
    res.cookie('jwt', 'loggedout', {
      expires: new Date(Date.now() + 10 * 1000),
      httpOnly: true
    });
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });

  refreshToken = catchAsync(async (req, res) => {
    const result = await authService.refreshToken(req.user.id);
    
    res.status(200).json({
      success: true,
      token: result.token,
      data: {
        user: result.user
      }
    });
  });

  changePassword = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    await authService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  forgotPassword = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { email } = req.body;
    
    if (!email) {
      throw new AppError('Email is required', 400);
    }

    const result = await authService.forgotPassword(email);
    
    res.status(200).json({
      success: true,
      message: result.message,
      // Remove resetToken in production
      ...(process.env.NODE_ENV === 'development' && { resetToken: result.resetToken })
    });
  });

  resetPassword = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    const { token } = req.params;
    const { password } = req.body;
    
    if (!token) {
      throw new AppError('Reset token is required', 400);
    }
    
    if (!password) {
      throw new AppError('New password is required', 400);
    }

    await authService.resetPassword(token, password);
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
  });

  verifyToken = catchAsync(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.jwt;
    
    if (!token) {
      throw new AppError('No token provided', 401);
    }

    const user = await authService.verifyToken(token);
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  getMe = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        user: req.user
      }
    });
  });

  checkAuth = catchAsync(async (req, res) => {
    // This endpoint is protected by the protect middleware
    // If we reach here, the user is authenticated
    res.status(200).json({
      success: true,
      authenticated: true,
      data: {
        user: req.user
      }
    });
  });

  // Admin only endpoints
  adminOnly = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Admin access granted',
      data: {
        user: req.user
      }
    });
  });

  // Staff and admin endpoints
  staffOnly = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Staff access granted',
      data: {
        user: req.user
      }
    });
  });

  // Enterprise contact endpoints
  enterpriseOnly = catchAsync(async (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Enterprise access granted',
      data: {
        user: req.user
      }
    });
  });
}

module.exports = new AuthController();