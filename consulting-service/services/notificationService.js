const db = require('../config/database');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

// Event emitter for real-time notifications
const notificationEmitter = new EventEmitter();

/**
 * Create a new notification
 */
const createNotification = async (notificationData) => {
    try {
        const {
            type,
            title,
            message,
            priority = 'medium',
            data = {},
            recipient_id = null,
            recipient_type = 'admin' // admin, user, team
        } = notificationData;

        const insertQuery = `
            INSERT INTO notifications (
                type, title, message, priority, data, 
                recipient_id, recipient_type, is_read, 
                created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, false, NOW(), NOW())
        `;

        const [result] = await db.execute(insertQuery, [
            type,
            title,
            message,
            priority,
            JSON.stringify(data),
            recipient_id,
            recipient_type
        ]);

        const notificationId = result.insertId;

        // Get the created notification
        const [notificationRows] = await db.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [notificationId]
        );

        const notification = {
            ...notificationRows[0],
            data: JSON.parse(notificationRows[0].data || '{}')
        };

        logger.info(`Notification created: ${type} - ${title}`);

        // Emit event for real-time notifications
        notificationEmitter.emit('notification_created', notification);

        return {
            success: true,
            data: notification
        };

    } catch (error) {
        logger.error('Error creating notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get notifications with filtering and pagination
 */
const getNotifications = async (filters = {}, options = {}) => {
    try {
        const {
            page = 1,
            limit = 20,
            sortBy = 'created_at',
            sortOrder = 'DESC'
        } = options;

        const offset = (page - 1) * limit;

        // Build WHERE clause
        const whereConditions = [];
        const queryParams = [];

        if (filters.type) {
            whereConditions.push('type = ?');
            queryParams.push(filters.type);
        }

        if (filters.priority) {
            whereConditions.push('priority = ?');
            queryParams.push(filters.priority);
        }

        if (filters.is_read !== undefined) {
            whereConditions.push('is_read = ?');
            queryParams.push(filters.is_read);
        }

        if (filters.recipient_type) {
            whereConditions.push('recipient_type = ?');
            queryParams.push(filters.recipient_type);
        }

        if (filters.recipient_id) {
            whereConditions.push('recipient_id = ?');
            queryParams.push(filters.recipient_id);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        // Get total count
        const countQuery = `SELECT COUNT(*) as total FROM notifications ${whereClause}`;
        const [countResult] = await db.execute(countQuery, queryParams);
        const total = countResult[0].total;

        // Get notifications
        const notificationsQuery = `
            SELECT *
            FROM notifications 
            ${whereClause}
            ORDER BY ${sortBy} ${sortOrder}
            LIMIT ? OFFSET ?
        `;

        const [notifications] = await db.execute(notificationsQuery, [...queryParams, limit, offset]);

        // Parse JSON data field
        const parsedNotifications = notifications.map(notification => ({
            ...notification,
            data: JSON.parse(notification.data || '{}')
        }));

        return {
            success: true,
            data: parsedNotifications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };

    } catch (error) {
        logger.error('Error getting notifications:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mark notification as read
 */
const markAsRead = async (notificationId) => {
    try {
        const updateQuery = `
            UPDATE notifications 
            SET is_read = true, updated_at = NOW()
            WHERE id = ?
        `;

        const [result] = await db.execute(updateQuery, [notificationId]);

        if (result.affectedRows === 0) {
            return {
                success: false,
                error: 'Notification not found'
            };
        }

        logger.info(`Notification ${notificationId} marked as read`);

        return {
            success: true,
            message: 'Notification marked as read'
        };

    } catch (error) {
        logger.error('Error marking notification as read:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Mark multiple notifications as read
 */
const markMultipleAsRead = async (notificationIds) => {
    try {
        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return {
                success: false,
                error: 'Invalid notification IDs'
            };
        }

        const placeholders = notificationIds.map(() => '?').join(',');
        const updateQuery = `
            UPDATE notifications 
            SET is_read = true, updated_at = NOW()
            WHERE id IN (${placeholders})
        `;

        const [result] = await db.execute(updateQuery, notificationIds);

        logger.info(`${result.affectedRows} notifications marked as read`);

        return {
            success: true,
            message: `${result.affectedRows} notifications marked as read`
        };

    } catch (error) {
        logger.error('Error marking multiple notifications as read:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Delete notification
 */
const deleteNotification = async (notificationId) => {
    try {
        const deleteQuery = 'DELETE FROM notifications WHERE id = ?';
        const [result] = await db.execute(deleteQuery, [notificationId]);

        if (result.affectedRows === 0) {
            return {
                success: false,
                error: 'Notification not found'
            };
        }

        logger.info(`Notification ${notificationId} deleted`);

        return {
            success: true,
            message: 'Notification deleted successfully'
        };

    } catch (error) {
        logger.error('Error deleting notification:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Get notification statistics
 */
const getNotificationStats = async (filters = {}) => {
    try {
        const whereConditions = [];
        const queryParams = [];

        if (filters.recipient_type) {
            whereConditions.push('recipient_type = ?');
            queryParams.push(filters.recipient_type);
        }

        if (filters.recipient_id) {
            whereConditions.push('recipient_id = ?');
            queryParams.push(filters.recipient_id);
        }

        const whereClause = whereConditions.length > 0
            ? `WHERE ${whereConditions.join(' AND ')}`
            : '';

        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_read = false THEN 1 ELSE 0 END) as unread,
                SUM(CASE WHEN is_read = true THEN 1 ELSE 0 END) as read,
                SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent,
                SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high,
                SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium,
                SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low
            FROM notifications 
            ${whereClause}
        `;

        const [statsResult] = await db.execute(statsQuery, queryParams);
        const stats = statsResult[0];

        return {
            success: true,
            data: {
                total: parseInt(stats.total),
                unread: parseInt(stats.unread),
                read: parseInt(stats.read),
                by_priority: {
                    urgent: parseInt(stats.urgent),
                    high: parseInt(stats.high),
                    medium: parseInt(stats.medium),
                    low: parseInt(stats.low)
                }
            }
        };

    } catch (error) {
        logger.error('Error getting notification stats:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

/**
 * Clean up old notifications (older than specified days)
 */
const cleanupOldNotifications = async (daysOld = 30) => {
    try {
        const deleteQuery = `
            DELETE FROM notifications 
            WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
            AND is_read = true
        `;

        const [result] = await db.execute(deleteQuery, [daysOld]);

        logger.info(`Cleaned up ${result.affectedRows} old notifications`);

        return {
            success: true,
            message: `Cleaned up ${result.affectedRows} old notifications`
        };

    } catch (error) {
        logger.error('Error cleaning up old notifications:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Export the event emitter for real-time notifications
const getNotificationEmitter = () => notificationEmitter;

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markMultipleAsRead,
    deleteNotification,
    getNotificationStats,
    cleanupOldNotifications,
    getNotificationEmitter
};