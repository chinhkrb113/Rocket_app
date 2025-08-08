import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { login } from '../store/slices/authSlice';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import TestCredentials from '../components/auth/TestCredentials';
import './LoginPage.css';

interface LoginForm {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Partial<LoginForm>>({});
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useAppSelector(state => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<LoginForm> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await dispatch(login({
        email: formData.email,
        password: formData.password
      })).unwrap();
      
      navigate('/dashboard');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleSelectTestCredentials = (testEmail: string, testPassword: string) => {
    setFormData(prev => ({
      ...prev,
      email: testEmail,
      password: testPassword
    }));
  };

  const handleInputChange = (field: keyof LoginForm) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'admin@rockettraining.com',
      password: 'admin123'
    });
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <span className="logo-icon">🚀</span>
              <h1>Rocket Training</h1>
            </div>
            
            <div className="brand-description">
              <h2>Chào mừng trở lại!</h2>
              <p>Hệ thống quản lý đào tạo hiện đại và thông minh</p>
            </div>
            
            <div className="features-list">
              <div className="feature-item">
                <span className="feature-icon">📊</span>
                <div className="feature-text">
                  <h4>Phân tích thông minh</h4>
                  <p>Theo dõi tiến độ học tập chi tiết</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">👥</span>
                <div className="feature-text">
                  <h4>Quản lý học viên</h4>
                  <p>Tối ưu hóa trải nghiệm học tập</p>
                </div>
              </div>
              
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <div className="feature-text">
                  <h4>Tự động hóa</h4>
                  <p>AI hỗ trợ tối ưu quy trình</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial">
              <div className="testimonial-content">
                <p>"Rocket Training đã giúp chúng tôi tăng hiệu quả đào tạo lên 300%"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">👨‍💼</div>
                  <div className="author-info">
                    <span className="author-name">Nguyễn Văn A</span>
                    <span className="author-role">Giám đốc Đào tạo</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Đăng nhập</h2>
              <p>Nhập thông tin để truy cập hệ thống</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Nhập email của bạn"
                  value={formData.email}
                  onChange={handleInputChange('email')}
                  error={errors.email}
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <div className="password-input-container">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange('password')}
                    error={errors.password}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
              </div>

              <div className="form-options">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  <span className="checkbox-label">Ghi nhớ đăng nhập</span>
                </label>
                
                <button type="button" className="forgot-password">
                  Quên mật khẩu?
                </button>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                loading={loading}
                className="login-button"
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              <div className="divider">
                <span>hoặc</span>
              </div>

              <Button
                type="button"
                variant="outline"
                size="large"
                onClick={handleDemoLogin}
                className="demo-button"
              >
                <span>🎮</span>
                Dùng thử với tài khoản demo
              </Button>
            </form>

            {/* Test Credentials Component */}
            <TestCredentials onSelectCredentials={handleSelectTestCredentials} />

            <div className="form-footer">
              <p>
                Chưa có tài khoản? 
                <button className="signup-link">Đăng ký ngay</button>
              </p>
              
              <div className="social-login">
                <p>Hoặc đăng nhập bằng:</p>
                <div className="social-buttons">
                  <button className="social-btn google">
                    <span>🔍</span>
                    Google
                  </button>
                  <button className="social-btn microsoft">
                    <span>🪟</span>
                    Microsoft
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Background Animation */}
      <div className="background-animation">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
        <div className="floating-shape shape-4"></div>
      </div>
    </div>
  );
};

export default LoginPage;