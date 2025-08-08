const { executeQuery } = require('../config/database');
const bcrypt = require('bcrypt');

class UserService {
  // Get user by email
  async getUserByEmail(email) {
    const query = `
      SELECT u.*, s.id as student_id, st.id as staff_id 
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      LEFT JOIN staff st ON u.id = st.user_id 
      WHERE u.email = ? AND u.is_active = TRUE
    `;
    const users = await executeQuery(query, [email]);
    return users[0] || null;
  }

  // Get user by ID
  async getUserById(id) {
    const query = `
      SELECT u.*, s.id as student_id, st.id as staff_id 
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      LEFT JOIN staff st ON u.id = st.user_id 
      WHERE u.id = ? AND u.is_active = TRUE
    `;
    const users = await executeQuery(query, [id]);
    return users[0] || null;
  }

  // Verify password
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Create new user
  async createUser(userData) {
    const { full_name, email, password, phone, role } = userData;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (full_name, email, password_hash, phone, role, email_verified) 
      VALUES (?, ?, ?, ?, ?, TRUE)
    `;
    
    const result = await executeQuery(query, [full_name, email, hashedPassword, phone, role]);
    return result.insertId;
  }

  // Update user profile
  async updateUser(id, updateData) {
    const { full_name, phone } = updateData;
    const query = `
      UPDATE users 
      SET full_name = ?, phone = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await executeQuery(query, [full_name, phone, id]);
    return await this.getUserById(id);
  }

  // Get all users with pagination
  async getAllUsers(page = 1, limit = 10, role = null) {
    const offset = (page - 1) * limit;
    let query = `
      SELECT u.id, u.full_name, u.email, u.phone, u.role, u.is_active, u.created_at,
             s.id as student_id, st.id as staff_id
      FROM users u 
      LEFT JOIN students s ON u.id = s.user_id 
      LEFT JOIN staff st ON u.id = st.user_id 
      WHERE u.is_active = TRUE
    `;
    
    const params = [];
    if (role) {
      query += ' AND u.role = ?';
      params.push(role);
    }
    
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const users = await executeQuery(query, params);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = TRUE';
    const countParams = [];
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    
    const countResult = await executeQuery(countQuery, countParams);
    const total = countResult[0].total;
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new UserService();