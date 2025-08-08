import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './app/store';
import { initializeAuth } from './store/slices/authSlice';
import { useAppDispatch, useAppSelector } from './hooks/redux';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/features/auth/ProtectedRoute';
import PublicRoute from './components/features/auth/PublicRoute';
import './App.css';

// Import pages
import DashboardPage from './pages/DashboardPage';
import LoginPage from './pages/LoginPage';
import CoursesPage from './pages/CoursesPage';
import StudentsPage from './pages/StudentsPage';
import ProfilePage from './pages/ProfilePage';
import EnterprisePage from './pages/EnterprisePage';
import NotFoundPage from './pages/NotFoundPage';



// App Content Component (inside Provider)
const AppContent: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  
  useEffect(() => {
    // Initialize auth state from localStorage on app start
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={
              <PublicRoute restricted={true}>
                <LoginPage />
              </PublicRoute>
            } 
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/courses" 
            element={
              <ProtectedRoute>
                <Layout>
                  <CoursesPage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/students" 
            element={
              <ProtectedRoute>
                <Layout>
                  {user && <StudentsPage currentUser={user} />}
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <Layout>
                  <ProfilePage />
                </Layout>
              </ProtectedRoute>
            } 
          />
          
          <Route 
            path="/enterprise" 
            element={
              <ProtectedRoute>
                {user && <EnterprisePage currentUser={user} />}
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* 404 Page */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </Router>
  );
};

// Main App Component with Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

export default App;
