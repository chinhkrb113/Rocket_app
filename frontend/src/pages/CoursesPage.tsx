import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import Layout from '../components/layout/Layout';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { mockCourses, type Course } from '../data/mockData';
import './CoursesPage.css';

const CoursesPage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  // Load mock data
  useEffect(() => {
    setCourses(mockCourses);
    setFilteredCourses(mockCourses);
  }, []);

  // Filter and search logic
  useEffect(() => {
    let filtered = courses.filter(course => {
      const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.instructor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           course.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesCategory = categoryFilter === 'all' || course.category === categoryFilter;
      const matchesLevel = levelFilter === 'all' || course.level === levelFilter;
      const matchesStatus = statusFilter === 'all' || course.status === statusFilter;
      
      return matchesSearch && matchesCategory && matchesLevel && matchesStatus;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'rating':
          aValue = a.rating;
          bValue = b.rating;
          break;
        case 'studentsCount':
          aValue = a.studentsCount;
          bValue = b.studentsCount;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = a.title;
          bValue = b.title;
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredCourses(filtered);
  }, [courses, searchTerm, categoryFilter, levelFilter, statusFilter, sortBy, sortOrder]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return '#10b981';
      case 'intermediate': return '#f59e0b';
      case 'advanced': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getLevelLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Cơ bản';
      case 'intermediate': return 'Trung cấp';
      case 'advanced': return 'Nâng cao';
      default: return level;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'archived': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'published': return 'Đã xuất bản';
      case 'draft': return 'Bản nháp';
      case 'archived': return 'Đã lưu trữ';
      default: return status;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDuration = (hours: number) => {
    return `${hours} giờ`;
  };

  const uniqueCategories = Array.from(new Set(courses.map(c => c.category)));

  return (
    <Layout>
      <div className="courses-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Quản lý khóa học</h1>
              <p>Tạo và quản lý nội dung đào tạo</p>
            </div>
            <div className="header-actions">
              <Button
                variant="outline"
                onClick={() => setShowAddModal(true)}
              >
                <span>📊</span>
                Báo cáo
              </Button>
              <Button
                variant="primary"
                onClick={() => setShowAddModal(true)}
              >
                <span>➕</span>
                Tạo khóa học
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">📚</div>
            <div className="stat-content">
              <h3>{courses.length}</h3>
              <p>Tổng khóa học</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h3>{courses.filter(c => c.status === 'active').length}</h3>
              <p>Đang hoạt động</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <h3>{courses.reduce((acc, c) => acc + c.studentsCount, 0)}</h3>
              <p>Tổng học viên</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h3>{(courses.reduce((acc, c) => acc + c.rating, 0) / courses.length).toFixed(1)}</h3>
              <p>Đánh giá trung bình</p>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="filters-section">
          <div className="search-filters">
            <div className="search-container">
              <Input
                placeholder="Tìm kiếm khóa học..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}

              />
            </div>
            
            <div className="filter-group">
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả danh mục</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select 
                value={levelFilter} 
                onChange={(e) => setLevelFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả cấp độ</option>
                <option value="beginner">Cơ bản</option>
                <option value="intermediate">Trung cấp</option>
                <option value="advanced">Nâng cao</option>
              </select>
              
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="published">Đã xuất bản</option>
                <option value="draft">Bản nháp</option>
                <option value="archived">Đã lưu trữ</option>
              </select>
            </div>
          </div>
          
          <div className="view-controls">
            <div className="view-toggle">
              <button 
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                ⊞
              </button>
              <button 
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                📋
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
              <option value="title-asc">Tên A-Z</option>
              <option value="title-desc">Tên Z-A</option>
              <option value="rating-desc">Đánh giá cao nhất</option>
              <option value="studentsCount-desc">Nhiều học viên nhất</option>
              <option value="price-asc">Giá thấp nhất</option>
              <option value="price-desc">Giá cao nhất</option>
              <option value="createdAt-desc">Mới nhất</option>
            </select>
          </div>
        </div>

        {/* Courses Grid/List */}
        <div className={`courses-container ${viewMode}`}>
          {filteredCourses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-thumbnail">
                <img src={course.thumbnail} alt={course.title} />
                <div className="course-overlay">
                  <div className="overlay-actions">
                    <button className="action-btn" title="Xem trước">
                      👁️
                    </button>
                    <button className="action-btn" title="Chỉnh sửa">
                      ✏️
                    </button>
                    <button className="action-btn" title="Sao chép">
                      📋
                    </button>
                  </div>
                </div>
                <div className="course-badges">
                  <span 
                    className="level-badge" 
                    style={{ backgroundColor: getLevelColor(course.level) }}
                  >
                    {getLevelLabel(course.level)}
                  </span>
                  <span 
                    className="status-badge" 
                    style={{ backgroundColor: getStatusColor(course.status) }}
                  >
                    {getStatusLabel(course.status)}
                  </span>
                </div>
              </div>
              
              <div className="course-content">
                <div className="course-header">
                  <h3 className="course-title">{course.title}</h3>
                  <div className="course-category">{course.category}</div>
                </div>
                
                <p className="course-description">{course.description}</p>
                
                <div className="course-instructor">
                  <span className="instructor-icon">👨‍🏫</span>
                  <span>{course.instructor}</span>
                </div>
                
                <div className="course-stats">
                  <div className="stat-item">
                    <span className="stat-icon">⭐</span>
                    <span className="stat-value">{course.rating}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">👥</span>
                    <span className="stat-value">{course.studentsCount}</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">📖</span>
                    <span className="stat-value">{course.lessonsCount} bài</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-icon">⏱️</span>
                    <span className="stat-value">{formatDuration(course.duration)}</span>
                  </div>
                </div>
                
                <div className="course-progress">
                  <div className="progress-header">
                    <span>Học viên đã đăng ký</span>
                    <span>{course.studentsCount}</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min((course.studentsCount / 300) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="course-tags">
                  {course.tags.map(tag => (
                    <span key={tag} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
              
              <div className="course-footer">
                <div className="course-price">
                  <span className="price">{formatPrice(course.price)}</span>
                </div>
                <div className="course-actions">
                  <Button variant="outline" size="small">
                    📊 Thống kê
                  </Button>
                  <Button variant="primary" size="small">
                    ✏️ Chỉnh sửa
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredCourses.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>Không tìm thấy khóa học</h3>
            <p>Thử thay đổi bộ lọc hoặc tạo khóa học mới</p>
            <Button variant="primary" onClick={() => setShowAddModal(true)}>
              Tạo khóa học đầu tiên
            </Button>
          </div>
        )}

        {/* Results Info */}
        {filteredCourses.length > 0 && (
          <div className="results-info">
            Hiển thị {filteredCourses.length} khóa học
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CoursesPage;