import React, { useState, useEffect } from 'react';
import { mockTasks, mockExtendedStudents, type User } from '../../data/mockData';
import { enterpriseService, CreateTaskRequest } from '../../api/enterpriseService';
import { type Task, type TaskSubmission, type ExtendedStudent } from '../../types/student';
import './TaskManagement.css';

interface TaskManagementProps {
  currentUser?: User;
  tasks?: Task[];
  students?: ExtendedStudent[];
  studentId?: string;
  viewMode?: 'student' | 'instructor' | 'admin';
}

const TaskManagement: React.FC<TaskManagementProps> = ({ 
  currentUser,
  tasks: propTasks,
  students: propStudents,
  studentId, 
  viewMode = 'student' 
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submissionContent, setSubmissionContent] = useState('');
  const [newTask, setNewTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    dueDate: '',
    type: 'project',
    priority: 'medium',
    assignedStudentIds: [],
  });

  useEffect(() => {
    setTasks(propTasks || mockTasks);
  }, [propTasks]);

  useEffect(() => {
    let filtered = tasks;

    // Filter by student if in student view
    if (viewMode === 'student' && studentId) {
      filtered = filtered.filter(task => 
        task.assignedTo.includes(studentId)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(task => task.type === filterType);
    }

    setFilteredTasks(filtered);
  }, [tasks, studentId, viewMode, filterStatus, filterType]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#3b82f6';
      case 'completed': return '#10b981';
      case 'overdue': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ thực hiện';
      case 'in_progress': return 'Đang thực hiện';
      case 'completed': return 'Đã hoàn thành';
      case 'overdue': return 'Quá hạn';
      default: return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'low': return 'Thấp';
      case 'medium': return 'Trung bình';
      case 'high': return 'Cao';
      default: return priority;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'individual': return '👤';
      case 'team': return '👥';
      case 'project': return '🚀';
      default: return '📝';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'individual': return 'Cá nhân';
      case 'team': return 'Nhóm';
      case 'project': return 'Dự án';
      default: return type;
    }
  };

  const isTaskOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && selectedTask?.status !== 'completed';
  };

  const getStudentSubmission = (task: Task) => {
    if (!studentId || !task.submissions) return null;
    return task.submissions.find((sub: any) => sub.studentId === studentId);
  };

  const handleSubmitTask = () => {
    if (!selectedTask || !studentId) return;
    
    const newSubmission: TaskSubmission = {
      id: `sub-${Date.now()}`,
      taskId: selectedTask.id,
      studentId: studentId,
      studentName: 'Current Student',
      content: submissionContent,
      submittedAt: new Date().toISOString(),
      status: 'submitted'
    };

    // Update task with new submission
    const updatedTasks = tasks.map(task => {
      if (task.id === selectedTask.id) {
        return {
          ...task,
          submissions: [...(task.submissions || []), newSubmission],
          status: 'completed' as const
        };
      }
      return task;
    });

    setTasks(updatedTasks);
    setSubmissionContent('');
    setShowSubmissionModal(false);
    setSelectedTask(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentSelection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedIds = Array.from(e.target.selectedOptions, option => option.value);
    setNewTask(prev => ({ ...prev, assignedStudentIds: selectedIds }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.title || !newTask.description || !newTask.dueDate || newTask.assignedStudentIds.length === 0) {
      alert('Please fill all required fields.');
      return;
    }

    try {
      const createdProject = await enterpriseService.createProject(newTask);
      const newProject = createdProject.data;

      const taskToAdd: Task = {
        id: newProject.id.toString(),
        title: newProject.title,
        description: newProject.description,
        status: 'pending',
        dueDate: newProject.endDate,
        assignedTo: newProject.assignedStudentIds || [],
        type: newTask.type,
        priority: newTask.priority,
        submissions: []
      };

      setTasks(prev => [...prev, taskToAdd]);
      setShowCreateModal(false);
      setNewTask({
        title: '',
        description: '',
        dueDate: '',
        type: 'project',
        priority: 'medium',
        assignedStudentIds: [],
      });
    } catch (error) {
      console.error('Failed to create task', error);
      alert('Failed to create task. Please check the console for details.');
    }
  };

  const getTaskStats = () => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'completed').length;
    const inProgress = filteredTasks.filter(t => t.status === 'in_progress').length;
    const overdue = filteredTasks.filter(t => isTaskOverdue(t.dueDate)).length;
    
    return { total, completed, inProgress, overdue };
  };

  const stats = getTaskStats();

  return (
    <div className="task-management">
      <div className="task-header">
        <div className="task-title">
          <h2>Quản lý Task</h2>
          <p>Theo dõi và hoàn thành các nhiệm vụ được giao</p>
        </div>
        {viewMode !== 'student' && (
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Tạo Task Mới
          </button>
        )}
      </div>

      {/* Task Statistics */}
      <div className="task-stats">
        <div className="stat-card">
          <div className="stat-icon total">📋</div>
          <div className="stat-content">
            <h3>{stats.total}</h3>
            <p>Tổng task</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon completed">✅</div>
          <div className="stat-content">
            <h3>{stats.completed}</h3>
            <p>Đã hoàn thành</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon in-progress">⏳</div>
          <div className="stat-content">
            <h3>{stats.inProgress}</h3>
            <p>Đang thực hiện</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon overdue">⚠️</div>
          <div className="stat-content">
            <h3>{stats.overdue}</h3>
            <p>Quá hạn</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="task-filters">
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ thực hiện</option>
            <option value="in_progress">Đang thực hiện</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="overdue">Quá hạn</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Loại task:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="individual">Cá nhân</option>
            <option value="team">Nhóm</option>
            <option value="project">Dự án</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="no-tasks">
            <div className="no-tasks-icon">📝</div>
            <h3>Chưa có task nào</h3>
            <p>Các task sẽ được hiển thị ở đây khi được giao</p>
          </div>
        ) : (
          <div className="tasks-grid">
            {filteredTasks.map(task => {
              const submission = getStudentSubmission(task);
              const overdue = isTaskOverdue(task.dueDate);
              
              return (
                <div 
                  key={task.id} 
                  className={`task-card ${overdue ? 'overdue' : ''}`}
                  onClick={() => setSelectedTask(task)}
                >
                  <div className="task-card-header">
                    <div className="task-type">
                      <span className="type-icon">{getTypeIcon(task.type)}</span>
                      <span className="type-label">{getTypeLabel(task.type)}</span>
                    </div>
                    <div className="task-priority">
                      <span 
                        className="priority-badge"
                        style={{ backgroundColor: getPriorityColor(task.priority) }}
                      >
                        {getPriorityLabel(task.priority)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="task-card-content">
                    <h3>{task.title}</h3>
                    <p className="task-description">{task.description}</p>
                    
                    <div className="task-meta">
                      <div className="task-due-date">
                        <span className="meta-label">Hạn nộp:</span>
                        <span className={`meta-value ${overdue ? 'overdue' : ''}`}>
                          {new Date(task.dueDate).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="task-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(task.status) }}
                        >
                          {getStatusLabel(task.status)}
                        </span>
                      </div>
                    </div>
                    
                    {submission && (
                      <div className="submission-info">
                        <div className="submission-status">
                          {submission.status === 'graded' ? (
                            <>
                              <span className="grade">Điểm: {submission.grade}/10</span>
                              <span className="feedback">✓ Đã chấm điểm</span>
                            </>
                          ) : (
                            <span className="submitted">✓ Đã nộp bài</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <div className="task-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{selectedTask.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setSelectedTask(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="task-detail-info">
                <div className="task-detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">Loại:</span>
                    <span className="meta-value">
                      {getTypeIcon(selectedTask.type)} {getTypeLabel(selectedTask.type)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Độ ưu tiên:</span>
                    <span 
                      className="priority-badge"
                      style={{ backgroundColor: getPriorityColor(selectedTask.priority) }}
                    >
                      {getPriorityLabel(selectedTask.priority)}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Hạn nộp:</span>
                    <span className={`meta-value ${isTaskOverdue(selectedTask.dueDate) ? 'overdue' : ''}`}>
                      {new Date(selectedTask.dueDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Trạng thái:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(selectedTask.status) }}
                    >
                      {getStatusLabel(selectedTask.status)}
                    </span>
                  </div>
                </div>
                
                <div className="task-description-full">
                  <h4>Mô tả chi tiết:</h4>
                  <p>{selectedTask.description}</p>
                </div>
                
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="task-attachments">
                    <h4>Tài liệu đính kèm:</h4>
                    <div className="attachments-list">
                      {selectedTask.attachments.map((attachment: any) => (
                        <div key={attachment.id} className="attachment-item">
                          <span className="attachment-icon">📎</span>
                          <span className="attachment-name">{attachment.name}</span>
                          <span className="attachment-size">
                            ({Math.round(attachment.size / 1024)} KB)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {viewMode === 'student' && (
                  <div className="task-actions">
                    {getStudentSubmission(selectedTask) ? (
                      <div className="submission-status">
                        <div className="submitted-info">
                          <h4>Bài nộp của bạn:</h4>
                          <p>{getStudentSubmission(selectedTask)?.content}</p>
                          <span className="submitted-time">
                            Nộp lúc: {new Date(getStudentSubmission(selectedTask)!.submittedAt).toLocaleString('vi-VN')}
                          </span>
                          {getStudentSubmission(selectedTask)?.grade && (
                            <div className="grade-info">
                              <span className="grade">Điểm: {getStudentSubmission(selectedTask)?.grade}/10</span>
                              {getStudentSubmission(selectedTask)?.feedback && (
                                <p className="feedback">Nhận xét: {getStudentSubmission(selectedTask)?.feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <button 
                        className="btn-primary submit-btn"
                        onClick={() => setShowSubmissionModal(true)}
                        disabled={selectedTask.status === 'completed'}
                      >
                        Nộp bài
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submission Modal */}
      {showSubmissionModal && (
        <div className="submission-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Nộp bài: {selectedTask?.title}</h3>
              <button 
                className="close-btn"
                onClick={() => setShowSubmissionModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="submission-form">
                <div className="form-group">
                  <label>Nội dung bài làm:</label>
                  <textarea
                    value={submissionContent}
                    onChange={(e) => setSubmissionContent(e.target.value)}
                    placeholder="Mô tả chi tiết về bài làm của bạn..."
                    rows={6}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowSubmissionModal(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleSubmitTask}
                    disabled={!submissionContent.trim()}
                  >
                    Nộp bài
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal (for instructors/admin) */}
      {showCreateModal && (
        <div className="create-task-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Tạo Task Mới</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form className="create-task-form" onSubmit={handleCreateTask}>
                <div className="form-group">
                  <label>Tiêu đề task:</label>
                  <input type="text" name="title" value={newTask.title} onChange={handleInputChange} placeholder="Nhập tiêu đề task" required />
                </div>
                
                <div className="form-group">
                  <label>Mô tả:</label>
                  <textarea name="description" value={newTask.description} onChange={handleInputChange} placeholder="Mô tả chi tiết về task" rows={4} required />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Loại task:</label>
                    <select name="type" value={newTask.type} onChange={handleInputChange}>
                      <option value="individual">Cá nhân</option>
                      <option value="team">Nhóm</option>
                      <option value="project">Dự án</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Độ ưu tiên:</label>
                    <select name="priority" value={newTask.priority} onChange={handleInputChange}>
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Hạn nộp:</label>
                  <input type="date" name="dueDate" value={newTask.dueDate} onChange={handleInputChange} required />
                </div>
                
                <div className="form-group">
                  <label>Giao cho:</label>
                  <select multiple value={newTask.assignedStudentIds} onChange={handleStudentSelection} required>
                    {propStudents?.map(student => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Hủy
                  </button>
                  <button type="submit" className="btn-primary">
                    Tạo Task
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

export default TaskManagement;