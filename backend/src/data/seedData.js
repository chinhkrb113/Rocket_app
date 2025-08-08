// Seed data for Rocket Training System database
// This file contains sample data for testing and development

const bcrypt = require('bcrypt');

// Helper function to hash passwords
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 10);
};

// Users seed data
const users = [
  // Admin accounts
  {
    id: 'admin-001',
    email: 'admin@rockettraining.com',
    password: 'admin123', // Will be hashed
    fullName: 'Nguyễn Văn Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    phone: '+84 901 234 567',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: '1985-03-15',
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'admin-002',
    email: 'manager@rockettraining.com',
    password: 'manager123',
    fullName: 'Trần Thị Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    phone: '+84 902 345 678',
    address: 'TP.HCM, Việt Nam',
    dateOfBirth: '1988-07-22',
    isActive: true,
    emailVerified: true,
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2024-01-15')
  },

  // Instructor accounts
  {
    id: 'instructor-001',
    email: 'instructor1@rockettraining.com',
    password: 'instructor123',
    fullName: 'Lê Văn Giảng',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 903 456 789',
    address: 'Đà Nẵng, Việt Nam',
    dateOfBirth: '1982-11-10',
    isActive: true,
    emailVerified: true,
    bio: 'Chuyên gia Frontend với 8+ năm kinh nghiệm, từng làm việc tại các công ty công nghệ hàng đầu.',
    expertise: ['React', 'JavaScript', 'TypeScript', 'UI/UX'],
    experience: 8,
    education: 'Thạc sĩ Khoa học Máy tính - ĐH Bách Khoa Hà Nội',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'instructor-002',
    email: 'instructor2@rockettraining.com',
    password: 'instructor123',
    fullName: 'Phạm Thị Hướng Dẫn',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 904 567 890',
    address: 'Hải Phòng, Việt Nam',
    dateOfBirth: '1990-05-18',
    isActive: true,
    emailVerified: true,
    bio: 'Backend Developer và DevOps Engineer với kinh nghiệm triển khai hệ thống quy mô lớn.',
    expertise: ['Node.js', 'Python', 'AWS', 'Docker', 'Kubernetes'],
    experience: 6,
    education: 'Cử nhân Công nghệ Thông tin - ĐH FPT',
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2024-01-14')
  },
  {
    id: 'instructor-003',
    email: 'instructor3@rockettraining.com',
    password: 'instructor123',
    fullName: 'Hoàng Minh Tuấn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 905 678 901',
    address: 'Cần Thơ, Việt Nam',
    dateOfBirth: '1987-09-25',
    isActive: true,
    emailVerified: true,
    bio: 'Data Scientist và AI Engineer, chuyên gia về Machine Learning và Deep Learning.',
    expertise: ['Python', 'Machine Learning', 'Deep Learning', 'Data Analysis'],
    experience: 7,
    education: 'Tiến sĩ Trí tuệ Nhân tạo - ĐH Quốc gia TP.HCM',
    createdAt: new Date('2023-04-01'),
    updatedAt: new Date('2024-01-15')
  },

  // Student accounts
  {
    id: 'student-001',
    email: 'student1@gmail.com',
    password: 'student123',
    fullName: 'Nguyễn Thị Học Viên',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    role: 'student',
    phone: '+84 906 789 012',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: '1995-12-03',
    isActive: true,
    emailVerified: true,
    occupation: 'Sinh viên IT',
    goals: 'Trở thành Frontend Developer',
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'student-002',
    email: 'student2@gmail.com',
    password: 'student123',
    fullName: 'Trần Văn Sinh Viên',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    role: 'student',
    phone: '+84 907 890 123',
    address: 'TP.HCM, Việt Nam',
    dateOfBirth: '1998-04-14',
    isActive: true,
    emailVerified: true,
    occupation: 'Junior Developer',
    goals: 'Nâng cao kỹ năng Backend',
    createdAt: new Date('2023-07-01'),
    updatedAt: new Date('2024-01-15')
  },

  // Enterprise accounts
  {
    id: 'enterprise-001',
    email: 'hr@techcorp.com',
    password: 'enterprise123',
    fullName: 'Lê Thị Doanh Nghiệp',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 908 901 234',
    address: 'Tòa nhà TechCorp, Hà Nội',
    dateOfBirth: '1983-08-30',
    isActive: true,
    emailVerified: true,
    company: 'TechCorp Vietnam',
    position: 'HR Manager',
    companySize: '100-500',
    industry: 'Technology',
    createdAt: new Date('2023-05-01'),
    updatedAt: new Date('2024-01-15')
  }
];

