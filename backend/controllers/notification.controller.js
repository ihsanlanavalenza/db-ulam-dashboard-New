// backend/controllers/notification.controller.js
const db = require('../config/db');

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, unread_only = false } = req.query;

    let query = `
      SELECT 
        id,
        title,
        message,
        type,
        is_read,
        created_at
      FROM notifications 
      WHERE user_id = ?
    `;
    
    const params = [userId];

    if (unread_only === 'true') {
      query += ' AND is_read = FALSE';
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [notifications] = await db.promise().query(query, params);

    // Get unread count
    const [countResult] = await db.promise().query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({
      success: true,
      data: {
        notifications,
        unread_count: countResult[0].unread_count,
        total: notifications.length
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    if (id === 'all') {
      // Mark all as read
      await db.promise().query(
        'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
        [userId]
      );
    } else {
      // Mark specific notification as read
      const [result] = await db.promise().query(
        'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
        [id, userId]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Notification not found'
        });
      }
    }

    res.json({
      success: true,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await db.promise().query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Create notification (internal use - from other controllers)
 */
const createNotification = async (userId, title, message, type = 'info') => {
  try {
    await db.promise().query(
      'INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)',
      [userId, title, message, type]
    );
    return true;
  } catch (error) {
    console.error('Create notification error:', error);
    return false;
  }
};

/**
 * Create notification for all users with specific role/level
 */
const createBroadcastNotification = async (title, message, type = 'info', filters = {}) => {
  try {
    let query = 'SELECT id FROM users WHERE is_active = 1';
    const params = [];

    if (filters.role) {
      query += ' AND role = ?';
      params.push(filters.role);
    }

    if (filters.level) {
      query += ' AND level = ?';
      params.push(filters.level);
    }

    const [users] = await db.promise().query(query, params);

    for (const user of users) {
      await createNotification(user.id, title, message, type);
    }

    return true;
  } catch (error) {
    console.error('Broadcast notification error:', error);
    return false;
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  deleteNotification,
  createNotification,
  createBroadcastNotification
};
