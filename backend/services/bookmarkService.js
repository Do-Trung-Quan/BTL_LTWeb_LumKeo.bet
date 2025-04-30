const mongoose = require('mongoose');
const Bookmark = require('../models/Bookmark');
const Article = require('../models/Article');
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
const getBookmarksByUser = async (userId, page = 1, limit = 10) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }

  const skip = (page - 1) * limit;

  const bookmarks = await Bookmark.find({ UserID: userId })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar') // Populate user fields
    .populate({
      path: 'ArticleID',
      select: 'title thumbnail created_at', // Select fields from Article
      populate: {
        path: 'CategoryID', // Populate CategoryID within ArticleID
        select: 'name' // Only select the 'name' field from Category
      }
    })
    .sort({ created_at: -1 }); // Sắp xếp theo thời gian tạo, mới nhất trước

  const total = await Bookmark.countDocuments({ UserID: userId });

  return {
    data: bookmarks,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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