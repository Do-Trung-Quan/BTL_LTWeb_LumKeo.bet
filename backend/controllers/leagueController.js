const mongoose = require('mongoose');
const League = require('../models/League');
const Category = require('../models/Category');

// GET /api/leagues
exports.getAllLeagues = async (req, res) => {
    try {
        const leagues = await League.find().populate('category_id', 'name slug');
        res.json(leagues);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/leagues/:id
exports.getLeagueById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const league = await League.findById(req.params.id).populate('category_id', 'name slug');
        if (!league) {
            return res.status(404).json({ message: 'Giải đấu không tồn tại!' });
        }
        res.json(league);
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};

// POST /api/leagues
exports.createLeague = async (req, res) => {
    try {
        const { name, slug, category_id, logo_url, season_time } = req.body;
        if (!name || !slug || !category_id) {
            return res.status(400).json({ message: 'Tên, slug và danh mục là bắt buộc!' });
        }
        if (!mongoose.isValidObjectId(category_id)) {
            return res.status(400).json({ message: 'ID danh mục không hợp lệ!' });
        }
        const category = await Category.findById(category_id);
        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }
        const league = new League({ name, slug, category_id, logo_url, season_time });
        const saved = await league.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên hoặc slug đã tồn tại!' });
        }
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/leagues/:id
exports.updateLeague = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const { name, slug, category_id, logo_url, season_time } = req.body;
        if (!name && !slug && !category_id && !logo_url && !season_time) {
            return res.status(400).json({ message: 'Cần ít nhất một trường để cập nhật!' });
        }
        if (category_id && !mongoose.isValidObjectId(category_id)) {
            return res.status(400).json({ message: 'ID danh mục không hợp lệ!' });
        }
        if (category_id) {
            const category = await Category.findById(category_id);
            if (!category) {
                return res.status(404).json({ message: 'Danh mục không tồn tại!' });
            }
        }
        const updates = {};
        if (name) updates.name = name;
        if (slug) updates.slug = slug;
        if (category_id) updates.category_id = category_id;
        if (logo_url) updates.logo_url = logo_url;
        if (season_time) updates.season_time = season_time;

        const updated = await League.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Giải đấu không tồn tại!' });
        }
        res.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên hoặc slug đã tồn tại!' });
        }
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/leagues/:id
exports.deleteLeague = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const deleted = await League.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Giải đấu không tồn tại!' });
        }
        res.json({ message: 'Xóa giải đấu thành công!' });
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};