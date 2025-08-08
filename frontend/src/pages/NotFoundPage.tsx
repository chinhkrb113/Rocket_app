import React from 'react';
import { Link } from 'react-router-dom';
import './NotFoundPage.css';

const NotFoundPage: React.FC = () => {
  const suggestions = [
    {
      title: 'Dashboard',
      description: 'Xem tổng quan về tiến độ học tập',
      icon: '📊',
      path: '/dashboard'
    },
    {
      title: 'Khóa học',
      description: 'Khám phá các khóa học có sẵn',
      icon: '📚',
      path: '/courses'
    },
    {
      title: 'Học viên',
      description: 'Quản lý thông tin học viên',
      icon: '👥',
      path: '/students'
    },
    {
      title: 'Hồ sơ',
      description: 'Cập nhật thông tin cá nhân',
      icon: '👤',
      path: '/profile'
    }
  ];

  const handleGoBack = () => {
    window.history.back();
  };

  const handleReportIssue = () => {
    // In a real app, this would open a support ticket or feedback form
    alert('Cảm ơn bạn đã báo cáo! Chúng tôi sẽ kiểm tra và khắc phục sớm nhất.');
  };

  return (
    <div className="not-found-page">
      <div className="not-found-container">
        {/* Animated 404 */}
        <div className="error-animation">
          <div className="error-number">
            <span className="digit">4</span>
            <span className="digit floating">0</span>
            <span className="digit">4</span>
          </div>
          <div className="error-illustration">
            <div className="rocket">
              <div className="rocket-body">🚀</div>
              <div className="rocket-trail"></div>
            </div>
            <div className="stars">
              <span className="star">⭐</span>
              <span className="star">✨</span>
              <span className="star">🌟</span>
              <span className="star">💫</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        <div className="error-content">
          <h1 className="error-title">Oops! Trang không tồn tại</h1>
          <p className="error-description">
            Có vẻ như bạn đã đi lạc trong không gian mạng. Trang bạn đang tìm kiếm 
            có thể đã được di chuyển, xóa hoặc chưa bao giờ tồn tại.
          </p>
          
          {/* Action Buttons */}
          <div className="error-actions">
            <button className="btn btn-primary" onClick={handleGoBack}>
              <span className="btn-icon">⬅️</span>
              Quay lại
            </button>
            <Link to="/dashboard" className="btn btn-secondary">
              <span className="btn-icon">🏠</span>
              Về trang chủ
            </Link>
          </div>
        </div>

        {/* Suggestions */}
        <div className="suggestions-section">
          <h2 className="suggestions-title">Có thể bạn đang tìm kiếm:</h2>
          <div className="suggestions-grid">
            {suggestions.map((suggestion, index) => (
              <Link 
                key={index} 
                to={suggestion.path} 
                className="suggestion-card"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="suggestion-icon">{suggestion.icon}</div>
                <div className="suggestion-content">
                  <h3>{suggestion.title}</h3>
                  <p>{suggestion.description}</p>
                </div>
                <div className="suggestion-arrow">→</div>
              </Link>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="help-section">
          <div className="help-card">
            <div className="help-icon">🤔</div>
            <div className="help-content">
              <h3>Vẫn không tìm thấy?</h3>
              <p>Nếu bạn tin rằng đây là lỗi hệ thống, hãy báo cáo cho chúng tôi.</p>
              <button className="btn btn-outline" onClick={handleReportIssue}>
                <span className="btn-icon">🐛</span>
                Báo cáo lỗi
              </button>
            </div>
          </div>
        </div>

        {/* Search Section */}
        <div className="search-section">
          <div className="search-card">
            <div className="search-icon">🔍</div>
            <div className="search-content">
              <h3>Tìm kiếm nội dung</h3>
              <div className="search-form">
                <input 
                  type="text" 
                  placeholder="Tìm kiếm khóa học, bài học, hoặc tài liệu..."
                  className="search-input"
                />
                <button className="search-btn">
                  <span>🔍</span>
                </button>
              </div>
              <div className="popular-searches">
                <span className="popular-label">Tìm kiếm phổ biến:</span>
                <div className="popular-tags">
                  <span className="popular-tag">React</span>
                  <span className="popular-tag">JavaScript</span>
                  <span className="popular-tag">Python</span>
                  <span className="popular-tag">UI/UX</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="error-footer">
          <p>
            Nếu bạn cần hỗ trợ, vui lòng liên hệ{' '}
            <a href="mailto:support@rockettraining.com" className="support-link">
              support@rockettraining.com
            </a>
          </p>
          <div className="footer-links">
            <a href="/help" className="footer-link">Trung tâm trợ giúp</a>
            <span className="separator">•</span>
            <a href="/contact" className="footer-link">Liên hệ</a>
            <span className="separator">•</span>
            <a href="/status" className="footer-link">Trạng thái hệ thống</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;