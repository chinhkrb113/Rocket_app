import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface DashboardSummary {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  convertedLeads: number;
  averageScore: number;
  highQualityLeads: number;
  weeklyLeads: number;
  monthlyLeads: number;
  leadsBySource: { [key: string]: number };
  recentHighQualityLeads: Lead[];
  newLeadsTrend: { date: string; count: number }[];
}

export interface Lead {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  score: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardState {
  data: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  data: null,
  loading: false,
  error: null,
};

// Async thunk for fetching dashboard summary
export const fetchDashboardSummary = createAsyncThunk(
  'dashboard/fetchSummary',
  async (_, { rejectWithValue }) => {
    try {
      // Mock data for now - replace with actual API call
      const mockData: DashboardSummary = {
        totalLeads: 1250,
        newLeads: 45,
        qualifiedLeads: 320,
        convertedLeads: 89,
        averageScore: 67.5,
        highQualityLeads: 156,
        weeklyLeads: 78,
        monthlyLeads: 312,
        leadsBySource: {
          'Website': 450,
          'Facebook': 320,
          'Google Ads': 280,
          'Referral': 200
        },
        recentHighQualityLeads: [
          {
            id: 1,
            fullName: 'Nguyễn Văn A',
            email: 'nguyenvana@email.com',
            phone: '0901234567',
            source: 'Website',
            status: 'qualified',
            score: 85,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            fullName: 'Trần Thị B',
            email: 'tranthib@email.com',
            phone: '0907654321',
            source: 'Facebook',
            status: 'new',
            score: 78,
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:15:00Z'
          },
          {
            id: 3,
            fullName: 'Lê Văn C',
            email: 'levanc@email.com',
            source: 'Google Ads',
            status: 'contacted',
            score: 72,
            createdAt: '2024-01-15T08:45:00Z',
            updatedAt: '2024-01-15T08:45:00Z'
          }
        ],
        newLeadsTrend: [
          { date: '2024-01-09', count: 12 },
          { date: '2024-01-10', count: 15 },
          { date: '2024-01-11', count: 8 },
          { date: '2024-01-12', count: 18 },
          { date: '2024-01-13', count: 22 },
          { date: '2024-01-14', count: 16 },
          { date: '2024-01-15', count: 19 }
        ]
      };

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return mockData;
      
      // Uncomment when backend is ready:
      // const response = await axios.get('/api/admin/dashboard-summary');
      // return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch dashboard data');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    resetDashboard: (state) => {
      state.data = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardSummary.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action: PayloadAction<DashboardSummary>) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(fetchDashboardSummary.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, resetDashboard } = dashboardSlice.actions;
export default dashboardSlice.reducer;