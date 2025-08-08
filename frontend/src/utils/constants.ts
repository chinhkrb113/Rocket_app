// Application Constants
export const APP_CONFIG = {
  NAME: process.env.REACT_APP_APP_NAME || 'AI Training & Recruitment System',
  VERSION: process.env.REACT_APP_VERSION || '1.0.0',
  DEFAULT_PAGE_SIZE: parseInt(process.env.REACT_APP_DEFAULT_PAGE_SIZE || '20'),
  MAX_PAGE_SIZE: parseInt(process.env.REACT_APP_MAX_PAGE_SIZE || '100'),
  MAX_FILE_SIZE: parseInt(process.env.REACT_APP_MAX_FILE_SIZE || '10485760'), // 10MB
  CACHE_TTL: parseInt(process.env.REACT_APP_CACHE_TTL || '300000'), // 5 minutes
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  INSTRUCTOR: 'instructor',
  STUDENT: 'student',
  ENTERPRISE: 'enterprise',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// Auth Status
export const AUTH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
} as const;

export type AuthStatus = typeof AUTH_STATUS[keyof typeof AUTH_STATUS];

// API Status
export const API_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type ApiStatus = typeof API_STATUS[keyof typeof API_STATUS];

// Course Status
export const COURSE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
  SUSPENDED: 'suspended',
} as const;

export type CourseStatus = typeof COURSE_STATUS[keyof typeof COURSE_STATUS];

// Enrollment Status
export const ENROLLMENT_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  DROPPED: 'dropped',
  SUSPENDED: 'suspended',
} as const;

export type EnrollmentStatus = typeof ENROLLMENT_STATUS[keyof typeof ENROLLMENT_STATUS];

// Task Status
export const TASK_STATUS = {
  NOT_STARTED: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  OVERDUE: 'overdue',
  SUBMITTED: 'submitted',
  GRADED: 'graded',
} as const;

export type TaskStatus = typeof TASK_STATUS[keyof typeof TASK_STATUS];

// Lead Status
export const LEAD_STATUS = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  PROPOSAL: 'proposal',
  NEGOTIATION: 'negotiation',
  CLOSED_WON: 'closed_won',
  CLOSED_LOST: 'closed_lost',
} as const;

export type LeadStatus = typeof LEAD_STATUS[keyof typeof LEAD_STATUS];

// Lead Quality
export const LEAD_QUALITY = {
  HOT: 'hot',
  WARM: 'warm',
  COLD: 'cold',
  UNQUALIFIED: 'unqualified',
} as const;

export type LeadQuality = typeof LEAD_QUALITY[keyof typeof LEAD_QUALITY];

// Job Application Status
export const APPLICATION_STATUS = {
  APPLIED: 'applied',
  SCREENING: 'screening',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  HIRED: 'hired',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn',
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

// File Types
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  DOCUMENTS: ['.pdf', '.doc', '.docx', '.txt', '.rtf'],
  SPREADSHEETS: ['.xls', '.xlsx', '.csv'],
  PRESENTATIONS: ['.ppt', '.pptx'],
  VIDEOS: ['.mp4', '.avi', '.mov', '.wmv', '.flv'],
  AUDIO: ['.mp3', '.wav', '.ogg', '.m4a'],
};

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

export type NotificationType = typeof NOTIFICATION_TYPES[keyof typeof NOTIFICATION_TYPES];

// Theme Colors
export const THEME_COLORS = {
  PRIMARY: '#1976d2',
  SECONDARY: '#dc004e',
  SUCCESS: '#4caf50',
  WARNING: '#ff9800',
  ERROR: '#f44336',
  INFO: '#2196f3',
  LIGHT: '#f5f5f5',
  DARK: '#212121',
};

// Breakpoints
export const BREAKPOINTS = {
  XS: 0,
  SM: 600,
  MD: 960,
  LG: 1280,
  XL: 1920,
};

// Local Storage Keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  TOKEN_EXPIRATION: 'tokenExpiration',
  THEME: 'theme',
  LANGUAGE: 'language',
  PREFERENCES: 'preferences',
};

// API Endpoints
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REGISTER: '/api/auth/register',
    REFRESH: '/api/auth/refresh-token',
    FORGOT_PASSWORD: '/api/auth/forgot-password',
    RESET_PASSWORD: '/api/auth/reset-password',
    VERIFY_EMAIL: '/api/auth/verify-email',
    ME: '/api/auth/me',
  },
  USERS: {
    LIST: '/api/users',
    PROFILE: '/api/users/profile',
    UPDATE: '/api/users/profile',
    AVATAR: '/api/users/avatar',
  },
  COURSES: {
    LIST: '/api/courses',
    DETAIL: '/api/courses/:id',
    CREATE: '/api/courses',
    UPDATE: '/api/courses/:id',
    DELETE: '/api/courses/:id',
    ENROLL: '/api/courses/:id/enroll',
  },
  AI: {
    LEAD_SCORE: '/api/leads/score',
    STUDENT_ANALYSIS: '/api/students/analyze',
    JD_PARSE: '/api/enterprise/parse-jd',
    CANDIDATE_RECOMMEND: '/api/enterprise/recommend-candidates',
  },
};

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMM DD, YYYY HH:mm',
  INPUT: 'YYYY-MM-DD',
  INPUT_WITH_TIME: 'YYYY-MM-DDTHH:mm',
  API: 'YYYY-MM-DD HH:mm:ss',
  ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
};

// Regex Patterns
export const REGEX_PATTERNS = {
  EMAIL: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
  PHONE: /^[\+]?[1-9][\d]{0,15}$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  SLUG: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
};