import React, { useState, useEffect } from 'react';
import { ExtendedStudent, StudentProfile, EnterpriseInterest } from '../../types/student';
import { User } from '../../data/mockData';
import './CorporateConnection.css';

interface CorporateConnectionProps {
  currentUser: User;
  students?: ExtendedStudent[];
  studentProfiles?: StudentProfile[];
  enterpriseInterests?: EnterpriseInterest[];
}

interface Company {
  id: string;
  name: string;
  logo: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  openPositions: Position[];
  requirements: string[];
  benefits: string[];
  contactEmail: string;
  website: string;
}

interface Position {
  id: string;
  title: string;
  department: string;
  level: string;
  salary: string;
  description: string;
  requirements: string[];
  skills: string[];
  type: 'full-time' | 'part-time' | 'internship' | 'contract';
  remote: boolean;
  postedDate: string;
  deadline: string;
}

interface Application {
  id: string;
  studentId: string;
  companyId: string;
  positionId: string;
  status: 'pending' | 'reviewing' | 'interview' | 'accepted' | 'rejected';
  appliedDate: string;
  message: string;
  documents: string[];
}

const CorporateConnection: React.FC<CorporateConnectionProps> = ({
  currentUser,
  students = [],
  studentProfiles = [],
  enterpriseInterests = []
}) => {
  const [activeTab, setActiveTab] = useState<'companies' | 'positions' | 'applications' | 'students'>('companies');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<ExtendedStudent | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [filterIndustry, setFilterIndustry] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterSkills, setFilterSkills] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for companies and positions
  const [companies] = useState<Company[]>([
    {
      id: '1',
      name: 'TechViet Solutions',
      logo: 'TV',
      industry: 'Technology',
      size: '100-500',
      location: 'Ho Chi Minh City',
      description: 'Leading software development company specializing in web and mobile applications.',
      openPositions: [
        {
          id: '1',
          title: 'Frontend Developer',
          department: 'Engineering',
          level: 'Junior',
          salary: '15-25 triệu VND',
          description: 'Develop and maintain user interfaces using React and TypeScript.',
          requirements: ['Bachelor degree in Computer Science', '1+ years experience', 'React knowledge'],
          skills: ['React', 'TypeScript', 'CSS', 'JavaScript'],
          type: 'full-time',
          remote: true,
          postedDate: '2024-01-15',
          deadline: '2024-02-15'
        },
        {
          id: '2',
          title: 'Backend Developer',
          department: 'Engineering',
          level: 'Mid',
          salary: '20-35 triệu VND',
          description: 'Build and maintain server-side applications using Node.js and Python.',
          requirements: ['Bachelor degree', '2+ years experience', 'API development'],
          skills: ['Node.js', 'Python', 'MongoDB', 'PostgreSQL'],
          type: 'full-time',
          remote: false,
          postedDate: '2024-01-10',
          deadline: '2024-02-10'
        }
      ],
      requirements: ['Strong technical skills', 'Team collaboration', 'Problem-solving'],
      benefits: ['Competitive salary', 'Health insurance', 'Flexible working hours', 'Training opportunities'],
      contactEmail: 'hr@techviet.com',
      website: 'https://techviet.com'
    },
    {
      id: '2',
      name: 'Digital Marketing Pro',
      logo: 'DM',
      industry: 'Marketing',
      size: '50-100',
      location: 'Hanoi',
      description: 'Digital marketing agency helping businesses grow online presence.',
      openPositions: [
        {
          id: '3',
          title: 'Digital Marketing Specialist',
          department: 'Marketing',
          level: 'Junior',
          salary: '12-20 triệu VND',
          description: 'Manage social media campaigns and content marketing strategies.',
          requirements: ['Marketing degree preferred', 'Social media experience', 'Creative thinking'],
          skills: ['Social Media', 'Content Creation', 'Analytics', 'SEO'],
          type: 'full-time',
          remote: true,
          postedDate: '2024-01-12',
          deadline: '2024-02-12'
        }
      ],
      requirements: ['Creative mindset', 'Data analysis skills', 'Communication'],
      benefits: ['Creative environment', 'Performance bonus', 'Remote work', 'Career growth'],
      contactEmail: 'careers@digitalmarketingpro.vn',
      website: 'https://digitalmarketingpro.vn'
    }
  ]);

  const [applications, setApplications] = useState<Application[]>([
    {
      id: '1',
      studentId: 'student1',
      companyId: '1',
      positionId: '1',
      status: 'reviewing',
      appliedDate: '2024-01-20',
      message: 'I am very interested in this position and believe my React skills would be valuable.',
      documents: ['CV.pdf', 'Portfolio.pdf']
    }
  ]);

  const isStudent = currentUser.role === 'student';
  const isEnterprise = currentUser.role === 'enterprise';

  const filteredCompanies = companies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         company.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIndustry = !filterIndustry || company.industry === filterIndustry;
    const matchesLocation = !filterLocation || company.location.includes(filterLocation);
    return matchesSearch && matchesIndustry && matchesLocation;
  });

  const allPositions = companies.flatMap(company => 
    company.openPositions.map(position => ({ ...position, company }))
  );

  const filteredPositions = allPositions.filter(position => {
    const matchesSearch = position.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSkills = !filterSkills || position.skills.some(skill => 
      skill.toLowerCase().includes(filterSkills.toLowerCase())
    );
    return matchesSearch && matchesSkills;
  });

  const filteredStudents = students.filter(student => {
    const profile = studentProfiles.find(p => p.studentId === student.id);
    if (!profile) return false;
    
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         profile.technicalSkills.some(skill => 
                           skill.name.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesSkills = !filterSkills || profile.technicalSkills.some(skill => 
      skill.name.toLowerCase().includes(filterSkills.toLowerCase())
    );
    return matchesSearch && matchesSkills;
  });

  const handleApplyPosition = (position: Position, company: Company) => {
    setSelectedPosition({ ...position, company } as any);
    setShowApplicationModal(true);
  };

  const handleSubmitApplication = () => {
    if (!selectedPosition || !applicationMessage.trim()) return;

    const newApplication: Application = {
      id: Date.now().toString(),
      studentId: currentUser.id,
      companyId: (selectedPosition as any).company?.id || '',
      positionId: selectedPosition.id,
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
      message: applicationMessage,
      documents: ['CV.pdf'] // Mock documents
    };

    setApplications([...applications, newApplication]);
    setShowApplicationModal(false);
    setApplicationMessage('');
    setSelectedPosition(null);
  };

  const handleViewStudent = (student: ExtendedStudent) => {
    setSelectedStudent(student);
    setShowStudentModal(true);
  };

  const handleExpressInterest = (student: ExtendedStudent) => {
    // Mock expressing interest in a student
    console.log('Expressing interest in student:', student.fullName);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#f59e0b';
      case 'reviewing': return '#3b82f6';
      case 'interview': return '#8b5cf6';
      case 'accepted': return '#10b981';
      case 'rejected': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Đang chờ';
      case 'reviewing': return 'Đang xem xét';
      case 'interview': return 'Phỏng vấn';
      case 'accepted': return 'Được chấp nhận';
      case 'rejected': return 'Bị từ chối';
      default: return status;
    }
  };

  return (
    <div className="corporate-connection">
      <div className="connection-header">
        <h2>🏢 Kết nối Doanh nghiệp</h2>
        <p>Nền tảng kết nối học viên và doanh nghiệp</p>
      </div>

      <div className="connection-tabs">
        {isStudent && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`}
              onClick={() => setActiveTab('companies')}
            >
              🏢 Doanh nghiệp
            </button>
            <button 
              className={`tab-btn ${activeTab === 'positions' ? 'active' : ''}`}
              onClick={() => setActiveTab('positions')}
            >
              💼 Vị trí tuyển dụng
            </button>
            <button 
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              📝 Đơn ứng tuyển
            </button>
          </>
        )}
        {isEnterprise && (
          <>
            <button 
              className={`tab-btn ${activeTab === 'students' ? 'active' : ''}`}
              onClick={() => setActiveTab('students')}
            >
              👨‍🎓 Hồ sơ học viên
            </button>
            <button 
              className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`}
              onClick={() => setActiveTab('applications')}
            >
              📝 Đơn ứng tuyển
            </button>
          </>
        )}
      </div>

      <div className="connection-filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Tìm kiếm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {activeTab === 'companies' && (
          <>
            <select value={filterIndustry} onChange={(e) => setFilterIndustry(e.target.value)}>
              <option value="">Tất cả ngành</option>
              <option value="Technology">Công nghệ</option>
              <option value="Marketing">Marketing</option>
              <option value="Finance">Tài chính</option>
            </select>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
              <option value="">Tất cả địa điểm</option>
              <option value="Ho Chi Minh">TP. Hồ Chí Minh</option>
              <option value="Hanoi">Hà Nội</option>
              <option value="Da Nang">Đà Nẵng</option>
            </select>
          </>
        )}
        
        {(activeTab === 'positions' || activeTab === 'students') && (
          <input
            type="text"
            placeholder="Lọc theo kỹ năng..."
            value={filterSkills}
            onChange={(e) => setFilterSkills(e.target.value)}
          />
        )}
      </div>

      <div className="connection-content">
        {activeTab === 'companies' && (
          <div className="companies-grid">
            {filteredCompanies.map(company => (
              <div key={company.id} className="company-card">
                <div className="company-header">
                  <div className="company-logo">{company.logo}</div>
                  <div className="company-info">
                    <h3>{company.name}</h3>
                    <p className="company-industry">{company.industry}</p>
                    <p className="company-location">📍 {company.location}</p>
                  </div>
                </div>
                
                <div className="company-description">
                  <p>{company.description}</p>
                </div>
                
                <div className="company-stats">
                  <div className="stat">
                    <span className="stat-label">Quy mô:</span>
                    <span className="stat-value">{company.size} nhân viên</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Vị trí mở:</span>
                    <span className="stat-value">{company.openPositions.length} vị trí</span>
                  </div>
                </div>
                
                <div className="company-actions">
                  <button 
                    className="btn-view-company"
                    onClick={() => setSelectedCompany(company)}
                  >
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="positions-list">
            {filteredPositions.map(position => (
              <div key={position.id} className="position-card">
                <div className="position-header">
                  <div className="position-info">
                    <h3>{position.title}</h3>
                    <p className="company-name">{position.company.name}</p>
                    <p className="position-details">
                      📍 {position.company.location} • 💰 {position.salary} • 
                      {position.remote ? '🏠 Remote' : '🏢 Tại văn phòng'}
                    </p>
                  </div>
                  <div className="position-meta">
                    <span className={`position-type ${position.type}`}>
                      {position.type === 'full-time' ? 'Toàn thời gian' : 
                       position.type === 'part-time' ? 'Bán thời gian' :
                       position.type === 'internship' ? 'Thực tập' : 'Hợp đồng'}
                    </span>
                    <span className="position-level">{position.level}</span>
                  </div>
                </div>
                
                <div className="position-description">
                  <p>{position.description}</p>
                </div>
                
                <div className="position-skills">
                  <h4>Kỹ năng yêu cầu:</h4>
                  <div className="skills-tags">
                    {position.skills.map(skill => (
                      <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
                
                <div className="position-footer">
                  <div className="position-dates">
                    <span>Đăng: {new Date(position.postedDate).toLocaleDateString('vi-VN')}</span>
                    <span>Hạn: {new Date(position.deadline).toLocaleDateString('vi-VN')}</span>
                  </div>
                  {isStudent && (
                    <button 
                      className="btn-apply"
                      onClick={() => handleApplyPosition(position, position.company)}
                    >
                      Ứng tuyển
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="applications-list">
            {applications
              .filter(app => isStudent ? app.studentId === currentUser.id : true)
              .map(application => {
                const company = companies.find(c => c.id === application.companyId);
                const position = company?.openPositions.find(p => p.id === application.positionId);
                const student = students.find(s => s.id === application.studentId);
                
                return (
                  <div key={application.id} className="application-card">
                    <div className="application-header">
                      <div className="application-info">
                        {isStudent ? (
                          <>
                            <h3>{position?.title}</h3>
                            <p className="company-name">{company?.name}</p>
                          </>
                        ) : (
                          <>
                            <h3>{student?.fullName}</h3>
                            <p className="position-name">{position?.title}</p>
                          </>
                        )}
                        <p className="application-date">
                          Ngày nộp: {new Date(application.appliedDate).toLocaleDateString('vi-VN')}
                        </p>
                      </div>
                      <div className="application-status">
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(application.status) }}
                        >
                          {getStatusText(application.status)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="application-message">
                      <h4>Thư xin việc:</h4>
                      <p>{application.message}</p>
                    </div>
                    
                    <div className="application-documents">
                      <h4>Tài liệu đính kèm:</h4>
                      <div className="documents-list">
                        {application.documents.map(doc => (
                          <span key={doc} className="document-tag">📄 {doc}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}

        {activeTab === 'students' && isEnterprise && (
          <div className="students-grid">
            {filteredStudents.map(student => {
              const profile = studentProfiles.find(p => p.studentId === student.id);
              if (!profile) return null;
              
              return (
                <div key={student.id} className="student-card">
                  <div className="student-header">
                    <div className="student-avatar">
                      {student.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div className="student-info">
                      <h3>{student.fullName}</h3>
                      <p className="student-email">{student.email}</p>
                      <p className="student-status">
                        ⭐ {profile.overallRating.toFixed(1)}/5.0
                      </p>
                    </div>
                  </div>
                  
                  <div className="student-skills">
                    <h4>Kỹ năng chính:</h4>
                    <div className="skills-tags">
                      {profile.technicalSkills.slice(0, 4).map(skill => (
                        <span key={skill.name} className="skill-tag">
                          {skill.name} ({skill.level})
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="student-stats">
                    <div className="stat">
                      <span className="stat-label">Dự án:</span>
                      <span className="stat-value">{profile.projectsParticipated}</span>
                    </div>
                    <div className="stat">
                      <span className="stat-label">Task:</span>
                      <span className="stat-value">{profile.tasksCompleted}</span>
                    </div>
                  </div>
                  
                  <div className="student-actions">
                    <button 
                      className="btn-view-profile"
                      onClick={() => handleViewStudent(student)}
                    >
                      Xem hồ sơ
                    </button>
                    <button 
                      className="btn-express-interest"
                      onClick={() => handleExpressInterest(student)}
                    >
                      Quan tâm
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Company Detail Modal */}
      {selectedCompany && (
        <div className="modal-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCompany.name}</h3>
              <button className="close-btn" onClick={() => setSelectedCompany(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="company-detail">
                <div className="company-overview">
                  <h4>Tổng quan</h4>
                  <p>{selectedCompany.description}</p>
                  
                  <div className="company-info-grid">
                    <div className="info-item">
                      <span className="info-label">Ngành:</span>
                      <span className="info-value">{selectedCompany.industry}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Quy mô:</span>
                      <span className="info-value">{selectedCompany.size} nhân viên</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Địa điểm:</span>
                      <span className="info-value">{selectedCompany.location}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Website:</span>
                      <span className="info-value">
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer">
                          {selectedCompany.website}
                        </a>
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="company-positions">
                  <h4>Vị trí tuyển dụng ({selectedCompany.openPositions.length})</h4>
                  <div className="positions-list">
                    {selectedCompany.openPositions.map(position => (
                      <div key={position.id} className="position-item">
                        <div className="position-summary">
                          <h5>{position.title}</h5>
                          <p>{position.department} • {position.level} • {position.salary}</p>
                        </div>
                        {isStudent && (
                          <button 
                            className="btn-apply-small"
                            onClick={() => handleApplyPosition(position, selectedCompany)}
                          >
                            Ứng tuyển
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="company-benefits">
                  <h4>Quyền lợi</h4>
                  <ul>
                    {selectedCompany.benefits.map(benefit => (
                      <li key={benefit}>{benefit}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && selectedPosition && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ứng tuyển: {selectedPosition.title}</h3>
              <button className="close-btn" onClick={() => setShowApplicationModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="application-form">
                <div className="position-summary">
                  <h4>{(selectedPosition as any).company?.name || 'Company Name'}</h4>
                  <p>{selectedPosition.title} • {selectedPosition.salary}</p>
                </div>
                
                <div className="form-group">
                  <label>Thư xin việc *</label>
                  <textarea
                    value={applicationMessage}
                    onChange={(e) => setApplicationMessage(e.target.value)}
                    placeholder="Viết thư xin việc của bạn..."
                    rows={6}
                  />
                </div>
                
                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowApplicationModal(false)}
                  >
                    Hủy
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleSubmitApplication}
                    disabled={!applicationMessage.trim()}
                  >
                    Gửi đơn ứng tuyển
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Student Detail Modal */}
      {showStudentModal && selectedStudent && (
        <div className="modal-overlay" onClick={() => setShowStudentModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Hồ sơ: {selectedStudent.fullName}</h3>
              <button className="close-btn" onClick={() => setShowStudentModal(false)}>×</button>
            </div>
            <div className="modal-body">
              {/* Student profile content would be rendered here */}
              <p>Chi tiết hồ sơ học viên sẽ được hiển thị ở đây...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CorporateConnection;