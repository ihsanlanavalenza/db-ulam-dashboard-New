// backend/routes/notification.routes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(requireAuth);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications
 * @access  Private
 */
router.get('/', notificationController.getNotifications);

/**
 * @route   PUT /api/notifications/:id/read
 * @desc    Mark notification as read (use 'all' to mark all as read)
 * @access  Private
 */
router.put('/:id/read', notificationController.markAsRead);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete notification
 * @access  Private
 */
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
