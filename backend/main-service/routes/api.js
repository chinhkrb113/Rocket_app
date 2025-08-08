const express = require('express');
const router = express.Router();

// Import services
const userService = require('../services/userService');
const studentService = require('../services/studentService');
const courseService = require('../services/courseService');
const enterpriseService = require('../services/enterpriseService');
const leadService = require('../services/leadService');

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// User routes
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, role } = req.query;
  const result = await userService.getAllUsers(parseInt(page), parseInt(limit), role);
  res.json(result);
}));

router.get('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}));

router.post('/users', asyncHandler(async (req, res) => {
  const userId = await userService.createUser(req.body);
  const user = await userService.getUserById(userId);
  res.status(201).json(user);
}));

router.put('/users/:id', asyncHandler(async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json(user);
}));

// Student routes
router.get('/students', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const result = await studentService.getAllStudents(parseInt(page), parseInt(limit));
  res.json(result);
}));

router.get('/students/:id', asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
}));

router.get('/students/:id/analytics', asyncHandler(async (req, res) => {
  const analytics = await studentService.getStudentAnalytics(req.params.id);
  if (!analytics) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(analytics);
}));

router.post('/students', asyncHandler(async (req, res) => {
  const studentId = await studentService.createStudent(req.body);
  const student = await studentService.getStudentById(studentId);
  res.status(201).json(student);
}));

router.put('/students/:id', asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }
  res.json(student);
}));

// Course routes
router.get('/courses', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, level } = req.query;
  const result = await courseService.getAllCourses(parseInt(page), parseInt(limit), category, level);
  res.json(result);
}));

router.get('/courses/:id', asyncHandler(async (req, res) => {
  const course = await courseService.getCourseById(req.params.id);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
}));

router.get('/courses/stats/overview', asyncHandler(async (req, res) => {
  const stats = await courseService.getCourseStats();
  res.json(stats);
}));

router.post('/courses', asyncHandler(async (req, res) => {
  const courseId = await courseService.createCourse(req.body);
  const course = await courseService.getCourseById(courseId);
  res.status(201).json(course);
}));

router.put('/courses/:id', asyncHandler(async (req, res) => {
  const course = await courseService.updateCourse(req.params.id, req.body);
  if (!course) {
    return res.status(404).json({ error: 'Course not found' });
  }
  res.json(course);
}));

router.post('/courses/:id/enroll', asyncHandler(async (req, res) => {
  const { studentId } = req.body;
  const result = await courseService.enrollStudent(req.params.id, studentId);
  res.json(result);
}));

// Enterprise routes
router.get('/enterprises', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, industry } = req.query;
  const result = await enterpriseService.getAllEnterprises(parseInt(page), parseInt(limit), industry);
  res.json(result);
}));

router.get('/enterprises/:id', asyncHandler(async (req, res) => {
  const enterprise = await enterpriseService.getEnterpriseById(req.params.id);
  if (!enterprise) {
    return res.status(404).json({ error: 'Enterprise not found' });
  }
  res.json(enterprise);
}));

router.get('/enterprises/stats/overview', asyncHandler(async (req, res) => {
  const stats = await enterpriseService.getEnterpriseStats();
  res.json(stats);
}));

router.get('/enterprises/:id/projects', asyncHandler(async (req, res) => {
  const projects = await enterpriseService.getProjects(req.params.id);
  res.json(projects);
}));

router.get('/projects', asyncHandler(async (req, res) => {
  const projects = await enterpriseService.getProjects();
  res.json(projects);
}));

router.post('/enterprises', asyncHandler(async (req, res) => {
  const enterpriseId = await enterpriseService.createEnterprise(req.body);
  const enterprise = await enterpriseService.getEnterpriseById(enterpriseId);
  res.status(201).json(enterprise);
}));

router.put('/enterprises/:id', asyncHandler(async (req, res) => {
  const enterprise = await enterpriseService.updateEnterprise(req.params.id, req.body);
  if (!enterprise) {
    return res.status(404).json({ error: 'Enterprise not found' });
  }
  res.json(enterprise);
}));

router.post('/projects', asyncHandler(async (req, res) => {
  const project = await enterpriseService.createProject(req.body);
  res.status(201).json(project);
}));

// Lead routes
router.get('/leads', asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, source, search } = req.query;
  
  let result;
  if (search) {
    result = await leadService.searchLeads(search, parseInt(page), parseInt(limit));
  } else {
    result = await leadService.getAllLeads(parseInt(page), parseInt(limit), status, source);
  }
  
  res.json(result);
}));

router.get('/leads/:id', asyncHandler(async (req, res) => {
  const lead = await leadService.getLeadById(req.params.id);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
}));

router.get('/leads/stats/overview', asyncHandler(async (req, res) => {
  const stats = await leadService.getLeadStats();
  res.json(stats);
}));

router.post('/leads', asyncHandler(async (req, res) => {
  const leadId = await leadService.createLead(req.body);
  const lead = await leadService.getLeadById(leadId);
  res.status(201).json(lead);
}));

router.put('/leads/:id', asyncHandler(async (req, res) => {
  const lead = await leadService.updateLead(req.params.id, req.body);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
}));

router.patch('/leads/:id/status', asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  const lead = await leadService.updateLeadStatus(req.params.id, status, notes);
  if (!lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }
  res.json(lead);
}));

router.delete('/leads/:id', asyncHandler(async (req, res) => {
  await leadService.deleteLead(req.params.id);
  res.status(204).send();
}));

// Dashboard stats route
router.get('/dashboard/stats', asyncHandler(async (req, res) => {
  const [userStats, courseStats, enterpriseStats, leadStats] = await Promise.all([
    userService.getAllUsers(1, 1), // Just to get total count
    courseService.getCourseStats(),
    enterpriseService.getEnterpriseStats(),
    leadService.getLeadStats()
  ]);
  
  res.json({
    users: {
      total: userStats.pagination.total,
      active: userStats.pagination.total // Assuming all users are active for now
    },
    courses: courseStats,
    enterprises: enterpriseStats,
    leads: leadStats
  });
}));

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('API Error:', error);
  
  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ 
      error: 'Duplicate entry', 
      message: 'A record with this information already exists' 
    });
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({ 
      error: 'Invalid reference', 
      message: 'Referenced record does not exist' 
    });
  }
  
  res.status(500).json({ 
    error: 'Internal server error', 
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
  });
});

module.exports = router;