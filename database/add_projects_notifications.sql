-- Thêm bảng projects và notifications vào database
USE rocket_training_system;

-- Bảng projects: Dự án từ doanh nghiệp
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    enterprise_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status ENUM('planning', 'active', 'on_hold', 'completed', 'cancelled') DEFAULT 'planning',
    budget DECIMAL(12,2),
    duration VARCHAR(100),
    required_skills JSON,
    assigned_student_ids JSON, -- Store assigned student IDs as a JSON array
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
);

-- Bảng notifications: Hệ thống thông báo
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'success', 'warning', 'error', 'project_assignment') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type VARCHAR(50), -- 'project', 'course', 'task', etc.
    related_entity_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at),
    INDEX idx_related_entity (related_entity_type, related_entity_id)
);

-- Bảng project_assignments: Phân công nhân viên vào dự án
-- Bảng project_student_assignments: Phân công học viên vào dự án
CREATE TABLE project_student_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    student_id INT NOT NULL,
    role VARCHAR(100), -- e.g., 'developer', 'designer'
    assigned_by INT,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('assigned', 'in_progress', 'completed', 'withdrawn') DEFAULT 'assigned',
    
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    UNIQUE KEY unique_project_student (project_id, student_id),
    INDEX idx_project_id (project_id),
    INDEX idx_student_id (student_id)
);

COMMIT;