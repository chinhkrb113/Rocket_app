const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'rocket_training_system',
  multipleStatements: true
};

// Sample data
const sampleUsers = [
  {
    full_name: 'System Admin',
    email: 'admin@rockettraining.com',
    password: 'admin123',
    role: 'admin',
    phone: '+84 901 234 567'
  },
  {
    full_name: 'Lê Văn Giảng',
    email: 'instructor1@rockettraining.com',
    password: 'instructor123',
    role: 'staff',
    phone: '+84 903 456 789'
  },
  {
    full_name: 'Phạm Thị Hướng Dẫn',
    email: 'instructor2@rockettraining.com',
    password: 'instructor123',
    role: 'staff',
    phone: '+84 904 567 890'
  },
  {
    full_name: 'Nguyễn Thị Học Viên',
    email: 'student1@gmail.com',
    password: 'student123',
    role: 'student',
    phone: '+84 906 789 012'
  },
  {
    full_name: 'Trần Văn Sinh Viên',
    email: 'student2@gmail.com',
    password: 'student123',
    role: 'student',
    phone: '+84 907 890 123'
  },
  {
    full_name: 'Lê Thị Minh Anh',
    email: 'minhanh@gmail.com',
    password: 'student123',
    role: 'student',
    phone: '+84 908 901 234'
  },
  {
    full_name: 'Lê Thị Doanh Nghiệp',
    email: 'hr@techcorp.com',
    password: 'enterprise123',
    role: 'enterprise_contact',
    phone: '+84 908 901 234'
  }
];

const sampleCourses = [
  {
    title: 'React.js Fundamentals',
    description: 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế',
    price: 1500000,
    duration_weeks: 10,
    level: 'beginner',
    content_detail: JSON.stringify({
      modules: ['JSX', 'Components', 'State', 'Props', 'Hooks'],
      projects: ['Todo App', 'Weather App', 'E-commerce Dashboard']
    }),
    max_students: 30
  },
  {
    title: 'Node.js Backend Development',
    description: 'Xây dựng API và backend services với Node.js và Express',
    price: 2000000,
    duration_weeks: 12,
    level: 'intermediate',
    content_detail: JSON.stringify({
      modules: ['Express.js', 'Database', 'Authentication', 'API Design'],
      projects: ['REST API', 'Chat Application', 'E-commerce Backend']
    }),
    max_students: 25
  },
  {
    title: 'Python Data Science',
    description: 'Phân tích dữ liệu và machine learning với Python',
    price: 2500000,
    duration_weeks: 15,
    level: 'advanced',
    content_detail: JSON.stringify({
      modules: ['Pandas', 'NumPy', 'Matplotlib', 'Scikit-learn', 'TensorFlow'],
      projects: ['Data Analysis', 'Prediction Model', 'Recommendation System']
    }),
    max_students: 20
  },
  {
    title: 'UI/UX Design Masterclass',
    description: 'Thiết kế giao diện và trải nghiệm người dùng chuyên nghiệp',
    price: 1800000,
    duration_weeks: 8,
    level: 'intermediate',
    content_detail: JSON.stringify({
      modules: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
      projects: ['Mobile App Design', 'Web Dashboard', 'Design System']
    }),
    max_students: 30
  },
  {
    title: 'DevOps và Cloud Computing',
    description: 'Triển khai và quản lý ứng dụng trên cloud với DevOps practices',
    price: 2200000,
    duration_weeks: 11,
    level: 'advanced',
    content_detail: JSON.stringify({
      modules: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring'],
      projects: ['Containerized App', 'Cloud Deployment', 'DevOps Pipeline']
    }),
    max_students: 20
  },
  {
    title: 'Mobile App Development với Flutter',
    description: 'Phát triển ứng dụng di động đa nền tảng với Flutter',
    price: 1900000,
    duration_weeks: 10,
    level: 'intermediate',
    content_detail: JSON.stringify({
      modules: ['Dart', 'Widgets', 'State Management', 'API Integration'],
      projects: ['Todo App', 'Social Media App', 'E-commerce App']
    }),
    max_students: 25
  }
];

