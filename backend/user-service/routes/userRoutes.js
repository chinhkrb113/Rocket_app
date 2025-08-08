const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/auth');

const router = express.Router();

// Validation middleware
const validateUserCreation = [
  body('full_name')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('role')
    .optional()
    .isIn(['student', 'staff', 'admin', 'enterprise_contact'])
    .withMessage('Invalid role')
];

const validateUserUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('is_active')
    .optional()
    .isBoolean()
    .withMessage('is_active must be a boolean value')
];

const validateProfileUpdate = [
  body('full_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Full name must be between 2 and 255 characters'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number')
];

const validatePasswordChange = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Protected routes - require authentication
router.use(protect);

// Current user routes
router.get('/me', userController.getCurrentUser);
router.patch('/me', validateProfileUpdate, userController.updateCurrentUser);
router.patch('/me/password', validatePasswordChange, userController.changePassword);
router.patch('/me/verify-email', userController.verifyEmail);

// Admin only routes
router.use(restrictTo('admin'));

// User management routes (admin only)
router
  .route('/')
  .get(userController.getAllUsers)
  .post(validateUserCreation, userController.createUser);

router.get('/stats', userController.getUserStats);
router.get('/role/:role', userController.getUsersByRole);

router
  .route('/:id')
  .get(userController.getUserById)
  .patch(validateUserUpdate, userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:id/verify-email', userController.verifyEmail);

module.exports = router;