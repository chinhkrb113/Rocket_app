const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// Lấy danh sách thông báo của user
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only = false } = req.query;
    const userId = req.user?.id; // Giả sử có middleware auth để lấy user ID
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await notificationService.getUserNotifications(
      userId, 
      parseInt(page), 
      parseInt(limit), 
      unread_only === 'true'
    );
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

// Đếm số thông báo chưa đọc
router.get('/unread-count', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const count = await notificationService.getUnreadCount(userId);
    
    res.json({
      success: true,
      data: { count }
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch unread count' 
    });
  }
});

// Đánh dấu thông báo đã đọc
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await notificationService.markAsRead(parseInt(id), userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark notification as read' 
    });
  }
});

// Đánh dấu tất cả thông báo đã đọc
router.patch('/mark-all-read', async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await notificationService.markAllAsRead(userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to mark all notifications as read' 
    });
  }
});

// Xóa thông báo
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const result = await notificationService.deleteNotification(parseInt(id), userId);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete notification' 
    });
  }
});

// Tạo thông báo mới (cho admin hoặc system)
router.post('/', async (req, res) => {
  try {
    const notificationData = req.body;
    
    const result = await notificationService.createNotification(notificationData);
    
    res.status(201).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
  }
});

module.exports = router;