const leadService = require('../services/leadService');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * Create a new lead and automatically score it
 * POST /leads
 */
const createLead = async (req, res) => {
    try {
        // Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { fullName, email, phone, source, message } = req.body;

        // Create lead data object
        const leadData = {
            fullName,
            email,
            phone,
            source: source || 'web_form',
            message,
            status: 'new',
            score: 0
        };

        logger.info(`Creating new lead: ${email} from ${source}`);

        // Create lead and process scoring
        const result = await leadService.createAndScoreLead(leadData);

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to create lead',
                error: result.error
            });
        }

        logger.info(`Lead created successfully: ID ${result.data.lead.id}, Score: ${result.data.score}`);

        return res.status(201).json({
            success: true,
            message: 'Lead created and scored successfully',
            data: {
                lead: result.data.lead,
                score: result.data.score,
                needs_human_intervention: result.data.needs_human_intervention,
                notifications_created: result.data.notifications_created
            }
        });

    } catch (error) {
        logger.error('Error in createLead controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get all leads with optional filtering
 * GET /leads
 */
const getLeads = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            source,
            minScore,
            maxScore,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = req.query;

        const filters = {
            status,
            source,
            minScore: minScore ? parseInt(minScore) : undefined,
            maxScore: maxScore ? parseInt(maxScore) : undefined
        };

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sortBy,
            sortOrder: sortOrder.toUpperCase()
        };

        const result = await leadService.getLeads(filters, options);

        return res.status(200).json({
            success: true,
            data: result.data,
            pagination: result.pagination
        });

    } catch (error) {
        logger.error('Error in getLeads controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Get a specific lead by ID
 * GET /leads/:id
 */
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await leadService.getLeadById(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: result.data
        });

    } catch (error) {
        logger.error('Error in getLeadById controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Update lead status
 * PUT /leads/:id/status
 */
const updateLeadStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status is required'
            });
        }

        const result = await leadService.updateLeadStatus(id, status, notes);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lead status updated successfully',
            data: result.data
        });

    } catch (error) {
        logger.error('Error in updateLeadStatus controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

/**
 * Manually trigger lead scoring
 * POST /leads/:id/score
 */
const scoreLeadManually = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await leadService.scoreExistingLead(id);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'Lead not found or scoring failed',
                error: result.error
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Lead scored successfully',
            data: {
                lead_id: id,
                score: result.data.score,
                needs_human_intervention: result.data.needs_human_intervention,
                notifications_created: result.data.notifications_created
            }
        });

    } catch (error) {
        logger.error('Error in scoreLeadManually controller:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
};

module.exports = {
    createLead,
    getLeads,
    getLeadById,
    updateLeadStatus,
    scoreLeadManually
};