// Courses seed data
const courses = [
  {
    id: 'course-001',
    title: 'React.js Fundamentals',
    slug: 'react-js-fundamentals',
    description: 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế. Khóa học bao gồm JSX, Components, State, Props, Hooks và nhiều chủ đề quan trọng khác.',
    shortDescription: 'Khóa học React.js từ cơ bản đến nâng cao',
    category: 'Frontend Development',
    level: 'Beginner',
    duration: 40, // hours
    price: 1500000, // VND
    discountPrice: 1200000,
    instructorId: 'instructor-001',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    videoPreview: 'https://example.com/preview/react-course.mp4',
    rating: 4.8,
    reviewsCount: 156,
    studentsCount: 245,
    lessonsCount: 32,
    status: 'published',
    featured: true,
    language: 'Vietnamese',
    subtitles: ['Vietnamese', 'English'],
    requirements: [
      'Kiến thức cơ bản về HTML, CSS',
      'Hiểu biết về JavaScript ES6+',
      'Máy tính có kết nối internet'
    ],
    learningOutcomes: [
      'Xây dựng ứng dụng React từ đầu',
      'Hiểu rõ về Components và JSX',
      'Sử dụng thành thạo React Hooks',
      'Quản lý state hiệu quả',
      'Tích hợp API và xử lý dữ liệu'
    ],
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    skills: ['Component Development', 'State Management', 'Hooks', 'JSX'],
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'course-002',
    title: 'Node.js Backend Development',
    slug: 'nodejs-backend-development',
    description: 'Xây dựng API và backend services với Node.js và Express. Học cách tạo RESTful API, xử lý database, authentication và deployment.',
    shortDescription: 'Phát triển backend với Node.js và Express',
    category: 'Backend Development',
    level: 'Intermediate',
    duration: 50,
    price: 2000000,
    discountPrice: 1600000,
    instructorId: 'instructor-002',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
    videoPreview: 'https://example.com/preview/nodejs-course.mp4',
    rating: 4.7,
    reviewsCount: 98,
    studentsCount: 189,
    lessonsCount: 45,
    status: 'published',
    featured: true,
    language: 'Vietnamese',
    subtitles: ['Vietnamese'],
    requirements: [
      'Kiến thức JavaScript cơ bản',
      'Hiểu về HTTP và REST API',
      'Kinh nghiệm với command line'
    ],
    learningOutcomes: [
      'Xây dựng RESTful API với Express',
      'Tích hợp database MongoDB/PostgreSQL',
      'Implement authentication và authorization',
      'Deploy ứng dụng lên cloud',
      'Viết unit test và integration test'
    ],
    tags: ['Node.js', 'Express', 'API', 'Backend'],
    skills: ['REST API', 'Database Integration', 'Authentication', 'Server Management'],
    createdAt: new Date('2023-03-01'),
    updatedAt: new Date('2024-01-08')
  },
  {
    id: 'course-003',
    title: 'Python Data Science',
    slug: 'python-data-science',
    description: 'Phân tích dữ liệu và machine learning với Python. Sử dụng pandas, numpy, matplotlib, scikit-learn để xử lý và phân tích dữ liệu.',
    shortDescription: 'Data Science và Machine Learning với Python',
    category: 'Data Science',
    level: 'Advanced',
    duration: 60,
    price: 2500000,
    discountPrice: 2000000,
    instructorId: 'instructor-003',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    videoPreview: 'https://example.com/preview/python-ds-course.mp4',
    rating: 4.9,
    reviewsCount: 87,
    studentsCount: 156,
    lessonsCount: 52,
    status: 'published',
    featured: true,
    language: 'Vietnamese',
    subtitles: ['Vietnamese', 'English'],
    requirements: [
      'Kiến thức Python cơ bản',
      'Hiểu biết về toán học và thống kê',
      'Kinh nghiệm làm việc với dữ liệu'
    ],
    learningOutcomes: [
      'Xử lý và làm sạch dữ liệu với pandas',
      'Trực quan hóa dữ liệu với matplotlib/seaborn',
      'Xây dựng mô hình Machine Learning',
      'Đánh giá và tối ưu mô hình',
      'Deploy mô hình vào production'
    ],
    tags: ['Python', 'Data Science', 'Machine Learning', 'Analytics'],
    skills: ['Data Analysis', 'Pandas', 'NumPy', 'Scikit-learn', 'Visualization'],
    createdAt: new Date('2023-04-15'),
    updatedAt: new Date('2024-01-12')
  }
];

// Enrollments seed data
const enrollments = [
  {
    id: 'enrollment-001',
    studentId: 'student-001',
    courseId: 'course-001',
    enrollmentDate: new Date('2023-06-15'),
    status: 'active',
    progress: 85,
    completedLessons: 27,
    totalLessons: 32,
    lastAccessDate: new Date('2024-01-15'),
    certificateIssued: false,
    grade: 'A',
    totalTimeSpent: 34 * 60, // minutes
    paymentStatus: 'completed',
    paymentAmount: 1200000,
    paymentDate: new Date('2023-06-15')
  },
  {
    id: 'enrollment-002',
    studentId: 'student-002',
    courseId: 'course-002',
    enrollmentDate: new Date('2023-07-01'),
    status: 'completed',
    progress: 100,
    completedLessons: 45,
    totalLessons: 45,
    lastAccessDate: new Date('2024-01-10'),
    certificateIssued: true,
    certificateIssuedDate: new Date('2024-01-10'),
    grade: 'A',
    totalTimeSpent: 48 * 60,
    paymentStatus: 'completed',
    paymentAmount: 1600000,
    paymentDate: new Date('2023-07-01')
  }
];

