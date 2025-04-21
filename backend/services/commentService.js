const Comment = require('../models/Comment');
const mongoose = require('mongoose');

const CommentService = {
  // Lấy tất cả bình luận theo bài viết (bao gồm replies)
  async getCommentsByArticle(articleId) {
    if (!mongoose.Types.ObjectId.isValid(articleId)) {
      throw new Error('ID bài viết không hợp lệ');
    }

    const rootComments = await Comment.find({
      ArticleID: articleId,
      CommentID: null
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
          replies
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
      created_at: new Date()
    });

    await comment.save();

    return await Comment.findById(comment._id).populate('UserID', 'name avatar');
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
  async deleteComment(commentId, userId, role) {
    const comment = await Comment.findById(commentId);
    if (!comment) throw new Error('Không tìm thấy bình luận');

    if (comment.UserID.toString() !== userId.toString() && role !== 'admin') {
      throw new Error('Bạn không có quyền xóa bình luận này');
    }

    await Comment.deleteMany({ CommentID: commentId }); // Xóa các comment con
    await Comment.findByIdAndDelete(commentId); // Xóa chính nó
  },

  // Thống kê tất cả bình luận + 15 ngày gần nhất
  async getAllCommentsStatistics() {
    const total = await Comment.countDocuments();
    const rootComments = await Comment.countDocuments({ CommentID: null });
    const replies = total - rootComments;

    const mostCommentedArticle = await Comment.aggregate([
      { $group: { _id: "$ArticleID", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    const latestComment = await Comment.findOne().sort({ created_at: -1 });

    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
  
    const newComments = await Comment.countDocuments({
      created_at: { $gte: fifteenDaysAgo }
    });
  
    return {
      totalComments: total,
      rootComments,
      replies,
      mostCommentedArticle: mostCommentedArticle[0] || null,
      latestComment,
      newCommentsLast15Days: {
        from: fifteenDaysAgo.toISOString(),
        to: new Date().toISOString(),
        count: newComments
      }
    };
  }
};  


module.exports = CommentService;
