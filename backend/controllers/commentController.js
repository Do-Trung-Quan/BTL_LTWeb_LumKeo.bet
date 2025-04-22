const { CommentService } = require('../services/commentService');

// Lấy danh sách bình luận theo bài viết
exports.getCommentsByArticle = async (req, res) => {
  try {
    const comments = await CommentService.getCommentsByArticle(req.params.articleId);
    res.status(200).json(comments);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Tạo bình luận mới
exports.createComment = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Người dùng chưa được xác thực' });
    }
    const userId = req.user._id;
    const comment = await CommentService.createComment(req.body, userId);
    res.status(201).json(comment);
  } catch (error) {
    console.error('Lỗi khi tạo bình luận:', error);
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật bình luận
exports.updateComment = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Người dùng chưa được xác thực' });
    }
    const userId = req.user._id;
    const updatedComment = await CommentService.updateComment(req.params.commentId, req.body.content, userId);
    res.status(200).json(updatedComment);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa bình luận
exports.deleteComment = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Người dùng chưa được xác thực' });
    }
    const userId = req.user._id;
    await CommentService.deleteComment(req.params.commentId, userId);
    res.status(200).json({ message: 'Xóa bình luận thành công' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Thống kê bình luận
exports.getAllCommentsStatistics = async (req, res) => {
  try {
    const stats = await CommentService.getAllCommentsStatistics();
    res.status(200).json(stats);
  } catch (error) {
    console.error('Lỗi khi lấy thống kê bình luận:', error);
    res.status(500).json({ message: 'Đã xảy ra lỗi khi thống kê bình luận' });
  }
};

module.exports = exports;