const NotificationService = require('../services/notificationService');

const NotificationController = {
  async createNotification(req, res) {
    try {
      const { noti_entity_ID, noti_entity_type, content, UserID } = req.body;

      const result = await NotificationService.createNotification({
        noti_entity_ID,
        noti_entity_type,
        content,
        UserID,
      });

      res.status(201).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //---------------------------------------------------------------------------------
  // Lấy danh sách thông báo theo UserID
  async getNotifications(req, res) {
    try {
      const { receiver_id } = req.params;

      const result = await NotificationService.getNotificationsByReceiver(receiver_id);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //---------------------------------------------------------------------------------
  // Cập nhật trạng thái đã đọc cho thông báo
  async markNotificationAsRead(req, res) {
    try {
      const { notification_id } = req.params;

      const result = await NotificationService.markNotificationAsRead(notification_id);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //---------------------------------------------------------------------------------
  // Cập nhật trạng thái đã đọc cho tất cả thông báo
  async markAllNotificationsAsRead(req, res) {
    try {
      const { receiver_id } = req.params;

      const result = await NotificationService.markAllNotificationsAsRead(receiver_id);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //---------------------------------------------------------------------------------
  // Lấy số lượng thông báo chưa đọc
  async getUnreadNotificationsCount(req, res) {
    try {
      const { receiver_id } = req.params;

      const result = await NotificationService.getUnreadNotificationsCount(receiver_id);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  //---------------------------------------------------------------------------------
  // Xóa thông báo
  async deleteNotification(req, res) {
    try {
      const { notification_id } = req.params;

      const result = await NotificationService.deleteNotification(notification_id);

      res.status(200).json(result);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  }
};

module.exports = NotificationController;