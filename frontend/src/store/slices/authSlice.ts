import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { mockUsers, testCredentials } from '../../data/mockData';

// Types
export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'instructor' | 'student' | 'enterprise' | 'mentor' | 'leader';
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check credentials against test accounts
      const testAccount = Object.values(testCredentials).find(
        account => account.email === credentials.email && account.password === credentials.password
      );
      
      if (!testAccount) {
        throw new Error('Email hoặc mật khẩu không đúng');
      }
      
      // Find user data from mock users
      const userData = mockUsers.find(user => user.email === credentials.email);
      
      if (!userData) {
        throw new Error('Không tìm thấy thông tin người dùng');
      }
      
      // Return successful login data
      return {
        user: {
          id: userData.id,
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
          avatar: userData.avatar,
          createdAt: userData.joinedDate
        },
        token: `mock-jwt-token-${userData.id}-${Date.now()}`
      };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('token');
      
      // Uncomment when backend is ready:
      // await axios.post('/api/auth/logout');
      
      return null;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const verifyToken = createAsyncThunk(
  'auth/verifyToken',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
      
      // Mock verification for now
      const mockUser: User = {
        id: 'user-new-001',
        email: 'test@example.com',
        fullName: 'Test User',
        role: 'student',
        createdAt: new Date().toISOString()
      };
      
      return { user: mockUser, token };
      
      // Uncomment when backend is ready:
      // const response = await axios.get('/api/auth/verify', {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // return response.data;
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue(error.response?.data?.message || 'Token verification failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCredentials: (state, action: PayloadAction<{ user: User; token: string }>) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem('token', action.payload.token);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('token');
    },
    initializeAuth: (state) => {
      const token = localStorage.getItem('token');
      if (token) {
        state.token = token;
        // In a real app, you would verify the token with the server
        // For now, we'll just set isAuthenticated to true if token exists
        state.isAuthenticated = true;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
        localStorage.setItem('token', action.payload.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      })
      // Logout
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Verify token
      .addCase(verifyToken.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyToken.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(verifyToken.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, setCredentials, clearCredentials, initializeAuth } = authSlice.actions;
export default authSlice.reducer;