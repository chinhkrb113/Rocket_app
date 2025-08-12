import { mainApi } from './config';
import { ApiResponse } from './config';
import { CandidateRecommendation } from './aiService';

// Enterprise Types
export interface Project {
  id: number;
  title: string;
  description: string;
  skills: string[];
  budget: number;
  endDate: string;
  status: 'open' | 'in_progress' | 'completed' | 'cancelled';
  enterpriseId?: number;
  createdAt?: string;
  updatedAt?: string;
  assignedStudentIds?: string[];
}

export interface CreateProjectRequest {
  title: string;
  description: string;
  skills: string[];
  budget: number;
  endDate: string;
  requirements?: string;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
}

export interface UpdateProjectRequest {
  title?: string;
  description?: string;
  skills?: string[];
  budget?: number;
  endDate?: string;
  status?: 'open' | 'in_progress' | 'completed' | 'cancelled';
}

export interface Enterprise {
  id: number;
  companyName: string;
  industry: string;
  size: string;
  email: string;
  website?: string;
  description?: string;
  location?: string;
}

export interface ProjectApplication {
  id: number;
  projectId: number;
  studentId: number;
  studentName: string;
  studentEmail: string;
  coverLetter: string;
  proposedBudget: number;
  estimatedDuration: string;
  status: 'pending' | 'accepted' | 'rejected';
  appliedAt: string;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  dueDate: string;
  type: 'individual' | 'team' | 'project';
  priority: 'low' | 'medium' | 'high';
  assignedStudentIds: string[];
  enterpriseId?: number; // Optional: If an admin/instructor can select an enterprise
  createdBy?: number; // Optional: Logged in user's ID
}


// Enterprise Service API calls
export const enterpriseService = {
  // Get all projects for current enterprise
  getProjects: async (): Promise<ApiResponse<Project[]>> => {
    const response = await mainApi.get('/api/enterprises/projects');
    return response.data;
  },

  // Get project by ID
  getProjectById: async (id: number): Promise<ApiResponse<Project>> => {
    const response = await mainApi.get(`/api/enterprises/projects/${id}`);
    return response.data;
  },

  // Create new project (task for students)
  createProject: async (data: CreateTaskRequest): Promise<ApiResponse<Project>> => {
    const response = await mainApi.post('/api/projects', data);
    return response.data;
  },

  // Update project
  updateProject: async (id: number, data: UpdateProjectRequest): Promise<ApiResponse<Project>> => {
    const response = await mainApi.put(`/api/enterprises/projects/${id}`, data);
    return response.data;
  },

  // Delete project
  deleteProject: async (id: number): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.delete(`/api/enterprises/projects/${id}`);
    return response.data;
  },

  // Get AI-powered candidate recommendations
  getCandidateRecommendations: async (projectId: number): Promise<ApiResponse<CandidateRecommendation[]>> => {
    const response = await mainApi.post('/api/ai/recommend-candidates', { projectId });
    return response.data;
  },

  // Get project applications
  getProjectApplications: async (projectId: number): Promise<ApiResponse<ProjectApplication[]>> => {
    const response = await mainApi.get(`/api/enterprises/projects/${projectId}/applications`);
    return response.data;
  },

  // Accept/Reject application
  updateApplicationStatus: async (
    projectId: number, 
    applicationId: number, 
    status: 'accepted' | 'rejected'
  ): Promise<ApiResponse<ProjectApplication>> => {
    const response = await mainApi.put(
      `/api/enterprises/projects/${projectId}/applications/${applicationId}`, 
      { status }
    );
    return response.data;
  },

  // Search projects (for students)
  searchProjects: async (filters: {
    skills?: string[];
    budgetMin?: number;
    budgetMax?: number;
    experienceLevel?: string;
  }): Promise<ApiResponse<Project[]>> => {
    const response = await mainApi.post('/api/enterprises/projects/search', filters);
    return response.data;
  },

  // Apply to project (for students)
  applyToProject: async (data: {
    projectId: number;
    coverLetter: string;
    proposedBudget: number;
    estimatedDuration: string;
  }): Promise<ApiResponse<ProjectApplication>> => {
    const response = await mainApi.post('/api/enterprises/projects/apply', data);
    return response.data;
  },

  // Get enterprise profile
  getProfile: async (): Promise<ApiResponse<Enterprise>> => {
    const response = await mainApi.get('/api/enterprises/profile');
    return response.data;
  },

  // Update enterprise profile
  updateProfile: async (data: Partial<Enterprise>): Promise<ApiResponse<Enterprise>> => {
    const response = await mainApi.put('/api/enterprises/profile', data);
    return response.data;
  }
};

export default enterpriseService;