const { executeQuery } = require('./config/database');
const fs = require('fs');
const path = require('path');

async function addTables() {
  try {
    console.log('Adding projects and notifications tables...');
    
    // Tạo bảng projects
    const createProjectsTable = `
      CREATE TABLE IF NOT EXISTS projects (
        id INT PRIMARY KEY AUTO_INCREMENT,
        enterprise_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
        budget DECIMAL(12,2),
        duration VARCHAR(100),
        required_skills JSON,
        assigned_staff JSON,
        start_date DATE,
        end_date DATE,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_enterprise_id (enterprise_id),
        INDEX idx_status (status),
        INDEX idx_created_by (created_by),
        INDEX idx_created_at (created_at)
      )
    `;
    
    await executeQuery(createProjectsTable);
    console.log('Projects table created successfully');
    
    // Tạo bảng notifications
    const createNotificationsTable = `
      CREATE TABLE IF NOT EXISTS notifications (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('info', 'success', 'warning', 'error', 'project_assignment') DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        related_entity_type VARCHAR(50),
        related_entity_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id),
        INDEX idx_type (type),
        INDEX idx_is_read (is_read),
        INDEX idx_created_at (created_at),
        INDEX idx_related_entity (related_entity_type, related_entity_id)
      )
    `;
    
    await executeQuery(createNotificationsTable);
    console.log('Notifications table created successfully');
    
    // Tạo bảng project_assignments
    const createProjectAssignmentsTable = `
      CREATE TABLE IF NOT EXISTS project_assignments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        project_id INT NOT NULL,
        staff_id INT NOT NULL,
        role VARCHAR(100),
        assigned_by INT,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status ENUM('assigned', 'accepted', 'declined', 'completed') DEFAULT 'assigned',
        
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES users(id),
        UNIQUE KEY unique_project_staff (project_id, staff_id),
        INDEX idx_project_id (project_id),
        INDEX idx_staff_id (staff_id),
        INDEX idx_assigned_by (assigned_by),
        INDEX idx_status (status)
      )
    `;
    
    await executeQuery(createProjectAssignmentsTable);
    console.log('Project assignments table created successfully');
    
    console.log('All tables added successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('Error adding tables:', error);
    process.exit(1);
  }
}

addTables();