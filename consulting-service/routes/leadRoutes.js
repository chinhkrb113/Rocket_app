const express = require('express');
const { body, param, query } = require('express-validator');
const leadController = require('../controllers/leadController');
const auth = require('../middleware/auth');
const rateLimit = require('../middleware/rateLimit');

const router = express.Router();

// Rate limiting for lead creation (prevent spam)
const createLeadLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        success: false,
        message: 'Too many lead submissions, please try again later.'
    }
});

// Validation rules
const createLeadValidation = [
    body('fullName')
        .trim()
        .isLength({ min: 2, max: 100 })
        .withMessage('Full name must be between 2 and 100 characters'),
    body('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Please provide a valid email address'),
    body('phone')
        .optional()
        .isMobilePhone()
        .withMessage('Please provide a valid phone number'),
    body('source')
        .optional()
        .isIn(['web_form', 'chatbot', 'phone_call', 'email', 'social_media', 'referral', 'other'])
        .withMessage('Invalid source'),
    body('message')
        .trim()
        .isLength({ min: 10, max: 1000 })
        .withMessage('Message must be between 10 and 1000 characters')
];

const updateStatusValidation = [
    param('id')
        .isInt({ min: 1 })
        .withMessage('Lead ID must be a positive integer'),
    body('status')
        .isIn(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'])
        .withMessage('Invalid status'),
    body('notes')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Notes must not exceed 500 characters')
];

const getLeadsValidation = [
    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),
    query('status')
        .optional()
        .isIn(['new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost'])
        .withMessage('Invalid status filter'),
    query('source')
        .optional()
        .isIn(['web_form', 'chatbot', 'phone_call', 'email', 'social_media', 'referral', 'other'])
        .withMessage('Invalid source filter'),
    query('minScore')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Minimum score must be a non-negative integer'),
    query('maxScore')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Maximum score must be a non-negative integer'),
    query('sortBy')
        .optional()
        .isIn(['created_at', 'updated_at', 'score', 'full_name', 'email'])
        .withMessage('Invalid sort field'),
    query('sortOrder')
        .optional()
        .isIn(['ASC', 'DESC'])
        .withMessage('Sort order must be ASC or DESC')
];

// Routes

/**
 * @route   POST /api/leads
 * @desc    Create a new lead and automatically score it
 * @access  Public (with rate limiting)
 */
router.post('/', 
    createLeadLimiter,
    createLeadValidation,
    leadController.createLead
);

/**
 * @route   GET /api/leads
 * @desc    Get all leads with filtering and pagination
 * @access  Private (Admin/Consultant)
 */
router.get('/',
    auth.authenticate,
    auth.authorize(['admin', 'consultant']),
    getLeadsValidation,
    leadController.getLeads
);

/**
 * @route   GET /api/leads/:id
 * @desc    Get a specific lead by ID
 * @access  Private (Admin/Consultant)
 */
router.get('/:id',
    auth.authenticate,
    auth.authorize(['admin', 'consultant']),
    param('id').isInt({ min: 1 }).withMessage('Lead ID must be a positive integer'),
    leadController.getLeadById
);

/**
 * @route   PUT /api/leads/:id/status
 * @desc    Update lead status
 * @access  Private (Admin/Consultant)
 */
router.put('/:id/status',
    auth.authenticate,
    auth.authorize(['admin', 'consultant']),
    updateStatusValidation,
    leadController.updateLeadStatus
);

/**
 * @route   POST /api/leads/:id/score
 * @desc    Manually trigger lead scoring
 * @access  Private (Admin)
 */
router.post('/:id/score',
    auth.authenticate,
    auth.authorize(['admin']),
    param('id').isInt({ min: 1 }).withMessage('Lead ID must be a positive integer'),
    leadController.scoreLeadManually
);

/**
 * @route   GET /api/leads/stats/summary
 * @desc    Get lead statistics summary
 * @access  Private (Admin/Consultant)
 */
router.get('/stats/summary',
    auth.authenticate,
    auth.authorize(['admin', 'consultant']),
    async (req, res) => {
        try {
            const db = require('../config/database');
            
            // Get lead statistics
            const [statsResult] = await db.execute(`
                SELECT 
                    COUNT(*) as total_leads,
                    SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads,
                    SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified_leads,
                    SUM(CASE WHEN status = 'converted' THEN 1 ELSE 0 END) as converted_leads,
                    AVG(score) as average_score,
                    SUM(CASE WHEN score > 50 THEN 1 ELSE 0 END) as high_quality_leads,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as leads_this_week,
                    SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 ELSE 0 END) as leads_this_month
                FROM leads
            `);
            
            // Get leads by source
            const [sourceResult] = await db.execute(`
                SELECT source, COUNT(*) as count
                FROM leads
                GROUP BY source
                ORDER BY count DESC
            `);
            
            // Get recent high-quality leads
            const [recentLeads] = await db.execute(`
                SELECT id, full_name, email, score, source, created_at
                FROM leads
                WHERE score > 50
                ORDER BY created_at DESC
                LIMIT 10
            `);
            
            res.json({
                success: true,
                data: {
                    summary: statsResult[0],
                    by_source: sourceResult,
                    recent_high_quality: recentLeads
                }
            });
            
        } catch (error) {
            console.error('Error getting lead stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
);

/**
 * @route   GET /api/leads/export/csv
 * @desc    Export leads to CSV
 * @access  Private (Admin)
 */
router.get('/export/csv',
    auth.authenticate,
    auth.authorize(['admin']),
    async (req, res) => {
        try {
            const db = require('../config/database');
            
            const [leads] = await db.execute(`
                SELECT 
                    id, full_name, email, phone, source, status, 
                    score, quality, created_at, updated_at
                FROM leads
                ORDER BY created_at DESC
            `);
            
            // Convert to CSV
            const csv = [
                'ID,Full Name,Email,Phone,Source,Status,Score,Quality,Created At,Updated At',
                ...leads.map(lead => [
                    lead.id,
                    `"${lead.full_name}"`,
                    lead.email,
                    lead.phone || '',
                    lead.source,
                    lead.status,
                    lead.score,
                    lead.quality || '',
                    lead.created_at,
                    lead.updated_at
                ].join(','))
            ].join('\n');
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="leads_${new Date().toISOString().split('T')[0]}.csv"`);
            res.send(csv);
            
        } catch (error) {
            console.error('Error exporting leads:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
);

module.exports = router;