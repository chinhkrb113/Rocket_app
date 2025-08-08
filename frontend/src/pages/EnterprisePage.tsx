import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { mockStudents, type Student, User, mockTeams, mockTasks, mockEvaluations, mockStudentProfiles, mockExtendedStudents, mockEnterpriseInterests } from '../data/mockData';
import './EnterprisePage.css';

interface EnterprisePageProps {
  currentUser: User | any;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  duration: string;
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'completed' | 'paused';
  participants: string[];
  instructor: string;
  progress: number;
  budget: number;
  skills: string[];
  type: 'technical' | 'soft-skills' | 'leadership' | 'project-based';
}

interface ProjectAssignment {
  id: string;
  title: string;
  description: string;
  assignedStudents: string[];
  startDate: string;
  endDate: string;
  status: 'planning' | 'active' | 'review' | 'completed';
  progress: number;
  deliverables: string[];
  budget: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  skills?: string;
  experienceLevel?: string;
  teamSize?: number;
}

const EnterprisePage: React.FC<EnterprisePageProps> = ({ currentUser }) => {
  const [activeStep, setActiveStep] = useState<'project-creation' | 'ai-recommendation' | 'monitoring' | 'evaluation'>('project-creation');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [skillFilter, setSkillFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
  const [newProgram, setNewProgram] = useState<Partial<TrainingProgram>>({});
  const [newProject, setNewProject] = useState<Partial<ProjectAssignment>>({});

  // Mock data for training programs and projects
  const [trainingPrograms, setTrainingPrograms] = useState<TrainingProgram[]>([
    {
      id: '1',
      title: 'Chương trình đào tạo React Advanced',
      description: 'Đào tạo chuyên sâu về React, Redux và các công nghệ frontend hiện đại',
      duration: '8 tuần',
      startDate: '2024-02-01',
      endDate: '2024-03-29',
      status: 'active',
      participants: ['1', '2', '3'],
      instructor: 'Nguyễn Văn A',
      progress: 65,
      budget: 50000000,
      skills: ['React', 'Redux', 'TypeScript', 'Testing'],
      type: 'technical'
    },
    {
      id: '2',
      title: 'Dự án phát triển ứng dụng E-commerce',
      description: 'Xây dựng ứng dụng thương mại điện tử hoàn chỉnh từ A-Z',
      duration: '12 tuần',
      startDate: '2024-01-15',
      endDate: '2024-04-15',
      status: 'active',
      participants: ['4', '5', '6', '7'],
      instructor: 'Trần Thị B',
      progress: 45,
      budget: 80000000,
      skills: ['Full-stack', 'Database', 'API Design', 'DevOps'],
      type: 'project-based'
    }
  ]);

  const [projectAssignments, setProjectAssignments] = useState<ProjectAssignment[]>([
    {
      id: '1',
      title: 'Hệ thống quản lý nhân sự',
      description: 'Phát triển hệ thống quản lý nhân sự cho doanh nghiệp vừa và nhỏ',
      assignedStudents: ['1', '2', '8'],
      startDate: '2024-02-15',
      endDate: '2024-05-15',
      status: 'active',
      progress: 30,
      deliverables: ['Database Design', 'API Development', 'Frontend Interface', 'Testing & Deployment'],
      budget: 120000000,
      priority: 'high'
    },
    {
      id: '2',
      title: 'Ứng dụng mobile Banking',
      description: 'Xây dựng ứng dụng ngân hàng di động với tính năng bảo mật cao',
      assignedStudents: ['3', '4', '5'],
      startDate: '2024-03-01',
      endDate: '2024-07-01',
      status: 'planning',
      progress: 5,
      deliverables: ['Security Analysis', 'Mobile App Development', 'Backend Services', 'Security Testing'],
      budget: 200000000,
      priority: 'urgent'
    }
  ]);

  // Filter students based on search and filters
  const filteredStudents = mockExtendedStudents.filter(student => {
    const profile = mockStudentProfiles.find(p => p.studentId === student.id);
    if (!profile) return false;

    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSkill = !skillFilter || profile.technicalSkills.some(skill => 
      skill.name.toLowerCase().includes(skillFilter.toLowerCase())
    );
    
    const matchesExperience = experienceFilter === 'all' || 
      (experienceFilter === 'beginner' && profile.technicalSkills.some(skill => skill.level === 'beginner')) ||
      (experienceFilter === 'intermediate' && profile.technicalSkills.some(skill => skill.level === 'intermediate')) ||
      (experienceFilter === 'advanced' && profile.technicalSkills.some(skill => skill.level === 'advanced' || skill.level === 'expert'));

    return matchesSearch && matchesSkill && matchesExperience;
  });

  const handleStudentSelection = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleCreateProgram = () => {
    if (newProgram.title && newProgram.description && selectedStudents.length > 0) {
      const program: TrainingProgram = {
        id: Date.now().toString(),
        title: newProgram.title,
        description: newProgram.description || '',
        duration: newProgram.duration || '4 tuần',
        startDate: newProgram.startDate || new Date().toISOString().split('T')[0],
        endDate: newProgram.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'planning',
        participants: [...selectedStudents],
        instructor: newProgram.instructor || 'Chưa phân công',
        progress: 0,
        budget: newProgram.budget || 0,
        skills: newProgram.skills || [],
        type: newProgram.type || 'technical'
      };
      
      setTrainingPrograms(prev => [...prev, program]);
      setShowCreateProgramModal(false);
      setNewProgram({});
      setSelectedStudents([]);
      setActiveStep('monitoring');
    }
  };

  const handleCreateProject = () => {
    if (newProject.title && newProject.description && selectedStudents.length > 0) {
      const project: ProjectAssignment = {
        id: Date.now().toString(),
        title: newProject.title,
        description: newProject.description || '',
        assignedStudents: [...selectedStudents],
        startDate: newProject.startDate || new Date().toISOString().split('T')[0],
        endDate: newProject.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'planning',
        progress: 0,
        deliverables: newProject.deliverables || [],
        budget: newProject.budget || 0,
        priority: newProject.priority || 'medium'
      };
      
      setProjectAssignments(prev => [...prev, project]);
      setShowCreateProjectModal(false);
      setNewProject({});
      setSelectedStudents([]);
      setActiveStep('monitoring');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#f59e0b';
      case 'active': return '#10b981';
      case 'completed': return '#6366f1';
      case 'paused': return '#ef4444';
      case 'review': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#f97316';
      case 'urgent': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <Layout>
      <div className="enterprise-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>🏢 Quản lý Đào tạo Doanh nghiệp</h1>
              <p>Triển khai và giám sát các chương trình đào tạo, dự án cho nhân viên</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="progress-steps">
          <div className={`step ${activeStep === 'project-creation' ? 'active' : activeStep === 'ai-recommendation' || activeStep === 'monitoring' || activeStep === 'evaluation' ? 'completed' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Tạo dự án mới</h3>
              <p>Định nghĩa yêu cầu và mục tiêu dự án</p>
            </div>
          </div>
          <div className={`step ${activeStep === 'ai-recommendation' ? 'active' : activeStep === 'monitoring' || activeStep === 'evaluation' ? 'completed' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>AI gợi ý nhân sự</h3>
              <p>Hệ thống AI đề xuất nhân viên phù hợp</p>
            </div>
          </div>
          <div className={`step ${activeStep === 'monitoring' ? 'active' : activeStep === 'evaluation' ? 'completed' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Giám sát tiến độ</h3>
              <p>Theo dõi tiến độ thực hiện dự án</p>
            </div>
          </div>
          <div className={`step ${activeStep === 'evaluation' ? 'active' : ''}`}>
            <div className="step-number">4</div>
            <div className="step-content">
              <h3>Đánh giá kết quả</h3>
              <p>Xem kết quả và mở rộng hợp tác</p>
            </div>
          </div>
        </div>

        {/* Step Navigation */}
        <div className="step-navigation">
          <button 
            className={`nav-btn ${activeStep === 'project-creation' ? 'active' : ''}`}
            onClick={() => setActiveStep('project-creation')}
          >
            🚀 Bước 1: Tạo dự án
          </button>
          <button 
            className={`nav-btn ${activeStep === 'ai-recommendation' ? 'active' : ''}`}
            onClick={() => setActiveStep('ai-recommendation')}
          >
            🤖 Bước 2: AI gợi ý
          </button>
          <button 
            className={`nav-btn ${activeStep === 'monitoring' ? 'active' : ''}`}
            onClick={() => setActiveStep('monitoring')}
          >
            📊 Bước 3: Giám sát tiến độ
          </button>
          <button 
            className={`nav-btn ${activeStep === 'evaluation' ? 'active' : ''}`}
            onClick={() => setActiveStep('evaluation')}
          >
            ⭐ Bước 4: Đánh giá kết quả
          </button>
        </div>

        {/* Step Content */}
        <div className="step-content-area">
          {activeStep === 'project-creation' && (
            <div className="project-creation-step">
              <div className="step-header">
                <h2>Bước 1: Tạo dự án mới</h2>
                <p>Định nghĩa yêu cầu, mục tiêu và thông tin chi tiết của dự án để hệ thống AI có thể gợi ý nhân sự phù hợp</p>
              </div>

              {/* Project Creation Form */}
              <div className="project-creation-form">
                <div className="form-section">
                  <h3>📋 Thông tin cơ bản</h3>
                  <div className="form-group">
                    <label>Tên dự án *</label>
                    <Input
                      type="text"
                      placeholder="Nhập tên dự án..."
                      value={newProject.title || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Mô tả dự án *</label>
                    <textarea
                      placeholder="Mô tả chi tiết về dự án, mục tiêu và yêu cầu..."
                      value={newProject.description || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Mức độ ưu tiên</label>
                      <select
                        value={newProject.priority || 'medium'}
                        onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value as any }))}
                      >
                        <option value="low">Thấp</option>
                        <option value="medium">Trung bình</option>
                        <option value="high">Cao</option>
                        <option value="urgent">Khẩn cấp</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Ngân sách (VNĐ)</label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={newProject.budget || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>⏰ Thời gian thực hiện</h3>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Ngày bắt đầu</label>
                      <Input
                        type="date"
                        value={newProject.startDate || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label>Ngày kết thúc dự kiến</label>
                      <Input
                        type="date"
                        value={newProject.endDate || ''}
                        onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-section">
                  <h3>🎯 Yêu cầu kỹ năng</h3>
                  <div className="form-group">
                    <label>Kỹ năng cần thiết</label>
                    <Input
                      type="text"
                      placeholder="VD: React, Node.js, Python, UI/UX Design..."
                      value={newProject.skills || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, skills: e.target.value }))}
                    />
                    <small>Nhập các kỹ năng cần thiết, phân cách bằng dấu phẩy</small>
                  </div>
                  <div className="form-group">
                    <label>Mức độ kinh nghiệm yêu cầu</label>
                    <select
                      value={newProject.experienceLevel || 'intermediate'}
                      onChange={(e) => setNewProject(prev => ({ ...prev, experienceLevel: e.target.value }))}
                    >
                      <option value="beginner">Beginner (0-1 năm)</option>
                      <option value="intermediate">Intermediate (1-3 năm)</option>
                      <option value="advanced">Advanced (3-5 năm)</option>
                      <option value="expert">Expert (5+ năm)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Số lượng thành viên cần thiết</label>
                    <Input
                      type="number"
                      placeholder="3"
                      min="1"
                      max="20"
                      value={newProject.teamSize || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, teamSize: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="form-section">
                  <h3>📦 Sản phẩm bàn giao</h3>
                  <div className="form-group">
                    <label>Các sản phẩm/deliverables</label>
                    <textarea
                      placeholder="VD: Thiết kế UI/UX, Frontend Application, Backend API, Database Design, Testing Report..."
                      value={newProject.deliverables?.join(', ') || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, deliverables: e.target.value.split(',').map(item => item.trim()).filter(item => item) }))}
                      rows={3}
                    />
                    <small>Nhập các sản phẩm bàn giao, phân cách bằng dấu phẩy</small>
                  </div>
                </div>

                <div className="form-actions">
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      if (newProject.title && newProject.description) {
                        setActiveStep('ai-recommendation');
                      } else {
                        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
                      }
                    }}
                    disabled={!newProject.title || !newProject.description}
                  >
                    🤖 Tiếp theo: AI gợi ý nhân sự
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeStep === 'ai-recommendation' && (
            <div className="ai-recommendation-step">
              <div className="step-header">
                <h2>Bước 2: AI gợi ý nhân sự phù hợp</h2>
                <p>Hệ thống AI phân tích yêu cầu dự án và đề xuất những nhân viên/học viên có kỹ năng phù hợp nhất</p>
              </div>

              {/* Project Summary */}
              <div className="project-summary">
                <h3>📋 Tóm tắt dự án</h3>
                <div className="summary-card">
                  <div className="summary-header">
                    <h4>{newProject.title}</h4>
                    <span className="priority-badge" style={{ backgroundColor: getPriorityColor(newProject.priority || 'medium') }}>
                      {newProject.priority === 'low' ? 'Thấp' :
                       newProject.priority === 'medium' ? 'Trung bình' :
                       newProject.priority === 'high' ? 'Cao' : 'Khẩn cấp'}
                    </span>
                  </div>
                  <p>{newProject.description}</p>
                  <div className="summary-details">
                    <div className="detail-item">
                      <span className="detail-label">Ngân sách:</span>
                      <span className="detail-value">{formatCurrency(newProject.budget || 0)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Thời gian:</span>
                      <span className="detail-value">
                        {newProject.startDate && newProject.endDate 
                          ? `${new Date(newProject.startDate).toLocaleDateString('vi-VN')} - ${new Date(newProject.endDate).toLocaleDateString('vi-VN')}`
                          : 'Chưa xác định'
                        }
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Số thành viên:</span>
                      <span className="detail-value">{newProject.teamSize || 'Chưa xác định'}</span>
                    </div>
                  </div>
                  {newProject.skills && (
                    <div className="required-skills">
                      <h5>Kỹ năng yêu cầu:</h5>
                      <div className="skills-tags">
                        {newProject.skills.split(',').map((skill: string) => (
                          <span key={skill.trim()} className="skill-tag required">{skill.trim()}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Analysis */}
              <div className="ai-analysis">
                <h3>🤖 Phân tích AI</h3>
                <div className="analysis-card">
                  <div className="analysis-header">
                    <div className="ai-icon">🧠</div>
                    <div className="analysis-title">
                      <h4>Kết quả phân tích thông minh</h4>
                      <p>Hệ thống đã phân tích {filteredStudents.length} hồ sơ ứng viên</p>
                    </div>
                  </div>
                  <div className="analysis-insights">
                    <div className="insight-item">
                      <span className="insight-icon">🎯</span>
                      <span className="insight-text">
                        Tìm thấy {filteredStudents.filter(student => {
                          const profile = mockStudentProfiles.find(p => p.studentId === student.id);
                          return profile?.technicalSkills.some(skill => 
                            newProject.skills?.toLowerCase().includes(skill.name.toLowerCase())
                          );
                        }).length} ứng viên có kỹ năng phù hợp
                      </span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">⭐</span>
                      <span className="insight-text">
                        Độ phù hợp trung bình: {Math.round(Math.random() * 20 + 75)}%
                      </span>
                    </div>
                    <div className="insight-item">
                      <span className="insight-icon">💡</span>
                      <span className="insight-text">
                        Khuyến nghị: Chọn {Math.min(newProject.teamSize || 3, filteredStudents.length)} ứng viên hàng đầu
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Search and Filter */}
              <div className="search-filter-section">
                <h3>🔍 Tìm kiếm và lọc ứng viên</h3>
                <div className="filter-group">
                  <Input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Input
                    type="text"
                    placeholder="Lọc theo kỹ năng..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                  <select 
                    value={experienceFilter} 
                    onChange={(e) => setExperienceFilter(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Tất cả kinh nghiệm</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Selected Count */}
              {selectedStudents.length > 0 && (
                <div className="selected-info">
                  <span>Đã chọn {selectedStudents.length} người</span>
                  <div className="action-buttons">
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveStep('project-creation')}
                    >
                      ← Quay lại
                    </Button>
                    <Button 
                      variant="primary" 
                      onClick={() => {
                        handleCreateProject();
                        setActiveStep('monitoring');
                      }}
                      disabled={selectedStudents.length === 0}
                    >
                      ✅ Xác nhận và tạo dự án
                    </Button>
                  </div>
                </div>
              )}

              {/* AI Recommended Candidates */}
               <div className="ai-candidates-section">
                 <h3>🎯 Ứng viên được AI gợi ý</h3>
                 <div className="candidates-grid">
                   {filteredStudents
                     .map(student => {
                       const profile = mockStudentProfiles.find(p => p.studentId === student.id);
                       const matchingSkills = profile?.technicalSkills.filter(skill => 
                         newProject.skills?.toLowerCase().includes(skill.name.toLowerCase())
                       ) || [];
                       const matchScore = Math.round(
                         (matchingSkills.length / (newProject.skills?.split(',').length || 1)) * 100
                       );
                       return { ...student, profile, matchingSkills, matchScore };
                     })
                     .sort((a, b) => b.matchScore - a.matchScore)
                     .map(student => {
                       const isSelected = selectedStudents.includes(student.id);
                       
                       return (
                         <div 
                           key={student.id} 
                           className={`candidate-card ${isSelected ? 'selected' : ''}`}
                           onClick={() => handleStudentSelection(student.id)}
                         >
                           <div className="candidate-header">
                             <div className="candidate-avatar">
                               {student.fullName.charAt(0)}
                             </div>
                             <div className="candidate-info">
                               <h3>{student.fullName}</h3>
                               <p>{student.email}</p>
                               <span className="experience-level">
                                 {student.profile?.technicalSkills && student.profile.technicalSkills.length > 0 
                                   ? student.profile.technicalSkills[0].level.charAt(0).toUpperCase() + student.profile.technicalSkills[0].level.slice(1)
                                   : 'Chưa xác định'
                                 }
                               </span>
                             </div>
                             <div className="ai-score">
                               <div className="score-circle" style={{ 
                                 background: `conic-gradient(#10b981 ${student.matchScore * 3.6}deg, #e5e7eb 0deg)` 
                               }}>
                                 <span className="score-text">{student.matchScore}%</span>
                               </div>
                               <span className="score-label">Độ phù hợp</span>
                             </div>
                             <div className="selection-indicator">
                               {isSelected ? '✅' : '⭕'}
                             </div>
                           </div>
                           
                           <div className="matching-skills">
                             <h4>Kỹ năng phù hợp ({student.matchingSkills.length}):</h4>
                             <div className="skills-tags">
                               {student.matchingSkills.map(skill => (
                                 <span key={skill.name} className="skill-tag matching">
                                   {skill.name} ({skill.level})
                                 </span>
                               ))}
                             </div>
                           </div>
                           
                           <div className="other-skills">
                             <h4>Kỹ năng khác:</h4>
                             <div className="skills-tags">
                               {student.profile?.technicalSkills
                                 .filter(skill => !student.matchingSkills.some(ms => ms.name === skill.name))
                                 .slice(0, 3)
                                 .map(skill => (
                                   <span key={skill.name} className="skill-tag">
                                     {skill.name} ({skill.level})
                                   </span>
                                 ))}
                             </div>
                           </div>
                           
                           <div className="candidate-stats">
                             <div className="stat">
                               <span className="stat-label">Tiến độ:</span>
                               <span className="stat-value">{student.progress}%</span>
                             </div>
                             <div className="stat">
                               <span className="stat-label">Điểm:</span>
                               <span className="stat-value">{student.grade}</span>
                             </div>
                             <div className="stat">
                               <span className="stat-label">AI Score:</span>
                               <span className="stat-value ai-score-text">{student.matchScore}%</span>
                             </div>
                           </div>
                           
                           <div className="ai-recommendation">
                             {student.matchScore >= 80 && (
                               <div className="recommendation excellent">
                                 <span className="rec-icon">🌟</span>
                                 <span className="rec-text">Ứng viên xuất sắc</span>
                               </div>
                             )}
                             {student.matchScore >= 60 && student.matchScore < 80 && (
                               <div className="recommendation good">
                                 <span className="rec-icon">👍</span>
                                 <span className="rec-text">Ứng viên tốt</span>
                               </div>
                             )}
                             {student.matchScore < 60 && (
                               <div className="recommendation average">
                                 <span className="rec-icon">⚡</span>
                                 <span className="rec-text">Cần đào tạo thêm</span>
                               </div>
                             )}
                           </div>
                         </div>
                       );
                     })}
                 </div>
               </div>
             </div>
           )}

          {activeStep === 'monitoring' && (
            <div className="monitoring-step">
              <div className="step-header">
                <h2>Bước 2: Giám sát tiến độ đào tạo/dự án</h2>
                <p>Theo dõi lịch trình và tiến độ của các chương trình đào tạo và dự án</p>
              </div>

              {/* Training Programs */}
              <div className="programs-section">
                <h3>📚 Chương trình đào tạo</h3>
                <div className="programs-grid">
                  {trainingPrograms.map(program => (
                    <div key={program.id} className="program-card">
                      <div className="program-header">
                        <h4>{program.title}</h4>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(program.status) }}
                        >
                          {program.status === 'planning' ? 'Lên kế hoạch' :
                           program.status === 'active' ? 'Đang diễn ra' :
                           program.status === 'completed' ? 'Hoàn thành' : 'Tạm dừng'}
                        </span>
                      </div>
                      
                      <p className="program-description">{program.description}</p>
                      
                      <div className="program-details">
                        <div className="detail-item">
                          <span className="detail-label">Thời gian:</span>
                          <span className="detail-value">{program.duration}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Học viên:</span>
                          <span className="detail-value">{program.participants.length} người</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Ngân sách:</span>
                          <span className="detail-value">{formatCurrency(program.budget)}</span>
                        </div>
                      </div>
                      
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Tiến độ: {program.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${program.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="program-skills">
                        <h5>Kỹ năng đào tạo:</h5>
                        <div className="skills-tags">
                          {program.skills.map(skill => (
                            <span key={skill} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Assignments */}
              <div className="projects-section">
                <h3>🚀 Dự án thực tế</h3>
                <div className="projects-grid">
                  {projectAssignments.map(project => (
                    <div key={project.id} className="project-card">
                      <div className="project-header">
                        <h4>{project.title}</h4>
                        <div className="project-badges">
                          <span 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(project.status) }}
                          >
                            {project.status === 'planning' ? 'Lên kế hoạch' :
                             project.status === 'active' ? 'Đang thực hiện' :
                             project.status === 'review' ? 'Đang review' : 'Hoàn thành'}
                          </span>
                          <span 
                            className="priority-badge"
                            style={{ backgroundColor: getPriorityColor(project.priority) }}
                          >
                            {project.priority === 'low' ? 'Thấp' :
                             project.priority === 'medium' ? 'Trung bình' :
                             project.priority === 'high' ? 'Cao' : 'Khẩn cấp'}
                          </span>
                        </div>
                      </div>
                      
                      <p className="project-description">{project.description}</p>
                      
                      <div className="project-details">
                        <div className="detail-item">
                          <span className="detail-label">Thành viên:</span>
                          <span className="detail-value">{project.assignedStudents.length} người</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Thời hạn:</span>
                          <span className="detail-value">{new Date(project.endDate).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Ngân sách:</span>
                          <span className="detail-value">{formatCurrency(project.budget)}</span>
                        </div>
                      </div>
                      
                      <div className="progress-section">
                        <div className="progress-header">
                          <span>Tiến độ: {project.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill"
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <div className="deliverables-section">
                        <h5>Sản phẩm bàn giao:</h5>
                        <ul className="deliverables-list">
                          {project.deliverables.map((deliverable, index) => (
                            <li key={index}>{deliverable}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeStep === 'evaluation' && (
            <div className="evaluation-step">
              <div className="step-header">
                <h2>Bước 3: Đánh giá kết quả và mở rộng hợp tác</h2>
                <p>Xem xét kết quả đào tạo, đánh giá hiệu quả và lên kế hoạch hợp tác tiếp theo</p>
              </div>

              {/* Overall Statistics */}
              <div className="evaluation-stats">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-content">
                    <h3>Tổng số chương trình</h3>
                    <p className="stat-number">{trainingPrograms.length + projectAssignments.length}</p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">👥</div>
                  <div className="stat-content">
                    <h3>Học viên tham gia</h3>
                    <p className="stat-number">
                      {new Set([
                        ...trainingPrograms.flatMap(p => p.participants),
                        ...projectAssignments.flatMap(p => p.assignedStudents)
                      ]).size}
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-content">
                    <h3>Tổng ngân sách</h3>
                    <p className="stat-number">
                      {formatCurrency(
                        trainingPrograms.reduce((sum, p) => sum + p.budget, 0) +
                        projectAssignments.reduce((sum, p) => sum + p.budget, 0)
                      )}
                    </p>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon">✅</div>
                  <div className="stat-content">
                    <h3>Tỷ lệ hoàn thành</h3>
                    <p className="stat-number">
                      {Math.round(
                        (trainingPrograms.reduce((sum, p) => sum + p.progress, 0) +
                         projectAssignments.reduce((sum, p) => sum + p.progress, 0)) /
                        (trainingPrograms.length + projectAssignments.length)
                      )}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Results */}
              <div className="results-section">
                <h3>📈 Kết quả chi tiết</h3>
                
                {/* Training Programs Results */}
                <div className="results-category">
                  <h4>Chương trình đào tạo</h4>
                  <div className="results-grid">
                    {trainingPrograms.map(program => {
                      const participantNames = program.participants.map(id => {
                        const student = mockExtendedStudents.find(s => s.id === id);
                        return student?.fullName || 'Unknown';
                      });
                      
                      return (
                        <div key={program.id} className="result-card">
                          <div className="result-header">
                            <h5>{program.title}</h5>
                            <div className="result-score">
                              <span className="score-label">Điểm đánh giá:</span>
                              <span className="score-value">{Math.round(program.progress * 0.85 + Math.random() * 15)}/100</span>
                            </div>
                          </div>
                          
                          <div className="result-details">
                            <div className="detail-row">
                              <span>Tiến độ hoàn thành:</span>
                              <span>{program.progress}%</span>
                            </div>
                            <div className="detail-row">
                              <span>Số học viên:</span>
                              <span>{program.participants.length}</span>
                            </div>
                            <div className="detail-row">
                              <span>Thời gian thực hiện:</span>
                              <span>{program.duration}</span>
                            </div>
                            <div className="detail-row">
                              <span>Chi phí thực tế:</span>
                              <span>{formatCurrency(program.budget * (program.progress / 100))}</span>
                            </div>
                          </div>
                          
                          <div className="participants-list">
                            <h6>Học viên tham gia:</h6>
                            <div className="participants-tags">
                              {participantNames.map(name => (
                                <span key={name} className="participant-tag">{name}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="result-actions">
                            <Button variant="outline" size="small">
                              📊 Xem báo cáo chi tiết
                            </Button>
                            <Button variant="primary" size="small">
                              🔄 Gia hạn hợp tác
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Results */}
                <div className="results-category">
                  <h4>Dự án thực tế</h4>
                  <div className="results-grid">
                    {projectAssignments.map(project => {
                      const memberNames = project.assignedStudents.map(id => {
                        const student = mockExtendedStudents.find(s => s.id === id);
                        return student?.fullName || 'Unknown';
                      });
                      
                      return (
                        <div key={project.id} className="result-card">
                          <div className="result-header">
                            <h5>{project.title}</h5>
                            <div className="result-score">
                              <span className="score-label">Điểm đánh giá:</span>
                              <span className="score-value">{Math.round(project.progress * 0.9 + Math.random() * 10)}/100</span>
                            </div>
                          </div>
                          
                          <div className="result-details">
                            <div className="detail-row">
                              <span>Tiến độ hoàn thành:</span>
                              <span>{project.progress}%</span>
                            </div>
                            <div className="detail-row">
                              <span>Số thành viên:</span>
                              <span>{project.assignedStudents.length}</span>
                            </div>
                            <div className="detail-row">
                              <span>Mức độ ưu tiên:</span>
                              <span style={{ color: getPriorityColor(project.priority) }}>
                                {project.priority === 'low' ? 'Thấp' :
                                 project.priority === 'medium' ? 'Trung bình' :
                                 project.priority === 'high' ? 'Cao' : 'Khẩn cấp'}
                              </span>
                            </div>
                            <div className="detail-row">
                              <span>Chi phí thực tế:</span>
                              <span>{formatCurrency(project.budget * (project.progress / 100))}</span>
                            </div>
                          </div>
                          
                          <div className="participants-list">
                            <h6>Thành viên dự án:</h6>
                            <div className="participants-tags">
                              {memberNames.map(name => (
                                <span key={name} className="participant-tag">{name}</span>
                              ))}
                            </div>
                          </div>
                          
                          <div className="deliverables-status">
                            <h6>Trạng thái sản phẩm:</h6>
                            <div className="deliverables-progress">
                              {project.deliverables.map((deliverable, index) => (
                                <div key={index} className="deliverable-item">
                                  <span className="deliverable-name">{deliverable}</span>
                                  <span className="deliverable-status">
                                    {project.progress > (index + 1) * (100 / project.deliverables.length) ? '✅' : '⏳'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="result-actions">
                            <Button variant="outline" size="small">
                              📊 Xem báo cáo chi tiết
                            </Button>
                            <Button variant="primary" size="small">
                              🚀 Dự án tiếp theo
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Collaboration Expansion */}
              <div className="collaboration-section">
                <h3>🤝 Mở rộng hợp tác</h3>
                <div className="collaboration-options">
                  <div className="option-card">
                    <div className="option-icon">📚</div>
                    <h4>Chương trình đào tạo mới</h4>
                    <p>Thiết kế chương trình đào tạo chuyên sâu cho các kỹ năng mới</p>
                    <Button variant="primary" onClick={() => setActiveStep('project-creation')}>
                       Bắt đầu ngay
                     </Button>
                   </div>
                   <div className="option-card">
                     <div className="option-icon">🚀</div>
                     <h4>Dự án quy mô lớn</h4>
                     <p>Triển khai dự án với quy mô và độ phức tạp cao hơn</p>
                     <Button variant="primary" onClick={() => setActiveStep('project-creation')}>
                       Lên kế hoạch
                     </Button>
                   </div>
                   <div className="option-card">
                     <div className="option-icon">🎯</div>
                     <h4>Đào tạo chuyên biệt</h4>
                     <p>Chương trình đào tạo theo yêu cầu riêng của doanh nghiệp</p>
                     <Button variant="primary" onClick={() => setActiveStep('project-creation')}>
                       Tùy chỉnh
                     </Button>
                   </div>
                   <div className="option-card">
                     <div className="option-icon">🏆</div>
                     <h4>Chương trình dài hạn</h4>
                     <p>Hợp tác dài hạn với cam kết chất lượng và hiệu quả</p>
                     <Button variant="primary" onClick={() => setActiveStep('project-creation')}>
                       Thảo luận
                     </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create Program Modal */}
        {showCreateProgramModal && (
          <div className="modal-overlay" onClick={() => setShowCreateProgramModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tạo chương trình đào tạo mới</h3>
                <button className="close-btn" onClick={() => setShowCreateProgramModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên chương trình:</label>
                  <Input
                    type="text"
                    value={newProgram.title || ''}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tên chương trình đào tạo"
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả:</label>
                  <textarea
                    value={newProgram.description || ''}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về chương trình"
                    rows={4}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Thời gian:</label>
                    <Input
                      type="text"
                      value={newProgram.duration || ''}
                      onChange={(e) => setNewProgram(prev => ({ ...prev, duration: e.target.value }))}
                      placeholder="VD: 8 tuần"
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngân sách (VNĐ):</label>
                    <Input
                      type="number"
                      value={newProgram.budget || ''}
                      onChange={(e) => setNewProgram(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bắt đầu:</label>
                    <Input
                      type="date"
                      value={newProgram.startDate || ''}
                      onChange={(e) => setNewProgram(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc:</label>
                    <Input
                      type="date"
                      value={newProgram.endDate || ''}
                      onChange={(e) => setNewProgram(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Giảng viên:</label>
                  <Input
                    type="text"
                    value={newProgram.instructor || ''}
                    onChange={(e) => setNewProgram(prev => ({ ...prev, instructor: e.target.value }))}
                    placeholder="Tên giảng viên"
                  />
                </div>
                <div className="selected-students-preview">
                  <h4>Học viên đã chọn ({selectedStudents.length}):</h4>
                  <div className="students-preview">
                    {selectedStudents.map(studentId => {
                      const student = mockExtendedStudents.find(s => s.id === studentId);
                      return (
                        <span key={studentId} className="student-preview-tag">
                          {student?.fullName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowCreateProgramModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleCreateProgram}>
                  Tạo chương trình
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Create Project Modal */}
        {showCreateProjectModal && (
          <div className="modal-overlay" onClick={() => setShowCreateProjectModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Tạo dự án mới</h3>
                <button className="close-btn" onClick={() => setShowCreateProjectModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tên dự án:</label>
                  <Input
                    type="text"
                    value={newProject.title || ''}
                    onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Nhập tên dự án"
                  />
                </div>
                <div className="form-group">
                  <label>Mô tả:</label>
                  <textarea
                    value={newProject.description || ''}
                    onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Mô tả chi tiết về dự án"
                    rows={4}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Mức độ ưu tiên:</label>
                    <select
                      value={newProject.priority || 'medium'}
                      onChange={(e) => setNewProject(prev => ({ ...prev, priority: e.target.value as any }))}
                    >
                      <option value="low">Thấp</option>
                      <option value="medium">Trung bình</option>
                      <option value="high">Cao</option>
                      <option value="urgent">Khẩn cấp</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Ngân sách (VNĐ):</label>
                    <Input
                      type="number"
                      value={newProject.budget || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, budget: Number(e.target.value) }))}
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Ngày bắt đầu:</label>
                    <Input
                      type="date"
                      value={newProject.startDate || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label>Ngày kết thúc:</label>
                    <Input
                      type="date"
                      value={newProject.endDate || ''}
                      onChange={(e) => setNewProject(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="selected-students-preview">
                  <h4>Thành viên đã chọn ({selectedStudents.length}):</h4>
                  <div className="students-preview">
                    {selectedStudents.map(studentId => {
                      const student = mockExtendedStudents.find(s => s.id === studentId);
                      return (
                        <span key={studentId} className="student-preview-tag">
                          {student?.fullName}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <Button variant="outline" onClick={() => setShowCreateProjectModal(false)}>
                  Hủy
                </Button>
                <Button variant="primary" onClick={handleCreateProject}>
                  Tạo dự án
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EnterprisePage;