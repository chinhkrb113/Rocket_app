// Types for Student Workflow System

export interface Team {
  id: string;
  name: string;
  leaderId: string;
  leaderName: string;
  mentorId?: string;
  mentorName?: string;
  members: TeamMember[];
  courseId: string;
  courseName: string;
  createdAt: string;
  status: 'active' | 'completed' | 'disbanded';
}

export interface TeamMember {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: 'leader' | 'member';
  joinedAt: string;
  isActive: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'individual' | 'team' | 'project';
  courseId: string;
  teamId?: string;
  assignedBy: string;
  assignedTo: string[]; // student IDs
  dueDate: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  attachments?: TaskAttachment[];
  submissions?: TaskSubmission[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  studentId: string;
  studentName: string;
  content: string;
  attachments?: TaskAttachment[];
  submittedAt: string;
  grade?: number;
  feedback?: string;
  status: 'submitted' | 'graded' | 'revision_needed';
}

export interface Evaluation {
  id: string;
  evaluatorId: string;
  evaluatorName: string;
  evaluatorType: 'student' | 'leader' | 'mentor' | 'ai_system';
  evaluatedId: string;
  evaluatedName: string;
  courseId: string;
  teamId?: string;
  criteria: EvaluationCriteria[];
  overallScore: number;
  comments: string;
  isAnonymous: boolean;
  createdAt: string;
  period: string; // e.g., "2024-Q1", "Week 1"
}

export interface EvaluationCriteria {
  id: string;
  name: string;
  description: string;
  score: number; // 1-10
  weight: number; // percentage
  comments?: string;
}

export interface StudentProfile {
  id: string;
  studentId: string;
  fullName: string;
  email: string;
  avatar?: string;
  
  // Course Information
  courseId: string;
  courseName: string;
  enrollmentDate: string;
  completionDate?: string;
  
  // Skills and Competencies
  primarySkills: string[];
  secondarySkills: string[];
  technicalSkills: TechnicalSkill[];
  softSkills: SoftSkill[];
  
  // Performance Metrics
  tasksCompleted: number;
  projectsParticipated: number;
  totalHours: number;
  attendanceRate: number;
  
  // Evaluations Summary
  overallRating: number;
  peerRating: number;
  mentorRating: number;
  leaderRating: number;
  aiSystemRating: number;
  
  // Feedback and Comments
  mentorFeedback: Feedback[];
  leaderFeedback: Feedback[];
  peerFeedback: Feedback[];
  
  // Enterprise Connection
  isAvailableForHire: boolean;
  preferredWorkType: 'full_time' | 'part_time' | 'internship' | 'freelance';
  expectedSalary?: number;
  preferredLocation?: string;
  
  // Generated Profile
  profileGenerated: boolean;
  profileGeneratedAt?: string;
  profileViews: number;
  enterpriseInterests: EnterpriseInterest[];
  
  createdAt: string;
  updatedAt: string;
}

export interface TechnicalSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  verifiedBy: string[];
  projectsUsed: string[];
}

export interface SoftSkill {
  name: string;
  level: 'developing' | 'competent' | 'proficient' | 'expert';
  evidenceFrom: string[];
}

export interface Feedback {
  id: string;
  fromId: string;
  fromName: string;
  fromType: 'mentor' | 'leader' | 'peer';
  content: string;
  rating: number;
  isPublic: boolean;
  createdAt: string;
}

export interface EnterpriseInterest {
  id: string;
  enterpriseId: string;
  enterpriseName: string;
  position: string;
  interestLevel: 'low' | 'medium' | 'high';
  status: 'interested' | 'contacted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  notes?: string;
  contactedAt?: string;
  updatedAt: string;
}

export interface StudentActivity {
  id: string;
  studentId: string;
  type: 'task_completed' | 'evaluation_received' | 'team_joined' | 'skill_acquired' | 'enterprise_interest';
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// Extended Student interface with new workflow features
export interface ExtendedStudent {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  
  // Basic course info
  course: string;
  courseId: string;
  enrollmentDate: string;
  progress: number;
  status: 'pending' | 'active' | 'completed' | 'suspended';
  grade: 'A' | 'B' | 'C' | 'D' | 'F' | 'N/A';
  lastActivity: string;
  totalHours: number;
  completedLessons: number;
  totalLessons: number;
  
  // New workflow features
  teamId?: string;
  teamName?: string;
  role?: 'member' | 'leader';
  mentorId?: string;
  mentorName?: string;
  
  // Performance tracking
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOverdue: number;
  
  // Evaluation scores
  peerEvaluationScore?: number;
  mentorEvaluationScore?: number;
  leaderEvaluationScore?: number;
  aiEvaluationScore?: number;
  
  // Profile status
  profileGenerated: boolean;
  isAvailableForHire: boolean;
  enterpriseInterests: number;
  
  // Activity tracking
  interactionHistory: StudentActivity[];
}