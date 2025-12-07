/**
 * ===================================
 * NOTIFICATION ROUTES
 * Định nghĩa routes cho thông báo
 * ===================================
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

// Protect tất cả routes
router.use(protect);

// Get notifications
router.get('/', notificationController.getNotifications);

// Get unread count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification by ID (chi tiết thông báo)
router.get('/:id', notificationController.getNotificationById);

// Mark as read
router.put('/:id/read', notificationController.markAsRead);

// Mark multiple as read
router.put('/read-multiple', notificationController.markMultipleAsRead);

// Mark all as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete notification
router.delete('/:id', notificationController.deleteNotification);

// Delete notification by reviewId (for admin cleanup)
router.delete('/by-review/:reviewId', notificationController.deleteByReviewId);

// Delete all notifications
router.delete('/all', notificationController.deleteAllNotifications);

module.exports = router;
