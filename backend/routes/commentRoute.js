const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Root endpoint
router.get('/', (req, res) => {
    res.json({ message: 'Comment API is working' });
});

// Lấy tất cả bình luận của một bài viết - không cần đăng nhập
router.get('/article/:articleId', CommentController.getCommentsByArticle);

// Tạo bình luận mới - yêu cầu đăng nhập
router.post('/', authMiddleware(), CommentController.createComment);

// Cập nhật bình luận - yêu cầu đăng nhập và chỉ người tạo mới được cập nhật
router.put('/:commentId', authMiddleware(), CommentController.updateComment);

// Xóa bình luận - yêu cầu đăng nhập và chỉ người tạo hoặc admin mới được xóa
router.delete('/:commentId', authMiddleware(), CommentController.deleteComment);

// Thống kê bình luận - yêu cầu đăng nhập và chỉ admin mới được xem
router.get('/statistics/all', authMiddleware('admin'), CommentController.getAllCommentsStatistics);

module.exports = router;
