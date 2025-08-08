const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const axios = require('axios');
const { testConnection } = require('./config/database');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// AI Service URL
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    await testConnection();
    res.status(200).json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'main-backend-service',
      database: 'connected',
      uptime: process.uptime()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'ERROR', 
      timestamp: new Date().toISOString(),
      service: 'main-backend-service',
      database: 'disconnected',
      uptime: process.uptime(),
      error: error.message
    });
  }
});

// API routes
app.use('/api', apiRoutes);

// Notifications routes
const notificationRoutes = require('./routes/notifications');
app.use('/api/notifications', notificationRoutes);

// Auth endpoints (mock - to be replaced with proper auth)
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Mock authentication
  if (email && password) {
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: 1,
          email: email,
          fullName: 'Test User',
          role: email.includes('admin') ? 'admin' : 
                email.includes('instructor') ? 'instructor' : 
                email.includes('enterprise') ? 'enterprise' : 'student'
        },
        token: 'mock-jwt-token-' + Date.now()
      }
    });
  } else {
    res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }
});

app.post('/api/auth/register', async (req, res) => {
  const { email, password, fullName, role } = req.body;
  
  // Mock registration
  res.json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        id: Date.now(),
        email,
        fullName,
        role: role || 'student'
      }
    }
  });
});

// Students endpoints
app.get('/api/students', async (req, res) => {
  // Mock students data
  res.json({
    success: true,
    data: [
      {
        id: 1,
        fullName: 'Nguyễn Văn A',
        email: 'student1@example.com',
        skills: ['JavaScript', 'React', 'Node.js'],
        experience: 'Beginner',
        status: 'active'
      },
      {
        id: 2,
        fullName: 'Trần Thị B',
        email: 'student2@example.com',
        skills: ['Python', 'Django', 'PostgreSQL'],
        experience: 'Intermediate',
        status: 'active'
      }
    ]
  });
});

// AI Service proxy endpoints
app.post('/api/ai/analyze-submission', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/students/analyze-submission`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('AI Service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI Service unavailable',
      error: error.message
    });
  }
});

app.post('/api/ai/recommend-candidates', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/enterprises/recommend-candidates`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('AI Service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI Service unavailable',
      error: error.message
    });
  }
});

app.post('/api/ai/score-lead', async (req, res) => {
  try {
    const response = await axios.post(`${AI_SERVICE_URL}/api/leads/score`, req.body);
    res.json(response.data);
  } catch (error) {
    console.error('AI Service error:', error.message);
    res.status(500).json({
      success: false,
      message: 'AI Service unavailable',
      error: error.message
    });
  }
});

// Enterprise endpoints
app.get('/api/enterprises/projects', async (req, res) => {
  try {
    const { enterprise_id, page = 1, limit = 10 } = req.query;
    const enterpriseService = require('./services/enterpriseService');
    
    const result = await enterpriseService.getProjects(
      enterprise_id ? parseInt(enterprise_id) : null,
      parseInt(page),
      parseInt(limit)
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    });
  }
});

app.post('/api/enterprises/projects', async (req, res) => {
  try {
    const enterpriseService = require('./services/enterpriseService');
    const projectData = {
      ...req.body,
      createdBy: req.body.createdBy || 1 // Mock user ID for now
    };
    
    const project = await enterpriseService.createProject(projectData);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize database connection and start server
async function startServer() {
  try {
    await testConnection();
    console.log('Database connection established successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Main Backend Service is running on port ${PORT}`);
      console.log(`📡 AI Service URL: ${AI_SERVICE_URL}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    console.log('Starting server without database connection...');
    
    app.listen(PORT, () => {
      console.log(`🚀 Main Backend Service is running on port ${PORT} (database disconnected)`);
      console.log(`📡 AI Service URL: ${AI_SERVICE_URL}`);
      console.log(`Health check available at http://localhost:${PORT}/health`);
    });
  }
}

startServer();

module.exports = app;