const sampleEnterprises = [
  {
    company_name: 'TechCorp Vietnam',
    address: 'Tòa nhà TechCorp, Hà Nội',
    tax_code: 'TC001234567',
    industry: 'Technology',
    company_size: 'medium',
    website: 'https://techcorp.vn',
    description: 'Công ty công nghệ hàng đầu Việt Nam'
  },
  {
    company_name: 'FPT Software',
    address: 'FPT Software, TP.HCM',
    tax_code: 'FPT987654321',
    industry: 'Software Development',
    company_size: 'large',
    website: 'https://fptsoft.com',
    description: 'Công ty phát triển phần mềm lớn nhất Việt Nam'
  },
  {
    company_name: 'VNG Corporation',
    address: 'VNG Corporation, TP.HCM',
    tax_code: 'VNG123456789',
    industry: 'Internet Services',
    company_size: 'large',
    website: 'https://vng.com.vn',
    description: 'Tập đoàn công nghệ internet hàng đầu Việt Nam'
  }
];

const sampleLeads = [
  {
    full_name: 'Nguyễn Văn Khách Hàng',
    email: 'khachhang1@gmail.com',
    phone: '+84 914 567 890',
    source: 'website',
    status: 'new',
    lead_score: 85.0,
    interested_courses: JSON.stringify(['React.js Fundamentals']),
    notes: 'Quan tâm đến khóa học React, có kinh nghiệm JavaScript cơ bản'
  },
  {
    full_name: 'Trần Thị Tiềm Năng',
    email: 'tiemnang@company.com',
    phone: '+84 915 678 901',
    source: 'social',
    status: 'contacted',
    lead_score: 92.0,
    interested_courses: JSON.stringify(['DevOps và Cloud Computing']),
    notes: 'Đã liên hệ qua email, rất quan tâm đến khóa DevOps cho team'
  },
  {
    full_name: 'Lê Minh Quan',
    email: 'quan.le@startup.io',
    phone: '+84 916 789 012',
    source: 'referral',
    status: 'qualified',
    lead_score: 78.0,
    interested_courses: JSON.stringify(['Python Data Science']),
    notes: 'Được giới thiệu bởi học viên cũ, muốn học Data Science'
  },
  {
    full_name: 'Phạm Văn Đức',
    email: 'duc.pham@email.com',
    phone: '+84 917 890 123',
    source: 'ads',
    status: 'new',
    lead_score: 65.0,
    interested_courses: JSON.stringify(['UI/UX Design Masterclass']),
    notes: 'Tìm hiểu qua quảng cáo Facebook, quan tâm đến thiết kế'
  },
  {
    full_name: 'Hoàng Thị Lan',
    email: 'lan.hoang@gmail.com',
    phone: '+84 918 901 234',
    source: 'event',
    status: 'converted',
    lead_score: 95.0,
    interested_courses: JSON.stringify(['Mobile App Development với Flutter']),
    notes: 'Gặp tại sự kiện tech talk, đã đăng ký khóa học'
  }
];

async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    return connection;
  } catch (error) {
    console.error('❌ Error connecting to database:', error.message);
    throw error;
  }
}

async function clearDatabase(connection) {
  try {
    console.log('🗑️  Clearing existing data...');
    
    // Disable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    // Clear tables in reverse dependency order
    const tables = [
      'student_competencies',
      'tasks',
      'enrollments',
      'leads',
      'students',
      'staff',
      'courses',
      'enterprises',
      'users'
    ];
    
    for (const table of tables) {
      await connection.execute(`DELETE FROM ${table}`);
      await connection.execute(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }
    
    // Re-enable foreign key checks
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    
    console.log('✅ Database cleared successfully');
  } catch (error) {
    console.error('❌ Error clearing database:', error.message);
    throw error;
  }
}

async function seedUsers(connection) {
  try {
    console.log('👥 Seeding users...');
    
    for (const user of sampleUsers) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      
      const [result] = await connection.execute(
        `INSERT INTO users (full_name, email, password_hash, role, phone, is_active, email_verified) 
         VALUES (?, ?, ?, ?, ?, TRUE, TRUE)`,
        [user.full_name, user.email, hashedPassword, user.role, user.phone]
      );
      
      // Create additional profile records based on role
      if (user.role === 'student') {
        await connection.execute(
          `INSERT INTO students (user_id, background, education_level, goals) 
           VALUES (?, ?, ?, ?)`,
          [result.insertId, 'Sinh viên IT', 'University', 'Trở thành developer chuyên nghiệp']
        );
      } else if (user.role === 'staff') {
        await connection.execute(
          `INSERT INTO staff (user_id, position, department, hire_date) 
           VALUES (?, ?, ?, ?)`,
          [result.insertId, 'Instructor', 'Education', new Date().toISOString().split('T')[0]]
        );
      }
    }
    
    console.log(`✅ Seeded ${sampleUsers.length} users`);
  } catch (error) {
    console.error('❌ Error seeding users:', error.message);
    throw error;
  }
}

