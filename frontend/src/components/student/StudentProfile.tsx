import React, { useState, useEffect } from 'react';
import { mockStudentProfiles, mockExtendedStudents, mockTasks, mockEvaluations } from '../../data/mockData';
import { type StudentProfile, type ExtendedStudent } from '../../types/student';
import './StudentProfile.css';

interface StudentProfileProps {
  studentId: string;
  viewMode?: 'student' | 'enterprise' | 'admin';
  showActions?: boolean;
}

const StudentProfileComponent: React.FC<StudentProfileProps> = ({ 
  studentId, 
  viewMode = 'student',
  showActions = true 
}) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [student, setStudent] = useState<ExtendedStudent | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [isInterested, setIsInterested] = useState(false);

  useEffect(() => {
    const studentProfile = mockStudentProfiles.find(p => p.studentId === studentId);
    const studentData = mockExtendedStudents.find(s => s.id === studentId);
    
    setProfile(studentProfile || null);
    setStudent(studentData || null);
  }, [studentId]);

  if (!profile || !student) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner">⏳</div>
        <p>Đang tải hồ sơ...</p>
      </div>
    );
  }

  const getSkillLevel = (level: number) => {
    if (level >= 8) return { label: 'Xuất sắc', color: '#10b981' };
    if (level >= 6) return { label: 'Giỏi', color: '#3b82f6' };
    if (level >= 4) return { label: 'Khá', color: '#f59e0b' };
    return { label: 'Cần cải thiện', color: '#ef4444' };
  };

  const getOverallRating = () => {
    const allScores = [
      ...profile.technicalSkills.map((skill: any) => skill.level),
      ...profile.softSkills.map((skill: any) => skill.level)
    ];
    return allScores.length > 0 
      ? (allScores.reduce((sum, score) => sum + score, 0) / allScores.length).toFixed(1)
      : '0';
  };

  const handleEnterpriseInterest = () => {
    setIsInterested(true);
    // In a real app, this would send a notification to the student
    alert('Đã gửi thông báo quan tâm đến học viên!');
  };

  const handleSendMessage = () => {
    if (!contactMessage.trim()) return;
    
    // In a real app, this would send the message
    alert('Đã gửi tin nhắn đến học viên!');
    setContactMessage('');
    setShowContactModal(false);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <div className="student-profile">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="profile-avatar">
          <div className="avatar-circle">
            {student.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="profile-status">
            <span className={`status-badge ${profile.isAvailableForHire ? 'available' : 'not-available'}`}>
              {profile.isAvailableForHire ? 'Sẵn sàng làm việc' : 'Không tìm việc'}
            </span>
          </div>
        </div>
        
        <div className="profile-info">
          <h1>{student.fullName}</h1>
          <div className="profile-meta">
            <div className="meta-item">
              <span className="meta-label">Chuyên ngành:</span>
              <span className="meta-value">{student.course}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Khóa học:</span>
              <span className="meta-value">{student.course}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Hoàn thành:</span>
              <span className="meta-value">{profile.completionDate ? formatDate(profile.completionDate) : 'Đang học'}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Đánh giá tổng:</span>
              <span 
                className="meta-value rating"
                style={{ color: getSkillLevel(parseFloat(getOverallRating())).color }}
              >
                {getOverallRating()}/10 ({getSkillLevel(parseFloat(getOverallRating())).label})
              </span>
            </div>
          </div>
        </div>
        
        {viewMode === 'enterprise' && showActions && (
          <div className="profile-actions">
            <button 
              className={`btn-interest ${isInterested ? 'interested' : ''}`}
              onClick={handleEnterpriseInterest}
              disabled={isInterested}
            >
              {isInterested ? '✓ Đã quan tâm' : '⭐ Quan tâm'}
            </button>
            <button 
              className="btn-contact"
              onClick={() => setShowContactModal(true)}
            >
              💬 Liên hệ
            </button>
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="profile-content">
        {/* Technical Skills */}
        <div className="profile-section">
          <div className="section-header">
            <h3>🔧 Kỹ năng Kỹ thuật</h3>
            <span className="section-count">{profile.technicalSkills.length} kỹ năng</span>
          </div>
          <div className="skills-grid">
            {profile.technicalSkills.map((skill: any) => {
              const skillInfo = getSkillLevel(skill.level);
              return (
                <div key={skill.name} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-name">{skill.name}</span>
                    <span 
                      className="skill-level"
                      style={{ color: skillInfo.color }}
                    >
                      {skill.level}/10
                    </span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill"
                      style={{ 
                        width: `${(skill.level / 10) * 100}%`,
                        backgroundColor: skillInfo.color
                      }}
                    ></div>
                  </div>
                  <div className="skill-description">{skill.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Soft Skills */}
        <div className="profile-section">
          <div className="section-header">
            <h3>🤝 Kỹ năng Mềm</h3>
            <span className="section-count">{profile.softSkills.length} kỹ năng</span>
          </div>
          <div className="skills-grid">
            {profile.softSkills.map((skill: any) => {
              const skillInfo = getSkillLevel(skill.level);
              return (
                <div key={skill.name} className="skill-item">
                  <div className="skill-header">
                    <span className="skill-name">{skill.name}</span>
                    <span 
                      className="skill-level"
                      style={{ color: skillInfo.color }}
                    >
                      {skill.level}/10
                    </span>
                  </div>
                  <div className="skill-bar">
                    <div 
                      className="skill-fill"
                      style={{ 
                        width: `${(skill.level / 10) * 100}%`,
                        backgroundColor: skillInfo.color
                      }}
                    ></div>
                  </div>
                  <div className="skill-description">{skill.description}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Project Statistics */}
        <div className="profile-section">
          <div className="section-header">
            <h3>📊 Thống kê Dự án & Task</h3>
          </div>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon projects">🚀</div>
              <div className="stat-content">
                <h4>{profile.projectsParticipated}</h4>
                <p>Dự án hoàn thành</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon tasks">✅</div>
              <div className="stat-content">
                <h4>{profile.tasksCompleted}</h4>
                <p>Task hoàn thành</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon participation">📈</div>
              <div className="stat-content">
                <h4>{profile.attendanceRate}%</h4>
                <p>Tỷ lệ tham gia</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teamwork">👥</div>
              <div className="stat-content">
                <h4>{profile.peerRating}/10</h4>
                <p>Đánh giá từ đồng đội</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback from Mentors/Leaders */}
        <div className="profile-section">
          <div className="section-header">
            <h3>💬 Nhận xét từ Mentor & Leader</h3>
            <span className="section-count">{(profile.mentorFeedback?.length || 0) + (profile.leaderFeedback?.length || 0) + (profile.peerFeedback?.length || 0)} nhận xét</span>
          </div>
          <div className="feedback-list">
            {[...profile.mentorFeedback, ...profile.leaderFeedback, ...profile.peerFeedback].map((feedback: any) => (
              <div key={feedback.id} className="feedback-item">
                <div className="feedback-header">
                  <div className="feedback-author">
                    <div className="author-avatar">
                      {feedback.authorName.charAt(0).toUpperCase()}
                    </div>
                    <div className="author-info">
                      <span className="author-name">{feedback.authorName}</span>
                      <span className="author-role">{feedback.authorRole}</span>
                    </div>
                  </div>
                  <div className="feedback-date">
                    {formatDate(feedback.createdAt)}
                  </div>
                </div>
                <div className="feedback-content">
                  <div className="feedback-rating">
                    <span className="rating-label">Đánh giá:</span>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, i) => (
                        <span 
                          key={i} 
                          className={`star ${i < feedback.rating ? 'filled' : ''}`}
                        >
                          ⭐
                        </span>
                      ))}
                    </div>
                    <span className="rating-score">({feedback.rating}/5)</span>
                  </div>
                  <p className="feedback-text">{feedback.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise Interests */}
        {profile.enterpriseInterests && profile.enterpriseInterests.length > 0 && (
          <div className="profile-section">
            <div className="section-header">
              <h3>🏢 Quan tâm từ Doanh nghiệp</h3>
              <span className="section-count">{profile.enterpriseInterests.length} doanh nghiệp</span>
            </div>
            <div className="interests-list">
              {profile.enterpriseInterests.map((interest: any) => (
                <div key={interest.id} className="interest-item">
                  <div className="interest-header">
                    <div className="company-info">
                      <div className="company-logo">
                        {interest.companyName.charAt(0).toUpperCase()}
                      </div>
                      <div className="company-details">
                        <span className="company-name">{interest.companyName}</span>
                        <span className="position-title">{interest.position}</span>
                      </div>
                    </div>
                    <div className="interest-status">
                      <span className={`status-badge ${interest.status}`}>
                        {interest.status === 'interested' ? 'Quan tâm' :
                         interest.status === 'contacted' ? 'Đã liên hệ' :
                         interest.status === 'interviewing' ? 'Phỏng vấn' :
                         interest.status === 'offered' ? 'Đã offer' : 'Từ chối'}
                      </span>
                    </div>
                  </div>
                  <div className="interest-content">
                    <p className="interest-message">{interest.message}</p>
                    <div className="interest-date">
                      Quan tâm từ: {formatDate(interest.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activities Timeline */}
        <div className="profile-section">
          <div className="section-header">
            <h3>📅 Hoạt động gần đây</h3>
          </div>
          <div className="activities-timeline">
            {student.interactionHistory.slice(0, 5).map((activity: any) => (
              <div key={activity.id} className="activity-item">
                <div className="activity-icon">
                  {activity.type === 'task_completed' ? '✅' :
                   activity.type === 'evaluation_received' ? '⭐' :
                   activity.type === 'project_joined' ? '🚀' :
                   activity.type === 'skill_improved' ? '📈' : '📝'}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-description">{activity.description}</div>
                  <div className="activity-date">{formatDate(activity.date)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="contact-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Liên hệ với {student.fullName}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowContactModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="contact-form">
                <div className="form-group">
                  <label>Tin nhắn:</label>
                  <textarea
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    placeholder="Viết tin nhắn cho học viên..."
                    rows={6}
                  />
                </div>
                
                <div className="contact-info">
                  <div className="info-item">
                    <span className="info-label">📧 Email:</span>
                    <span className="info-value">{student.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">📱 Điện thoại:</span>
                    <span className="info-value">{student.phone}</span>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowContactModal(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleSendMessage}
                    disabled={!contactMessage.trim()}
                  >
                    Gửi tin nhắn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfileComponent;