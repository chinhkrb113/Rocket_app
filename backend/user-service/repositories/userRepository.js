const database = require('../config/database');
const logger = require('../config/logger');

class UserRepository {
  async findAll(options = {}) {
    try {
      const { limit = 50, offset = 0, role, isActive } = options;
      let query = 'SELECT id, full_name, email, phone, role, is_active, email_verified, created_at, updated_at FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      return await database.query(query, params);
    } catch (error) {
      logger.error('Error in findAll:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = ?';
      const users = await database.query(query, [id]);
      return users[0] || null;
    } catch (error) {
      logger.error('Error in findById:', error);
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = ?';
      const users = await database.query(query, [email]);
      return users[0] || null;
    } catch (error) {
      logger.error('Error in findByEmail:', error);
      throw error;
    }
  }

  async create(userData) {
    try {
      const {
        full_name,
        email,
        password_hash,
        phone,
        role = 'student'
      } = userData;

      const query = `
        INSERT INTO users (full_name, email, password_hash, phone, role)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      const result = await database.query(query, [
        full_name,
        email,
        password_hash,
        phone,
        role
      ]);

      return await this.findById(result.insertId);
    } catch (error) {
      logger.error('Error in create:', error);
      throw error;
    }
  }

  async update(id, userData) {
    try {
      const allowedFields = ['full_name', 'email', 'phone', 'is_active', 'email_verified'];
      const updateFields = [];
      const params = [];

      Object.keys(userData).forEach(key => {
        if (allowedFields.includes(key) && userData[key] !== undefined) {
          updateFields.push(`${key} = ?`);
          params.push(userData[key]);
        }
      });

      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }

      params.push(id);
      const query = `UPDATE users SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
      
      await database.query(query, params);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error in update:', error);
      throw error;
    }
  }

  async updatePassword(id, passwordHash) {
    try {
      const query = 'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      await database.query(query, [passwordHash, id]);
      return await this.findById(id);
    } catch (error) {
      logger.error('Error in updatePassword:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const query = 'DELETE FROM users WHERE id = ?';
      const result = await database.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error in delete:', error);
      throw error;
    }
  }

  async softDelete(id) {
    try {
      const query = 'UPDATE users SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await database.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error in softDelete:', error);
      throw error;
    }
  }

  async count(options = {}) {
    try {
      const { role, isActive } = options;
      let query = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
      const params = [];

      if (role) {
        query += ' AND role = ?';
        params.push(role);
      }

      if (isActive !== undefined) {
        query += ' AND is_active = ?';
        params.push(isActive);
      }

      const result = await database.query(query, params);
      return result[0].total;
    } catch (error) {
      logger.error('Error in count:', error);
      throw error;
    }
  }

  async verifyEmail(id) {
    try {
      const query = 'UPDATE users SET email_verified = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = ?';
      const result = await database.query(query, [id]);
      return result.affectedRows > 0;
    } catch (error) {
      logger.error('Error in verifyEmail:', error);
      throw error;
    }
  }

  async findByRole(role) {
    try {
      const query = 'SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE role = ? AND is_active = TRUE';
      return await database.query(query, [role]);
    } catch (error) {
      logger.error('Error in findByRole:', error);
      throw error;
    }
  }
}

module.exports = new UserRepository();