async function seedCourses(connection) {
  try {
    console.log('📚 Seeding courses...');
    
    // Get instructor user ID
    const [instructors] = await connection.execute(
      "SELECT u.id FROM users u JOIN staff s ON u.id = s.user_id WHERE u.role = 'staff' LIMIT 1"
    );
    const instructorId = instructors[0]?.id || 1;
    
    for (const course of sampleCourses) {
      await connection.execute(
        `INSERT INTO courses (title, description, price, duration_weeks, level, content_detail, max_students, created_by, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          course.title,
          course.description,
          course.price,
          course.duration_weeks,
          course.level,
          course.content_detail,
          course.max_students,
          instructorId
        ]
      );
    }
    
    console.log(`✅ Seeded ${sampleCourses.length} courses`);
  } catch (error) {
    console.error('❌ Error seeding courses:', error.message);
    throw error;
  }
}

async function seedEnterprises(connection) {
  try {
    console.log('🏢 Seeding enterprises...');
    
    for (const enterprise of sampleEnterprises) {
      await connection.execute(
        `INSERT INTO enterprises (company_name, address, tax_code, industry, company_size, website, description, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
        [
          enterprise.company_name,
          enterprise.address,
          enterprise.tax_code,
          enterprise.industry,
          enterprise.company_size,
          enterprise.website,
          enterprise.description
        ]
      );
    }
    
    console.log(`✅ Seeded ${sampleEnterprises.length} enterprises`);
  } catch (error) {
    console.error('❌ Error seeding enterprises:', error.message);
    throw error;
  }
}

async function seedLeads(connection) {
  try {
    console.log('🎯 Seeding leads...');
    
    // Get admin user ID for assignment
    const [admins] = await connection.execute(
      "SELECT id FROM users WHERE role = 'admin' LIMIT 1"
    );
    const adminId = admins[0]?.id || 1;
    
    for (const lead of sampleLeads) {
      await connection.execute(
        `INSERT INTO leads (full_name, email, phone, source, status, lead_score, interested_courses, notes, assigned_to) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          lead.full_name,
          lead.email,
          lead.phone,
          lead.source,
          lead.status,
          lead.lead_score,
          lead.interested_courses,
          lead.notes,
          adminId
        ]
      );
    }
    
    console.log(`✅ Seeded ${sampleLeads.length} leads`);
  } catch (error) {
    console.error('❌ Error seeding leads:', error.message);
    throw error;
  }
}

async function seedEnrollments(connection) {
  try {
    console.log('📝 Seeding enrollments...');
    
    // Get student and course IDs
    const [students] = await connection.execute(
      "SELECT s.id, u.full_name FROM students s JOIN users u ON s.user_id = u.id"
    );
    const [courses] = await connection.execute(
      "SELECT id, title FROM courses"
    );
    
    if (students.length > 0 && courses.length > 0) {
      // Enroll first student in React course
      await connection.execute(
        `INSERT INTO enrollments (student_id, course_id, status, progress_percentage) 
         VALUES (?, ?, 'in_progress', 85.0)`,
        [students[0].id, courses[0].id]
      );
      
      // Enroll second student in Node.js course (if exists)
      if (students.length > 1 && courses.length > 1) {
        await connection.execute(
          `INSERT INTO enrollments (student_id, course_id, status, progress_percentage, final_score) 
           VALUES (?, ?, 'completed', 100.0, 92.0)`,
          [students[1].id, courses[1].id]
        );
      }
      
      // Enroll third student in Python course
      if (students.length > 2 && courses.length > 2) {
        await connection.execute(
          `INSERT INTO enrollments (student_id, course_id, status, progress_percentage) 
           VALUES (?, ?, 'in_progress', 67.0)`,
          [students[2].id, courses[2].id]
        );
      }
    }
    
    console.log('✅ Seeded sample enrollments');
  } catch (error) {
    console.error('❌ Error seeding enrollments:', error.message);
    throw error;
  }
}

async function seedCompetencies(connection) {
  try {
    console.log('🎯 Seeding student competencies...');
    
    // Get students and competencies
    const [students] = await connection.execute(
      "SELECT id FROM students LIMIT 3"
    );
    const [competencies] = await connection.execute(
      "SELECT id, name FROM competencies LIMIT 8"
    );
    
    if (students.length > 0 && competencies.length > 0) {
      for (const student of students) {
        // Assign random competencies to each student
        const numCompetencies = Math.floor(Math.random() * 4) + 3; // 3-6 competencies per student
        const shuffledCompetencies = competencies.sort(() => 0.5 - Math.random());
        
        for (let i = 0; i < numCompetencies && i < shuffledCompetencies.length; i++) {
          const score = Math.floor(Math.random() * 40) + 60; // Random score between 60-100
          await connection.execute(
            `INSERT INTO student_competencies (student_id, competency_id, score, assessment_method) 
             VALUES (?, ?, ?, 'ai_analysis')`,
            [student.id, shuffledCompetencies[i].id, score]
          );
        }
      }
    }
    
    console.log('✅ Seeded student competencies');
  } catch (error) {
    console.error('❌ Error seeding competencies:', error.message);
    throw error;
  }
}

async function seedTasks(connection) {
  try {
    console.log('📋 Seeding tasks...');
    
    const [courses] = await connection.execute(
      "SELECT id, title FROM courses LIMIT 3"
    );
    
    if (courses.length > 0) {
      const sampleTasks = [
        {
          title: 'Bài tập 1: Tạo Component đầu tiên',
          description: 'Tạo một React component đơn giản hiển thị thông tin cá nhân',
          task_type: 'assignment',
          max_score: 100.0,
          order_index: 1
        },
        {
          title: 'Project: Todo App',
          description: 'Xây dựng ứng dụng Todo hoàn chỉnh với React',
          task_type: 'project',
          max_score: 100.0,
          order_index: 2
        },
        {
          title: 'Quiz: React Hooks',
          description: 'Kiểm tra kiến thức về React Hooks',
          task_type: 'quiz',
          max_score: 50.0,
          order_index: 3
        }
      ];
      
      for (const course of courses) {
        for (const task of sampleTasks) {
          await connection.execute(
            `INSERT INTO tasks (course_id, title, description, task_type, max_score, order_index, is_required) 
             VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
            [
              course.id,
              task.title,
              task.description,
              task.task_type,
              task.max_score,
              task.order_index
            ]
          );
        }
      }
    }
    
    console.log('✅ Seeded tasks');
  } catch (error) {
    console.error('❌ Error seeding tasks:', error.message);
    throw error;
  }
}

