import { mainApi } from './config';
import { ApiResponse } from './config';

// AI Service Types
export interface AnalyzeSubmissionRequest {
  studentId: string;
  submissionContent: string;
  assignmentType: string;
  criteria?: string[];
}

export interface AnalyzeSubmissionResponse {
  score: number;
  feedback: string;
  strengths: string[];
  improvements: string[];
  detailedAnalysis: {
    technical: number;
    creativity: number;
    codeQuality: number;
    documentation: number;
  };
}

export interface RecommendCandidatesRequest {
  projectId: string;
  requiredSkills: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  budget?: number;
  deadline?: string;
}

export interface CandidateRecommendation {
  studentId: string;
  fullName: string;
  email: string;
  matchScore: number;
  skills: string[];
  experience: string;
  portfolio: string[];
  estimatedCost: number;
  availability: string;
}

export interface ScoreLeadRequest {
  leadData: {
    companyName: string;
    industry: string;
    size: string;
    budget: number;
    urgency: string;
    requirements: string[];
  };
}

export interface LeadScore {
  score: number;
  priority: 'high' | 'medium' | 'low';
  reasoning: string;
  recommendations: string[];
}

// AI Service API calls
export const aiService = {
  // Analyze student submission
  analyzeSubmission: async (data: AnalyzeSubmissionRequest): Promise<ApiResponse<AnalyzeSubmissionResponse>> => {
    const response = await mainApi.post('/api/ai/analyze-submission', data);
    return response.data;
  },

  // Recommend candidates for enterprise projects
  recommendCandidates: async (data: RecommendCandidatesRequest): Promise<ApiResponse<CandidateRecommendation[]>> => {
    const response = await mainApi.post('/api/ai/recommend-candidates', data);
    return response.data;
  },

  // Score leads for consulting service
  scoreLead: async (data: ScoreLeadRequest): Promise<ApiResponse<LeadScore>> => {
    const response = await mainApi.post('/api/ai/score-lead', data);
    return response.data;
  },

  // Get AI service health
  getHealth: async (): Promise<ApiResponse<{ status: string; timestamp: string }>> => {
    const response = await mainApi.get('/health');
    return response.data;
  }
};

export default aiService;