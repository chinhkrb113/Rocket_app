const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepository = require('../repositories/userRepository');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class AuthService {
  async register(userData) {
    try {
      // Check if user already exists
      const existingUser = await userRepository.findByEmail(userData.email);
      if (existingUser) {
        throw new AppError('User with this email already exists', 400);
      }

      // Validate required fields
      if (!userData.full_name || !userData.email || !userData.password) {
        throw new AppError('Full name, email, and password are required', 400);
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new AppError('Invalid email format', 400);
      }

      // Validate password strength
      if (userData.password.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      // Check password complexity
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(userData.password)) {
        throw new AppError(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          400
        );
      }

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const newUser = await userRepository.create({
        full_name: userData.full_name,
        email: userData.email.toLowerCase(),
        password_hash,
        phone: userData.phone,
        role: userData.role || 'student'
      });

      // Generate JWT token
      const token = this.generateToken(newUser.id);

      logger.info(`New user registered: ${newUser.email}`);
      
      return {
        token,
        user: this.sanitizeUser(newUser)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in register:', error);
      throw new AppError('Registration failed', 500);
    }
  }

  async login(email, password) {
    try {
      // Validate input
      if (!email || !password) {
        throw new AppError('Email and password are required', 400);
      }

      // Find user by email
      const user = await userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.is_active) {
        throw new AppError('Your account has been deactivated. Please contact support.', 401);
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate JWT token
      const token = this.generateToken(user.id);

      logger.info(`User logged in: ${user.email}`);
      
      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in login:', error);
      throw new AppError('Login failed', 500);
    }
  }

  async refreshToken(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (!user.is_active) {
        throw new AppError('Account is deactivated', 401);
      }

      const token = this.generateToken(user.id);
      
      return {
        token,
        user: this.sanitizeUser(user)
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in refreshToken:', error);
      throw new AppError('Token refresh failed', 500);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new AppError('New password must be at least 8 characters long', 400);
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        throw new AppError(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          400
        );
      }

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await userRepository.updatePassword(userId, newPasswordHash);
      logger.info(`Password changed for user: ${user.email}`);
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in changePassword:', error);
      throw new AppError('Password change failed', 500);
    }
  }

  async forgotPassword(email) {
    try {
      const user = await userRepository.findByEmail(email.toLowerCase());
      if (!user) {
        // Don't reveal if email exists or not for security
        return { message: 'If the email exists, a reset link has been sent' };
      }

      // Generate reset token (in real app, you'd send this via email)
      const resetToken = this.generateResetToken(user.id);
      
      logger.info(`Password reset requested for: ${user.email}`);
      
      // In a real application, you would:
      // 1. Store the reset token in database with expiration
      // 2. Send email with reset link
      // 3. Return success message without revealing if email exists
      
      return {
        message: 'If the email exists, a reset link has been sent',
        resetToken // Remove this in production
      };
    } catch (error) {
      logger.error('Error in forgotPassword:', error);
      throw new AppError('Password reset request failed', 500);
    }
  }

  async resetPassword(resetToken, newPassword) {
    try {
      // Verify reset token
      const decoded = jwt.verify(resetToken, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
      
      const user = await userRepository.findById(decoded.id);
      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      // Validate new password
      if (newPassword.length < 8) {
        throw new AppError('Password must be at least 8 characters long', 400);
      }

      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
      if (!passwordRegex.test(newPassword)) {
        throw new AppError(
          'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
          400
        );
      }

      // Hash new password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      await userRepository.updatePassword(user.id, passwordHash);
      logger.info(`Password reset completed for: ${user.email}`);
      
      return { message: 'Password reset successfully' };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid or expired reset token', 400);
      }
      if (error instanceof AppError) throw error;
      logger.error('Error in resetPassword:', error);
      throw new AppError('Password reset failed', 500);
    }
  }

  async verifyToken(token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await userRepository.findById(decoded.id);
      
      if (!user || !user.is_active) {
        throw new AppError('Invalid token', 401);
      }

      return this.sanitizeUser(user);
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new AppError('Invalid or expired token', 401);
      }
      throw error;
    }
  }

  generateToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
  }

  generateResetToken(userId) {
    return jwt.sign(
      { id: userId },
      process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = new AuthService();