// Lessons seed data
const lessons = [
  // React.js Course Lessons
  {
    id: 'lesson-001',
    courseId: 'course-001',
    title: 'Giới thiệu về React.js',
    description: 'Tổng quan về React.js và ecosystem',
    order: 1,
    duration: 45, // minutes
    type: 'video',
    videoUrl: 'https://example.com/lessons/react-intro.mp4',
    materials: [
      {
        type: 'pdf',
        title: 'React.js Overview',
        url: 'https://example.com/materials/react-overview.pdf'
      }
    ],
    quiz: {
      questions: [
        {
          question: 'React.js được phát triển bởi công ty nào?',
          options: ['Google', 'Facebook', 'Microsoft', 'Apple'],
          correctAnswer: 1
        }
      ]
    },
    isPreview: true,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'lesson-002',
    courseId: 'course-001',
    title: 'Cài đặt môi trường phát triển',
    description: 'Hướng dẫn cài đặt Node.js, npm và create-react-app',
    order: 2,
    duration: 30,
    type: 'video',
    videoUrl: 'https://example.com/lessons/react-setup.mp4',
    materials: [
      {
        type: 'text',
        title: 'Installation Guide',
        content: 'Step by step installation guide...'
      }
    ],
    isPreview: false,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2024-01-10')
  }
];

// Reviews seed data
const reviews = [
  {
    id: 'review-001',
    courseId: 'course-001',
    studentId: 'student-001',
    rating: 5,
    comment: 'Khóa học rất hay, giảng viên dạy dễ hiểu và có nhiều ví dụ thực tế. Tôi đã học được rất nhiều kiến thức về React.',
    createdAt: new Date('2023-08-15'),
    updatedAt: new Date('2023-08-15')
  },
  {
    id: 'review-002',
    courseId: 'course-002',
    studentId: 'student-002',
    rating: 5,
    comment: 'Khóa học Node.js rất chất lượng. Sau khi hoàn thành, tôi đã có thể xây dựng API cho dự án của mình.',
    createdAt: new Date('2023-09-20'),
    updatedAt: new Date('2023-09-20')
  }
];

// Categories seed data
const categories = [
  {
    id: 'cat-001',
    name: 'Frontend Development',
    slug: 'frontend-development',
    description: 'Phát triển giao diện người dùng',
    icon: 'monitor',
    color: '#3B82F6',
    coursesCount: 8,
    isActive: true
  },
  {
    id: 'cat-002',
    name: 'Backend Development',
    slug: 'backend-development',
    description: 'Phát triển server và API',
    icon: 'server',
    color: '#10B981',
    coursesCount: 6,
    isActive: true
  },
  {
    id: 'cat-003',
    name: 'Data Science',
    slug: 'data-science',
    description: 'Phân tích dữ liệu và AI',
    icon: 'chart-bar',
    color: '#8B5CF6',
    coursesCount: 4,
    isActive: true
  },
  {
    id: 'cat-004',
    name: 'Mobile Development',
    slug: 'mobile-development',
    description: 'Phát triển ứng dụng di động',
    icon: 'device-mobile',
    color: '#F59E0B',
    coursesCount: 3,
    isActive: true
  },
  {
    id: 'cat-005',
    name: 'DevOps',
    slug: 'devops',
    description: 'Triển khai và vận hành hệ thống',
    icon: 'cog',
    color: '#EF4444',
    coursesCount: 2,
    isActive: true
  },
  {
    id: 'cat-006',
    name: 'Design',
    slug: 'design',
    description: 'UI/UX và thiết kế đồ họa',
    icon: 'palette',
    color: '#EC4899',
    coursesCount: 1,
    isActive: true
  }
];

// Function to seed the database
const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Hash passwords for all users
    for (let user of users) {
      user.password = await hashPassword(user.password);
    }

    console.log('✅ Passwords hashed successfully');
    console.log('✅ Seed data prepared successfully');
    console.log(`📊 Data summary:`);
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Courses: ${courses.length}`);
    console.log(`   - Enrollments: ${enrollments.length}`);
    console.log(`   - Lessons: ${lessons.length}`);
    console.log(`   - Reviews: ${reviews.length}`);
    console.log(`   - Categories: ${categories.length}`);

    return {
      users,
      courses,
      enrollments,
      lessons,
      reviews,
      categories
    };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

// Test credentials for easy access
const testCredentials = {
  admin: {
    email: 'admin@rockettraining.com',
    password: 'admin123',
    role: 'admin'
  },
  manager: {
    email: 'manager@rockettraining.com',
    password: 'manager123',
    role: 'admin'
  },
  instructor: {
    email: 'instructor1@rockettraining.com',
    password: 'instructor123',
    role: 'instructor'
  },
  student: {
    email: 'student1@gmail.com',
    password: 'student123',
    role: 'student'
  },
  enterprise: {
    email: 'hr@techcorp.com',
    password: 'enterprise123',
    role: 'enterprise'
  }
};

module.exports = {
  users,
  courses,
  enrollments,
  lessons,
  reviews,
  categories,
  seedDatabase,
  testCredentials
};