const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');

// Lấy danh sách bài viết
router.get('/', newsController.getAllNews);

// Lấy chi tiết bài viết
router.get('/:id', newsController.getNewsById);

// Tạo bài viết mới
router.post('/', newsController.createNews);

// Cập nhật bài viết
router.put('/:id', newsController.updateNews);

// Xóa bài viết
router.delete('/:id', newsController.deleteNews);

module.exports = router;
