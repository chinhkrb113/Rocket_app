import React, { useState, useEffect } from 'react';
import { mockTeams, mockExtendedStudents, type User } from '../../data/mockData';
import { type Team, type ExtendedStudent } from '../../types/student';
import './TeamManagement.css';

interface TeamManagementProps {
  currentUser?: User;
  teams?: Team[];
  students?: ExtendedStudent[];
  studentId?: string;
  viewMode?: 'student' | 'admin';
}

const TeamManagement: React.FC<TeamManagementProps> = ({ 
  currentUser,
  teams: propTeams,
  students: propStudents,
  studentId, 
  viewMode = 'student' 
}) => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<ExtendedStudent[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setTeams(propTeams || mockTeams);
    setStudents(propStudents || mockExtendedStudents);
  }, [propTeams, propStudents]);

  const getStudentTeam = () => {
    if (!studentId) return null;
    return teams.find(team =>
      team.members.some((member: any) => member.studentId === studentId)
    );
  };

  const getTeamMemberDetails = (team: Team) => {
    return team.members.map((member: any) => {
      const studentDetails = students.find((s: any) => s.id === member.studentId);
      return {
        ...member,
        progress: studentDetails?.progress || 0,
        tasksCompleted: studentDetails?.tasksCompleted || 0,
        grade: studentDetails?.grade || 'N/A'
      };
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'completed': return '#3b82f6';
      case 'disbanded': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'leader' ? '👑' : '👤';
  };

  if (viewMode === 'student' && studentId) {
    const studentTeam = getStudentTeam();
    
    if (!studentTeam) {
      return (
        <div className="team-management">
          <div className="no-team-card">
            <div className="no-team-icon">👥</div>
            <h3>Chưa được phân team</h3>
            <p>Bạn sẽ được phân vào team sau khi hoàn thành đăng ký khóa học.</p>
            <div className="team-benefits">
              <h4>Lợi ích khi tham gia team:</h4>
              <ul>
                <li>Có mentor và leader hướng dẫn</li>
                <li>Làm việc nhóm với các dự án thực tế</li>
                <li>Học hỏi và chia sẻ kinh nghiệm</li>
                <li>Đánh giá lẫn nhau để cải thiện kỹ năng</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    const memberDetails = getTeamMemberDetails(studentTeam);
    const currentMember = memberDetails.find((m: any) => m.studentId === studentId);

    return (
      <div className="team-management">
        <div className="team-header">
          <div className="team-info">
            <h2>{studentTeam.name}</h2>
            <div className="team-meta">
              <span className="course-name">{studentTeam.courseName}</span>
              <span 
                className="team-status"
                style={{ backgroundColor: getStatusColor(studentTeam.status) }}
              >
                {studentTeam.status === 'active' ? 'Đang hoạt động' : 
                 studentTeam.status === 'completed' ? 'Đã hoàn thành' : 'Đã giải tán'}
              </span>
            </div>
          </div>
          <div className="team-role">
            <span className="role-badge">
              {getRoleIcon(currentMember?.role || 'member')} 
              {currentMember?.role === 'leader' ? 'Team Leader' : 'Thành viên'}
            </span>
          </div>
        </div>

        <div className="team-content">
          <div className="mentor-info">
            <h3>Mentor hướng dẫn</h3>
            <div className="mentor-card">
              <div className="mentor-avatar">👨‍🏫</div>
              <div className="mentor-details">
                <h4>{studentTeam.mentorName}</h4>
                <p>Giảng viên hướng dẫn</p>
              </div>
            </div>
          </div>

          <div className="team-members">
            <h3>Thành viên team ({memberDetails.length})</h3>
            <div className="members-grid">
              {memberDetails.map((member: any) => (
                  <div key={member.id} className="member-card">
                  <div className="member-header">
                    <img 
                      src={member.avatar || '/default-avatar.png'} 
                      alt={member.fullName}
                      className="member-avatar"
                    />
                    <div className="member-info">
                      <h4>{member.fullName}</h4>
                      <span className="member-role">
                        {getRoleIcon(member.role)} {member.role === 'leader' ? 'Leader' : 'Member'}
                      </span>
                    </div>
                  </div>
                  <div className="member-stats">
                    <div className="stat">
                      <span className="stat-label">Tiến độ:</span>
                      <span className="stat-value">{member.progress}%</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Tasks:</span>
                      <span className="stat-value">{member.tasksCompleted}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Điểm:</span>
                      <span className="stat-value grade-{member.grade.toLowerCase()}">{member.grade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="team-activities">
            <h3>Hoạt động gần đây</h3>
            <div className="activities-list">
              <div className="activity-item">
                <div className="activity-icon">📝</div>
                <div className="activity-content">
                  <p><strong>{studentTeam.leaderName}</strong> đã tạo task mới</p>
                  <span className="activity-time">2 giờ trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">✅</div>
                <div className="activity-content">
                  <p>Team đã hoàn thành milestone 1</p>
                  <span className="activity-time">1 ngày trước</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon">💬</div>
                <div className="activity-content">
                  <p><strong>{studentTeam.mentorName}</strong> đã đưa ra feedback</p>
                  <span className="activity-time">3 ngày trước</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Admin view - show all teams
  return (
    <div className="team-management admin-view">
      <div className="teams-header">
        <h2>Quản lý Teams</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          Tạo Team Mới
        </button>
      </div>

      <div className="teams-grid">
        {teams.map(team => {
          const memberDetails = getTeamMemberDetails(team);
          return (
            <div key={team.id} className="team-card" onClick={() => setSelectedTeam(team)}>
              <div className="team-card-header">
                <h3>{team.name}</h3>
                <span 
                  className="team-status"
                  style={{ backgroundColor: getStatusColor(team.status) }}
                >
                  {team.status === 'active' ? 'Hoạt động' : 
                   team.status === 'completed' ? 'Hoàn thành' : 'Giải tán'}
                </span>
              </div>
              <div className="team-card-content">
                <p className="course-name">{team.courseName}</p>
                <div className="team-stats">
                  <div className="stat">
                    <span className="stat-label">Thành viên:</span>
                    <span className="stat-value">{team.members.length}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Leader:</span>
                    <span className="stat-value">{team.leaderName}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Mentor:</span>
                    <span className="stat-value">{team.mentorName}</span>
                  </div>
                </div>
                <div className="team-progress">
                  <span className="progress-label">Tiến độ trung bình:</span>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ 
                        width: `${memberDetails.reduce((sum: number, m: any) => sum + m.progress, 0) / memberDetails.length}%` 
                      }}
                    ></div>
                  </div>
                  <span className="progress-value">
                    {Math.round(memberDetails.reduce((sum: number, m: any) => sum + m.progress, 0) / memberDetails.length)}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedTeam && (
        <div className="team-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTeam.name}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTeam(null)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="team-detail-info">
                <p><strong>Khóa học:</strong> {selectedTeam.courseName}</p>
                <p><strong>Mentor:</strong> {selectedTeam.mentorName}</p>
                <p><strong>Ngày tạo:</strong> {new Date(selectedTeam.createdAt).toLocaleDateString('vi-VN')}</p>
              </div>
              <div className="team-members-detail">
                <h4>Thành viên ({selectedTeam.members.length})</h4>
                {getTeamMemberDetails(selectedTeam).map((member: any) => (
                  <div key={member.id} className="member-detail-card">
                    <img 
                      src={member.avatar || '/default-avatar.png'} 
                      alt={member.fullName}
                      className="member-avatar"
                    />
                    <div className="member-detail-info">
                      <h5>{member.fullName}</h5>
                      <p>{member.email}</p>
                      <span className="member-role">
                        {getRoleIcon(member.role)} {member.role === 'leader' ? 'Team Leader' : 'Thành viên'}
                      </span>
                    </div>
                    <div className="member-detail-stats">
                      <div className="stat">
                        <span>Tiến độ: {member.progress}%</span>
                      </div>
                      <div className="stat">
                        <span>Tasks: {member.tasksCompleted}</span>
                      </div>
                      <div className="stat">
                        <span>Điểm: {member.grade}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="create-team-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo Team Mới</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <form className="create-team-form">
                <div className="form-group">
                  <label>Tên team:</label>
                  <input type="text" placeholder="Nhập tên team" />
                </div>
                <div className="form-group">
                  <label>Khóa học:</label>
                  <select>
                    <option value="">Chọn khóa học</option>
                    <option value="course-001">React.js Fundamentals</option>
                    <option value="course-002">Node.js Backend Development</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Mentor:</label>
                  <select>
                    <option value="">Chọn mentor</option>
                    <option value="instructor-001">Lê Văn Giảng</option>
                    <option value="instructor-002">Phạm Thị Hướng Dẫn</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Team Leader:</label>
                  <select>
                    <option value="">Chọn leader</option>
                    <option value="student-001">Nguyễn Thị Học Viên</option>
                    <option value="student-002">Trần Văn Sinh Viên</option>
                  </select>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Tạo Team
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManagement;