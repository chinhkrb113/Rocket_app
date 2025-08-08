const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { AppError } = require('../middleware/errorHandler');
const logger = require('../config/logger');

class UserService {
  async getAllUsers(options = {}) {
    try {
      const users = await userRepository.findAll(options);
      const total = await userRepository.count(options);
      
      return {
        users: users.map(user => this.sanitizeUser(user)),
        total,
        page: Math.floor(options.offset / options.limit) + 1,
        totalPages: Math.ceil(total / options.limit)
      };
    } catch (error) {
      logger.error('Error in getAllUsers:', error);
      throw new AppError('Failed to fetch users', 500);
    }
  }

  async getUserById(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getUserById:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async getUserByEmail(email) {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new AppError('User not found', 404);
      }
      return this.sanitizeUser(user);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in getUserByEmail:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async createUser(userData) {
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

      // Hash password
      const saltRounds = 12;
      const password_hash = await bcrypt.hash(userData.password, saltRounds);

      // Create user
      const newUser = await userRepository.create({
        ...userData,
        password_hash
      });

      logger.info(`New user created: ${newUser.email}`);
      return this.sanitizeUser(newUser);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in createUser:', error);
      throw new AppError('Failed to create user', 500);
    }
  }

  async updateUser(id, userData) {
    try {
      // Check if user exists
      const existingUser = await userRepository.findById(id);
      if (!existingUser) {
        throw new AppError('User not found', 404);
      }

      // Check if email is being changed and if it's already taken
      if (userData.email && userData.email !== existingUser.email) {
        const emailExists = await userRepository.findByEmail(userData.email);
        if (emailExists) {
          throw new AppError('Email is already taken', 400);
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
          throw new AppError('Invalid email format', 400);
        }

        // Reset email verification if email is changed
        userData.email_verified = false;
      }

      const updatedUser = await userRepository.update(id, userData);
      logger.info(`User updated: ${updatedUser.email}`);
      return this.sanitizeUser(updatedUser);
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in updateUser:', error);
      throw new AppError('Failed to update user', 500);
    }
  }

  async changePassword(id, currentPassword, newPassword) {
    try {
      const user = await userRepository.findById(id);
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

      // Hash new password
      const saltRounds = 12;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      await userRepository.updatePassword(id, newPasswordHash);
      logger.info(`Password changed for user: ${user.email}`);
      
      return { message: 'Password changed successfully' };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in changePassword:', error);
      throw new AppError('Failed to change password', 500);
    }
  }

  async deleteUser(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const deleted = await userRepository.softDelete(id);
      if (deleted) {
        logger.info(`User soft deleted: ${user.email}`);
        return { message: 'User deleted successfully' };
      } else {
        throw new AppError('Failed to delete user', 500);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in deleteUser:', error);
      throw new AppError('Failed to delete user', 500);
    }
  }

  async verifyUserEmail(id) {
    try {
      const user = await userRepository.findById(id);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const verified = await userRepository.verifyEmail(id);
      if (verified) {
        logger.info(`Email verified for user: ${user.email}`);
        return { message: 'Email verified successfully' };
      } else {
        throw new AppError('Failed to verify email', 500);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error in verifyUserEmail:', error);
      throw new AppError('Failed to verify email', 500);
    }
  }

  async getUsersByRole(role) {
    try {
      const users = await userRepository.findByRole(role);
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      logger.error('Error in getUsersByRole:', error);
      throw new AppError('Failed to fetch users by role', 500);
    }
  }

  async validatePassword(email, password) {
    try {
      const user = await userRepository.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      logger.error('Error in validatePassword:', error);
      throw new AppError('Failed to validate password', 500);
    }
  }

  sanitizeUser(user) {
    if (!user) return null;
    
    const { password_hash, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}

module.exports = new UserService();