const { executeQuery } = require('../config/database');

class NotificationService {
  // Tạo thông báo mới
  async createNotification(notificationData) {
    const {
      userId,
      title,
      message,
      type = 'info',
      relatedEntityType = null,
      relatedEntityId = null
    } = notificationData;

    const query = `
      INSERT INTO notifications (
        user_id, title, message, type, related_entity_type, related_entity_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      userId,
      title,
      message,
      type,
      relatedEntityType,
      relatedEntityId
    ]);

    return {
      id: result.insertId,
      userId,
      title,
      message,
      type,
      isRead: false,
      relatedEntityType,
      relatedEntityId,
      createdAt: new Date()
    };
  }

  // Lấy danh sách thông báo của user
  async getUserNotifications(userId, page = 1, limit = 20, unreadOnly = false) {
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE user_id = ?';
    let queryParams = [userId];
    
    if (unreadOnly) {
      whereClause += ' AND is_read = FALSE';
    }
    
    const query = `
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        related_entity_type,
        related_entity_id,
        created_at,
        updated_at
      FROM notifications 
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    queryParams.push(limit, offset);
    const notifications = await executeQuery(query, queryParams);
    
    // Đếm tổng số thông báo
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM notifications 
      ${whereClause}
    `;
    
    const countResult = await executeQuery(countQuery, [userId]);
    const total = countResult[0].total;
    
    return {
      notifications: notifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        isRead: notification.is_read,
        relatedEntityType: notification.related_entity_type,
        relatedEntityId: notification.related_entity_id,
        createdAt: notification.created_at,
        updatedAt: notification.updated_at
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Đánh dấu thông báo đã đọc
  async markAsRead(notificationId, userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `;

    await executeQuery(query, [notificationId, userId]);
    return { success: true };
  }

  // Đánh dấu tất cả thông báo đã đọc
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications 
      SET is_read = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = FALSE
    `;

    const result = await executeQuery(query, [userId]);
    return { 
      success: true, 
      updatedCount: result.affectedRows 
    };
  }

  // Đếm số thông báo chưa đọc
  async getUnreadCount(userId) {
    const query = `
      SELECT COUNT(*) as count 
      FROM notifications 
      WHERE user_id = ? AND is_read = FALSE
    `;

    const result = await executeQuery(query, [userId]);
    return result[0].count;
  }

  // Xóa thông báo
  async deleteNotification(notificationId, userId) {
    const query = `
      DELETE FROM notifications 
      WHERE id = ? AND user_id = ?
    `;

    const result = await executeQuery(query, [notificationId, userId]);
    return { 
      success: result.affectedRows > 0,
      message: result.affectedRows > 0 ? 'Notification deleted successfully' : 'Notification not found'
    };
  }

  // Tạo thông báo phân công dự án
  async createProjectAssignmentNotification(projectId, staffUserId, projectTitle, assignedBy) {
    const title = 'Bạn được phân công vào dự án mới';
    const message = `Bạn đã được phân công vào dự án "${projectTitle}". Vui lòng kiểm tra chi tiết và xác nhận tham gia.`;
    
    return await this.createNotification({
      userId: staffUserId,
      title,
      message,
      type: 'project_assignment',
      relatedEntityType: 'project',
      relatedEntityId: projectId
    });
  }

  // Tạo thông báo cập nhật dự án
  async createProjectUpdateNotification(projectId, staffUserIds, projectTitle, updateMessage) {
    const title = `Cập nhật dự án: ${projectTitle}`;
    
    const notifications = [];
    for (const userId of staffUserIds) {
      const notification = await this.createNotification({
        userId,
        title,
        message: updateMessage,
        type: 'info',
        relatedEntityType: 'project',
        relatedEntityId: projectId
      });
      notifications.push(notification);
    }
    
    return notifications;
  }
}

module.exports = new NotificationService();