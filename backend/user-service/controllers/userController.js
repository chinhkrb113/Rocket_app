const userService = require('../services/userService');
const { catchAsync } = require('../middleware/errorHandler');
const { validationResult } = require('express-validator');
const { AppError } = require('../middleware/errorHandler');

class UserController {
  getAllUsers = catchAsync(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const role = req.query.role;
    const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;

    const options = {
      limit: Math.min(limit, 100), // Max 100 items per page
      offset,
      role,
      isActive
    };

    const result = await userService.getAllUsers(options);
    
    res.status(200).json({
      success: true,
      data: result,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });
  });

  getUserById = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    const user = await userService.getUserById(parseInt(id));
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  getCurrentUser = catchAsync(async (req, res) => {
    const user = await userService.getUserById(req.user.id);
    
    res.status(200).json({
      success: true,
      data: { user }
    });
  });

  createUser = catchAsync(async (req, res) => {
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

    const user = await userService.createUser(userData);
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { user }
    });
  });

  updateUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    // Only allow certain fields to be updated
    const allowedFields = ['full_name', 'email', 'phone', 'is_active'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    // Check if user is trying to update their own account or if they're admin
    const userId = parseInt(id);
    if (req.user.id !== userId && req.user.role !== 'admin') {
      throw new AppError('You can only update your own profile', 403);
    }

    // Only admin can update is_active field
    if (updateData.is_active !== undefined && req.user.role !== 'admin') {
      delete updateData.is_active;
    }

    const user = await userService.updateUser(userId, updateData);
    
    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: { user }
    });
  });

  updateCurrentUser = catchAsync(async (req, res) => {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400, errors.array());
    }

    // Only allow certain fields to be updated by user themselves
    const allowedFields = ['full_name', 'phone'];
    const updateData = {};
    
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    const user = await userService.updateUser(req.user.id, updateData);
    
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  });

  changePassword = catchAsync(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      throw new AppError('Current password and new password are required', 400);
    }

    await userService.changePassword(req.user.id, currentPassword, newPassword);
    
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  });

  deleteUser = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    const userId = parseInt(id);
    
    // Only admin can delete users, and they can't delete themselves
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can delete users', 403);
    }

    if (req.user.id === userId) {
      throw new AppError('You cannot delete your own account', 400);
    }

    await userService.deleteUser(userId);
    
    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  });

  verifyEmail = catchAsync(async (req, res) => {
    const { id } = req.params;
    
    if (!id || isNaN(id)) {
      throw new AppError('Invalid user ID', 400);
    }

    const userId = parseInt(id);
    
    // Only admin can verify emails or users can verify their own
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      throw new AppError('You can only verify your own email', 403);
    }

    await userService.verifyUserEmail(userId);
    
    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });
  });

  getUsersByRole = catchAsync(async (req, res) => {
    const { role } = req.params;
    
    const validRoles = ['student', 'staff', 'admin', 'enterprise_contact'];
    if (!validRoles.includes(role)) {
      throw new AppError('Invalid role', 400);
    }

    const users = await userService.getUsersByRole(role);
    
    res.status(200).json({
      success: true,
      data: { users },
      count: users.length
    });
  });

  getUserStats = catchAsync(async (req, res) => {
    // Only admin can view user statistics
    if (req.user.role !== 'admin') {
      throw new AppError('Only administrators can view user statistics', 403);
    }

    const stats = {
      total: await userService.getAllUsers({ limit: 1 }).then(result => result.total),
      active: await userService.getAllUsers({ limit: 1, isActive: true }).then(result => result.total),
      inactive: await userService.getAllUsers({ limit: 1, isActive: false }).then(result => result.total),
      byRole: {
        students: await userService.getUsersByRole('student').then(users => users.length),
        staff: await userService.getUsersByRole('staff').then(users => users.length),
        admins: await userService.getUsersByRole('admin').then(users => users.length),
        enterprise_contacts: await userService.getUsersByRole('enterprise_contact').then(users => users.length)
      }
    };
    
    res.status(200).json({
      success: true,
      data: { stats }
    });
  });
}

module.exports = new UserController();