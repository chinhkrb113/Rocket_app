const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function createDatabase() {
  let connection;
  
  try {
    // Connect without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create database
    console.log('🗄️  Creating database...');
    await connection.execute(`
      CREATE DATABASE IF NOT EXISTS rocket_training_system 
      CHARACTER SET utf8mb4 
      COLLATE utf8mb4_unicode_ci
    `);
    
    console.log('✅ Database created successfully!');
    
    // Switch to the database
    await connection.query('USE rocket_training_system');
    
    // Create tables
    console.log('📋 Creating tables...');
    
    // Users table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        role ENUM('student', 'staff', 'admin', 'enterprise_contact') NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        email_verified BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_email (email),
        INDEX idx_role (role),
        INDEX idx_created_at (created_at)
      )
    `);
    
    // Students table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        address TEXT,
        date_of_birth DATE,
        background TEXT,
        education_level VARCHAR(100),
        goals TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);
    
    // Staff table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS staff (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        position VARCHAR(100),
        department VARCHAR(100),
        hire_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_id (user_id)
      )
    `);
    
    // Enterprises table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS enterprises (
        id INT PRIMARY KEY AUTO_INCREMENT,
        company_name VARCHAR(255) NOT NULL,
        address TEXT,
        tax_code VARCHAR(50) UNIQUE,
        industry VARCHAR(100),
        company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise') DEFAULT 'medium',
        website VARCHAR(255),
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_company_name (company_name),
        INDEX idx_industry (industry)
      )
    `);
    
    // Courses table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        duration_weeks INT DEFAULT 1,
        level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
        content_detail JSON,
        max_students INT DEFAULT 30,
        created_by INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (created_by) REFERENCES users(id),
        INDEX idx_title (title),
        INDEX idx_level (level),
        INDEX idx_created_by (created_by)
      )
    `);
    
    // Enrollments table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        status ENUM('enrolled', 'in_progress', 'completed', 'dropped') DEFAULT 'enrolled',
        progress_percentage DECIMAL(5,2) DEFAULT 0.00,
        final_score DECIMAL(5,2),
        enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP NULL,
        
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, course_id),
        INDEX idx_student_id (student_id),
        INDEX idx_course_id (course_id),
        INDEX idx_status (status)
      )
    `);
    
    // Tasks table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INT PRIMARY KEY AUTO_INCREMENT,
        course_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        task_type ENUM('assignment', 'quiz', 'project', 'exam') DEFAULT 'assignment',
        max_score DECIMAL(5,2) DEFAULT 100.00,
        due_date TIMESTAMP NULL,
        order_index INT DEFAULT 0,
        is_required BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        INDEX idx_course_id (course_id),
        INDEX idx_task_type (task_type),
        INDEX idx_order_index (order_index)
      )
    `);
    
    // Competencies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS competencies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) NOT NULL UNIQUE,
        category VARCHAR(100),
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_name (name),
        INDEX idx_category (category)
      )
    `);
    
    // Student competencies table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS student_competencies (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        competency_id INT NOT NULL,
        score DECIMAL(5,2) NOT NULL,
        assessment_method ENUM('ai_analysis', 'manual_review', 'peer_review') DEFAULT 'ai_analysis',
        assessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_competency (student_id, competency_id),
        INDEX idx_student_id (student_id),
        INDEX idx_competency_id (competency_id)
      )
    `);
    
    // Leads table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id INT PRIMARY KEY AUTO_INCREMENT,
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        source ENUM('website', 'social', 'referral', 'ads', 'event', 'other') DEFAULT 'website',
        status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
        lead_score DECIMAL(5,2) DEFAULT 0.00,
        interested_courses JSON,
        notes TEXT,
        assigned_to INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        FOREIGN KEY (assigned_to) REFERENCES users(id),
        INDEX idx_email (email),
        INDEX idx_status (status),
        INDEX idx_source (source),
        INDEX idx_assigned_to (assigned_to)
      )
    `);
    
    // Insert default competencies
    await connection.execute(`
      INSERT IGNORE INTO competencies (name, category, description) VALUES
      ('JavaScript Programming', 'Technical', 'Proficiency in JavaScript language and ES6+ features'),
      ('React Development', 'Technical', 'Building user interfaces with React framework'),
      ('Node.js Backend', 'Technical', 'Server-side development with Node.js'),
      ('Database Design', 'Technical', 'Designing and optimizing database schemas'),
      ('Problem Solving', 'Soft Skills', 'Analytical thinking and problem-solving abilities'),
      ('Communication', 'Soft Skills', 'Effective verbal and written communication'),
      ('Teamwork', 'Soft Skills', 'Collaboration and team working skills'),
      ('Project Management', 'Soft Skills', 'Planning and managing projects effectively')
    `);
    
    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

if (require.main === module) {
  createDatabase()
    .then(() => {
      console.log('🎉 Database setup completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Database setup failed:', error.message);
      process.exit(1);
    });
}

module.exports = { createDatabase };