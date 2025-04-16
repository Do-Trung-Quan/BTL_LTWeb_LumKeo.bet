const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');

// Lấy danh sách danh mục
router.get('/', categoryController.getAllCategories);

// Lấy chi tiết danh mục
router.get('/:id', categoryController.getCategoryById);

// Tạo danh mục mới
router.post('/', categoryController.createCategory);

// Cập nhật danh mục
router.put('/:id', categoryController.updateCategory);

// Xóa danh mục
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;