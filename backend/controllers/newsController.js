const News = require('../models/newsModel');

// GET /api/news
exports.getAllNews = async (req, res) => {
    try {
        const news = await News.find().populate('author_id').populate('category_id').populate('league_id');
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/news/:id
exports.getNewsById = async (req, res) => {
    try {
        const news = await News.findById(req.params.id).populate('author_id').populate('category_id').populate('league_id');
        if (!news) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json(news);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// POST /api/news
exports.createNews = async (req, res) => {
    try {
        const newArticle = new News(req.body);
        const saved = await newArticle.save();
        res.status(201).json(saved);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/news/:id
exports.updateNews = async (req, res) => {
    try {
        const updated = await News.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json(updated);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/news/:id
exports.deleteNews = async (req, res) => {
    try {
        const deleted = await News.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json({ message: 'Xóa bài viết thành công!' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
