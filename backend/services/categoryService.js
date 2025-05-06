const Category = require('../models/Category');
const Article = require('../models/Article');

// 1. Create Category (Tạo danh mục: Giải đấu, Bóng đá Việt Nam, Bóng đá thế giới)
const createCategory = async (categoryData) => {
  const { name, slug, parentCategory, type } = categoryData;

  // Nếu không cung cấp 'type', mặc định là 'Category'
  const categoryType = type || 'Category';

  const category = await Category.create({
    name,
    slug,
    type: categoryType,  // Gán type ở đây
    parentCategory
  });
  return category;
};

// 2. Get All Categories (Lấy tất cả danh mục, filter theo type = Category)
const getAllCategories = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [categories, total] = await Promise.all([
    Category.find({ type: 'Category' }).skip(skip).limit(limit), // Lấy các document có type là 'Category'
    Category.countDocuments({ type: 'Category' })
  ]);
  return { total, categories };
};

// 3. Get Category by ID (Lấy danh mục theo ID)
const getCategoryById = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Category not found');
  if (category.type !== 'Category') throw new Error('Not a category');
  return category;
};

// 4. Update Category (Cập nhật danh mục)
const updateCategory = async (categoryId, categoryData) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Category not found');
  
  // Nếu type là 'League', không cho phép cập nhật thành 'Category'
  if (category.type === 'League' && categoryData.type && categoryData.type !== 'League') {
    throw new Error('Cannot change a League to a Category');
  }

  const updatedCategory = await Category.findByIdAndUpdate(
    categoryId,
    { $set: categoryData },
    { new: true, runValidators: true }
  );
  return updatedCategory;
};

// 5. Delete Category (Xóa danh mục)
const deleteCategory = async (categoryId) => {
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Category not found');

  // Kiểm tra xem danh mục có giải đấu con không
  const childLeagues = await Category.find({ parentCategory: categoryId, type: 'League' });
  if (childLeagues.length > 0) throw new Error('Cannot delete category with child leagues');

  await Category.findByIdAndDelete(categoryId);
  return { message: 'Category deleted successfully' };
};

// 6. Get Most Viewed Articles in Each Category (Lấy bài báo có lượt xem cao nhất trong từng danh mục)
// Chỉ lấy bài viết trực tiếp thuộc danh mục, không lấy từ các League con
const getMostViewedArticlesInEachCategory = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const categories = await Category.find({ type: 'Category', name: { $ne: 'Giải đấu' }});
  const result = [];

  for (const category of categories) {
    const mostViewedArticle = await Article.find({
      CategoryID: category._id, // Chỉ tìm bài viết trực tiếp thuộc danh mục này
      is_published: true
    })
      .sort({ views: -1 })
      .skip(skip)
      .limit(limit)
      .populate('UserID', 'username avatar')
      .populate('CategoryID', 'name slug type');

    result.push({
      category: { _id: category._id, name: category.name, slug: category.slug },
      mostViewedArticle: mostViewedArticle || null
    });
  }

  return result;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getMostViewedArticlesInEachCategory
};
