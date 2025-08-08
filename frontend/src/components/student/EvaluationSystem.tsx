import React, { useState, useEffect } from 'react';
import { mockEvaluations, mockExtendedStudents } from '../../data/mockData';
import { type Evaluation, type StudentProfile, type ExtendedStudent } from '../../types/student';
import './EvaluationSystem.css';

interface EvaluationSystemProps {
  currentUser?: any;
  evaluations?: Evaluation[];
  students?: ExtendedStudent[];
  studentId?: string;
  viewMode?: 'student' | 'mentor' | 'leader' | 'admin';
}

const EvaluationSystem: React.FC<EvaluationSystemProps> = ({ 
  currentUser,
  evaluations: propEvaluations,
  students: propStudents,
  studentId, 
  viewMode = 'student' 
}) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [filteredEvaluations, setFilteredEvaluations] = useState<Evaluation[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [newEvaluation, setNewEvaluation] = useState({
    evaluatedStudentId: '',
    evaluatorType: 'student' as const,
    criteria: [
      { id: '1', name: 'Technical Skills', description: 'Programming and technical abilities', score: 0, weight: 20, comments: '' },
      { id: '2', name: 'Soft Skills', description: 'Communication and interpersonal skills', score: 0, weight: 20, comments: '' },
      { id: '3', name: 'Teamwork', description: 'Collaboration and team participation', score: 0, weight: 20, comments: '' },
      { id: '4', name: 'Communication', description: 'Verbal and written communication', score: 0, weight: 20, comments: '' },
      { id: '5', name: 'Problem Solving', description: 'Analytical and problem-solving abilities', score: 0, weight: 20, comments: '' }
    ],
    comments: ''
  });

  useEffect(() => {
    setEvaluations(propEvaluations || mockEvaluations);
  }, [propEvaluations]);

  useEffect(() => {
    let filtered = evaluations;

    // Filter by student role
    if (viewMode === 'student' && studentId) {
      // Show evaluations where student is evaluator or evaluated
      filtered = filtered.filter(evaluation =>
        evaluation.evaluatorId === studentId || evaluation.evaluatedId === studentId
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(evaluation => evaluation.evaluatorType === filterType);
    }

    // Filter by status - Note: Evaluation interface doesn't have status, so we'll skip this filter
    // if (filterStatus !== 'all') {
    //   filtered = filtered.filter(evaluation => evaluation.status === filterStatus);
    // }

    setFilteredEvaluations(filtered);
  }, [evaluations, studentId, viewMode, filterType, filterStatus]);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'student': return 'Đánh giá sinh viên';
      case 'mentor': return 'Đánh giá mentor';
      case 'leader': return 'Đánh giá leader';
      case 'ai_system': return 'Đánh giá AI';
      default: return 'Đánh giá';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'student': return '👥';
      case 'mentor': return '👨‍🏫';
      case 'leader': return '👑';
      case 'ai_system': return '🤖';
      default: return '📝';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Chờ đánh giá';
      case 'completed': return 'Đã hoàn thành';
      case 'reviewed': return 'Đã xem xét';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'completed': return '#10b981';
      case 'reviewed': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getOverallScore = (evaluation: Evaluation) => {
    if (!evaluation.criteria || evaluation.criteria.length === 0) {
      return evaluation.overallScore?.toFixed(1) || '0.0';
    }
    const weightedSum = evaluation.criteria.reduce((sum, criterion) => {
      return sum + (criterion.score * criterion.weight / 100);
    }, 0);
    return weightedSum.toFixed(1);
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  };

  const getStudentName = (studentId: string) => {
    const student = mockExtendedStudents.find(s => s.id === studentId);
    return student ? student.fullName : 'Unknown Student';
  };

  const handleCreateEvaluation = () => {
    const overallScore = newEvaluation.criteria.reduce((sum, criterion) => {
      return sum + (criterion.score * criterion.weight / 100);
    }, 0);

    const evaluation: Evaluation = {
      id: `eval-${Date.now()}`,
      evaluatorId: studentId || 'current-user',
      evaluatorName: 'Current User',
      evaluatorType: newEvaluation.evaluatorType,
      evaluatedId: newEvaluation.evaluatedStudentId,
      evaluatedName: getStudentName(newEvaluation.evaluatedStudentId),
      courseId: 'course-1',
      criteria: newEvaluation.criteria,
      overallScore: overallScore,
      comments: newEvaluation.comments,
      isAnonymous: false,
      createdAt: new Date().toISOString(),
      period: '2024-Q1'
    };

    setEvaluations([...evaluations, evaluation]);
    setNewEvaluation({
      evaluatedStudentId: '',
      evaluatorType: 'student' as const,
      criteria: [
        { id: '1', name: 'Technical Skills', description: 'Programming and technical abilities', score: 0, weight: 20, comments: '' },
        { id: '2', name: 'Soft Skills', description: 'Communication and interpersonal skills', score: 0, weight: 20, comments: '' },
        { id: '3', name: 'Teamwork', description: 'Collaboration and team participation', score: 0, weight: 20, comments: '' },
        { id: '4', name: 'Communication', description: 'Verbal and written communication', score: 0, weight: 20, comments: '' },
        { id: '5', name: 'Problem Solving', description: 'Analytical and problem-solving abilities', score: 0, weight: 20, comments: '' }
      ],
      comments: ''
    });
    setShowCreateModal(false);
  };

  const getEvaluationStats = () => {
    const received = filteredEvaluations.filter(evaluation => evaluation.evaluatedId === studentId);
    const given = filteredEvaluations.filter(evaluation => evaluation.evaluatorId === studentId);
    const pending = []; // Note: Evaluation interface doesn't have status property
    
    const avgScore = received.length > 0 
      ? received.reduce((sum, evaluation) => sum + parseFloat(getOverallScore(evaluation)), 0) / received.length
      : 0;
    
    return {
      received: received.length,
      given: given.length,
      pending: pending.length,
      avgScore: avgScore.toFixed(1)
    };
  };

  const stats = getEvaluationStats();

  const getTeammates = () => {
    // Get teammates from the same team
    const currentStudent = mockExtendedStudents.find(s => s.id === studentId);
    if (!currentStudent) return [];
    
    return mockExtendedStudents.filter(s => 
      s.teamId === currentStudent.teamId && s.id !== studentId
    );
  };

  return (
    <div className="evaluation-system">
      <div className="evaluation-header">
        <div className="evaluation-title">
          <h2>Hệ thống Đánh giá</h2>
          <p>Đánh giá và nhận phản hồi từ đồng nghiệp, mentor và leader</p>
        </div>
        {viewMode === 'student' && (
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            Đánh giá đồng nghiệp
          </button>
        )}
      </div>

      {/* Evaluation Statistics */}
      <div className="evaluation-stats">
        <div className="stat-card">
          <div className="stat-icon received">📨</div>
          <div className="stat-content">
            <h3>{stats.received}</h3>
            <p>Đánh giá nhận được</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon given">📤</div>
          <div className="stat-content">
            <h3>{stats.given}</h3>
            <p>Đánh giá đã cho</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon pending">⏳</div>
          <div className="stat-content">
            <h3>{stats.pending}</h3>
            <p>Chờ đánh giá</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon average">⭐</div>
          <div className="stat-content">
            <h3 style={{ color: getScoreColor(parseFloat(stats.avgScore)) }}>
              {stats.avgScore}
            </h3>
            <p>Điểm trung bình</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="evaluation-filters">
        <div className="filter-group">
          <label>Loại đánh giá:</label>
          <select 
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="peer">Đồng nghiệp</option>
            <option value="mentor">Mentor</option>
            <option value="leader">Leader</option>
            <option value="self">Tự đánh giá</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Trạng thái:</label>
          <select 
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="pending">Chờ đánh giá</option>
            <option value="completed">Đã hoàn thành</option>
            <option value="reviewed">Đã xem xét</option>
          </select>
        </div>
      </div>

      {/* Evaluation List */}
      <div className="evaluation-list">
        {filteredEvaluations.length === 0 ? (
          <div className="no-evaluations">
            <div className="no-evaluations-icon">📊</div>
            <h3>Chưa có đánh giá nào</h3>
            <p>Các đánh giá sẽ được hiển thị ở đây</p>
          </div>
        ) : (
          <div className="evaluations-grid">
            {filteredEvaluations.map(evaluation => {
              const isReceived = evaluation.evaluatedId === studentId;
              const overallScore = parseFloat(getOverallScore(evaluation));
              
              return (
                <div 
                  key={evaluation.id} 
                  className={`evaluation-card ${isReceived ? 'received' : 'given'}`}
                  onClick={() => {
                    setSelectedEvaluation(evaluation);
                    setShowDetailModal(true);
                  }}
                >
                  <div className="evaluation-card-header">
                    <div className="evaluation-type">
                      <span className="type-icon">{getTypeIcon(evaluation.evaluatorType)}</span>
                      <span className="type-label">{getTypeLabel(evaluation.evaluatorType)}</span>
                    </div>
                    <div className="evaluation-direction">
                      <span className={`direction-badge ${isReceived ? 'received' : 'given'}`}>
                        {isReceived ? 'Nhận được' : 'Đã cho'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="evaluation-card-content">
                    <div className="evaluation-participants">
                      <div className="participant">
                        <span className="participant-label">
                          {isReceived ? 'Từ:' : 'Cho:'}
                        </span>
                        <span className="participant-name">
                          {isReceived ? evaluation.evaluatorName : evaluation.evaluatedName}
                        </span>
                      </div>
                    </div>
                    
                    <div className="evaluation-score">
                      <div className="overall-score">
                        <span className="score-label">Điểm tổng:</span>
                        <span 
                          className="score-value"
                          style={{ color: getScoreColor(overallScore) }}
                        >
                          {overallScore}/10
                        </span>
                      </div>
                      
                      <div className="score-breakdown">
                        {evaluation.criteria?.slice(0, 3).map((criterion: any) => (
                          <div key={criterion.id} className="score-item">
                            <span>{criterion.name}:</span>
                            <span>{criterion.score}/10</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="evaluation-meta">
                      <div className="evaluation-date">
                        <span className="meta-label">Ngày đánh giá:</span>
                        <span className="meta-value">
                          {new Date(evaluation.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      
                      <div className="evaluation-status">
                        <span
                          className="status-badge"
                          style={{ backgroundColor: '#10b981' }}
                        >
                          Completed
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Evaluation Modal */}
      {showCreateModal && (
        <div className="create-evaluation-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Đánh giá đồng nghiệp</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <form className="create-evaluation-form">
                <div className="form-group">
                  <label>Chọn đồng nghiệp để đánh giá:</label>
                  <select 
                    value={newEvaluation.evaluatedStudentId}
                    onChange={(e) => setNewEvaluation({
                      ...newEvaluation,
                      evaluatedStudentId: e.target.value
                    })}
                  >
                    <option value="">-- Chọn đồng nghiệp --</option>
                    {getTeammates().map(teammate => (
                      <option key={teammate.id} value={teammate.id}>
                        {teammate.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="evaluation-criteria">
                  <h4>Tiêu chí đánh giá (1-10 điểm):</h4>
                  
                  <div className="criteria-grid">
                    {newEvaluation.criteria.map((criterion: any, index: number) => (
                      <div key={criterion.id} className="criteria-item">
                        <label>{criterion.name}:</label>
                        <div className="score-input">
                          <input 
                            type="range" 
                            min="1" 
                            max="10" 
                            value={criterion.score}
                            onChange={(e) => {
                              const updatedCriteria = [...newEvaluation.criteria];
                              updatedCriteria[index] = {
                                ...criterion,
                                score: parseInt(e.target.value)
                              };
                              setNewEvaluation({
                                ...newEvaluation,
                                criteria: updatedCriteria
                              });
                            }}
                          />
                          <span className="score-display">{criterion.score}/10</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Nhận xét chi tiết:</label>
                  <textarea
                    value={newEvaluation.comments}
                    onChange={(e) => setNewEvaluation({
                      ...newEvaluation,
                      comments: e.target.value
                    })}
                    placeholder="Chia sẻ nhận xét chi tiết về đồng nghiệp..."
                    rows={4}
                  />
                </div>
                
                <div className="overall-preview">
                  <div className="preview-score">
                    <span>Điểm tổng:</span>
                    <span className="preview-value">
                      {newEvaluation.criteria.reduce((sum: number, criterion: any) => {
                        return sum + (criterion.score * criterion.weight / 100);
                      }, 0).toFixed(1)}/10
                    </span>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    type="button" 
                    className="btn-primary"
                    onClick={handleCreateEvaluation}
                    disabled={!newEvaluation.evaluatedStudentId}
                  >
                    Gửi đánh giá
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Evaluation Detail Modal */}
      {showDetailModal && selectedEvaluation && (
        <div className="evaluation-detail-modal">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Chi tiết đánh giá</h3>
              <button 
                className="close-btn"
                onClick={() => setShowDetailModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="evaluation-detail">
                <div className="detail-header">
                  <div className="detail-type">
                    <span className="type-icon">{getTypeIcon(selectedEvaluation.evaluatorType)}</span>
                        <span className="type-label">{getTypeLabel(selectedEvaluation.evaluatorType)}</span>
                  </div>
                  <div className="detail-date">
                    {new Date(selectedEvaluation.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>
                
                <div className="detail-participants">
                  <div className="participant-info">
                    <div className="participant-item">
                      <span className="participant-label">Người đánh giá:</span>
                      <span className="participant-name">{selectedEvaluation.evaluatorName}</span>
                    </div>
                    <div className="participant-item">
                      <span className="participant-label">Được đánh giá:</span>
                      <span className="participant-name">{selectedEvaluation.evaluatedName}</span>
                    </div>
                  </div>
                </div>
                
                <div className="detail-scores">
                  <h4>Điểm số chi tiết:</h4>
                  <div className="scores-grid">
                    {selectedEvaluation.criteria?.map((criterion: any) => (
                      <div key={criterion.id} className="score-detail-item">
                        <span className="score-label">{criterion.name}:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill"
                            style={{ 
                              width: `${(criterion.score / 10) * 100}%`,
                              backgroundColor: getScoreColor(criterion.score)
                            }}
                          ></div>
                          <span className="score-text">{criterion.score}/10</span>
                        </div>
                      </div>
                    )) || (
                      <div className="score-detail-item">
                        <span className="score-label">Overall Score:</span>
                        <div className="score-bar">
                          <div 
                            className="score-fill"
                            style={{ 
                              width: `${(selectedEvaluation.overallScore / 10) * 100}%`,
                              backgroundColor: getScoreColor(selectedEvaluation.overallScore)
                            }}
                          ></div>
                          <span className="score-text">{selectedEvaluation.overallScore}/10</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="overall-score-detail">
                    <span className="overall-label">Điểm tổng:</span>
                    <span 
                      className="overall-value"
                      style={{ color: getScoreColor(parseFloat(getOverallScore(selectedEvaluation))) }}
                    >
                      {getOverallScore(selectedEvaluation)}/10
                    </span>
                  </div>
                </div>
                
                {selectedEvaluation.comments && (
                  <div className="detail-comments">
                    <h4>Nhận xét:</h4>
                    <div className="comments-content">
                      {selectedEvaluation.comments}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationSystem;