const db = require('../config/database');
const axios = require('axios');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

// AI Service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_TIMEOUT = 10000; // 10 seconds

/**
 * Create a new lead and automatically score it
 */
const createAndScoreLead = async (leadData) => {
    const connection = await db.getConnection();
    
    try {
        await connection.beginTransaction();
        
        // 1. Insert lead into database with initial status 'new' and score 0
        const leadInsertQuery = `
            INSERT INTO leads (full_name, email, phone, source, status, score, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'new', 0, NOW(), NOW())
        `;
        
        const [leadResult] = await connection.execute(leadInsertQuery, [
            leadData.fullName,
            leadData.email,
            leadData.phone,
            leadData.source
        ]);
        
        const leadId = leadResult.insertId;
        logger.info(`Lead created with ID: ${leadId}`);
        
        // 2. Insert initial message into interactions table
        if (leadData.message) {
            const interactionInsertQuery = `
                INSERT INTO interactions (lead_id, type, content, page_url, duration, created_at)
                VALUES (?, 'form_submission', ?, '/contact', 0, NOW())
            `;
            
            await connection.execute(interactionInsertQuery, [
                leadId,
                leadData.message
            ]);
            
            logger.info(`Interaction created for lead ${leadId}`);
        }
        
        // 3. Call AI service to score the lead
        let scoringResult;
        try {
            scoringResult = await callAIServiceForScoring(leadId);
        } catch (aiError) {
            logger.error(`AI scoring failed for lead ${leadId}:`, aiError);
            // Continue without scoring - we can score later
            scoringResult = {
                lead_score: 0,
                quality: 'unqualified',
                needs_human_intervention: true,
                interaction_details: ['AI scoring failed - manual review required']
            };
        }
        
        // 4. Update lead with score and quality
        const updateLeadQuery = `
            UPDATE leads 
            SET score = ?, quality = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        await connection.execute(updateLeadQuery, [
            scoringResult.lead_score,
            scoringResult.quality,
            leadId
        ]);
        
        // 5. Handle lead qualification and notifications
        const notifications = [];
        
        // If score > 50, update status to 'qualified'
        if (scoringResult.lead_score > 50) {
            const qualifyLeadQuery = `
                UPDATE leads 
                SET status = 'qualified', updated_at = NOW()
                WHERE id = ?
            `;
            
            await connection.execute(qualifyLeadQuery, [leadId]);
            
            // Create notification for qualified lead
            const qualifiedNotification = await notificationService.createNotification({
                type: 'lead_qualified',
                title: 'New Qualified Lead',
                message: `Lead ${leadData.fullName} (${leadData.email}) has been automatically qualified with score ${scoringResult.lead_score}`,
                priority: 'high',
                data: {
                    lead_id: leadId,
                    score: scoringResult.lead_score,
                    source: leadData.source
                }
            });
            
            notifications.push(qualifiedNotification);
            logger.info(`Lead ${leadId} qualified with score ${scoringResult.lead_score}`);
        }
        
        // If needs human intervention, create notification
        if (scoringResult.needs_human_intervention) {
            const interventionNotification = await notificationService.createNotification({
                type: 'lead_needs_attention',
                title: 'Lead Requires Human Intervention',
                message: `Lead ${leadData.fullName} (${leadData.email}) requires manual review. Reason: ${scoringResult.interaction_details.join(', ')}`,
                priority: 'urgent',
                data: {
                    lead_id: leadId,
                    score: scoringResult.lead_score,
                    source: leadData.source,
                    intervention_reason: scoringResult.interaction_details
                }
            });
            
            notifications.push(interventionNotification);
            logger.info(`Lead ${leadId} flagged for human intervention`);
        }
        
        await connection.commit();
        
        // Get the complete lead data
        const [leadRows] = await connection.execute(
            'SELECT * FROM leads WHERE id = ?',
            [leadId]
        );
        
        return {
            success: true,
            data: {
                lead: leadRows[0],
                score: scoringResult.lead_score,
                needs_human_intervention: scoringResult.needs_human_intervention,
                notifications_created: notifications.length
            }
        };
        
    } catch (error) {
        await connection.rollback();
        logger.error('Error in createAndScoreLead:', error);
        return {
            success: false,
            error: error.message
        };
    } finally {
        connection.release();
    }
};

/**
 * Call AI service to score a lead
 */
const callAIServiceForScoring = async (leadId) => {
    try {
        const response = await axios.post(
            `${AI_SERVICE_URL}/leads/score-by-id`,
            { lead_id: leadId.toString() },
            {
                timeout: AI_SERVICE_TIMEOUT,
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
        
        if (response.data && response.data.success !== false) {
            return response.data;
        } else {
            throw new Error('AI service returned unsuccessful response');
        }
        
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            throw new Error('AI service is not available');
        } else if (error.code === 'ETIMEDOUT') {
            throw new Error('AI service request timed out');
        } else {
            throw new Error(`AI service error: ${error.message}`);
        }
    }
};

/**
 * Get leads with filtering and pagination
 */
const getLeads = async (filters = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 10,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;
        
        const offset = (page - 1) * limit;
        
        // Build WHERE clause
        const whereConditions = [];
        const queryParams = [];
        
        if (filters.status) {
            whereConditions.push('status = ?');
            queryParams.push(filters.status);
        }
        
        if (filters.source) {
            whereConditions.push('source = ?');
            queryParams.push(filters.source);
        }
        
        if (filters.minScore !== undefined) {
            whereConditions.push('score >= ?');
            queryParams.push(filters.minScore);
        }
        
        if (filters.maxScore !== undefined) {
            whereConditions.push('score <= ?');
            queryParams.push(filters.maxScore);
        }
        
        const whereClause = whereConditions.length > 0 
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';
        
        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM leads ${whereClause}`;
        const [countResult] = await db.execute(countQuery, queryParams);
        const total = countResult[0].total;
        
        // Get leads
        const leadsQuery = `
            SELECT id, full_name, email, phone, source, status, score, quality, created_at, updated_at
            FROM leads 
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;
        
        const [leads] = await db.execute(leadsQuery, [...queryParams, limit, offset]);
        
        return {
            success: true,
            data: leads,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
        
    } catch (error) {
        logger.error('Error in getLeads:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get a specific lead by ID
 */
const getLeadById = async (leadId) => {
    try {
        const [leadRows] = await db.execute(
            'SELECT * FROM leads WHERE id = ?',
            [leadId]
        );
        
        if (leadRows.length === 0) {
            return {
                success: false,
                error: 'Lead not found'
            };
        }
        
        // Get interactions for this lead
        const [interactions] = await db.execute(
            'SELECT * FROM interactions WHERE lead_id = ? ORDER BY created_at ASC',
            [leadId]
        );
        
        return {
            success: true,
            data: {
                ...leadRows[0],
                interactions
            }
        };
        
    } catch (error) {
        logger.error('Error in getLeadById:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Update lead status
 */
const updateLeadStatus = async (leadId, status, notes = null) => {
    try {
        const updateQuery = `
            UPDATE leads 
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        const [result] = await db.execute(updateQuery, [status, notes, leadId]);
        
        if (result.affectedRows === 0) {
            return {
                success: false,
                error: 'Lead not found'
            };
        }
        
        // Get updated lead
        const [leadRows] = await db.execute(
            'SELECT * FROM leads WHERE id = ?',
            [leadId]
        );
        
        return {
            success: true,
            data: leadRows[0]
        };
        
    } catch (error) {
        logger.error('Error in updateLeadStatus:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Score an existing lead
 */
const scoreExistingLead = async (leadId) => {
    try {
        // Call AI service to score the lead
        const scoringResult = await callAIServiceForScoring(leadId);
        
        // Update lead with new score
        const updateQuery = `
            UPDATE leads 
            SET score = ?, quality = ?, updated_at = NOW()
            WHERE id = ?
        `;
        
        await db.execute(updateQuery, [
            scoringResult.lead_score,
            scoringResult.quality,
            leadId
        ]);
        
        // Handle notifications if needed
        const notifications = [];
        
        if (scoringResult.needs_human_intervention) {
            const notification = await notificationService.createNotification({
                type: 'lead_needs_attention',
                title: 'Lead Requires Human Intervention',
                message: `Lead ID ${leadId} requires manual review after re-scoring.`,
                priority: 'urgent',
                data: {
                    lead_id: leadId,
                    score: scoringResult.lead_score
                }
            });
            
            notifications.push(notification);
        }
        
        return {
            success: true,
            data: {
                score: scoringResult.lead_score,
                needs_human_intervention: scoringResult.needs_human_intervention,
                notifications_created: notifications.length
            }
        };
        
    } catch (error) {
        logger.error('Error in scoreExistingLead:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    createAndScoreLead,
    getLeads,
    getLeadById,
    updateLeadStatus,
    scoreExistingLead,
    callAIServiceForScoring
};