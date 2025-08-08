// Mock data for testing the Rocket Training System
import { Team, Task, Evaluation, StudentProfile, ExtendedStudent, StudentActivity } from '../types/student';

export interface User {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  role: 'admin' | 'instructor' | 'student' | 'enterprise' | 'mentor' | 'leader';
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  joinedDate: string;
  isActive: boolean;
  lastLogin?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // in hours
  price: number;
  instructor: string;
  instructorId: string;
  thumbnail: string;
  rating: number;
  studentsCount: number;
  lessonsCount: number;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  updatedAt: string;
  tags: string[];
  skills: string[];
}

export interface Student {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  course: string;
  enrollmentDate: string;
  progress: number;
  status: 'active' | 'completed' | 'suspended' | 'pending';
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';
  lastActivity: string;
  totalHours: number;
  completedLessons: number;
  totalLessons: number;
}

export interface Lead {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  company?: string;
  position?: string;
  interestedCourse: string;
  source: 'website' | 'social' | 'referral' | 'ads' | 'event';
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  notes: string;
  createdAt: string;
  lastContact?: string;
  assignedTo?: string;
}

export interface EnterpriseProgram {
  id: string;
  title: string;
  description: string;
  enterpriseId: string;
  enterpriseName: string;
  category: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number; // in hours
  maxParticipants: number;
  currentParticipants: number;
  status: 'planning' | 'active' | 'completed' | 'cancelled';
  startDate: string;
  endDate: string;
  skills: string[];
  requirements: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseProject {
  id: string;
  title: string;
  description: string;
  enterpriseId: string;
  enterpriseName: string;
  programId?: string;
  programName?: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'cancelled';
  progress: number;
  startDate: string;
  endDate: string;
  teamSize: number;
  assignedStudents: string[];
  requiredSkills: string[];
  deliverables: string[];
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseStats {
  totalPrograms: number;
  activePrograms: number;
  completedPrograms: number;
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalStudents: number;
  activeStudents: number;
  graduatedStudents: number;
  averageRating: number;
  successRate: number;
  monthlyProgress: {
    month: string;
    programs: number;
    projects: number;
    students: number;
  }[];
}

// Mock Users (Tài khoản test)
export const mockUsers: User[] = [
  // Admin accounts
  {
    id: 'admin-001',
    email: 'admin@rockettraining.com',
    fullName: 'Nguyễn Văn Admin',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    phone: '+84 901 234 567',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: '1985-03-15',
    joinedDate: '2023-01-01',
    isActive: true,
    lastLogin: '2024-01-15T10:30:00Z'
  },
  {
    id: 'admin-002',
    email: 'manager@rockettraining.com',
    fullName: 'Trần Thị Manager',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'admin',
    phone: '+84 902 345 678',
    address: 'TP.HCM, Việt Nam',
    dateOfBirth: '1988-07-22',
    joinedDate: '2023-01-15',
    isActive: true,
    lastLogin: '2024-01-15T09:15:00Z'
  },

  // Instructor accounts
  {
    id: 'instructor-001',
    email: 'instructor1@rockettraining.com',
    fullName: 'Lê Văn Giảng',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 903 456 789',
    address: 'Đà Nẵng, Việt Nam',
    dateOfBirth: '1982-11-10',
    joinedDate: '2023-02-01',
    isActive: true,
    lastLogin: '2024-01-15T08:45:00Z'
  },
  {
    id: 'instructor-002',
    email: 'instructor2@rockettraining.com',
    fullName: 'Phạm Thị Hướng Dẫn',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 904 567 890',
    address: 'Hải Phòng, Việt Nam',
    dateOfBirth: '1990-05-18',
    joinedDate: '2023-03-01',
    isActive: true,
    lastLogin: '2024-01-14T16:20:00Z'
  },
  {
    id: 'instructor-003',
    email: 'instructor3@rockettraining.com',
    fullName: 'Hoàng Minh Tuấn',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'instructor',
    phone: '+84 905 678 901',
    address: 'Cần Thơ, Việt Nam',
    dateOfBirth: '1987-09-25',
    joinedDate: '2023-04-01',
    isActive: true,
    lastLogin: '2024-01-15T07:30:00Z'
  },

  // Student accounts
  {
    id: 'student-001',
    email: 'student1@gmail.com',
    fullName: 'Nguyễn Thị Học Viên',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    role: 'student',
    phone: '+84 906 789 012',
    address: 'Hà Nội, Việt Nam',
    dateOfBirth: '1995-12-03',
    joinedDate: '2023-06-15',
    isActive: true,
    lastLogin: '2024-01-15T11:00:00Z'
  },
  {
    id: 'student-002',
    email: 'student2@gmail.com',
    fullName: 'Trần Văn Sinh Viên',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    role: 'student',
    phone: '+84 907 890 123',
    address: 'TP.HCM, Việt Nam',
    dateOfBirth: '1998-04-14',
    joinedDate: '2023-07-01',
    isActive: true,
    lastLogin: '2024-01-15T10:45:00Z'
  },

  // Enterprise accounts
  {
    id: 'enterprise-001',
    email: 'hr@techcorp.com',
    fullName: 'Lê Thị Doanh Nghiệp',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 908 901 234',
    address: 'Tòa nhà TechCorp, Hà Nội',
    dateOfBirth: '1983-08-30',
    joinedDate: '2023-05-01',
    isActive: true,
    lastLogin: '2024-01-15T09:30:00Z'
  },
  {
    id: 'enterprise-002',
    email: 'talent@fptsoft.com',
    fullName: 'Nguyễn Văn Tuyển Dụng',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 909 012 345',
    address: 'FPT Software, TP.HCM',
    dateOfBirth: '1985-12-15',
    joinedDate: '2023-06-01',
    isActive: true,
    lastLogin: '2024-01-14T15:20:00Z'
  },
  {
    id: 'enterprise-003',
    email: 'hr@vng.com.vn',
    fullName: 'Trần Thị Nhân Sự',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 910 123 456',
    address: 'VNG Corporation, TP.HCM',
    dateOfBirth: '1987-04-22',
    joinedDate: '2023-07-15',
    isActive: true,
    lastLogin: '2024-01-15T11:45:00Z'
  },
  {
    id: 'enterprise-004',
    email: 'recruitment@tiki.vn',
    fullName: 'Phạm Minh Tuyển',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 911 234 567',
    address: 'Tiki Corporation, Hà Nội',
    dateOfBirth: '1984-09-10',
    joinedDate: '2023-08-01',
    isActive: true,
    lastLogin: '2024-01-13T14:30:00Z'
  },
  {
    id: 'enterprise-005',
    email: 'hr@shopee.vn',
    fullName: 'Hoàng Thị Tài Năng',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 912 345 678',
    address: 'Shopee Vietnam, TP.HCM',
    dateOfBirth: '1986-11-05',
    joinedDate: '2023-09-01',
    isActive: true,
    lastLogin: '2024-01-15T16:10:00Z'
  },
  {
    id: 'enterprise-006',
    email: 'talent@grab.com',
    fullName: 'Đặng Văn Phát Triển',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    role: 'enterprise',
    phone: '+84 913 456 789',
    address: 'Grab Vietnam, Hà Nội',
    dateOfBirth: '1988-03-18',
    joinedDate: '2023-10-15',
    isActive: true,
    lastLogin: '2024-01-14T09:25:00Z'
  }
];

// Mock Courses
export const mockCourses: Course[] = [
  {
    id: 'course-001',
    title: 'React.js Fundamentals',
    description: 'Học React.js từ cơ bản đến nâng cao với các dự án thực tế',
    category: 'Frontend Development',
    level: 'Beginner',
    duration: 40,
    price: 1500000,
    instructor: 'Lê Văn Giảng',
    instructorId: 'instructor-001',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    rating: 4.8,
    studentsCount: 245,
    lessonsCount: 32,
    status: 'active',
    createdAt: '2023-02-15',
    updatedAt: '2024-01-10',
    tags: ['React', 'JavaScript', 'Frontend', 'Web Development'],
    skills: ['Component Development', 'State Management', 'Hooks', 'JSX']
  },
  {
    id: 'course-002',
    title: 'Node.js Backend Development',
    description: 'Xây dựng API và backend services với Node.js và Express',
    category: 'Backend Development',
    level: 'Intermediate',
    duration: 50,
    price: 2000000,
    instructor: 'Phạm Thị Hướng Dẫn',
    instructorId: 'instructor-002',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=250&fit=crop',
    rating: 4.7,
    studentsCount: 189,
    lessonsCount: 45,
    status: 'active',
    createdAt: '2023-03-01',
    updatedAt: '2024-01-08',
    tags: ['Node.js', 'Express', 'API', 'Backend'],
    skills: ['REST API', 'Database Integration', 'Authentication', 'Server Management']
  },
  {
    id: 'course-003',
    title: 'Python Data Science',
    description: 'Phân tích dữ liệu và machine learning với Python',
    category: 'Data Science',
    level: 'Advanced',
    duration: 60,
    price: 2500000,
    instructor: 'Hoàng Minh Tuấn',
    instructorId: 'instructor-003',
    thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    rating: 4.9,
    studentsCount: 156,
    lessonsCount: 52,
    status: 'active',
    createdAt: '2023-04-15',
    updatedAt: '2024-01-12',
    tags: ['Python', 'Data Science', 'Machine Learning', 'Analytics'],
    skills: ['Data Analysis', 'Pandas', 'NumPy', 'Scikit-learn', 'Visualization']
  },
  {
    id: 'course-004',
    title: 'UI/UX Design Masterclass',
    description: 'Thiết kế giao diện và trải nghiệm người dùng chuyên nghiệp',
    category: 'Design',
    level: 'Intermediate',
    duration: 35,
    price: 1800000,
    instructor: 'Lê Văn Giảng',
    instructorId: 'instructor-001',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
    rating: 4.6,
    studentsCount: 203,
    lessonsCount: 28,
    status: 'active',
    createdAt: '2023-05-01',
    updatedAt: '2024-01-05',
    tags: ['UI Design', 'UX Design', 'Figma', 'Prototyping'],
    skills: ['User Research', 'Wireframing', 'Prototyping', 'Design Systems']
  },
  {
    id: 'course-005',
    title: 'DevOps và Cloud Computing',
    description: 'Triển khai và quản lý ứng dụng trên cloud với DevOps practices',
    category: 'DevOps',
    level: 'Advanced',
    duration: 45,
    price: 2200000,
    instructor: 'Phạm Thị Hướng Dẫn',
    instructorId: 'instructor-002',
    thumbnail: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=250&fit=crop',
    rating: 4.8,
    studentsCount: 134,
    lessonsCount: 38,
    status: 'active',
    createdAt: '2023-06-01',
    updatedAt: '2024-01-14',
    tags: ['DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    skills: ['Container Management', 'Cloud Deployment', 'Monitoring', 'Automation']
  },
  {
    id: 'course-006',
    title: 'Mobile App Development với Flutter',
    description: 'Phát triển ứng dụng di động đa nền tảng với Flutter',
    category: 'Mobile Development',
    level: 'Intermediate',
    duration: 42,
    price: 1900000,
    instructor: 'Hoàng Minh Tuấn',
    instructorId: 'instructor-003',
    thumbnail: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    rating: 4.7,
    studentsCount: 178,
    lessonsCount: 35,
    status: 'active',
    createdAt: '2023-07-15',
    updatedAt: '2024-01-11',
    tags: ['Flutter', 'Dart', 'Mobile', 'Cross-platform'],
    skills: ['Widget Development', 'State Management', 'API Integration', 'App Store Deployment']
  }
];

// Mock Students
export const mockStudents: Student[] = [
  {
    id: 'student-001',
    fullName: 'Nguyễn Thị Học Viên',
    email: 'student1@gmail.com',
    phone: '+84 906 789 012',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    course: 'React.js Fundamentals',
    enrollmentDate: '2023-06-15',
    progress: 85,
    status: 'active',
    grade: 'A',
    lastActivity: '2024-01-15',
    totalHours: 34,
    completedLessons: 27,
    totalLessons: 32
  },
  {
    id: 'student-002',
    fullName: 'Trần Văn Sinh Viên',
    email: 'student2@gmail.com',
    phone: '+84 907 890 123',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    course: 'Node.js Backend Development',
    enrollmentDate: '2023-07-01',
    progress: 92,
    status: 'completed',
    grade: 'A',
    lastActivity: '2024-01-10',
    totalHours: 48,
    completedLessons: 45,
    totalLessons: 45
  },
  {
    id: 'student-003',
    fullName: 'Lê Thị Minh Anh',
    email: 'minhanh@gmail.com',
    phone: '+84 908 901 234',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    course: 'Python Data Science',
    enrollmentDate: '2023-08-15',
    progress: 67,
    status: 'active',
    grade: 'B',
    lastActivity: '2024-01-14',
    totalHours: 40,
    completedLessons: 35,
    totalLessons: 52
  },
  {
    id: 'student-004',
    fullName: 'Phạm Văn Đức',
    email: 'duc.pham@email.com',
    phone: '+84 909 012 345',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    course: 'UI/UX Design Masterclass',
    enrollmentDate: '2023-09-01',
    progress: 45,
    status: 'active',
    grade: 'C',
    lastActivity: '2024-01-13',
    totalHours: 16,
    completedLessons: 13,
    totalLessons: 28
  },
  {
    id: 'student-005',
    fullName: 'Hoàng Thị Lan',
    email: 'lan.hoang@gmail.com',
    phone: '+84 910 123 456',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    course: 'DevOps và Cloud Computing',
    enrollmentDate: '2023-10-15',
    progress: 78,
    status: 'active',
    grade: 'B',
    lastActivity: '2024-01-15',
    totalHours: 35,
    completedLessons: 30,
    totalLessons: 38
  },
  {
    id: 'student-006',
    fullName: 'Vũ Minh Quân',
    email: 'quan.vu@email.com',
    phone: '+84 911 234 567',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    course: 'Mobile App Development với Flutter',
    enrollmentDate: '2023-11-01',
    progress: 23,
    status: 'pending',
    grade: 'N/A',
    lastActivity: '2024-01-12',
    totalHours: 10,
    completedLessons: 8,
    totalLessons: 35
  },
  {
    id: 'student-007',
    fullName: 'Đặng Thị Hương',
    email: 'huong.dang@gmail.com',
    phone: '+84 912 345 678',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    course: 'React.js Fundamentals',
    enrollmentDate: '2023-12-01',
    progress: 12,
    status: 'suspended',
    grade: 'D',
    lastActivity: '2024-01-05',
    totalHours: 5,
    completedLessons: 4,
    totalLessons: 32
  },
  {
    id: 'student-008',
    fullName: 'Bùi Văn Thành',
    email: 'thanh.bui@email.com',
    phone: '+84 913 456 789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    course: 'Python Data Science',
    enrollmentDate: '2023-12-15',
    progress: 98,
    status: 'completed',
    grade: 'A',
    lastActivity: '2024-01-08',
    totalHours: 59,
    completedLessons: 52,
    totalLessons: 52
  }
];

// Mock Leads
export const mockLeads: Lead[] = [
  {
    id: 'lead-001',
    fullName: 'Nguyễn Văn Khách Hàng',
    email: 'khachhang1@gmail.com',
    phone: '+84 914 567 890',
    company: 'TechStart Vietnam',
    position: 'Frontend Developer',
    interestedCourse: 'React.js Fundamentals',
    source: 'website',
    status: 'new',
    score: 85,
    notes: 'Quan tâm đến khóa học React, có kinh nghiệm JavaScript cơ bản',
    createdAt: '2024-01-15T09:30:00Z',
    assignedTo: 'admin-001'
  },
  {
    id: 'lead-002',
    fullName: 'Trần Thị Tiềm Năng',
    email: 'tiemnang@company.com',
    phone: '+84 915 678 901',
    company: 'Digital Solutions Co.',
    position: 'Project Manager',
    interestedCourse: 'DevOps và Cloud Computing',
    source: 'social',
    status: 'contacted',
    score: 92,
    notes: 'Đã liên hệ qua email, rất quan tâm đến khóa DevOps cho team',
    createdAt: '2024-01-14T14:20:00Z',
    lastContact: '2024-01-15T10:00:00Z',
    assignedTo: 'admin-002'
  },
  {
    id: 'lead-003',
    fullName: 'Lê Minh Prospect',
    email: 'prospect@startup.vn',
    phone: '+84 916 789 012',
    company: 'AI Startup',
    position: 'Data Scientist',
    interestedCourse: 'Python Data Science',
    source: 'referral',
    status: 'qualified',
    score: 88,
    notes: 'Được giới thiệu bởi học viên cũ, có nhu cầu nâng cao kỹ năng ML',
    createdAt: '2024-01-13T11:15:00Z',
    lastContact: '2024-01-14T16:30:00Z',
    assignedTo: 'admin-001'
  },
  {
    id: 'lead-004',
    fullName: 'Phạm Văn Converted',
    email: 'converted@email.com',
    phone: '+84 917 890 123',
    company: 'Mobile Tech',
    position: 'Mobile Developer',
    interestedCourse: 'Mobile App Development với Flutter',
    source: 'ads',
    status: 'converted',
    score: 95,
    notes: 'Đã đăng ký khóa học, thanh toán thành công',
    createdAt: '2024-01-12T08:45:00Z',
    lastContact: '2024-01-13T09:20:00Z',
    assignedTo: 'admin-002'
  },
  {
    id: 'lead-005',
    fullName: 'Hoàng Thị Lost',
    email: 'lost@example.com',
    phone: '+84 918 901 234',
    company: 'Old Tech Corp',
    position: 'Senior Developer',
    interestedCourse: 'Node.js Backend Development',
    source: 'event',
    status: 'lost',
    score: 45,
    notes: 'Không phản hồi sau nhiều lần liên hệ, có thể đã chọn đối thủ',
    createdAt: '2024-01-10T13:30:00Z',
    lastContact: '2024-01-12T15:45:00Z',
    assignedTo: 'admin-001'
  }
];

// Test credentials for different roles
export const testCredentials = {
  admin: {
    email: 'admin@rockettraining.com',
    password: 'admin123',
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
  },
  // Additional enterprise accounts
  enterprise2: {
    email: 'talent@fptsoft.com',
    password: 'enterprise123',
    role: 'enterprise'
  },
  enterprise3: {
    email: 'hr@vng.com.vn',
    password: 'enterprise123',
    role: 'enterprise'
  },
  enterprise4: {
    email: 'recruitment@tiki.vn',
    password: 'enterprise123',
    role: 'enterprise'
  },
  enterprise5: {
    email: 'hr@shopee.vn',
    password: 'enterprise123',
    role: 'enterprise'
  },
  enterprise6: {
    email: 'talent@grab.com',
    password: 'enterprise123',
    role: 'enterprise'
  }
};

// Dashboard statistics
export const dashboardStats = {
  totalStudents: 1247,
  totalCourses: 24,
  totalInstructors: 8,
  totalRevenue: 2450000000,
  monthlyGrowth: {
    students: 12.5,
    courses: 8.3,
    revenue: 15.7
  },
  recentActivities: [
    {
      id: '1',
      type: 'enrollment',
      message: 'Nguyễn Văn A đã đăng ký khóa React.js Fundamentals',
      timestamp: '2024-01-15T10:30:00Z',
      user: 'Nguyễn Văn A'
    },
    {
      id: '2',
      type: 'completion',
      message: 'Trần Thị B đã hoàn thành khóa Node.js Backend Development',
      timestamp: '2024-01-15T09:15:00Z',
      user: 'Trần Thị B'
    },
    {
      id: '3',
      type: 'course_created',
      message: 'Khóa học mới "Advanced React Patterns" đã được tạo',
      timestamp: '2024-01-15T08:45:00Z',
      user: 'Lê Văn Giảng'
    }
  ]
};

// Mock Teams Data
export const mockTeams: Team[] = [
  {
    id: 'team-001',
    name: 'React Warriors',
    leaderId: 'student-001',
    leaderName: 'Nguyễn Thị Học Viên',
    mentorId: 'instructor-001',
    mentorName: 'Lê Văn Giảng',
    members: [
      {
        id: 'tm-001',
        studentId: 'student-001',
        fullName: 'Nguyễn Thị Học Viên',
        email: 'student1@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
        role: 'leader',
        joinedAt: '2023-06-15',
        isActive: true
      },
      {
        id: 'tm-002',
        studentId: 'student-007',
        fullName: 'Đặng Thị Hương',
        email: 'huong.dang@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
        role: 'member',
        joinedAt: '2023-12-01',
        isActive: true
      }
    ],
    courseId: 'course-001',
    courseName: 'React.js Fundamentals',
    createdAt: '2023-06-15',
    status: 'active'
  },
  {
    id: 'team-002',
    name: 'Node.js Masters',
    leaderId: 'student-002',
    leaderName: 'Trần Văn Sinh Viên',
    mentorId: 'instructor-002',
    mentorName: 'Phạm Thị Hướng Dẫn',
    members: [
      {
        id: 'tm-003',
        studentId: 'student-002',
        fullName: 'Trần Văn Sinh Viên',
        email: 'student2@gmail.com',
        avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
        role: 'leader',
        joinedAt: '2023-07-01',
        isActive: true
      }
    ],
    courseId: 'course-002',
    courseName: 'Node.js Backend Development',
    createdAt: '2023-07-01',
    status: 'completed'
  }
];

// Mock Tasks Data
export const mockTasks: Task[] = [
  {
    id: 'task-001',
    title: 'Xây dựng Component React cơ bản',
    description: 'Tạo một component React hiển thị danh sách sản phẩm với các tính năng filter và search',
    type: 'individual',
    courseId: 'course-001',
    assignedBy: 'instructor-001',
    assignedTo: ['student-001', 'student-007'],
    dueDate: '2024-01-20',
    priority: 'medium',
    status: 'completed',
    attachments: [
      {
        id: 'att-001',
        name: 'requirements.pdf',
        url: '/files/requirements.pdf',
        type: 'application/pdf',
        size: 245760
      }
    ],
    submissions: [
      {
        id: 'sub-001',
        taskId: 'task-001',
        studentId: 'student-001',
        studentName: 'Nguyễn Thị Học Viên',
        content: 'Đã hoàn thành component với đầy đủ tính năng yêu cầu',
        submittedAt: '2024-01-18T14:30:00Z',
        grade: 9,
        feedback: 'Làm rất tốt, code clean và có comment đầy đủ',
        status: 'graded'
      }
    ],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-18T15:00:00Z'
  },
  {
    id: 'task-002',
    title: 'Dự án Team: Xây dựng E-commerce App',
    description: 'Phát triển một ứng dụng thương mại điện tử hoàn chỉnh với React và Node.js',
    type: 'team',
    courseId: 'course-001',
    teamId: 'team-001',
    assignedBy: 'instructor-001',
    assignedTo: ['student-001', 'student-007'],
    dueDate: '2024-02-15',
    priority: 'high',
    status: 'in_progress',
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T16:30:00Z'
  }
];

// Mock Evaluations Data
export const mockEvaluations: Evaluation[] = [
  {
    id: 'eval-001',
    evaluatorId: 'student-007',
    evaluatorName: 'Đặng Thị Hương',
    evaluatorType: 'student',
    evaluatedId: 'student-001',
    evaluatedName: 'Nguyễn Thị Học Viên',
    courseId: 'course-001',
    teamId: 'team-001',
    criteria: [
      {
        id: 'crit-001',
        name: 'Kỹ năng lập trình',
        description: 'Khả năng viết code clean, hiệu quả',
        score: 9,
        weight: 30,
        comments: 'Code rất sạch và dễ hiểu'
      },
      {
        id: 'crit-002',
        name: 'Làm việc nhóm',
        description: 'Khả năng phối hợp và hỗ trợ đồng đội',
        score: 8,
        weight: 25,
        comments: 'Rất hỗ trợ và chia sẻ kiến thức'
      },
      {
        id: 'crit-003',
        name: 'Giao tiếp',
        description: 'Khả năng trình bày và thảo luận ý tưởng',
        score: 8,
        weight: 20,
        comments: 'Trình bày rõ ràng, dễ hiểu'
      },
      {
        id: 'crit-004',
        name: 'Sáng tạo',
        description: 'Khả năng đưa ra giải pháp mới',
        score: 9,
        weight: 25,
        comments: 'Có nhiều ý tưởng hay và sáng tạo'
      }
    ],
    overallScore: 8.5,
    comments: 'Học viên rất xuất sắc, là leader tốt của team',
    isAnonymous: false,
    createdAt: '2024-01-15T16:00:00Z',
    period: '2024-Q1'
  },
  {
    id: 'eval-002',
    evaluatorId: 'instructor-001',
    evaluatorName: 'Lê Văn Giảng',
    evaluatorType: 'mentor',
    evaluatedId: 'student-001',
    evaluatedName: 'Nguyễn Thị Học Viên',
    courseId: 'course-001',
    criteria: [
      {
        id: 'crit-005',
        name: 'Tiến độ học tập',
        description: 'Khả năng hoàn thành bài tập đúng hạn',
        score: 9,
        weight: 40,
        comments: 'Luôn hoàn thành đúng hạn và chất lượng cao'
      },
      {
        id: 'crit-006',
        name: 'Tham gia lớp học',
        description: 'Mức độ tích cực trong các buổi học',
        score: 8,
        weight: 30,
        comments: 'Tham gia tích cực, đặt câu hỏi hay'
      },
      {
        id: 'crit-007',
        name: 'Kỹ năng tự học',
        description: 'Khả năng tìm hiểu và học hỏi độc lập',
        score: 9,
        weight: 30,
        comments: 'Rất chủ động trong việc tìm hiểu kiến thức mới'
      }
    ],
    overallScore: 8.7,
    comments: 'Học viên xuất sắc với tiềm năng phát triển cao',
    isAnonymous: false,
    createdAt: '2024-01-14T10:00:00Z',
    period: '2024-Q1'
  }
];

// Mock Student Profiles Data
export const mockStudentProfiles: StudentProfile[] = [
  {
    id: 'profile-001',
    studentId: 'student-001',
    fullName: 'Nguyễn Thị Học Viên',
    email: 'student1@gmail.com',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    courseId: 'course-001',
    courseName: 'React.js Fundamentals',
    enrollmentDate: '2023-06-15',
    primarySkills: ['React.js', 'JavaScript', 'HTML/CSS'],
    secondarySkills: ['Node.js', 'Git', 'Responsive Design'],
    technicalSkills: [
      {
        name: 'React.js',
        level: 'advanced',
        verifiedBy: ['instructor-001', 'peer-review'],
        projectsUsed: ['E-commerce App', 'Portfolio Website']
      },
      {
        name: 'JavaScript',
        level: 'intermediate',
        verifiedBy: ['instructor-001'],
        projectsUsed: ['E-commerce App', 'Todo App']
      }
    ],
    softSkills: [
      {
        name: 'Leadership',
        level: 'proficient',
        evidenceFrom: ['team-lead-role', 'peer-feedback']
      },
      {
        name: 'Communication',
        level: 'competent',
        evidenceFrom: ['presentations', 'peer-feedback']
      }
    ],
    tasksCompleted: 15,
    projectsParticipated: 3,
    totalHours: 120,
    attendanceRate: 95,
    overallRating: 8.6,
    peerRating: 8.5,
    mentorRating: 8.7,
    leaderRating: 8.8,
    aiSystemRating: 8.4,
    mentorFeedback: [
      {
        id: 'feedback-001',
        fromId: 'instructor-001',
        fromName: 'Lê Văn Giảng',
        fromType: 'mentor',
        content: 'Học viên có tiềm năng rất cao, khả năng lãnh đạo tốt',
        rating: 9,
        isPublic: true,
        createdAt: '2024-01-14T10:00:00Z'
      }
    ],
    leaderFeedback: [],
    peerFeedback: [
      {
        id: 'feedback-002',
        fromId: 'student-007',
        fromName: 'Đặng Thị Hương',
        fromType: 'peer',
        content: 'Rất hỗ trợ team members, code review tốt',
        rating: 8,
        isPublic: true,
        createdAt: '2024-01-15T16:00:00Z'
      }
    ],
    isAvailableForHire: true,
    preferredWorkType: 'full_time',
    expectedSalary: 15000000,
    preferredLocation: 'Hà Nội',
    profileGenerated: true,
    profileGeneratedAt: '2024-01-16T09:00:00Z',
    profileViews: 12,
    enterpriseInterests: [
      {
        id: 'interest-001',
        enterpriseId: 'enterprise-001',
        enterpriseName: 'TechCorp Vietnam',
        position: 'Frontend Developer',
        interestLevel: 'high',
        status: 'contacted',
        notes: 'Phù hợp với vị trí Junior Frontend Developer',
        contactedAt: '2024-01-16T14:00:00Z',
        updatedAt: '2024-01-16T14:00:00Z'
      }
    ],
    createdAt: '2023-06-15T09:00:00Z',
    updatedAt: '2024-01-16T09:00:00Z'
  }
];

// Mock Extended Students Data
export const mockExtendedStudents: ExtendedStudent[] = [
  {
    id: 'student-001',
    fullName: 'Nguyễn Thị Học Viên',
    email: 'student1@gmail.com',
    phone: '+84 906 789 012',
    avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150&h=150&fit=crop&crop=face',
    course: 'React.js Fundamentals',
    courseId: 'course-001',
    enrollmentDate: '2023-06-15',
    progress: 85,
    status: 'active',
    grade: 'A',
    lastActivity: '2024-01-15',
    totalHours: 120,
    completedLessons: 27,
    totalLessons: 32,
    teamId: 'team-001',
    teamName: 'React Warriors',
    role: 'leader',
    mentorId: 'instructor-001',
    mentorName: 'Lê Văn Giảng',
    tasksAssigned: 18,
    tasksCompleted: 15,
    tasksOverdue: 1,
    peerEvaluationScore: 8.5,
    mentorEvaluationScore: 8.7,
    leaderEvaluationScore: 8.8,
    aiEvaluationScore: 8.4,
    profileGenerated: true,
    isAvailableForHire: true,
    enterpriseInterests: 3,
    interactionHistory: [
      {
        id: 'activity-001',
        studentId: 'student-001',
        type: 'task_completed',
        title: 'Hoàn thành Task: Component React cơ bản',
        description: 'Đã submit và được chấm điểm 9/10',
        metadata: { taskId: 'task-001', grade: 9 },
        timestamp: '2024-01-18T14:30:00Z'
      },
      {
        id: 'activity-002',
        studentId: 'student-001',
        type: 'evaluation_received',
        title: 'Nhận đánh giá từ đồng đội',
        description: 'Điểm đánh giá: 8.5/10 từ Đặng Thị Hương',
        metadata: { evaluationId: 'eval-001', score: 8.5 },
        timestamp: '2024-01-15T16:00:00Z'
      },
      {
        id: 'activity-003',
        studentId: 'student-001',
        type: 'enterprise_interest',
        title: 'Doanh nghiệp quan tâm',
        description: 'TechCorp Vietnam đã xem profile và liên hệ',
        metadata: { enterpriseId: 'enterprise-001' },
        timestamp: '2024-01-16T14:00:00Z'
      }
    ]
  },
  {
    id: 'student-002',
    fullName: 'Trần Văn Sinh Viên',
    email: 'student2@gmail.com',
    phone: '+84 907 890 123',
    avatar: 'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=150&h=150&fit=crop&crop=face',
    course: 'Node.js Backend Development',
    courseId: 'course-002',
    enrollmentDate: '2023-07-01',
    progress: 92,
    status: 'completed',
    grade: 'A',
    lastActivity: '2024-01-10',
    totalHours: 150,
    completedLessons: 45,
    totalLessons: 45,
    teamId: 'team-002',
    teamName: 'Node.js Masters',
    role: 'leader',
    mentorId: 'instructor-002',
    mentorName: 'Phạm Thị Hướng Dẫn',
    tasksAssigned: 22,
    tasksCompleted: 22,
    tasksOverdue: 0,
    peerEvaluationScore: 9.0,
    mentorEvaluationScore: 9.2,
    leaderEvaluationScore: 9.1,
    aiEvaluationScore: 8.9,
    profileGenerated: true,
    isAvailableForHire: true,
    enterpriseInterests: 5,
    interactionHistory: [
      {
        id: 'activity-004',
        studentId: 'student-002',
        type: 'task_completed',
        title: 'Hoàn thành khóa học',
        description: 'Đã hoàn thành tất cả bài học và dự án',
        timestamp: '2024-01-10T16:00:00Z'
      }
    ]
  }
];

// Mock Enterprise Interests
export const mockEnterpriseInterests: import('../types/student').EnterpriseInterest[] = [
  {
    id: 'interest-001',
    enterpriseId: 'enterprise-001',
    enterpriseName: 'TechCorp Vietnam',
    position: 'Frontend Developer',
    interestLevel: 'high' as const,
    status: 'contacted' as const,
    notes: 'Phù hợp với vị trí Junior Frontend Developer',
    contactedAt: '2024-01-16T14:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z'
  },
  {
    id: 'interest-002',
    enterpriseId: 'enterprise-002',
    enterpriseName: 'StartupXYZ',
    position: 'Full Stack Developer',
    interestLevel: 'medium' as const,
    status: 'interested' as const,
    notes: 'Cần kinh nghiệm thêm về backend',
    updatedAt: '2024-01-15T10:00:00Z'
  }
];

// Mock Enterprise Programs
export const mockEnterprisePrograms: EnterpriseProgram[] = [
  {
    id: 'program-001',
    title: 'TechCorp Frontend Bootcamp',
    description: 'Chương trình đào tạo Frontend Developer chuyên sâu cho nhân viên TechCorp',
    enterpriseId: 'enterprise-001',
    enterpriseName: 'TechCorp Vietnam',
    category: 'Frontend Development',
    level: 'Intermediate',
    duration: 120,
    maxParticipants: 20,
    currentParticipants: 15,
    status: 'active',
    startDate: '2024-01-15',
    endDate: '2024-04-15',
    skills: ['React.js', 'TypeScript', 'Next.js', 'Tailwind CSS'],
    requirements: ['Kinh nghiệm JavaScript cơ bản', 'Hiểu biết về HTML/CSS'],
    createdAt: '2023-12-01T09:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z'
  },
  {
    id: 'program-002',
    title: 'FPT Software Backend Mastery',
    description: 'Khóa học Backend Development nâng cao với Node.js và microservices',
    enterpriseId: 'enterprise-002',
    enterpriseName: 'FPT Software',
    category: 'Backend Development',
    level: 'Advanced',
    duration: 160,
    maxParticipants: 15,
    currentParticipants: 12,
    status: 'active',
    startDate: '2024-02-01',
    endDate: '2024-06-01',
    skills: ['Node.js', 'Express', 'MongoDB', 'Docker', 'Kubernetes'],
    requirements: ['2+ năm kinh nghiệm backend', 'Hiểu biết về database'],
    createdAt: '2024-01-01T09:00:00Z',
    updatedAt: '2024-02-01T10:00:00Z'
  },
  {
    id: 'program-003',
    title: 'VNG Data Science Program',
    description: 'Chương trình đào tạo Data Science và Machine Learning',
    enterpriseId: 'enterprise-003',
    enterpriseName: 'VNG Corporation',
    category: 'Data Science',
    level: 'Advanced',
    duration: 200,
    maxParticipants: 10,
    currentParticipants: 8,
    status: 'planning',
    startDate: '2024-03-01',
    endDate: '2024-08-01',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'SQL', 'Statistics'],
    requirements: ['Kinh nghiệm Python', 'Nền tảng toán học tốt'],
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T10:00:00Z'
  }
];

// Mock Enterprise Projects
export const mockEnterpriseProjects: EnterpriseProject[] = [
  {
    id: 'project-001',
    title: 'E-commerce Platform (TechCorp)',
    description: 'Xây dựng nền tảng thương mại điện tử với React và Node.js',
    enterpriseId: 'enterprise-001',
    enterpriseName: 'TechCorp Vietnam',
    programId: 'program-001',
    programName: 'TechCorp Frontend Bootcamp',
    category: 'Web Development',
    priority: 'high',
    status: 'in_progress',
    progress: 65,
    startDate: '2024-01-20',
    endDate: '2024-04-10',
    teamSize: 6,
    assignedStudents: ['student-001', 'student-007', 'student-008'],
    requiredSkills: ['React.js', 'Node.js', 'MongoDB', 'Payment Integration'],
    deliverables: ['Frontend UI/UX', 'Backend API', 'Database Design', 'Payment System'],
    budget: 50000000,
    createdAt: '2024-01-15T09:00:00Z',
    updatedAt: '2024-01-20T14:30:00Z'
  },
  {
    id: 'project-002',
    title: 'Microservices Architecture (FPT)',
    description: 'Thiết kế và triển khai kiến trúc microservices cho hệ thống ERP',
    enterpriseId: 'enterprise-002',
    enterpriseName: 'FPT Software',
    programId: 'program-002',
    programName: 'FPT Software Backend Mastery',
    category: 'System Architecture',
    priority: 'critical',
    status: 'planning',
    progress: 15,
    startDate: '2024-02-15',
    endDate: '2024-05-15',
    teamSize: 8,
    assignedStudents: ['student-002', 'student-009'],
    requiredSkills: ['Node.js', 'Docker', 'Kubernetes', 'API Gateway', 'Message Queue'],
    deliverables: ['Service Architecture', 'API Documentation', 'Deployment Scripts', 'Monitoring Setup'],
    budget: 80000000,
    createdAt: '2024-02-01T09:00:00Z',
    updatedAt: '2024-02-10T16:00:00Z'
  },
  {
    id: 'project-003',
    title: 'Mobile App Development (Tiki)',
    description: 'Phát triển ứng dụng mobile cho Tiki với React Native',
    enterpriseId: 'enterprise-004',
    enterpriseName: 'Tiki Corporation',
    category: 'Mobile Development',
    priority: 'medium',
    status: 'completed',
    progress: 100,
    startDate: '2023-10-01',
    endDate: '2024-01-15',
    teamSize: 4,
    assignedStudents: ['student-003', 'student-010'],
    requiredSkills: ['React Native', 'Redux', 'Firebase', 'Push Notifications'],
    deliverables: ['iOS App', 'Android App', 'Backend Integration', 'Testing Suite'],
    budget: 35000000,
    createdAt: '2023-09-15T09:00:00Z',
    updatedAt: '2024-01-15T17:00:00Z'
  }
];

// Mock Enterprise Statistics
export const mockEnterpriseStats: EnterpriseStats = {
  totalPrograms: 8,
  activePrograms: 3,
  completedPrograms: 4,
  totalProjects: 15,
  activeProjects: 6,
  completedProjects: 8,
  totalStudents: 45,
  activeStudents: 32,
  graduatedStudents: 28,
  averageRating: 4.6,
  successRate: 87.5,
  monthlyProgress: [
    { month: '2023-09', programs: 1, projects: 2, students: 8 },
    { month: '2023-10', programs: 2, projects: 3, students: 12 },
    { month: '2023-11', programs: 1, projects: 2, students: 6 },
    { month: '2023-12', programs: 2, projects: 4, students: 15 },
    { month: '2024-01', programs: 2, projects: 4, students: 18 },
    { month: '2024-02', programs: 1, projects: 2, students: 8 }
  ]
};

export default {
  mockUsers,
  mockCourses,
  mockStudents,
  mockLeads,
  testCredentials,
  dashboardStats,
  mockTeams,
  mockTasks,
  mockEvaluations,
  mockStudentProfiles,
  mockExtendedStudents,
  mockEnterpriseInterests,
  mockEnterprisePrograms,
  mockEnterpriseProjects,
  mockEnterpriseStats
};