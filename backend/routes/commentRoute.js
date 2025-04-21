const express = require('express');
const router = express.Router();
const CommentController = require('../controllers/commentController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy tất cả bình luận của một bài viết - public
router.get('/comments/article/:id', CommentController.getCommentsByArticle);

// Tạo bình luận mới - yêu cầu đăng nhập
router.post('/comments', authMiddleware(), CommentController.createComment);

// Cập nhật bình luận - yêu cầu đăng nhập, chỉ người tạo mới được sửa
router.put('/comments/:commentId', authMiddleware(), CommentController.updateComment);

// Xoá bình luận - yêu cầu đăng nhập, người tạo hoặc admin mới được xoá
router.delete('/comments/:id', authMiddleware(), CommentController.deleteComment);

// Thống kê bình luận - yêu cầu đăng nhập, chỉ admin xem được
router.get('/comments/statistics/all', authMiddleware('admin'), CommentController.getAllCommentsStatistics);

module.exports = router;