async function main() {
  let connection;
  
  try {
    // Parse command line arguments
    const args = process.argv.slice(2);
    const shouldClear = args.includes('--clear');
    const shouldSeed = args.includes('--seed');
    
    if (!shouldClear && !shouldSeed) {
      console.log('\n🚀 Rocket Training System - MySQL Database Seeder');
      console.log('Usage: node seedMySQLDatabase.js [--clear] [--seed]');
      console.log('  --clear: Clear existing data');
      console.log('  --seed: Insert sample data');
      console.log('  Both flags can be used together\n');
      console.log('Examples:');
      console.log('  node seedMySQLDatabase.js --clear --seed  # Clear and seed');
      console.log('  node seedMySQLDatabase.js --seed          # Only seed');
      console.log('  node seedMySQLDatabase.js --clear         # Only clear\n');
      process.exit(1);
    }
    
    connection = await createConnection();
    
    if (shouldClear) {
      await clearDatabase(connection);
    }
    
    if (shouldSeed) {
      console.log('🌱 Starting database seeding...');
      
      await seedUsers(connection);
      await seedCourses(connection);
      await seedEnterprises(connection);
      await seedLeads(connection);
      await seedEnrollments(connection);
      await seedTasks(connection);
      await seedCompetencies(connection);
      
      console.log('\n🎉 Database seeding completed successfully!');
      console.log('\n📋 Test Credentials:');
      console.log('Admin: admin@rockettraining.com / admin123');
      console.log('Instructor: instructor1@rockettraining.com / instructor123');
      console.log('Student: student1@gmail.com / student123');
      console.log('Enterprise: hr@techcorp.com / enterprise123\n');
    }
    
  } catch (error) {
    console.error('💥 Seeding failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  createConnection,
  clearDatabase,
  seedUsers,
  seedCourses,
  seedEnterprises,
  seedLeads,
  seedEnrollments,
  seedCompetencies,
  seedTasks
};