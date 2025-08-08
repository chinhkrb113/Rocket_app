import React, { useState } from 'react';
import './ProfilePage.css';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  department: string;
  joinDate: string;
  phone: string;
  location: string;
  bio: string;
  skills: string[];
  achievements: Achievement[];
  stats: UserStats;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedDate: string;
  category: string;
}

interface UserStats {
  coursesCompleted: number;
  totalHours: number;
  certificatesEarned: number;
  currentStreak: number;
}

interface Activity {
  id: string;
  type: 'course_completed' | 'certificate_earned' | 'skill_learned' | 'achievement_unlocked';
  title: string;
  description: string;
  date: string;
  icon: string;
}

const ProfilePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'settings'>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: '1',
    name: 'Nguyễn Văn An',
    email: 'nguyen.van.an@company.com',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    role: 'Senior Developer',
    department: 'Engineering',
    joinDate: '2022-01-15',
    phone: '+84 123 456 789',
    location: 'Hồ Chí Minh, Việt Nam',
    bio: 'Passionate software developer with 5+ years of experience in full-stack development. Love learning new technologies and sharing knowledge with the team.',
    skills: ['React', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker'],
    achievements: [
      {
        id: '1',
        title: 'React Master',
        description: 'Completed advanced React course with 95% score',
        icon: '⚛️',
        earnedDate: '2024-01-15',
        category: 'Technical'
      },
      {
        id: '2',
        title: 'Team Player',
        description: 'Helped 10+ colleagues complete their training',
        icon: '🤝',
        earnedDate: '2024-02-20',
        category: 'Collaboration'
      },
      {
        id: '3',
        title: 'Fast Learner',
        description: 'Completed 5 courses in one month',
        icon: '⚡',
        earnedDate: '2024-03-10',
        category: 'Learning'
      }
    ],
    stats: {
      coursesCompleted: 24,
      totalHours: 156,
      certificatesEarned: 8,
      currentStreak: 12
    }
  });

  const [activities] = useState<Activity[]>([
    {
      id: '1',
      type: 'course_completed',
      title: 'Advanced React Patterns',
      description: 'Completed with 98% score',
      date: '2024-01-20',
      icon: '📚'
    },
    {
      id: '2',
      type: 'certificate_earned',
      title: 'AWS Solutions Architect',
      description: 'Professional certification earned',
      date: '2024-01-18',
      icon: '🏆'
    },
    {
      id: '3',
      type: 'achievement_unlocked',
      title: 'React Master',
      description: 'Unlocked new achievement',
      date: '2024-01-15',
      icon: '🎖️'
    },
    {
      id: '4',
      type: 'skill_learned',
      title: 'TypeScript',
      description: 'Added new skill to profile',
      date: '2024-01-12',
      icon: '💡'
    }
  ]);

  const handleSaveProfile = () => {
    setIsEditing(false);
    // Here you would typically save to backend
    console.log('Profile saved:', profile);
  };

  const handleInputChange = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'course_completed': return '#10b981';
      case 'certificate_earned': return '#f59e0b';
      case 'achievement_unlocked': return '#8b5cf6';
      case 'skill_learned': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="profile-info">
            <div className="avatar-section">
              <img src={profile.avatar} alt={profile.name} className="profile-avatar" />
              <div className="avatar-overlay">
                <button className="change-avatar-btn">
                  📷
                </button>
              </div>
            </div>
            <div className="basic-info">
              {isEditing ? (
                <>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="edit-input name-input"
                  />
                  <input
                    type="text"
                    value={profile.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="edit-input role-input"
                  />
                </>
              ) : (
                <>
                  <h1 className="profile-name">{profile.name}</h1>
                  <p className="profile-role">{profile.role}</p>
                </>
              )}
              <div className="profile-meta">
                <span className="meta-item">
                  <span className="meta-icon">🏢</span>
                  {profile.department}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📍</span>
                  {profile.location}
                </span>
                <span className="meta-item">
                  <span className="meta-icon">📅</span>
                  Tham gia từ {formatDate(profile.joinDate)}
                </span>
              </div>
            </div>
          </div>
          <div className="profile-actions">
            {isEditing ? (
              <>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  Hủy
                </button>
                <button className="btn btn-primary" onClick={handleSaveProfile}>
                  Lưu thay đổi
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary">
                  📤 Chia sẻ
                </button>
                <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
                  ✏️ Chỉnh sửa
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{profile.stats.coursesCompleted}</h3>
              <p>Khóa học hoàn thành</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-content">
              <h3>{profile.stats.totalHours}</h3>
              <p>Giờ học tập</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🏆</div>
            <div className="stat-content">
              <h3>{profile.stats.certificatesEarned}</h3>
              <p>Chứng chỉ đạt được</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <h3>{profile.stats.currentStreak}</h3>
              <p>Ngày liên tiếp</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng quan
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          📈 Hoạt động
        </button>
        <button
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Cài đặt
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Bio Section */}
              <div className="bio-section">
                <h3>Giới thiệu</h3>
                {isEditing ? (
                  <textarea
                    value={profile.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="edit-textarea"
                    rows={4}
                  />
                ) : (
                  <p className="bio-text">{profile.bio}</p>
                )}
              </div>

              {/* Skills Section */}
              <div className="skills-section">
                <h3>Kỹ năng</h3>
                <div className="skills-grid">
                  {profile.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                      {isEditing && (
                        <button className="remove-skill">×</button>
                      )}
                    </span>
                  ))}
                  {isEditing && (
                    <button className="add-skill-btn">+ Thêm kỹ năng</button>
                  )}
                </div>
              </div>

              {/* Contact Info */}
              <div className="contact-section">
                <h3>Thông tin liên hệ</h3>
                <div className="contact-info">
                  <div className="contact-item">
                    <span className="contact-icon">📧</span>
                    {isEditing ? (
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{profile.email}</span>
                    )}
                  </div>
                  <div className="contact-item">
                    <span className="contact-icon">📱</span>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="edit-input"
                      />
                    ) : (
                      <span>{profile.phone}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Achievements */}
              <div className="achievements-section">
                <h3>Thành tích</h3>
                <div className="achievements-grid">
                  {profile.achievements.map((achievement) => (
                    <div key={achievement.id} className="achievement-card">
                      <div className="achievement-icon">{achievement.icon}</div>
                      <div className="achievement-content">
                        <h4>{achievement.title}</h4>
                        <p>{achievement.description}</p>
                        <span className="achievement-date">
                          {formatDate(achievement.earnedDate)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'activity' && (
          <div className="activity-tab">
            <div className="activity-header">
              <h3>Hoạt động gần đây</h3>
              <div className="activity-filters">
                <select className="filter-select">
                  <option value="all">Tất cả hoạt động</option>
                  <option value="courses">Khóa học</option>
                  <option value="certificates">Chứng chỉ</option>
                  <option value="achievements">Thành tích</option>
                </select>
              </div>
            </div>
            <div className="activity-timeline">
              {activities.map((activity) => (
                <div key={activity.id} className="activity-item">
                  <div 
                    className="activity-marker"
                    style={{ backgroundColor: getActivityTypeColor(activity.type) }}
                  >
                    {activity.icon}
                  </div>
                  <div className="activity-content">
                    <div className="activity-header">
                      <h4>{activity.title}</h4>
                      <span className="activity-date">{formatDate(activity.date)}</span>
                    </div>
                    <p>{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="settings-tab">
            <div className="settings-sections">
              {/* Account Settings */}
              <div className="settings-section">
                <h3>Cài đặt tài khoản</h3>
                <div className="settings-group">
                  <div className="setting-item">
                    <label>Ngôn ngữ hiển thị</label>
                    <select className="setting-select">
                      <option value="vi">Tiếng Việt</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="setting-item">
                    <label>Múi giờ</label>
                    <select className="setting-select">
                      <option value="Asia/Ho_Chi_Minh">GMT+7 (Hồ Chí Minh)</option>
                      <option value="UTC">UTC</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Notification Settings */}
              <div className="settings-section">
                <h3>Thông báo</h3>
                <div className="settings-group">
                  <div className="setting-item toggle-item">
                    <label>Thông báo email</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="email-notifications" defaultChecked />
                      <label htmlFor="email-notifications" className="toggle-label"></label>
                    </div>
                  </div>
                  <div className="setting-item toggle-item">
                    <label>Thông báo khóa học mới</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="course-notifications" defaultChecked />
                      <label htmlFor="course-notifications" className="toggle-label"></label>
                    </div>
                  </div>
                  <div className="setting-item toggle-item">
                    <label>Nhắc nhở học tập</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="study-reminders" defaultChecked />
                      <label htmlFor="study-reminders" className="toggle-label"></label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div className="settings-section">
                <h3>Quyền riêng tư</h3>
                <div className="settings-group">
                  <div className="setting-item toggle-item">
                    <label>Hiển thị hồ sơ công khai</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="public-profile" defaultChecked />
                      <label htmlFor="public-profile" className="toggle-label"></label>
                    </div>
                  </div>
                  <div className="setting-item toggle-item">
                    <label>Cho phép người khác xem tiến độ</label>
                    <div className="toggle-switch">
                      <input type="checkbox" id="show-progress" defaultChecked />
                      <label htmlFor="show-progress" className="toggle-label"></label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="settings-section">
                <h3>Bảo mật</h3>
                <div className="settings-group">
                  <button className="btn btn-secondary full-width">
                    🔒 Đổi mật khẩu
                  </button>
                  <button className="btn btn-secondary full-width">
                    📱 Thiết lập xác thực 2 bước
                  </button>
                  <button className="btn btn-secondary full-width">
                    📋 Xem phiên đăng nhập
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="settings-section danger-zone">
                <h3>Vùng nguy hiểm</h3>
                <div className="settings-group">
                  <button className="btn btn-danger full-width">
                    🗑️ Xóa tài khoản
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;