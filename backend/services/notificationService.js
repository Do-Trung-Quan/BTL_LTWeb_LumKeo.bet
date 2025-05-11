const mongoose = require('mongoose');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Article = require('../models/Article');
const Comment = require('../models/Comment');

let websocket = null;

// Initialize WebSocket
const initWebSocket = (ws) => {
  websocket = ws;
};

const NotificationService = {
  // Tạo thông báo
  async createNotification({ noti_entity_ID, noti_entity_type, content, UserID }) {
    // Kiểm tra định dạng UserID
    if (!mongoose.Types.ObjectId.isValid(UserID)) {
      throw new Error('Invalid UserID format');
    }

    // Kiểm tra xem UserID có tồn tại không
    const userExists = await User.findById(UserID).lean();
    if (!userExists) {
      throw new Error('UserID does not exist');
    }

    // Kiểm tra các trường bắt buộc
    if (!content || !noti_entity_type) {
      throw new Error('Content and noti_entity_type are required');
    }

    // Kiểm tra noti_entity_type
    const validEntityTypes = ['Article', 'Comment'];
    if (!validEntityTypes.includes(noti_entity_type)) {
      throw new Error('noti_entity_type must be one of: Article, Comment');
    }

    // Kiểm tra noti_entity_ID
    if (!noti_entity_ID) {
      throw new Error('noti_entity_ID is required');
    }
    if (!mongoose.Types.ObjectId.isValid(noti_entity_ID)) {
      throw new Error('Invalid noti_entity_ID format');
    }

    if (noti_entity_type === 'Article') {
      const articleExists = await Article.findById(noti_entity_ID).lean();
      if (!articleExists) {
        throw new Error('Article not found for noti_entity_ID');
      }
    } else if (noti_entity_type === 'Comment') {
      const commentExists = await Comment.findById(noti_entity_ID).lean();
      if (!commentExists) {
        throw new Error('Comment not found for noti_entity_ID');
      }
    }

    const notification = new Notification({
      noti_entity_ID,
      noti_entity_type,
      content,
      UserID,
      is_read: false,
      created_at: Date.now(),
    });

    const savedNotification = await notification.save();

    // Send WebSocket notification
    if (websocket) {
      websocket.notifyUser(UserID, {
        type: noti_entity_type.toUpperCase() + '_NOTIFICATION',
        message: content,
        entityId: noti_entity_ID,
        notificationId: savedNotification._id,
        createdAt: savedNotification.created_at,
      });
    }

    return {
      success: true,
      data: savedNotification,
      message: 'Notification created successfully',
    };
  },

  // Tạo thông báo cho admin khi có bài đăng chờ duyệt
  async createPendingArticleNotification(articleId) {
    // Kiểm tra định dạng articleId
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('Invalid ArticleID format');
    }

    // Kiểm tra bài viết có tồn tại không
    const article = await Article.findById(articleId).lean();
    if (!article) {
      throw new Error('Article not found');
    }

    // Tìm tất cả user có role admin
    const admins = await User.find({ role: 'admin' }).lean();
    console.log('Found admins:', admins.length);
    if (!admins || admins.length === 0) {
      throw new Error('No admin users found');
    }

    const notifications = await Promise.all(
      admins.map(async (admin) => {
        const notification = new Notification({
          noti_entity_ID: articleId,
          noti_entity_type: 'Article',
          content: `A new article "${article.title}" is pending approval`,
          UserID: admin._id,
          is_read: false,
          created_at: Date.now(),
        });
        console.log('Creating notification for admin:', admin._id);
        return notification.save();
      })
    );
    console.log('Notifications created:', notifications.length);
  },

  // Lấy danh sách thông báo theo UserID
  async getNotificationsByReceiver(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid UserID format');
    }

    const notifications = await Notification.find({ UserID: userId })
      .sort({ created_at: -1 })
      .populate('UserID', 'username avatar')
      .lean();

    return {
      success: true,
      data: {
        notifications,
      },
      message: 'Notifications retrieved successfully',
    };
  },

  // Đánh dấu thông báo là đã đọc
  async markNotificationAsRead(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid NotificationID format');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid UserID format');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.UserID.toString() !== userId.toString()) {
      throw new Error('You can only mark your own notifications as read');
    }

    notification.is_read = true;
    await notification.save();

    return {
      success: true,
      data: notification,
      message: 'Notification marked as read',
    };
  },

  // Đánh dấu tất cả thông báo là đã đọc
  async markAllNotificationsAsRead(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid UserID format');
    }

    const result = await Notification.updateMany(
      { UserID: userId, is_read: false },
      { is_read: true }
    );

    return {
      success: true,
      data: { modifiedCount: result.modifiedCount },
      message: 'All notifications marked as read',
    };
  },

  // Lấy số lượng thông báo chưa đọc
  async getUnreadNotificationsCount(userId) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid UserID format');
    }

    const count = await Notification.countDocuments({ UserID: userId, is_read: false });

    return {
      success: true,
      data: { unreadCount: count },
      message: 'Unread notifications count retrieved successfully',
    };
  },

  // Xóa thông báo
  async deleteNotification(notificationId, userId) {
    if (!mongoose.Types.ObjectId.isValid(notificationId)) {
      throw new Error('Invalid NotificationID format');
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid UserID format');
    }

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.UserID.toString() !== userId.toString()) {
      throw new Error('You can only delete your own notifications');
    }

    await Notification.deleteOne({ _id: notificationId });

    return {
      success: true,
      data: notification,
      message: 'Notification deleted successfully',
    };
  },
};

module.exports = NotificationService;
module.exports.initWebSocket = initWebSocket;
