const bookmarkService = require('../services/bookmarkService');

// Tạo bookmark
const createBookmark = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id;
    const { articleId } = req.body;
    console.log(req.body);

    const bookmark = await bookmarkService.createBookmark(userId, articleId);
    res.status(201).json({ message: 'Bookmark created successfully', bookmark });
  } catch (error) {
    if (
      error.message === 'Invalid UserID format' ||
      error.message === 'Invalid ArticleID format' ||
      error.message === 'Bookmark already exists'
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error creating bookmark', error: error.message });
  }
};

// Lấy bookmark theo ID
const getBookmarkById = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const bookmarkId = req.params.id;
    const bookmark = await bookmarkService.getBookmarkById(bookmarkId);

    // Kiểm tra xem user có quyền xem bookmark không
    if (bookmark.UserID._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only view your own bookmarks' });
    }

    res.status(200).json(bookmark);
  } catch (error) {
    if (error.message === 'Invalid BookmarkID format' || error.message === 'Bookmark not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching bookmark', error: error.message });
  }
};

// Lấy danh sách bookmark theo User
const getBookmarksByUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 6;
    const category = req.query.category || '';
    const keyword = req.query.keyword || '';

    console.log('Request params:', { userId, page, limit, category, keyword });

    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: 'You can only view your own bookmarks' });
    }

    const result = await bookmarkService.getBookmarksByUser(userId, page, limit, category, keyword);
    console.log('Service result:', result);

    res.status(200).json({
      success: true,
      data: {
        bookmarks: result.bookmarks,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages
        }
      }
    });
  } catch (error) {
    console.error('Error in getBookmarksByUser controller:', error.message);
    if (error.message === 'Invalid UserID format' || error.message.startsWith('Category')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách bookmark', error: error.message });
  }
};

// Xóa bookmark
const deleteBookmark = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const bookmarkId = req.params.id;
    const userId = req.user._id;

    const result = await bookmarkService.deleteBookmark(bookmarkId, userId);
    res.status(200).json(result);
  } catch (error) {
    if (
      error.message === 'Invalid BookmarkID format' ||
      error.message === 'Invalid UserID format' ||
      error.message === 'Bookmark not found' ||
      error.message === 'You can only delete your own bookmarks'
    ) {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting bookmark', error: error.message });
  }
};

module.exports = {
  createBookmark,
  getBookmarkById,
  getBookmarksByUser,
  deleteBookmark,
};