const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const News = require('../models/Article');

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

// Route lấy news lọc theo slug

router.get('/', async (req, res) => {
    try {
        const { slug } = req.query;
        if (slug) {
            const news = await News.find({ slug }); // Tìm bài viết theo slug
            res.json(news || []); // Luôn trả về mảng, nếu không tìm thấy thì trả về []
        } else {
            const news = await News.find();
            res.json(news);
        }
    } catch (error) {
        console.error('Lỗi khi tìm bài viết:', error);
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
