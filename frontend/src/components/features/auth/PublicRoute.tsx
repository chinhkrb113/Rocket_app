import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../../hooks/redux';

interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean; // If true, authenticated users will be redirected
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children, restricted = false }) => {
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  // If route is restricted and user is authenticated, redirect to dashboard
  if (restricted && isAuthenticated) {
    // Get the intended destination from location state, or default to dashboard
    const from = (location.state as any)?.from?.pathname || '/dashboard';
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;

// Add styles for loading spinner (same as ProtectedRoute)
const styles = `
.public-route .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.public-route .loading-spinner {
  text-align: center;
  color: white;
}

.public-route .spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

.public-route .loading-spinner p {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  margin: 0;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const existingStyle = document.querySelector('style[data-component="public-route"]');
  if (!existingStyle) {
    const styleSheet = document.createElement('style');
    styleSheet.setAttribute('data-component', 'public-route');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
  }
}