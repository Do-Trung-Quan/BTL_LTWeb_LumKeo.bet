const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const NotificationController = require('../controllers/notificationController');

// POST /api/notifications - Tạo thông báo (user, author, admin)
router.post('/', authMiddleware(['user', 'author', 'admin']), NotificationController.createNotification);

// POST /api/notifications/pending-article - Tạo thông báo cho admin khi có bài đăng chờ duyệt (chỉ admin)
router.post('/pending-article', authMiddleware(['admin']), NotificationController.createPendingArticleNotification);

// GET /api/notifications/user/:receiver_id - Lấy danh sách thông báo theo receiver_id (user, author, admin)
router.get('/user/:receiver_id', authMiddleware(['user', 'author', 'admin']), NotificationController.getNotifications);

// PUT /api/notifications/:notification_id/read - Đánh dấu một thông báo đã đọc (user, author, admin)
router.put('/:notification_id/read', authMiddleware(['user', 'author', 'admin']), NotificationController.markNotificationAsRead);

// PUT /api/notifications/user/:receiver_id/read-all - Đánh dấu tất cả thông báo đã đọc (user, author, admin)
router.put('/user/:receiver_id/read-all', authMiddleware(['user', 'author', 'admin']), NotificationController.markAllNotificationsAsRead);

// GET /api/notifications/user/:receiver_id/unread-count - Đếm tổng số thông báo chưa đọc (user, author, admin)
router.get('/user/:receiver_id/unread-count', authMiddleware(['user', 'author', 'admin']), NotificationController.getUnreadNotificationsCount);

// DELETE /api/notifications/:notification_id - Xóa một thông báo (user, author, admin)
router.delete('/:notification_id', authMiddleware(['user', 'author', 'admin']), NotificationController.deleteNotification);

module.exports = router;