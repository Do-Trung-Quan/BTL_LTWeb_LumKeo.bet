const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const NotificationController = require('../controllers/notificationController');

//Create a notification (user, author, admin)
router.post('/notifications', authMiddleware(), NotificationController.createNotification);

// Create notifications for admins about pending articles (admin only)
router.post('/notifications/pending-article', authMiddleware(['admin']), NotificationController.createPendingArticleNotification);

// Get notifications for a specific user (user, author, admin)
router.get('/notifications/:receiver_id', authMiddleware(), NotificationController.getNotifications);

// Mark a notification as read (user, author, admin)
router.put('/notifications/:notification_id/read', authMiddleware(), NotificationController.markNotificationAsRead);

// Mark all notifications as read for a user (user, author, admin)
router.put('/notifications/:receiver_id/read-all', authMiddleware(), NotificationController.markAllNotificationsAsRead);

// Get the count of unread notifications (user, author, admin)
router.get('/notifications/:receiver_id/unread-count', authMiddleware(), NotificationController.getUnreadNotificationsCount);

// Delete a notification (user, author, admin)
router.delete('/notifications/:notification_id', authMiddleware(), NotificationController.deleteNotification);

module.exports = router;