import React, { useState, useEffect } from 'react';
import { mockExtendedStudents, mockTasks, mockEvaluations } from '../../data/mockData';
import { type ExtendedStudent, type Task, type Evaluation } from '../../types/student';
import './LearningPathManagement.css';

interface LearningPathManagementProps {
  currentUser?: any;
  students?: ExtendedStudent[];
  tasks?: Task[];
  evaluations?: Evaluation[];
}

interface LearningPath {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  currentPhase: string;
  phases: LearningPhase[];
  overallProgress: number;
  estimatedCompletion: string;
  lastUpdated: string;
}

interface LearningPhase {
  id: string;
  name: string;
  description: string;
  order: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  startDate?: string;
  endDate?: string;
  estimatedDuration: number; // in days
  prerequisites: string[];
  tasks: string[]; // task IDs
  skills: string[];
  resources: LearningResource[];
}

interface LearningResource {
  id: string;
  type: 'video' | 'document' | 'exercise' | 'project' | 'quiz';
  title: string;
  url?: string;
  duration?: number; // in minutes
  completed: boolean;
}

interface StudentInteraction {
  studentId: string;
  date: string;
  type: 'login' | 'task_submission' | 'forum_post' | 'video_watch' | 'quiz_attempt' | 'project_commit';
  details: string;
  duration?: number; // in minutes
}

