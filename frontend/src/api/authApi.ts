import { mainApi, ApiResponse } from './config';
import { User } from '../store/slices/authSlice';

// Login interfaces
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  refresh_token: string;
  expires_in: number;
}

// Auth API endpoints
export const AUTH_ENDPOINTS = {
  LOGIN: '/api/auth/login',
  LOGOUT: '/api/auth/logout',
  REGISTER: '/api/auth/register',
  REFRESH_TOKEN: '/api/auth/refresh-token',
  FORGOT_PASSWORD: '/api/auth/forgot-password',
  RESET_PASSWORD: '/api/auth/reset-password',
  VERIFY_EMAIL: '/api/auth/verify-email',
  RESEND_VERIFICATION: '/api/auth/resend-verification',
  CHANGE_PASSWORD: '/api/auth/change-password',
  ME: '/api/auth/me',
};

// Registration interface
export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  full_name: string;
  role: 'student' | 'instructor' | 'enterprise' | 'admin';
  phone?: string;
  company_name?: string; // For enterprise users
  department?: string; // For enterprise users
}

// Password reset interfaces
export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Email verification interfaces
export interface VerifyEmailData {
  token: string;
}

export interface ResendVerificationData {
  email: string;
}

// Auth API functions
export const authApiService = {
  // Login user
  login: async (credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.LOGIN, credentials);
    return response.data;
  },

  // Register user
  register: async (userData: RegisterData): Promise<ApiResponse<{ user: User; message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.REGISTER, userData);
    return response.data;
  },

  // Logout user
  logout: async (): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.LOGOUT);
    return response.data;
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<ApiResponse<{
    token: string;
    refresh_token: string;
    expires_in: number;
  }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.REFRESH_TOKEN, { refresh_token: refreshToken });
    return response.data;
  },

  // Get current user
  getCurrentUser: async (): Promise<ApiResponse<{ user: User }>> => {
    const response = await mainApi.get(AUTH_ENDPOINTS.ME);
    return response.data;
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.FORGOT_PASSWORD, data);
    return response.data;
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.RESET_PASSWORD, data);
    return response.data;
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.put(AUTH_ENDPOINTS.CHANGE_PASSWORD, data);
    return response.data;
  },

  // Verify email
  verifyEmail: async (data: VerifyEmailData): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.VERIFY_EMAIL, data);
    return response.data;
  },

  // Resend email verification
  resendVerification: async (data: ResendVerificationData): Promise<ApiResponse<{ message: string }>> => {
    const response = await mainApi.post(AUTH_ENDPOINTS.RESEND_VERIFICATION, data);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<ApiResponse<{ user: User }>> => {
    const response = await mainApi.put('/api/auth/profile', userData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<ApiResponse<{ user: User; avatar_url: string }>> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await mainApi.post('/api/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default authApiService;