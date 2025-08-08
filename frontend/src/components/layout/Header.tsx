import React, { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { logout } from '../../store/slices/authSlice';
import './Header.css';

interface HeaderProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  const notifications = [
    {
      id: '1',
      title: 'Khóa học mới',
      message: 'Khóa học "Advanced React" đã được thêm',
      time: '5 phút trước',
      type: 'info',
      unread: true
    },
    {
      id: '2',
      title: 'Hoàn thành bài tập',
      message: 'Bạn đã hoàn thành bài tập JavaScript',
      time: '1 giờ trước',
      type: 'success',
      unread: true
    },
    {
      id: '3',
      title: 'Nhắc nhở',
      message: 'Đừng quên tham gia buổi học lúc 14:00',
      time: '2 giờ trước',
      type: 'warning',
      unread: false
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <header className="header">
      <div className="header-left">
        <button 
          className="sidebar-toggle"
          onClick={onToggleSidebar}
          aria-label={isSidebarOpen ? 'Đóng menu' : 'Mở menu'}
        >
          <span className={`hamburger ${isSidebarOpen ? 'active' : ''}`}>
            <span></span>
            <span></span>
            <span></span>
          </span>
        </button>
        
        <div className="header-title">
          <h1>🚀 Rocket Training</h1>
        </div>
      </div>

      <div className="header-center">
        <div className="search-container">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Tìm kiếm khóa học, bài học..."
              className="search-input"
            />
            <button className="search-btn">
              <span>⌘K</span>
            </button>
          </div>
        </div>
      </div>

      <div className="header-right">
        {/* Quick Actions */}
        <div className="quick-actions">
          <button className="quick-action-btn" title="Thêm khóa học mới">
            ➕
          </button>
          <button className="quick-action-btn" title="Cài đặt nhanh">
            ⚙️
          </button>
        </div>

        {/* Notifications */}
        <div className="notification-container">
          <button 
            className="notification-btn"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            title="Thông báo"
          >
            🔔
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>
          
          {isNotificationOpen && (
            <div className="notification-dropdown">
              <div className="notification-header">
                <h3>Thông báo</h3>
                <button className="mark-all-read">Đánh dấu đã đọc</button>
              </div>
              <div className="notification-list">
                {notifications.map((notification) => (
                  <div 
                    key={notification.id} 
                    className={`notification-item ${notification.unread ? 'unread' : ''}`}
                  >
                    <div className={`notification-type ${notification.type}`}>
                      {notification.type === 'info' && '💡'}
                      {notification.type === 'success' && '✅'}
                      {notification.type === 'warning' && '⚠️'}
                    </div>
                    <div className="notification-content">
                      <h4>{notification.title}</h4>
                      <p>{notification.message}</p>
                      <span className="notification-time">{notification.time}</span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="notification-footer">
                <button className="view-all-btn">Xem tất cả</button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="profile-container">
          <button 
            className="profile-btn"
            onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          >
            <img 
              src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face'} 
              alt={user?.fullName || 'User'}
              className="profile-avatar"
            />
            <div className="profile-info">
              <span className="profile-name">{user?.fullName || 'Người dùng'}</span>
              <span className="profile-role">{user?.role || 'Học viên'}</span>
            </div>
            <span className="profile-arrow">▼</span>
          </button>
          
          {isProfileMenuOpen && (
            <div className="profile-dropdown">
              <div className="profile-menu-header">
                <img 
                  src={user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face'} 
                  alt={user?.fullName || 'User'}
                  className="profile-menu-avatar"
                />
                <div className="profile-menu-info">
                  <h4>{user?.fullName || 'Người dùng'}</h4>
                  <p>{user?.email || 'user@example.com'}</p>
                </div>
              </div>
              
              <div className="profile-menu-items">
                <a href="/profile" className="profile-menu-item">
                  <span className="menu-icon">👤</span>
                  Hồ sơ cá nhân
                </a>
                <a href="/settings" className="profile-menu-item">
                  <span className="menu-icon">⚙️</span>
                  Cài đặt
                </a>
                <a href="/help" className="profile-menu-item">
                  <span className="menu-icon">❓</span>
                  Trợ giúp
                </a>
                <div className="menu-divider"></div>
                <button className="profile-menu-item logout-btn" onClick={handleLogout}>
                  <span className="menu-icon">🚪</span>
                  Đăng xuất
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay for closing dropdowns */}
      {(isProfileMenuOpen || isNotificationOpen) && (
        <div 
          className="header-overlay"
          onClick={() => {
            setIsProfileMenuOpen(false);
            setIsNotificationOpen(false);
          }}
        ></div>
      )}
    </header>
  );
};

export default Header;