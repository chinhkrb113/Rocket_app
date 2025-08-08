import React, { useState, useEffect } from 'react';
import { mockExtendedStudents, mockEvaluations, mockTasks } from '../../data/mockData';
import { type ExtendedStudent, type Evaluation, type Task } from '../../types/student';
import './AIStudentRanking.css';

interface AIStudentRankingProps {
  currentUser?: any;
  students?: ExtendedStudent[];
  evaluations?: Evaluation[];
  tasks?: Task[];
}

interface StudentRanking {
  studentId: string;
  studentName: string;
  overallScore: number;
  interactionLevel: number;
  rank: number;
  category: 'excellent' | 'good' | 'average' | 'needs_improvement' | 'at_risk';
  aiAnalysis: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    riskFactors: string[];
  };
  lastUpdated: string;
}

const AIStudentRanking: React.FC<AIStudentRankingProps> = ({
  currentUser,
  students = mockExtendedStudents,
  evaluations = mockEvaluations,
  tasks = mockTasks
}) => {
  const [rankings, setRankings] = useState<StudentRanking[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'score' | 'interaction'>('rank');
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [selectedStudentForWarning, setSelectedStudentForWarning] = useState<string>('');
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState<'attendance' | 'performance' | 'deadline' | 'behavior'>('performance');

  useEffect(() => {
    analyzeStudents();
  }, [students, evaluations, tasks]);

  const analyzeStudents = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    const analyzed = students.map((student, index) => {
      const studentEvaluations = evaluations.filter(e => e.evaluatedId === student.id);
      const studentTasks = tasks.filter(t => t.assignedTo.includes(student.id));
      
      // Calculate overall score from evaluations
      const avgEvaluationScore = studentEvaluations.length > 0
        ? studentEvaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / studentEvaluations.length
        : 0;
      
      // Calculate task completion rate
      const completedTasks = studentTasks.filter(t => t.status === 'completed').length;
      const taskCompletionRate = studentTasks.length > 0 ? (completedTasks / studentTasks.length) * 100 : 0;
      
      // Calculate interaction level (based on task submissions, evaluations received)
      const interactionLevel = Math.min(100, 
        (studentEvaluations.length * 10) + 
        (completedTasks * 5) + 
        (student.progress || 0)
      );
      
      // Calculate overall score
      const overallScore = Math.round(
        (avgEvaluationScore * 0.4) + 
        (taskCompletionRate * 0.3) + 
        (interactionLevel * 0.3)
      );
      
      // Determine category
      let category: StudentRanking['category'];
      if (overallScore >= 85) category = 'excellent';
      else if (overallScore >= 70) category = 'good';
      else if (overallScore >= 55) category = 'average';
      else if (overallScore >= 40) category = 'needs_improvement';
      else category = 'at_risk';
      
      // AI Analysis simulation
      const aiAnalysis = generateAIAnalysis(student, overallScore, taskCompletionRate, interactionLevel);
      
      return {
        studentId: student.id,
        studentName: student.fullName,
        overallScore,
        interactionLevel,
        rank: index + 1, // Will be recalculated after sorting
        category,
        aiAnalysis,
        lastUpdated: new Date().toISOString()
      };
    });
    
    // Sort by overall score and assign ranks
    const sorted = analyzed.sort((a, b) => b.overallScore - a.overallScore);
    const withRanks = sorted.map((item, index) => ({ ...item, rank: index + 1 }));
    
    setRankings(withRanks);
    setIsAnalyzing(false);
  };
  
  const generateAIAnalysis = (student: ExtendedStudent, score: number, taskRate: number, interaction: number) => {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const riskFactors: string[] = [];
    
    // Analyze strengths
    if (score >= 80) strengths.push('Hiệu suất học tập xuất sắc');
    if (taskRate >= 80) strengths.push('Hoàn thành bài tập đúng hạn');
    if (interaction >= 70) strengths.push('Tích cực tham gia hoạt động');
    
    // Analyze weaknesses
    if (score < 60) weaknesses.push('Điểm số tổng thể thấp');
    if (taskRate < 60) weaknesses.push('Tỷ lệ hoàn thành bài tập thấp');
    if (interaction < 50) weaknesses.push('Ít tương tác trong lớp học');
    
    // Generate recommendations
    if (score < 70) recommendations.push('Cần tăng cường ôn tập và làm bài tập');
    if (taskRate < 70) recommendations.push('Cải thiện quản lý thời gian và kỹ năng tổ chức');
    if (interaction < 60) recommendations.push('Tham gia tích cực hơn vào các hoạt động nhóm');
    
    // Identify risk factors
    if (score < 50) riskFactors.push('Nguy cơ không đạt yêu cầu khóa học');
    if (taskRate < 40) riskFactors.push('Thường xuyên nộp bài muộn');
    if (interaction < 30) riskFactors.push('Nguy cơ bỏ học cao');
    
    return { strengths, weaknesses, recommendations, riskFactors };
  };
  
  const getCategoryColor = (category: StudentRanking['category']) => {
    switch (category) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'average': return '#f59e0b';
      case 'needs_improvement': return '#f97316';
      case 'at_risk': return '#ef4444';
      default: return '#6b7280';
    }
  };
  
  const getCategoryLabel = (category: StudentRanking['category']) => {
    switch (category) {
      case 'excellent': return 'Xuất sắc';
      case 'good': return 'Giỏi';
      case 'average': return 'Trung bình';
      case 'needs_improvement': return 'Cần cải thiện';
      case 'at_risk': return 'Nguy cơ cao';
      default: return category;
    }
  };
  
  const filteredRankings = selectedCategory === 'all' 
    ? rankings 
    : rankings.filter(r => r.category === selectedCategory);
    
  const sortedRankings = [...filteredRankings].sort((a, b) => {
    switch (sortBy) {
      case 'score': return b.overallScore - a.overallScore;
      case 'interaction': return b.interactionLevel - a.interactionLevel;
      default: return a.rank - b.rank;
    }
  });
  
  const handleSendWarning = () => {
    if (!selectedStudentForWarning || !warningMessage.trim()) return;
    
    // In a real app, this would send the warning through the notification system
    alert(`Đã gửi cảnh báo đến học viên: ${warningMessage}`);
    setShowWarningModal(false);
    setSelectedStudentForWarning('');
    setWarningMessage('');
  };
  
  const getWarningTypeLabel = (type: string) => {
    switch (type) {
      case 'attendance': return 'Vắng mặt';
      case 'performance': return 'Hiệu suất';
      case 'deadline': return 'Trễ hạn';
      case 'behavior': return 'Hành vi';
      default: return type;
    }
  };

  return (
    <div className="ai-student-ranking">
      {/* Header */}
      <div className="ranking-header">
        <div className="header-content">
          <h2>🤖 Phân loại học viên AI</h2>
          <p>Hệ thống phân tích và xếp hạng học viên tự động</p>
        </div>
        <div className="header-actions">
          <button 
            className="analyze-btn"
            onClick={analyzeStudents}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? '🔄 Đang phân tích...' : '🔍 Phân tích lại'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="ranking-filters">
        <div className="filter-group">
          <label>Phân loại:</label>
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">Tất cả</option>
            <option value="excellent">Xuất sắc</option>
            <option value="good">Giỏi</option>
            <option value="average">Trung bình</option>
            <option value="needs_improvement">Cần cải thiện</option>
            <option value="at_risk">Nguy cơ cao</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Sắp xếp theo:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="rank">Xếp hạng</option>
            <option value="score">Điểm tổng</option>
            <option value="interaction">Mức tương tác</option>
          </select>
        </div>
      </div>

      {/* Statistics */}
      <div className="ranking-stats">
        <div className="stat-card excellent">
          <div className="stat-number">{rankings.filter(r => r.category === 'excellent').length}</div>
          <div className="stat-label">Xuất sắc</div>
        </div>
        <div className="stat-card good">
          <div className="stat-number">{rankings.filter(r => r.category === 'good').length}</div>
          <div className="stat-label">Giỏi</div>
        </div>
        <div className="stat-card average">
          <div className="stat-number">{rankings.filter(r => r.category === 'average').length}</div>
          <div className="stat-label">Trung bình</div>
        </div>
        <div className="stat-card needs-improvement">
          <div className="stat-number">{rankings.filter(r => r.category === 'needs_improvement').length}</div>
          <div className="stat-label">Cần cải thiện</div>
        </div>
        <div className="stat-card at-risk">
          <div className="stat-number">{rankings.filter(r => r.category === 'at_risk').length}</div>
          <div className="stat-label">Nguy cơ cao</div>
        </div>
      </div>

      {/* Rankings Table */}
      <div className="rankings-table">
        <table>
          <thead>
            <tr>
              <th>Hạng</th>
              <th>Học viên</th>
              <th>Điểm tổng</th>
              <th>Tương tác</th>
              <th>Phân loại</th>
              <th>Phân tích AI</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {sortedRankings.map((ranking) => (
              <tr key={ranking.studentId} className={`ranking-row ${ranking.category}`}>
                <td className="rank-cell">
                  <div className="rank-badge">
                    {ranking.rank <= 3 && '🏆'}
                    {ranking.rank}
                  </div>
                </td>
                <td className="student-cell">
                  <div className="student-info">
                    <div className="student-avatar">
                      {ranking.studentName.charAt(0)}
                    </div>
                    <div className="student-name">{ranking.studentName}</div>
                  </div>
                </td>
                <td className="score-cell">
                  <div className="score-display">
                    <div className="score-number">{ranking.overallScore}</div>
                    <div className="score-bar">
                      <div 
                        className="score-fill" 
                        style={{ 
                          width: `${ranking.overallScore}%`,
                          backgroundColor: getCategoryColor(ranking.category)
                        }}
                      ></div>
                    </div>
                  </div>
                </td>
                <td className="interaction-cell">
                  <div className="interaction-level">
                    {ranking.interactionLevel}%
                  </div>
                </td>
                <td className="category-cell">
                  <span 
                    className="category-badge"
                    style={{ backgroundColor: getCategoryColor(ranking.category) }}
                  >
                    {getCategoryLabel(ranking.category)}
                  </span>
                </td>
                <td className="analysis-cell">
                  <div className="ai-analysis-summary">
                    {ranking.aiAnalysis.riskFactors.length > 0 && (
                      <div className="risk-indicator">⚠️ {ranking.aiAnalysis.riskFactors.length} rủi ro</div>
                    )}
                    <div className="recommendations-count">
                      💡 {ranking.aiAnalysis.recommendations.length} khuyến nghị
                    </div>
                  </div>
                </td>
                <td className="actions-cell">
                  <div className="action-buttons">
                    <button 
                      className="action-btn view-btn"
                      title="Xem chi tiết phân tích"
                    >
                      👁️
                    </button>
                    {ranking.category === 'at_risk' || ranking.category === 'needs_improvement' ? (
                      <button 
                        className="action-btn warning-btn"
                        title="Gửi cảnh báo"
                        onClick={() => {
                          setSelectedStudentForWarning(ranking.studentId);
                          setShowWarningModal(true);
                        }}
                      >
                        ⚠️
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="modal-overlay">
          <div className="warning-modal">
            <div className="modal-header">
              <h3>⚠️ Gửi cảnh báo học viên</h3>
              <button 
                className="close-btn"
                onClick={() => setShowWarningModal(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-content">
              <div className="form-group">
                <label>Loại cảnh báo:</label>
                <select 
                  value={warningType} 
                  onChange={(e) => setWarningType(e.target.value as any)}
                >
                  <option value="performance">Hiệu suất học tập</option>
                  <option value="attendance">Vắng mặt</option>
                  <option value="deadline">Trễ hạn nộp bài</option>
                  <option value="behavior">Hành vi không phù hợp</option>
                </select>
              </div>
              
              <div className="form-group">
                <label>Nội dung cảnh báo:</label>
                <textarea
                  value={warningMessage}
                  onChange={(e) => setWarningMessage(e.target.value)}
                  placeholder="Nhập nội dung cảnh báo..."
                  rows={4}
                />
              </div>
              
              <div className="warning-templates">
                <p>Mẫu cảnh báo:</p>
                <button 
                  className="template-btn"
                  onClick={() => setWarningMessage('Bạn đang có nguy cơ không đạt yêu cầu khóa học. Vui lòng liên hệ với giảng viên để được hỗ trợ.')}
                >
                  Cảnh báo hiệu suất
                </button>
                <button 
                  className="template-btn"
                  onClick={() => setWarningMessage('Bạn đã vắng mặt quá nhiều buổi học. Vui lòng tham gia đầy đủ các buổi học tiếp theo.')}
                >
                  Cảnh báo vắng mặt
                </button>
              </div>
            </div>
            
            <div className="modal-actions">
              <button 
                className="cancel-btn"
                onClick={() => setShowWarningModal(false)}
              >
                Hủy
              </button>
              <button 
                className="send-btn"
                onClick={handleSendWarning}
                disabled={!warningMessage.trim()}
              >
                Gửi cảnh báo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIStudentRanking;