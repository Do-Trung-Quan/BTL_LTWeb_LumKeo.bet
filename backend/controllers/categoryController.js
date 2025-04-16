const mongoose = require('mongoose');
const Category = require('../models/Category');

// GET /api/categories
exports.getAllCategories = async (req, res) => {
    try {
        const { parent_id } = req.query;
        const query = parent_id ? { parent_id } : { parent_id: null };
        const categories = await Category.find(query).populate('parent_id', 'name slug');
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/categories/:id
exports.getCategoryById = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const category = await Category.findById(req.params.id).populate('parent_id', 'name slug');
        if (!category) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }
        res.json(category);
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};

// POST /api/categories
exports.createCategory = async (req, res) => {
    try {
        const { name, slug, parent_id } = req.body;
        if (!name || !slug) {
            return res.status(400).json({ message: 'Tên và slug là bắt buộc!' });
        }
        if (parent_id && !mongoose.isValidObjectId(parent_id)) {
            return res.status(400).json({ message: 'ID danh mục cha không hợp lệ!' });
        }
        if (parent_id) {
            const parent = await Category.findById(parent_id);
            if (!parent) {
                return res.status(404).json({ message: 'Danh mục cha không tồn tại!' });
            }
        }
        const category = new Category({ name, slug, parent_id: parent_id || null });
        const saved = await category.save();
        res.status(201).json(saved);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên hoặc slug đã tồn tại!' });
        }
        res.status(400).json({ message: error.message });
    }
};

// PUT /api/categories/:id
exports.updateCategory = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        const { name, slug, parent_id } = req.body;
        if (!name && !slug && !parent_id) {
            return res.status(400).json({ message: 'Cần ít nhất một trường để cập nhật!' });
        }
        if (parent_id && !mongoose.isValidObjectId(parent_id)) {
            return res.status(400).json({ message: 'ID danh mục cha không hợp lệ!' });
        }
        if (parent_id) {
            const parent = await Category.findById(parent_id);
            if (!parent) {
                return res.status(404).json({ message: 'Danh mục cha không tồn tại!' });
            }
        }
        const updates = {};
        if (name) updates.name = name;
        if (slug) updates.slug = slug;
        if (parent_id !== undefined) updates.parent_id = parent_id || null;

        const updated = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!updated) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }
        res.json(updated);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Tên hoặc slug đã tồn tại!' });
        }
        res.status(400).json({ message: error.message });
    }
};

// DELETE /api/categories/:id
exports.deleteCategory = async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'ID không hợp lệ!' });
        }
        // Kiểm tra danh mục con và giải đấu liên quan
        const subCategories = await Category.find({ parent_id: req.params.id });
        const leagues = await require('../models/leagueModel').find({ category_id: req.params.id });
        if (subCategories.length > 0 || leagues.length > 0) {
            return res.status(400).json({ message: 'Không thể xóa danh mục vì có danh mục con hoặc giải đấu liên quan!' });
        }
        const deleted = await Category.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Danh mục không tồn tại!' });
        }
        res.json({ message: 'Xóa danh mục thành công!' });
    } catch (error) {
        res.status(error.name === 'CastError' ? 400 : 500).json({ message: error.message });
    }
};