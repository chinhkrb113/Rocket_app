-- Hệ thống Quản lý Đào tạo và Tuyển dụng AI-First
-- Database Schema - MySQL DDL
-- Created: 2024

-- Tạo database
CREATE DATABASE IF NOT EXISTS rocket_training_system 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE rocket_training_system;

-- Bảng users: Lưu thông tin chung người dùng
CREATE TABLE users (
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
);

-- Bảng students: Mở rộng thông tin học viên
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    address TEXT,
    date_of_birth DATE,
    background TEXT,
    education_level VARCHAR(100),
    current_job VARCHAR(255),
    goals TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_date_of_birth (date_of_birth)
);

-- Bảng staff: Thông tin nhân viên nội bộ
CREATE TABLE staff (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    position VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    hire_date DATE,
    salary DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_position (position),
    INDEX idx_department (department)
);

-- Bảng enterprises: Thông tin doanh nghiệp đối tác
CREATE TABLE enterprises (
    id INT PRIMARY KEY AUTO_INCREMENT,
    company_name VARCHAR(255) NOT NULL,
    address TEXT,
    tax_code VARCHAR(50) UNIQUE,
    industry VARCHAR(100),
    company_size ENUM('startup', 'small', 'medium', 'large', 'enterprise'),
    website VARCHAR(255),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_company_name (company_name),
    INDEX idx_tax_code (tax_code),
    INDEX idx_industry (industry),
    INDEX idx_is_active (is_active)
);

-- Bảng courses: Thông tin khóa học
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    duration_weeks INT,
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    content_detail JSON,
    max_students INT DEFAULT 30,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_title (title),
    INDEX idx_level (level),
    INDEX idx_is_active (is_active),
    INDEX idx_created_by (created_by)
);

-- Bảng enrollments: Đăng ký khóa học
CREATE TABLE enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    course_id INT NOT NULL,
    enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'in_progress', 'completed', 'dropped', 'suspended') DEFAULT 'enrolled',
    progress_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_score DECIMAL(5,2),
    completion_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (student_id, course_id),
    INDEX idx_student_id (student_id),
    INDEX idx_course_id (course_id),
    INDEX idx_status (status),
    INDEX idx_enrollment_date (enrollment_date)
);

-- Bảng tasks: Các task trong khóa học
CREATE TABLE tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type ENUM('assignment', 'project', 'quiz', 'exam') DEFAULT 'assignment',
    max_score DECIMAL(5,2) DEFAULT 100.00,
    due_date TIMESTAMP,
    is_required BOOLEAN DEFAULT TRUE,
    order_index INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    INDEX idx_course_id (course_id),
    INDEX idx_task_type (task_type),
    INDEX idx_due_date (due_date),
    INDEX idx_order_index (order_index)
);

-- Bảng student_tasks: Tiến độ làm task của học viên
CREATE TABLE student_tasks (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    task_id INT NOT NULL,
    status ENUM('pending', 'in_progress', 'completed', 'overdue', 'graded') DEFAULT 'pending',
    submission_url VARCHAR(500),
    submission_text TEXT,
    score DECIMAL(5,2),
    feedback TEXT,
    submitted_at TIMESTAMP NULL,
    graded_at TIMESTAMP NULL,
    graded_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
    FOREIGN KEY (graded_by) REFERENCES users(id),
    UNIQUE KEY unique_student_task (student_id, task_id),
    INDEX idx_student_id (student_id),
    INDEX idx_task_id (task_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at)
);

-- Bảng competencies: Danh sách các năng lực
CREATE TABLE competencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,
    category VARCHAR(100),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_name (name),
    INDEX idx_category (category),
    INDEX idx_is_active (is_active)
);

-- Bảng student_competencies: Bản đồ năng lực học viên
CREATE TABLE student_competencies (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    competency_id INT NOT NULL,
    score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    assessment_method ENUM('self_assessment', 'peer_review', 'instructor_evaluation', 'ai_analysis') DEFAULT 'ai_analysis',
    last_updated_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (competency_id) REFERENCES competencies(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_competency (student_id, competency_id),
    INDEX idx_student_id (student_id),
    INDEX idx_competency_id (competency_id),
    INDEX idx_score (score)
);

-- Bảng leads: Khách hàng tiềm năng
CREATE TABLE leads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    source VARCHAR(100),
    status ENUM('new', 'contacted', 'qualified', 'converted', 'lost') DEFAULT 'new',
    lead_score DECIMAL(5,2) DEFAULT 0.00,
    interested_courses JSON,
    notes TEXT,
    assigned_to INT,
    last_contact_date TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_status (status),
    INDEX idx_lead_score (lead_score),
    INDEX idx_source (source),
    INDEX idx_assigned_to (assigned_to)
);

-- Bảng interactions: Log tương tác
CREATE TABLE interactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lead_id INT,
    student_id INT,
    user_id INT,
    interaction_type ENUM('view_page', 'submit_form', 'chat_message', 'email_open', 'email_click', 'phone_call', 'meeting') NOT NULL,
    metadata JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_lead_id (lead_id),
    INDEX idx_student_id (student_id),
    INDEX idx_user_id (user_id),
    INDEX idx_interaction_type (interaction_type),
    INDEX idx_created_at (created_at)
);

-- Bảng job_descriptions: JD từ doanh nghiệp
CREATE TABLE job_descriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enterprise_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description_text TEXT NOT NULL,
    parsed_requirements JSON,
    required_skills JSON,
    experience_level ENUM('entry', 'junior', 'mid', 'senior', 'lead') DEFAULT 'junior',
    salary_min DECIMAL(12,2),
    salary_max DECIMAL(12,2),
    location VARCHAR(255),
    job_type ENUM('full_time', 'part_time', 'contract', 'internship') DEFAULT 'full_time',
    is_active BOOLEAN DEFAULT TRUE,
    posted_by INT,
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (enterprise_id) REFERENCES enterprises(id) ON DELETE CASCADE,
    FOREIGN KEY (posted_by) REFERENCES users(id),
    INDEX idx_enterprise_id (enterprise_id),
    INDEX idx_title (title),
    INDEX idx_experience_level (experience_level),
    INDEX idx_job_type (job_type),
    INDEX idx_is_active (is_active),
    INDEX idx_posted_by (posted_by),
    INDEX idx_expires_at (expires_at)
);

-- Thêm dữ liệu mẫu cho competencies
INSERT INTO competencies (name, category, description) VALUES
('Python Programming', 'Technical', 'Khả năng lập trình Python'),
('JavaScript', 'Technical', 'Khả năng lập trình JavaScript'),
('UI/UX Design', 'Design', 'Thiết kế giao diện người dùng'),
('Project Management', 'Soft Skills', 'Quản lý dự án'),
('Teamwork', 'Soft Skills', 'Làm việc nhóm'),
('Communication', 'Soft Skills', 'Kỹ năng giao tiếp'),
('Problem Solving', 'Soft Skills', 'Giải quyết vấn đề'),
('Data Analysis', 'Technical', 'Phân tích dữ liệu'),
('Machine Learning', 'Technical', 'Học máy'),
('Database Design', 'Technical', 'Thiết kế cơ sở dữ liệu');

-- Tạo user admin mặc định
INSERT INTO users (full_name, email, password_hash, role) VALUES
('System Admin', 'admin@rocket.com', '$2b$10$example_hash_here', 'admin');

COMMIT;