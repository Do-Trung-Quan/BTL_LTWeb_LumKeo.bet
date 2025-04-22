const categoryService = require('../services/categoryService');

// 1. Create Category
const createCategory = async (req, res) => {
  try {
    const category = await categoryService.createCategory(req.body);
    res.status(201).json({ message: 'Category created successfully', category });
  } catch (error) {
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// 2. Get All Categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryService.getAllCategories();
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// 3. Get Category by ID
const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(req.params.id);
    res.status(200).json(category);
  } catch (error) {
    if (error.message === 'Category not found' || error.message === 'Not a category') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// 4. Update Category
const updateCategory = async (req, res) => {
  try {
    const updatedCategory = await categoryService.updateCategory(req.params.id, req.body); // Không cần file ở đây
    res.status(200).json({ message: 'Category updated successfully', category: updatedCategory });
  } catch (error) {
    if (error.message === 'Category not found' || error.message === 'Not a category') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// 5. Delete Category
const deleteCategory = async (req, res) => {
  try {
    const result = await categoryService.deleteCategory(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Category not found' || 
        error.message === 'Not a category' || 
        error.message === 'Cannot delete category with child leagues') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};

// 6. Get Most Viewed Articles in Each Category
const getMostViewedArticlesInEachCategory = async (req, res) => {
  try {
    const result = await categoryService.getMostViewedArticlesInEachCategory();
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching most viewed articles', error: error.message });
  }
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getMostViewedArticlesInEachCategory
};
