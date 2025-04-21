const express = require('express');
const router = express.Router();
const NotificationController = require('../controllers/notificationController');

// POST /api/notifications/create - Tạo thông báo
router.post('/create', NotificationController.createNotification);

// GET /api/notifications/get/:receiver_id - Lấy danh sách thông báo theo receiver_id
router.get('/get/:receiver_id', NotificationController.getNotifications);

// POST /api/notifications/mark/:notification_id - Đánh dấu một thông báo đã đọc
router.post('/mark/:notification_id', NotificationController.markNotificationAsRead);

// POST /api/notifications/mark_all/:receiver_id - Đánh dấu tất cả thông báo đã đọc
router.post('/mark_all/:receiver_id', NotificationController.markAllNotificationsAsRead);

// GET /api/notifications/unread_count/:receiver_id - Đếm tổng số thông báo chưa đọc
router.get('/unread_count/:receiver_id', NotificationController.getUnreadNotificationsCount);

// DELETE /api/notifications/delete/:notification_id - Xóa một thông báo
router.delete('/delete/:notification_id', NotificationController.deleteNotification);

module.exports = router;