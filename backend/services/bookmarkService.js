const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Article = require('../models/Article');
const Category = require('../models/Category');
// Tạo bookmark
const createBookmark = async (userId, articleId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    throw new Error('Invalid ArticleID format');
  }

  const article = await Article.findById(articleId);
    if (!article) {
        throw new Error('Article not found');
    }
    if (!article.is_published) {
        throw new Error('Cannot bookmark an unpublished article');
    }

  // Kiểm tra bookmark đã tồn tại chưa
  const existingBookmark = await Bookmark.findOne({ UserID: userId, ArticleID: articleId });
  if (existingBookmark) {
    throw new Error('Bookmark already exists');
  }

  const bookmark = await Bookmark.create({
    UserID: userId,
    ArticleID: articleId,
    created_at: Date.now(),
  });

  return bookmark;
};

// Lấy bookmark theo ID
const getBookmarkById = async (bookmarkId) => {
  if (!mongoose.Types.ObjectId.isValid(bookmarkId)) {
    throw new Error('Invalid BookmarkID format');
  }

  const bookmark = await Bookmark.findById(bookmarkId)
    .populate('UserID', 'username avatar')
    .populate('ArticleID', 'title slug views');
  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  return bookmark;
};

// Lấy danh sách bookmark theo User
const getBookmarksByUser = async (userId, page, limit, category = '', keyword = '') => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }

  // Build match conditions for ArticleID population
  const articleMatch = {};

  // Optional: Filter by category
  if (category && category !== 'Tất cả') {
    const categoryDoc = await Category.findOne({ name: category.trim() }).catch(err => {
      console.error('Error finding category:', err);
      throw new Error(`Category '${category}' not found`);
    });
    if (!categoryDoc) {
      throw new Error(`Category '${category}' not found`);
    }
    articleMatch.CategoryID = categoryDoc._id;
  }

  // Optional: Filter by keyword in title
  if (keyword && keyword.trim() !== '') {
    articleMatch.title = { $regex: keyword.trim(), $options: 'i' };
  }

  // Fetch all bookmarks with populated ArticleID
  const allBookmarks = await Bookmark.find({ UserID: userId })
    .populate({
      path: 'UserID',
      select: 'username avatar'
    })
    .populate({
      path: 'ArticleID',
      match: articleMatch,
      select: 'title thumbnail created_at slug',
      populate: {
        path: 'CategoryID',
        select: 'name'
      }
    })
    .sort({ created_at: -1 })
    .catch(err => {
      console.error('Error fetching bookmarks:', err);
      throw new Error('Error fetching bookmarks');
    });

  // Filter out entries where ArticleID didn't match the criteria
  const filteredBookmarks = allBookmarks.filter(bm => bm.ArticleID);

  // Calculate total count after filtering
  const total = filteredBookmarks.length;

  // Apply pagination on the filtered results
  const skip = (page - 1) * limit;
  const paginatedBookmarks = filteredBookmarks.slice(skip, skip + limit);

  return {
    bookmarks: paginatedBookmarks,
    total,
    page,
    limit,
    totalPages: total > 0 ? Math.ceil(total / limit) : 0
  };
};

// Xóa bookmark
const deleteBookmark = async (bookmarkId, userId) => {
  if (!mongoose.Types.ObjectId.isValid(bookmarkId)) {
    throw new Error('Invalid BookmarkID format');
  }
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }

  const bookmark = await Bookmark.findById(bookmarkId);
  if (!bookmark) {
    throw new Error('Bookmark not found');
  }

  // Kiểm tra xem user có quyền xóa bookmark không
  if (bookmark.UserID.toString() !== userId.toString()) {
    throw new Error('You can only delete your own bookmarks');
  }

  await Bookmark.deleteOne({ _id: bookmarkId });
  return { message: 'Bookmark deleted successfully' };
};

module.exports = {
  createBookmark,
  getBookmarkById,
  getBookmarksByUser,
  deleteBookmark,
};