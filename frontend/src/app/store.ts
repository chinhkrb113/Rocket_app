import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../store/slices/authSlice';
import dashboardReducer from '../store/slices/dashboardSlice';

// Configure the Redux store
export const store = configureStore({
  reducer: {
    auth: authReducer,
    dashboard: dashboardReducer,
    // Add other reducers here as they are created
    // students: studentsReducer,
    // courses: coursesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
        // Ignore these field paths in all actions
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        // Ignore these paths in the state
        ignoredPaths: ['items.dates'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export store as default
export default store;