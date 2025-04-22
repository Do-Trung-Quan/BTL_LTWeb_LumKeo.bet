const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const authMiddleware = require('../middlewares/authMiddleware');

router.post('/categories', authMiddleware(['admin']), categoryController.createCategory); // Tạo danh mục - Chỉ admin
router.get('/categories', categoryController.getAllCategories); // Lấy tất cả danh mục - Không cần admin
router.get('/categories/most-viewed-articles', categoryController.getMostViewedArticlesInEachCategory); // Lấy bài báo hot theo danh mục - Không cần admin
router.get('/categories/:id', categoryController.getCategoryById); // Lấy danh mục theo ID - Không cần admin
router.put('/categories/:id', authMiddleware(['admin']), categoryController.updateCategory); // Cập nhật danh mục - Chỉ admin
router.delete('/categories/:id', authMiddleware(['admin']), categoryController.deleteCategory); // Xóa danh mục - Chỉ admin

module.exports = router;