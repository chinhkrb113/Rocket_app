import { authApi, apiRequest, ApiResponse } from './config';
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
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<LoginResponse>>(AUTH_ENDPOINTS.LOGIN, credentials)
    );
  },

  // Register user
  register: async (userData: RegisterData): Promise<{ user: User; message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ user: User; message: string }>>(
        AUTH_ENDPOINTS.REGISTER, 
        userData
      )
    );
  },

  // Logout user
  logout: async (): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ message: string }>>(AUTH_ENDPOINTS.LOGOUT)
    );
  },

  // Refresh token
  refreshToken: async (refreshToken: string): Promise<{
    token: string;
    refresh_token: string;
    expires_in: number;
  }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{
        token: string;
        refresh_token: string;
        expires_in: number;
      }>>(AUTH_ENDPOINTS.REFRESH_TOKEN, { refresh_token: refreshToken })
    );
  },

  // Get current user
  getCurrentUser: async (): Promise<{ user: User }> => {
    return apiRequest(() => 
      authApi.get<ApiResponse<{ user: User }>>(AUTH_ENDPOINTS.ME)
    );
  },

  // Forgot password
  forgotPassword: async (data: ForgotPasswordData): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.FORGOT_PASSWORD, 
        data
      )
    );
  },

  // Reset password
  resetPassword: async (data: ResetPasswordData): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.RESET_PASSWORD, 
        data
      )
    );
  },

  // Change password
  changePassword: async (data: ChangePasswordData): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.put<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.CHANGE_PASSWORD, 
        data
      )
    );
  },

  // Verify email
  verifyEmail: async (data: VerifyEmailData): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.VERIFY_EMAIL, 
        data
      )
    );
  },

  // Resend email verification
  resendVerification: async (data: ResendVerificationData): Promise<{ message: string }> => {
    return apiRequest(() => 
      authApi.post<ApiResponse<{ message: string }>>(
        AUTH_ENDPOINTS.RESEND_VERIFICATION, 
        data
      )
    );
  },

  // Update user profile
  updateProfile: async (userData: Partial<User>): Promise<{ user: User }> => {
    return apiRequest(() => 
      authApi.put<ApiResponse<{ user: User }>>('/api/auth/profile', userData)
    );
  },

  // Upload avatar
  uploadAvatar: async (file: File): Promise<{ user: User; avatar_url: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return apiRequest(() => 
      authApi.post<ApiResponse<{ user: User; avatar_url: string }>>(
        '/api/auth/upload-avatar', 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
    );
  },
};

export default authApiService;