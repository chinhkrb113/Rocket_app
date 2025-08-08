import { mainApi } from './config';
import { ApiResponse } from './config';

// Student Types
export interface Student {
  id: number;
  fullName: string;
  email: string;
  skills: string[];
  experience: 'Beginner' | 'Intermediate' | 'Advanced';
  status: 'active' | 'inactive' | 'graduated';
  portfolio?: string[];
  bio?: string;
  location?: string;
  availability?: string;
  hourlyRate?: number;
}

export interface StudentProfile {
  id: number;
  fullName: string;
  email: string;
  skills: string[];
  experience: string;
  portfolio: string[];
  bio: string;
  location: string;
  availability: string;
  hourlyRate: number;
  completedProjects: number;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: number;
  projectId: number;
  rating: number;
  comment: string;
  reviewerName: string;
  createdAt: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  skills?: string[];
  experience?: string;
  bio?: string;
  location?: string;
  availability?: string;
  hourlyRate?: number;
  portfolio?: string[];
}

// Student Service API calls
export const studentService = {
  // Get all students
  getAllStudents: async (): Promise<ApiResponse<Student[]>> => {
    const response = await mainApi.get('/api/students');
    return response.data;
  },

  // Get student by ID
  getStudentById: async (id: number): Promise<ApiResponse<StudentProfile>> => {
    const response = await mainApi.get(`/api/students/${id}`);
    return response.data;
  },

  // Update student profile
  updateProfile: async (id: number, data: UpdateProfileRequest): Promise<ApiResponse<StudentProfile>> => {
    const response = await mainApi.put(`/api/students/${id}`, data);
    return response.data;
  },

  // Search students by skills
  searchBySkills: async (skills: string[]): Promise<ApiResponse<Student[]>> => {
    const response = await mainApi.post('/api/students/search', { skills });
    return response.data;
  },

  // Get student portfolio
  getPortfolio: async (id: number): Promise<ApiResponse<{ projects: any[] }>> => {
    const response = await mainApi.get(`/api/students/${id}/portfolio`);
    return response.data;
  },

  // Submit assignment for AI analysis
  submitAssignment: async (data: {
    studentId: number;
    assignmentId: number;
    content: string;
    files?: File[];
  }): Promise<ApiResponse<{ submissionId: number; analysisId: string }>> => {
    const formData = new FormData();
    formData.append('studentId', data.studentId.toString());
    formData.append('assignmentId', data.assignmentId.toString());
    formData.append('content', data.content);
    
    if (data.files) {
      data.files.forEach((file, index) => {
        formData.append(`file_${index}`, file);
      });
    }

    const response = await mainApi.post('/api/students/submit-assignment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

export default studentService;