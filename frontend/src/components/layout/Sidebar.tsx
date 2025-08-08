import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: any;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentUser }) => {
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      icon: '📊',
      label: 'Dashboard',
      description: 'Tổng quan hệ thống'
    },
    {
      path: '/courses',
      icon: '📚',
      label: 'Khóa học',
      description: 'Quản lý khóa học'
    },
    {
      path: '/students',
      icon: '👥',
      label: 'Học viên',
      description: 'Quản lý học viên'
    },
    ...(currentUser?.role === 'enterprise' ? [{
      path: '/enterprise',
      icon: '🏢',
      label: 'Doanh nghiệp',
      description: 'Quản lý đào tạo doanh nghiệp'
    }] : []),
    {
      path: '/profile',
      icon: '👤',
      label: 'Hồ sơ',
      description: 'Thông tin cá nhân'
    }
  ];

  const quickActions = [
    {
      icon: '➕',
      label: 'Thêm khóa học',
      action: () => console.log('Add course')
    },
    {
      icon: '👤',
      label: 'Thêm học viên',
      action: () => console.log('Add student')
    },
    {
      icon: '📝',
      label: 'Tạo bài kiểm tra',
      action: () => console.log('Create test')
    }
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      
      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-content">
          {/* Navigation Menu */}
          <nav className="sidebar-nav">
            <div className="nav-section">
              <h3 className="nav-title">Menu chính</h3>
              <ul className="nav-list">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <li key={item.path} className="nav-item">
                      <Link 
                        to={item.path} 
                        className={`nav-link ${isActive ? 'nav-link-active' : ''}`}
                        onClick={() => window.innerWidth <= 768 && onClose()}
                      >
                        <span className="nav-icon">{item.icon}</span>
                        <div className="nav-content">
                          <span className="nav-label">{item.label}</span>
                          <span className="nav-description">{item.description}</span>
                        </div>
                        {isActive && <span className="nav-indicator" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Quick Actions */}
            <div className="nav-section">
              <h3 className="nav-title">Thao tác nhanh</h3>
              <div className="quick-actions">
                {quickActions.map((action, index) => (
                  <button 
                    key={index}
                    className="quick-action-btn"
                    onClick={action.action}
                    title={action.label}
                  >
                    <span className="action-icon">{action.icon}</span>
                    <span className="action-label">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Help Section */}
            <div className="nav-section help-section">
              <div className="help-card">
                <div className="help-icon">💡</div>
                <h4>Cần hỗ trợ?</h4>
                <p>Liên hệ với chúng tôi để được hỗ trợ tốt nhất</p>
                <button className="help-btn">Liên hệ</button>
              </div>
            </div>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;