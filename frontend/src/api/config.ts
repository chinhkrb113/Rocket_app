import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { store } from '../app/store';
import { clearCredentials } from '../store/slices/authSlice';

// API Base URLs
export const API_ENDPOINTS = {
  AUTH_SERVICE: process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:3001',
  USER_SERVICE: process.env.REACT_APP_USER_SERVICE_URL || 'http://localhost:3002',
  COURSE_SERVICE: process.env.REACT_APP_COURSE_SERVICE_URL || 'http://localhost:3003',
  AI_SERVICE: process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000',
};

// Create axios instance
const createApiInstance = (baseURL: string): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Request interceptor to add auth token
  instance.interceptors.request.use(
    (config: any) => {
      const state = store.getState() as any;
      const token = state.auth.token;
      
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor to handle token refresh
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;
      
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        // Token expired, logout user
        store.dispatch(clearCredentials());
        
        // Redirect to login page
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
      
      return Promise.reject(error);
    }
  );

  return instance;
};

// Create API instances for different services
export const authApi = createApiInstance(API_ENDPOINTS.AUTH_SERVICE);
export const userApi = createApiInstance(API_ENDPOINTS.USER_SERVICE);
export const courseApi = createApiInstance(API_ENDPOINTS.COURSE_SERVICE);
export const aiApi = createApiInstance(API_ENDPOINTS.AI_SERVICE);

// Generic API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  errors?: string[];
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

// Generic API error interface
export interface ApiError {
  message: string;
  status: number;
  errors?: string[];
}

// API request wrapper with error handling
export const apiRequest = async <T>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await request();
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'API request failed');
    }
  } catch (error: any) {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiError = {
        message: error.response.data?.message || 'Server error',
        status: error.response.status,
        errors: error.response.data?.errors,
      };
      throw apiError;
    } else if (error.request) {
      // Network error
      throw new Error('Network error - please check your connection');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
};

// Export default api instance (auth service)
export default authApi;