const LearningPathManagement: React.FC<LearningPathManagementProps> = ({
  currentUser,
  students = mockExtendedStudents,
  tasks = mockTasks,
  evaluations = mockEvaluations
}) => {
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [interactions, setInteractions] = useState<StudentInteraction[]>([]);
  const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
  const [showPathModal, setShowPathModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'progress' | 'name' | 'phase'>('progress');
  
  // New task form
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    type: 'individual' as Task['type'],
    priority: 'medium' as Task['priority'],
    dueDate: '',
    estimatedHours: 1,
    phaseId: '',
    skills: [] as string[],
    resources: [] as LearningResource[]
  });

  useEffect(() => {
    generateLearningPaths();
    generateInteractions();
  }, [students, tasks]);

  const generateLearningPaths = () => {
    const paths: LearningPath[] = students.map(student => {
      const studentTasks = tasks.filter(t => t.assignedTo.includes(student.id));
      
      // Define learning phases based on course
      const phases: LearningPhase[] = [
        {
          id: 'foundation',
          name: 'Kiến thức nền tảng',
          description: 'Học các kiến thức cơ bản và nguyên lý',
          order: 1,
          status: 'completed',
          progress: 100,
          startDate: student.enrollmentDate,
          estimatedDuration: 30,
          prerequisites: [],
          tasks: studentTasks.filter(t => t.type === 'individual').map(t => t.id),
          skills: ['Lý thuyết cơ bản', 'Tư duy logic'],
          resources: [
            { id: '1', type: 'video', title: 'Video bài giảng', completed: true },
            { id: '2', type: 'document', title: 'Tài liệu học tập', completed: true }
          ]
        },
        {
          id: 'practice',
          name: 'Thực hành',
          description: 'Áp dụng kiến thức vào bài tập thực tế',
          order: 2,
          status: student.progress > 30 ? 'in_progress' : 'not_started',
          progress: Math.max(0, Math.min(100, (student.progress - 30) * 2)),
          estimatedDuration: 45,
          prerequisites: ['foundation'],
          tasks: studentTasks.filter(t => t.type === 'team').map(t => t.id),
          skills: ['Thực hành', 'Giải quyết vấn đề'],
          resources: [
            { id: '3', type: 'exercise', title: 'Bài tập thực hành', completed: student.progress > 40 },
            { id: '4', type: 'project', title: 'Dự án nhỏ', completed: student.progress > 60 }
          ]
        },
        {
          id: 'project',
          name: 'Dự án thực tế',
          description: 'Thực hiện dự án hoàn chỉnh',
          order: 3,
          status: student.progress > 70 ? 'in_progress' : 'not_started',
          progress: Math.max(0, Math.min(100, (student.progress - 70) * 3.33)),
          estimatedDuration: 60,
          prerequisites: ['practice'],
          tasks: studentTasks.filter(t => t.type === 'project').map(t => t.id),
          skills: ['Quản lý dự án', 'Làm việc nhóm', 'Presentation'],
          resources: [
            { id: '5', type: 'project', title: 'Dự án capstone', completed: student.progress > 90 }
          ]
        }
      ];
      
      const currentPhase = phases.find(p => p.status === 'in_progress')?.name || 
                          phases.filter(p => p.status === 'completed').pop()?.name || 
                          phases[0].name;
      
      return {
        id: `path-${student.id}`,
        studentId: student.id,
        studentName: student.fullName,
        course: student.course,
        currentPhase,
        phases,
        overallProgress: student.progress,
        estimatedCompletion: calculateEstimatedCompletion(phases, student.progress),
        lastUpdated: new Date().toISOString()
      };
    });
    
    setLearningPaths(paths);
  };
  
  const calculateEstimatedCompletion = (phases: LearningPhase[], currentProgress: number): string => {
    const totalDuration = phases.reduce((sum, phase) => sum + phase.estimatedDuration, 0);
    const remainingDuration = totalDuration * (100 - currentProgress) / 100;
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + remainingDuration);
    return estimatedDate.toISOString().split('T')[0];
  };
  
  const generateInteractions = () => {
    const interactions: StudentInteraction[] = [];
    
    students.forEach(student => {
      // Generate random interactions for the last 30 days
      for (let i = 0; i < 30; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        
        // Random number of interactions per day (0-5)
        const dailyInteractions = Math.floor(Math.random() * 6);
        
        for (let j = 0; j < dailyInteractions; j++) {
          const types: StudentInteraction['type'][] = ['login', 'task_submission', 'forum_post', 'video_watch', 'quiz_attempt', 'project_commit'];
          const type = types[Math.floor(Math.random() * types.length)];
          
          interactions.push({
            studentId: student.id,
            date: date.toISOString(),
            type,
            details: getInteractionDetails(type),
            duration: type === 'video_watch' ? Math.floor(Math.random() * 60) + 10 : undefined
          });
        }
      }
    });
    
    setInteractions(interactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };
  
  const getInteractionDetails = (type: StudentInteraction['type']): string => {
    switch (type) {
      case 'login': return 'Đăng nhập hệ thống';
      case 'task_submission': return 'Nộp bài tập';
      case 'forum_post': return 'Đăng bài trên diễn đàn';
      case 'video_watch': return 'Xem video bài giảng';
      case 'quiz_attempt': return 'Làm bài kiểm tra';
      case 'project_commit': return 'Commit code dự án';
      default: return 'Hoạt động khác';
    }
  };
  
  const getInteractionIcon = (type: StudentInteraction['type']): string => {
    switch (type) {
      case 'login': return '🔐';
      case 'task_submission': return '📝';
      case 'forum_post': return '💬';
      case 'video_watch': return '📹';
      case 'quiz_attempt': return '❓';
      case 'project_commit': return '💻';
      default: return '📋';
    }
  };
  
  const getPhaseStatusColor = (status: LearningPhase['status']): string => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'in_progress': return '#3b82f6';
      case 'blocked': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getPhaseStatusLabel = (status: LearningPhase['status']): string => {
    switch (status) {
      case 'completed': return 'Hoàn thành';
      case 'in_progress': return 'Đang thực hiện';
      case 'blocked': return 'Bị chặn';
      case 'not_started': return 'Chưa bắt đầu';
      default: return status;
    }
  };
  
  const handleAssignTask = () => {
    if (!selectedStudent || !newTask.title || !newTask.description) return;
    
    // In a real app, this would create a new task
    alert(`Đã giao bài tập "${newTask.title}" cho học viên!`);
    setShowAssignTaskModal(false);
    setNewTask({
      title: '',
      description: '',
      type: 'individual',
      priority: 'medium',
      dueDate: '',
      estimatedHours: 1,
      phaseId: '',
      skills: [],
      resources: []
    });
  };
  
  const getStudentInteractionLevel = (studentId: string): { level: string; color: string; count: number } => {
    const studentInteractions = interactions.filter(i => i.studentId === studentId);
    const last7Days = studentInteractions.filter(i => {
      const interactionDate = new Date(i.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return interactionDate >= weekAgo;
    });
    
    const count = last7Days.length;
    
    if (count >= 20) return { level: 'Rất tích cực', color: '#10b981', count };
    if (count >= 10) return { level: 'Tích cực', color: '#3b82f6', count };
    if (count >= 5) return { level: 'Trung bình', color: '#f59e0b', count };
    return { level: 'Ít tương tác', color: '#ef4444', count };
  };
  
  const filteredPaths = learningPaths.filter(path => {
    if (filterStatus === 'all') return true;
    if (filterStatus === 'on_track') return path.overallProgress >= 70;
    if (filterStatus === 'behind') return path.overallProgress < 50;
    if (filterStatus === 'at_risk') return path.overallProgress < 30;
    return true;
  });
  
  const sortedPaths = [...filteredPaths].sort((a, b) => {
    switch (sortBy) {
      case 'progress': return b.overallProgress - a.overallProgress;
      case 'name': return a.studentName.localeCompare(b.studentName);
      case 'phase': return a.currentPhase.localeCompare(b.currentPhase);
      default: return 0;
    }
  });

  return (
    <div className="learning-path-management">
      {/* Header */}
      <div className="path-header">
        <div className="header-content">
          <h2>🛤️ Quản lý lộ trình học tập</h2>
          <p>Theo dõi tiến độ và giao bài tập cho học viên</p>
        </div>
        <div className="header-actions">
          <button 
            className="assign-task-btn"
            onClick={() => setShowAssignTaskModal(true)}
          >
            ➕ Giao bài tập
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="path-filters">
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">Tất cả</option>
            <option value="on_track">Đúng tiến độ</option>
            <option value="behind">Chậm tiến độ</option>
            <option value="at_risk">Nguy cơ cao</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sắp xếp:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
            <option value="progress">Tiến độ</option>
            <option value="name">Tên học viên</option>
            <option value="phase">Giai đoạn</option>
          </select>
        </div>
      </div>

      {/* Learning Paths Grid */}
      <div className="paths-grid">
        {sortedPaths.map(path => {
          const interaction = getStudentInteractionLevel(path.studentId);
          
          return (
            <div key={path.id} className="path-card">
              <div className="path-header-card">
                <div className="student-info">
                  <div className="student-avatar">
                    {path.studentName.charAt(0)}
                  </div>
                  <div className="student-details">
                    <h3>{path.studentName}</h3>
                    <p>{path.course}</p>
                  </div>
                </div>
                <div className="path-actions">
                  <button 
                    className="view-btn"
                    onClick={() => {
                      setSelectedPath(path);
                      setShowPathModal(true);
                    }}
                  >
                    👁️ Xem
                  </button>
                  <button 
                    className="assign-btn"
                    onClick={() => {
                      setSelectedStudent(path.studentId);
                      setShowAssignTaskModal(true);
                    }}
                  >
                    📝 Giao bài
                  </button>
                </div>
              </div>
              
              <div className="path-progress">
                <div className="progress-header">
                  <span>Tiến độ tổng thể</span>
                  <span className="progress-percent">{path.overallProgress}%</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${path.overallProgress}%`,
                      backgroundColor: path.overallProgress >= 70 ? '#10b981' : 
                                     path.overallProgress >= 50 ? '#f59e0b' : '#ef4444'
                    }}
                  ></div>
                </div>
              </div>
              
              <div className="current-phase">
                <div className="phase-info">
                  <span className="phase-label">Giai đoạn hiện tại:</span>
                  <span className="phase-name">{path.currentPhase}</span>
                </div>
                <div className="estimated-completion">
                  <span>📅 Dự kiến hoàn thành: {new Date(path.estimatedCompletion).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
              
              <div className="interaction-level">
                <div className="interaction-info">
                  <span 
                    className="interaction-badge"
                    style={{ backgroundColor: interaction.color }}
                  >
                    {interaction.level}
                  </span>
                  <span className="interaction-count">
                    {interaction.count} hoạt động (7 ngày qua)
                  </span>
                </div>
              </div>
              
              <div className="phases-preview">
                {path.phases.map(phase => (
                  <div key={phase.id} className="phase-item">
                    <div 
                      className="phase-status"
                      style={{ backgroundColor: getPhaseStatusColor(phase.status) }}
                    ></div>
                    <span className="phase-name-small">{phase.name}</span>
                    <span className="phase-progress">{phase.progress}%</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Task Modal */}
      {showAssignTaskModal && (
        <div className="modal-overlay">
          <div className="assign-task-modal">
            <div className="modal-header">
              <h3>📝 Giao bài tập mới</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAssignTaskModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Học viên:</label>
                <select 
                  value={selectedStudent} 
                  onChange={(e) => setSelectedStudent(e.target.value)}
                >
                  <option value="">Chọn học viên</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.fullName} - {student.course}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Loại bài tập:</label>
                  <select 
                    value={newTask.type} 
                    onChange={(e) => setNewTask({...newTask, type: e.target.value as any})}
                  >
                    <option value="individual">Cá nhân</option>
                    <option value="team">Nhóm</option>
                    <option value="project">Dự án</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Độ ưu tiên:</label>
                  <select 
                    value={newTask.priority} 
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value as any})}
                  >
                    <option value="low">Thấp</option>
                    <option value="medium">Trung bình</option>
                    <option value="high">Cao</option>
                    <option value="urgent">Khẩn cấp</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Hạn nộp:</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Tiêu đề:</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Nhập tiêu đề bài tập..."
                />
              </div>
              
              <div className="form-group">
                <label>Mô tả:</label>
                <textarea
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  placeholder="Nhập mô tả chi tiết bài tập..."
                  rows={4}
                />
              </div>
              
              <div className="form-group">
                <label>Thời gian ước tính (giờ):</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({...newTask, estimatedHours: parseInt(e.target.value)})}
                />
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowAssignTaskModal(false)}
              >
                Hủy
              </button>
              <button 
                className="assign-btn"
                onClick={handleAssignTask}
                disabled={!selectedStudent || !newTask.title || !newTask.description}
              >
                Giao bài tập
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Path Detail Modal */}
      {showPathModal && selectedPath && (
        <div className="modal-overlay">
          <div className="path-detail-modal">
            <div className="modal-header">
              <h3>🛤️ Lộ trình học tập - {selectedPath.studentName}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowPathModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="path-overview">
                <div className="overview-stats">
                  <div className="stat-item">
                    <span className="stat-label">Tiến độ tổng thể:</span>
                    <span className="stat-value">{selectedPath.overallProgress}%</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Giai đoạn hiện tại:</span>
                    <span className="stat-value">{selectedPath.currentPhase}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-label">Dự kiến hoàn thành:</span>
                    <span className="stat-value">{new Date(selectedPath.estimatedCompletion).toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>
              </div>
              
              <div className="phases-detail">
                <h4>Chi tiết các giai đoạn</h4>
                {selectedPath.phases.map(phase => (
                  <div key={phase.id} className="phase-detail-card">
                    <div className="phase-header">
                      <div className="phase-info">
                        <h5>{phase.name}</h5>
                        <p>{phase.description}</p>
                      </div>
                      <div className="phase-status-info">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getPhaseStatusColor(phase.status) }}
                        >
                          {getPhaseStatusLabel(phase.status)}
                        </span>
                        <span className="progress-text">{phase.progress}%</span>
                      </div>
                    </div>
                    
                    <div className="phase-progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ 
                          width: `${phase.progress}%`,
                          backgroundColor: getPhaseStatusColor(phase.status)
                        }}
                      ></div>
                    </div>
                    
                    <div className="phase-details">
                      <div className="detail-section">
                        <h6>Kỹ năng:</h6>
                        <div className="skills-list">
                          {phase.skills.map((skill, index) => (
                            <span key={index} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="detail-section">
                        <h6>Tài nguyên học tập:</h6>
                        <div className="resources-list">
                          {phase.resources.map(resource => (
                            <div key={resource.id} className="resource-item">
                              <span className={`resource-status ${resource.completed ? 'completed' : 'pending'}`}>
                                {resource.completed ? '✅' : '⏳'}
                              </span>
                              <span className="resource-title">{resource.title}</span>
                              <span className="resource-type">{resource.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="recent-interactions">
                <h4>Hoạt động gần đây</h4>
                <div className="interactions-list">
                  {interactions
                    .filter(i => i.studentId === selectedPath.studentId)
                    .slice(0, 10)
                    .map((interaction, index) => (
                      <div key={index} className="interaction-item">
                        <span className="interaction-icon">
                          {getInteractionIcon(interaction.type)}
                        </span>
                        <div className="interaction-content">
                          <span className="interaction-details">{interaction.details}</span>
                          <span className="interaction-date">
                            {new Date(interaction.date).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        {interaction.duration && (
                          <span className="interaction-duration">
                            {interaction.duration} phút
                          </span>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="close-btn"
                onClick={() => setShowPathModal(false)}
              >
                Đóng
              </button>
              <button 
                className="assign-btn"
                onClick={() => {
                  setSelectedStudent(selectedPath.studentId);
                  setShowPathModal(false);
                  setShowAssignTaskModal(true);
                }}
              >
                📝 Giao bài tập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathManagement;