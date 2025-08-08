import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { mockStudents, type Student, User, mockTeams, mockTasks, mockEvaluations, mockStudentProfiles, mockExtendedStudents, mockEnterpriseInterests } from '../data/mockData';
import TeamManagement from '../components/student/TeamManagement';
import TaskManagement from '../components/student/TaskManagement';
import EvaluationSystem from '../components/student/EvaluationSystem';
import StudentProfile from '../components/student/StudentProfile';
import CorporateConnection from '../components/student/CorporateConnection';
import AIStudentRanking from '../components/student/AIStudentRanking';
import StudentWarningSystem from '../components/student/StudentWarningSystem';
import LearningPathManagement from '../components/student/LearningPathManagement';
import './StudentsPage.css';

interface StudentsPageProps {
  currentUser: User | any;
}

const StudentsPage: React.FC<StudentsPageProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'teams' | 'tasks' | 'evaluations' | 'profiles' | 'corporate' | 'ai_ranking' | 'warnings' | 'learning_path'>('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [courseFilter, setCourseFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Load mock data
  useEffect(() => {
    setStudents(mockStudents);
    setFilteredStudents(mockStudents);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = students.filter(student => {
      const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.course.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
      const matchesCourse = courseFilter === 'all' || student.course === courseFilter;
      
      return matchesSearch && matchesStatus && matchesCourse;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'name':
          aValue = a.fullName;
          bValue = b.fullName;
          break;
        case 'progress':
          aValue = a.progress;
          bValue = b.progress;
          break;
        case 'enrollmentDate':
          aValue = new Date(a.enrollmentDate);
          bValue = new Date(b.enrollmentDate);
          break;
        case 'lastActivity':
          aValue = new Date(a.lastActivity);
          bValue = new Date(b.lastActivity);
          break;
        default:
          aValue = a.fullName;
          bValue = b.fullName;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStudents(filtered);
    setCurrentPage(1);
  }, [students, searchTerm, statusFilter, courseFilter, sortBy, sortOrder]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#f59e0b';
      case 'graduated': return '#3b82f6';
      case 'suspended': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'Đang học';
      case 'inactive': return 'Tạm nghỉ';
      case 'graduated': return 'Đã tốt nghiệp';
      case 'suspended': return 'Bị đình chỉ';
      default: return status;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return '#10b981';
      case 'B': return '#3b82f6';
      case 'C': return '#f59e0b';
      case 'D': return '#f97316';
      case 'F': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : Array.from([...prev, studentId])
    );
  };

  const handleSelectAll = () => {
    const currentPageStudents = getCurrentPageStudents();
    const allSelected = currentPageStudents.every(student => selectedStudents.includes(student.id));
    
    if (allSelected) {
      setSelectedStudents(prev => prev.filter(id => !currentPageStudents.find(s => s.id === id)));
    } else {
      setSelectedStudents(prev => Array.from(new Set([...prev, ...currentPageStudents.map(s => s.id)])));
    }
  };

  const getCurrentPageStudents = () => {
    const indexOfLastStudent = currentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    return filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);
  };

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const currentPageStudents = getCurrentPageStudents();

  const uniqueCourses = Array.from(new Set(students.map(s => s.course)));

  const isStudent = currentUser.role === 'student';
  const isInstructor = currentUser.role === 'instructor';
  const isAdmin = currentUser.role === 'admin';
  const isEnterprise = currentUser.role === 'enterprise';

  return (
    <Layout>
      <div className="students-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>{isStudent ? 'Hành trình học tập' : 'Quản lý học viên'}</h1>
              <p>{isStudent ? 'Theo dõi tiến độ và phát triển kỹ năng của bạn' : 'Theo dõi và quản lý thông tin học viên'}</p>
            </div>
            <div className="header-actions">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(true)}
              >
                <span>📤</span>
                Xuất Excel
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <span>➕</span>
                Thêm học viên
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="student-tabs">
          {(isAdmin || isInstructor) && (
            <button 
              className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              📊 Tổng quan
            </button>
          )}
          <button 
            className={`tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            👥 Nhóm học tập
          </button>
          <button 
            className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
            onClick={() => setActiveTab('tasks')}
          >
            📝 Nhiệm vụ
          </button>
          <button 
            className={`tab-btn ${activeTab === 'evaluations' ? 'active' : ''}`}
            onClick={() => setActiveTab('evaluations')}
          >
            ⭐ Đánh giá
          </button>
          {(isStudent || isAdmin || isInstructor) && (
            <button 
              className={`tab-btn ${activeTab === 'profiles' ? 'active' : ''}`}
              onClick={() => setActiveTab('profiles')}
            >
              👤 Hồ sơ
            </button>
          )}
          <button 
            className={`tab-btn ${activeTab === 'corporate' ? 'active' : ''}`}
            onClick={() => setActiveTab('corporate')}
          >
            🏢 Kết nối DN
          </button>
          {(isAdmin || isInstructor) && (
            <button 
              className={`tab-btn ${activeTab === 'ai_ranking' ? 'active' : ''}`}
              onClick={() => setActiveTab('ai_ranking')}
            >
              🤖 Phân loại AI
            </button>
          )}
          {(isAdmin || isInstructor) && (
            <button 
              className={`tab-btn ${activeTab === 'warnings' ? 'active' : ''}`}
              onClick={() => setActiveTab('warnings')}
            >
              ⚠️ Cảnh báo
            </button>
          )}
          {(isAdmin || isInstructor) && (
            <button 
              className={`tab-btn ${activeTab === 'learning_path' ? 'active' : ''}`}
              onClick={() => setActiveTab('learning_path')}
            >
              🛤️ Lộ trình học
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (isAdmin || isInstructor) && (
            <div className="overview-content">
              {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{students.length}</h3>
              <p>Tổng học viên</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{students.filter(s => s.status === 'active').length}</h3>
              <p>Đang học</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🎓</div>
            <div className="stat-content">
              <h3>{students.filter(s => s.status === 'completed').length}</h3>
              <p>Đã hoàn thành</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h3>{Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%</h3>
              <p>Tiến độ trung bình</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-filters">
            <div className="search-container">
              <Input
                placeholder="Tìm kiếm học viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="filter-group">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="active">Đang học</option>
                <option value="inactive">Tạm nghỉ</option>
                <option value="graduated">Đã tốt nghiệp</option>
                <option value="suspended">Bị đình chỉ</option>
              </select>
              
              <select 
                value={courseFilter} 
                onChange={(e) => setCourseFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả khóa học</option>
                {uniqueCourses.map(course => (
                  <option key={course} value={course}>{course}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="view-controls">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                📋
              </button>
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
            </div>
            
            <select 
              value={`${sortBy}-${sortOrder}`} 
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="sort-select"
            >
              <option value="name-asc">Tên A-Z</option>
              <option value="name-desc">Tên Z-A</option>
              <option value="progress-desc">Tiến độ cao nhất</option>
              <option value="progress-asc">Tiến độ thấp nhất</option>
              <option value="enrollmentDate-desc">Mới nhất</option>
              <option value="enrollmentDate-asc">Cũ nhất</option>
            </select>
          </div>
        </div>

        {/* Selected Actions */}
        {selectedStudents.length > 0 && (
          <div className="selected-actions">
            <span className="selected-count">
              Đã chọn {selectedStudents.length} học viên
            </span>
            <div className="action-buttons">
              <Button variant="outline" size="small">
                📧 Gửi email
              </Button>
              <Button variant="outline" size="small">
                📊 Xuất báo cáo
              </Button>
              <Button variant="outline" size="small">
                🗑️ Xóa
              </Button>
            </div>
          </div>
        )}

        {/* Students Table/Grid */}
        {viewMode === 'table' ? (
          <div className="students-table-container">
            <table className="students-table">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      checked={currentPageStudents.length > 0 && currentPageStudents.every(s => selectedStudents.includes(s.id))}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th onClick={() => handleSort('name')} className="sortable">
                    Học viên
                    {sortBy === 'name' && <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>Khóa học</th>
                  <th onClick={() => handleSort('progress')} className="sortable">
                    Tiến độ
                    {sortBy === 'progress' && <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>Trạng thái</th>
                  <th>Điểm</th>
                  <th onClick={() => handleSort('lastActivity')} className="sortable">
                    Hoạt động cuối
                    {sortBy === 'lastActivity' && <span className="sort-icon">{sortOrder === 'asc' ? '↑' : '↓'}</span>}
                  </th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {currentPageStudents.map(student => (
                  <tr key={student.id} className={selectedStudents.includes(student.id) ? 'selected' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => handleSelectStudent(student.id)}
                      />
                    </td>
                    <td>
                      <div className="student-info">
                        <div className="student-avatar">
                          {student.avatar ? (
                            <img src={student.avatar} alt={student.fullName} />
                          ) : (
                            <span>{student.fullName.charAt(0)}</span>
                          )}
                        </div>
                        <div className="student-details">
                          <div className="student-name">{student.fullName}</div>
                          <div className="student-email">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="course-badge">{student.course}</span>
                    </td>
                    <td>
                      <div className="progress-container">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${student.progress}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">{student.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(student.status) }}
                      >
                        {getStatusLabel(student.status)}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="grade-badge"
                        style={{ color: getGradeColor(student.grade) }}
                      >
                        {student.grade}
                      </span>
                    </td>
                    <td>
                      <div className="last-activity">
                        {new Date(student.lastActivity).toLocaleDateString('vi-VN')}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" title="Xem chi tiết">
                          👁️
                        </button>
                        <button className="action-btn" title="Chỉnh sửa">
                          ✏️
                        </button>
                        <button className="action-btn" title="Xóa">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="students-grid">
            {currentPageStudents.map(student => (
              <div key={student.id} className="student-card">
                <div className="card-header">
                  <input 
                    type="checkbox" 
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleSelectStudent(student.id)}
                    className="card-checkbox"
                  />
                  <div className="student-avatar">
                    {student.avatar ? (
                      <img src={student.avatar} alt={student.fullName} />
                    ) : (
                      <span>{student.fullName.charAt(0)}</span>
                    )}
                  </div>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(student.status) }}
                  >
                    {getStatusLabel(student.status)}
                  </span>
                </div>
                
                <div className="card-content">
                  <h3 className="student-name">{student.fullName}</h3>
                  <p className="student-email">{student.email}</p>
                  <p className="student-course">{student.course}</p>
                  
                  <div className="progress-section">
                    <div className="progress-header">
                      <span>Tiến độ</span>
                      <span>{student.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${student.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="card-stats">
                    <div className="stat">
                      <span className="stat-label">Điểm:</span>
                      <span 
                        className="stat-value grade"
                        style={{ color: getGradeColor(student.grade) }}
                      >
                        {student.grade}
                      </span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Bài học:</span>
                      <span className="stat-value">{student.completedLessons}/{student.totalLessons}</span>
                    </div>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button className="action-btn" title="Xem chi tiết">
                    👁️
                  </button>
                  <button className="action-btn" title="Chỉnh sửa">
                    ✏️
                  </button>
                  <button className="action-btn" title="Xóa">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              ← Trước
            </button>
            
            <div className="pagination-numbers">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button 
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Sau →
            </button>
          </div>
        )}

              {/* Results Info */}
              <div className="results-info">
                Hiển thị {((currentPage - 1) * studentsPerPage) + 1} - {Math.min(currentPage * studentsPerPage, filteredStudents.length)} 
                trong tổng số {filteredStudents.length} học viên
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <TeamManagement
              currentUser={currentUser}
              teams={mockTeams}
              students={mockExtendedStudents}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskManagement
              currentUser={currentUser}
              tasks={mockTasks}
              students={mockExtendedStudents}
            />
          )}

          {activeTab === 'evaluations' && (
            <EvaluationSystem
              currentUser={currentUser}
              evaluations={mockEvaluations}
              students={mockExtendedStudents}
            />
          )}

          {activeTab === 'profiles' && (
            <div className="profiles-content">
              {isStudent ? (
                <StudentProfile
                  studentId={currentUser.id}
                  viewMode="student"
                  showActions={true}
                />
              ) : (
                <div className="profiles-grid">
                  {mockStudentProfiles.map((profile: any) => {
                    const student = mockExtendedStudents.find((s: any) => s.id === profile.studentId);
                    if (!student) return null;

                    return (
                      <StudentProfile
                        key={profile.studentId}
                        studentId={profile.studentId}
                        viewMode={currentUser.role === 'enterprise' ? 'enterprise' : 'admin'}
                        showActions={currentUser.role === 'enterprise'}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'corporate' && (
            <CorporateConnection
              currentUser={currentUser}
              students={mockExtendedStudents}
              studentProfiles={mockStudentProfiles}
              enterpriseInterests={mockEnterpriseInterests}
            />
          )}

          {activeTab === 'ai_ranking' && (
            <AIStudentRanking
              currentUser={currentUser}
              students={mockExtendedStudents}
              evaluations={mockEvaluations}
              tasks={mockTasks}
            />
          )}

          {activeTab === 'warnings' && (
            <StudentWarningSystem
              currentUser={currentUser}
              students={mockExtendedStudents}
              tasks={mockTasks}
              evaluations={mockEvaluations}
            />
          )}

          {activeTab === 'learning_path' && (
            <LearningPathManagement
              currentUser={currentUser}
              students={mockExtendedStudents}
              tasks={mockTasks}
              evaluations={mockEvaluations}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentsPage;