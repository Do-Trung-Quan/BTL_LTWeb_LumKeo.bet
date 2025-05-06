const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const mongoose = require('mongoose');

let websocket = null;

// Initialize WebSocket
const initWebSocket = (ws) => {
  websocket = ws;
};

const CommentService = {
  // Lấy tất cả bình luận theo bài viết (bao gồm replies)
  async getCommentsByArticle(articleId) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    const rootComments = await Comment.find({
      ArticleID: articleId,
      CommentID: null,
    })
      .populate('UserID', 'name avatar')
      .sort({ created_at: -1 });

    const commentsWithReplies = await Promise.all(
      rootComments.map(async (comment) => {
        const replies = await Comment.find({ CommentID: comment._id })
          .populate('UserID', 'name avatar')
          .sort({ created_at: 1 });

        return {
          ...comment.toObject(),
          replies,
        };
      })
    );

    return commentsWithReplies;
  },

  // Tạo bình luận mới
  async createComment(data, userId) {
    const { content, ArticleID, CommentID } = data;

    if (!content || content.trim() === '') throw new Error('Nội dung bình luận không được để trống');
    if (content.length > 255) throw new Error('Nội dung bình luận không được vượt quá 255 ký tự');
    if (!mongoose.Types.ObjectId.isValid(ArticleID)) throw new Error('ID bài viết không hợp lệ');
    if (CommentID && !mongoose.Types.ObjectId.isValid(CommentID)) throw new Error('ID bình luận gốc không hợp lệ');

    const comment = new Comment({
      content,
      UserID: userId,
      ArticleID,
      CommentID: CommentID || null,
      created_at: new Date(),
    });

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
    .populate('UserID', 'username avatar')
    .populate('CommentID', 'content UserID created_at');
    // Notify parent comment's author if this is a reply
    let parentComment = null;
    if (CommentID) {
      parentComment = await Comment.findById(CommentID);
    }
    if (parentComment) {
      try {
        console.log('Creating notification for reply comment:', comment._id);
        const notification = await notificationService.createNotification({
          noti_entity_ID: comment._id,
          noti_entity_type: 'Comment',
          content: `Someone replied to your comment: "${parentComment.content.slice(0, 50)}..."`,
          UserID: parentComment.UserID,
        });
        console.log('Reply notification created:', notification);
        if (websocket) {
          websocket.notifyUser(parentComment.UserID.toString(), {
            type: 'COMMENT_NOTIFICATION',
            message: `Someone replied to your comment: "${parentComment.content.slice(0, 50)}..."`,
            commentId: comment._id,
            articleId: ArticleID,
            createdAt: Date.now(),
          });
        }
      } catch (error) {
        console.error('Failed to create reply notification:', error.message);
      }
    }
    return populatedComment
  },

  // Cập nhật bình luận
  async updateComment(commentId, content, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Không tìm thấy bình luận');
    if (comment.UserID.toString() !== userId.toString()) throw new Error('Bạn không có quyền cập nhật bình luận này');

    comment.content = content;
    comment.updated_at = new Date();
    await comment.save();
    return comment;
  },

  // Xóa bình luận và các bình luận con
  async deleteComment(commentId, userId) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Không tìm thấy bình luận');

    if (comment.UserID.toString() !== userId.toString()) {
      throw new Error('Bạn không có quyền xóa bình luận này');
    }

    // Xóa các bình luận con và thông báo liên quan nếu có
    await Promise.all([
      Comment.deleteMany({ CommentID: commentId }),
      Notification.deleteMany({ noti_entity_ID: commentId, noti_entity_type: 'Comment' }),
    ]);

    await Comment.findByIdAndDelete(commentId);

    return { message: 'Xóa bình luận thành công' };
  },

  // Thống kê tất cả bình luận + 15 ngày gần nhất
  async getAllCommentsStatistics() {
    const total = await Comment.countDocuments();
    const rootComments = await Comment.countDocuments({ CommentID: null });
    const replies = total - rootComments;

    const mostCommentedArticle = await Comment.aggregate([
      { $group: { _id: '$ArticleID', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
    ]);

    const latestComment = await Comment.findOne().sort({ created_at: -1 });

    const now = new Date();
    const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Aggregate to group comments by day
    const newCommentsStats = await Comment.aggregate([
      {
        $match: {
          created_at: { $gte: fifteenDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 } // Sort by date ascending
      }
    ]);

    // Create an array of the last 15 days with 0 counts for days with no data
    const dailyStats = [];
    for (let i = 0; i < 15; i++) {
      const date = new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      const found = newCommentsStats.find(stat => stat._id === dateStr);
      dailyStats.push({
        date: dateStr,
        count: found ? found.count : 0
      });
    }

    return {
      totalComments: total,
      rootComments,
      replies,
      mostCommentedArticle: mostCommentedArticle[0] || null,
      latestComment,
      newCommentsLast15Days: {
        from: fifteenDaysAgo.toISOString(),
        to: now.toISOString(),
        dailyStats: dailyStats,
        count: dailyStats.reduce((sum, day) => sum + day.count, 0)
      },
    };
  },
};


module.exports = {
  initWebSocket,
  CommentService
};