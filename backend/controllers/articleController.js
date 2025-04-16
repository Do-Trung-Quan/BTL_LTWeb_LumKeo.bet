const mongoose = require('mongoose');
const News = require('../models/Article');

// GET /api/news
exports.getAllNews = async (req, res) => {
    try {
        const { page = 1, limit = 10, category_id } = req.query;
        const query = category_id ? { category_id } : {};
        const news = await News.find(query)
            .populate('author_id', 'name')
            .populate('category_id', 'name')
            .populate('league_id', 'name')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));
        const total = await News.countDocuments(query);
        res.json({ news, total });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/news/:id
exports.getNewsById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const news = await News.findById(req.params.id)
            .populate('author_id', 'name')
            .populate('category_id', 'name')
            .populate('league_id', 'name');
        if (!news) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json(news);
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};

// POST /api/news
exports.createNews = async (req, res) => {
    try {
        const { title, slug, content, summary, author_id, category_id, published_at } = req.body;
        if (!title || !slug || !content || !summary || !author_id || !category_id) {
            return res.status(400).json({ message: 'Thiếu các trường bắt buộc!' });
        }
        if (!mongoose.isValidObjectId(author_id) || !mongoose.isValidObjectId(category_id)) {
            return res.status(400).json({ message: 'ID tác giả hoặc danh mục không hợp lệ!' });
        }
        const newArticle = new News({
            title,
            slug,
            content,
            summary,
            author_id,
            category_id,
            league_id: req.body.league_id || null,
            image_url: req.file ? `/uploads/${req.file.filename}` : req.body.image_url,
            published_at: published_at || new Date()
        });
        const saved = await newArticle.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Slug đã tồn tại!' });
        }
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/news/:id
exports.updateNews = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const updates = {};
        if (req.body.title) updates.title = req.body.title;
        if (req.body.slug) updates.slug = req.body.slug;
        if (req.body.content) updates.content = req.body.content;
        if (req.body.summary) updates.summary = req.body.summary;
        if (req.body.author_id) updates.author_id = req.body.author_id;
        if (req.body.category_id) updates.category_id = req.body.category_id;
        if (req.body.league_id) updates.league_id = req.body.league_id;
        if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
        if (req.body.published_at) updates.published_at = req.body.published_at;
        const updated = await News.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updated) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Slug đã tồn tại!' });
        }
        res.status(error.name === 'CastError' ? 400 : 400).json({ message: error.message });
    }
};

// DELETE /api/news/:id
exports.deleteNews = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const deleted = await News.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Bài viết không tồn tại!' });
        res.json({ message: 'Xóa bài viết thành công!' });
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};
