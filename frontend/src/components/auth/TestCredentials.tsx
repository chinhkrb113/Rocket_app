import React, { useState } from 'react';
import { testCredentials } from '../../data/mockData';
import './TestCredentials.css';

interface TestCredentialsProps {
  onSelectCredentials: (email: string, password: string) => void;
}

const TestCredentials: React.FC<TestCredentialsProps> = ({ onSelectCredentials }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectCredentials = (email: string, password: string) => {
    onSelectCredentials(email, password);
    setIsExpanded(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return '#ef4444'; // red
      case 'instructor':
        return '#3b82f6'; // blue
      case 'student':
        return '#10b981'; // green
      case 'enterprise':
        return '#8b5cf6'; // purple
      default:
        return '#6b7280'; // gray
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return '👑';
      case 'instructor':
        return '👨‍🏫';
      case 'student':
        return '🎓';
      case 'enterprise':
        return '🏢';
      default:
        return '👤';
    }
  };

  return (
    <div className="test-credentials">
      <button
        className="test-credentials-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        type="button"
      >
        <span className="toggle-icon">🧪</span>
        <span className="toggle-text">
          {isExpanded ? 'Ẩn tài khoản test' : 'Tài khoản test'}
        </span>
        <span className={`toggle-arrow ${isExpanded ? 'expanded' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="test-credentials-panel">
          <div className="panel-header">
            <h3>🔑 Tài khoản test</h3>
            <p>Click vào tài khoản để tự động điền thông tin đăng nhập</p>
          </div>

          <div className="credentials-grid">
            {Object.entries(testCredentials).map(([key, creds]) => (
              <div
                key={key}
                className="credential-card"
                onClick={() => handleSelectCredentials(creds.email, creds.password)}
                style={{ borderLeftColor: getRoleColor(creds.role) }}
              >
                <div className="credential-header">
                  <span className="role-icon">{getRoleIcon(creds.role)}</span>
                  <span className="role-name">
                    {creds.role === 'admin' && 'Quản trị viên'}
                    {creds.role === 'instructor' && 'Giảng viên'}
                    {creds.role === 'student' && 'Học viên'}
                    {creds.role === 'enterprise' && 'Doanh nghiệp'}
                  </span>
                </div>
                <div className="credential-info">
                  <div className="credential-field">
                    <span className="field-label">Email:</span>
                    <span className="field-value">{creds.email}</span>
                  </div>
                  <div className="credential-field">
                    <span className="field-label">Password:</span>
                    <span className="field-value">{creds.password}</span>
                  </div>
                </div>
                <div className="credential-action">
                  <span className="action-text">Click để sử dụng</span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel-footer">
            <div className="info-item">
              <span className="info-icon">💡</span>
              <span className="info-text">
                Mỗi tài khoản có quyền hạn và giao diện khác nhau
              </span>
            </div>
            <div className="info-item">
              <span className="info-icon">🔒</span>
              <span className="info-text">
                Dữ liệu test được tạo sẵn cho từng vai trò
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestCredentials;