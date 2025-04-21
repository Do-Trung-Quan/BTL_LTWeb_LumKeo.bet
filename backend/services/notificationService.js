const User = require('../models/User');
const Notification = require('../models/Notification');

const NotificationService = {
  async createNotification({ noti_entity_ID, noti_entity_type, content, UserID }) {
    try {
      // Kiểm tra xem UserID có tồn tại trong bảng User không
      const userExists = await User.findById(UserID);
      if (!userExists) {
        throw new Error('UserID does not exist');
      }

      const notification = new Notification({
        noti_entity_ID,
        noti_entity_type,
        content,
        UserID,
      });

      const savedNotification = await notification.save();

      return {
        success: true,
        data: savedNotification,
        message: 'Notification created successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create notification: ${error.message}`);
    }
  },

  //---------------------------------------------------------------------------------
  // Lấy danh sách thông báo theo UserID
  async getNotificationsByReceiver(receiver_id) {
    try {
      const notifications = await Notification.find({ UserID: receiver_id }).sort({ created_at: -1 });

      return {
        success: true,
        data: notifications,
        message: 'Notifications retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get notifications: ${error.message}`);
    }
  },

  //---------------------------------------------------------------------------------
  // Cập nhật trạng thái đã đọc cho thông báo
  async markNotificationAsRead(notificationId) {
    try {
      const notification = await Notification.findByIdAndUpdate(
        notificationId,
        { is_read: true },
        { new: true } // Trả về thông báo đã cập nhật
      );

      if (!notification) {
        throw new Error('Notification not found');
      }

      return {
        success: true,
        data: notification,
        message: 'Notification marked as read',
      };
    } catch (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }
  },

  //---------------------------------------------------------------------------------
  // Đánh dấu tất cả thông báo là đã đọc
  async markAllNotificationsAsRead(receiver_id) {
    try {
      const result = await Notification.updateMany(
        { UserID: receiver_id, is_read: false },
        { is_read: true }
      );

      return {
        success: true,
        data: result,
        message: 'All notifications marked as read',
      };
    } catch (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }
  },

  //---------------------------------------------------------------------------------
  // Lấy số lượng thông báo chưa đọc
  async getUnreadNotificationsCount(receiver_id) {
    try {
      const count = await Notification.countDocuments({ UserID: receiver_id, is_read: false });

      return {
        success: true,
        data: { unreadCount: count },
        message: 'Unread notifications count retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get unread notifications count: ${error.message}`);
    }
  },

  //---------------------------------------------------------------------------------
  // Xóa thông báo
  async deleteNotification(notificationId) {
    try {
      const notification = await Notification.findByIdAndDelete(notificationId);

      if (!notification) {
        throw new Error('Notification not found');
      }

      return {
        success: true,
        data: notification,
        message: 'Notification deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }
  }
};

module.exports = NotificationService;