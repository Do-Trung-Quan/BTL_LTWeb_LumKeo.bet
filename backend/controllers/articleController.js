const articleService = require('../services/articleService');
const Category = require('../models/Category'); 
const User = require('../models/User');

// 1. Create Article (Thêm bài viết)
const createArticle = async (req, res) => {
  try {
    const file = req.files?.thumbnails?.[0] || null;

    if (!file) {
      return res.status(400).json({ message: 'No thumbnail uploaded' });
    }

    if (!file.buffer || file.size === 0) {
      return res.status(400).json({ message: 'Thumbnail file is empty or corrupted' });
    }

    // Lấy dữ liệu từ request body
    const { title, slug, summary, content, CategoryID, league_id } = req.body;
    console.log(req.body); // debug

    // Kiểm tra xác thực người dùng
    if (!req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const category = await Category.findById(CategoryID);
    if (!category) {
      return res.status(400).json({ message: 'Category not found' });
    }

    const articleData = {
      title,
      slug,
      summary,
      content,
      CategoryID: category._id,
      UserID: req.user._id,
      league_id: league_id || undefined,
    };

    const article = await articleService.createArticle(articleData, file);

    res.status(201).json({ message: 'Article created successfully', article });
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(500).json({ message: 'Error creating article', error: error.message });
  }
};


// 2. Get All Post Articles (Lấy tất cả bài đăng đã duyệt)
const getAllPostArticles = async (req, res) => {
  try {
    const articles = await articleService.getAllPostArticles();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
};

// 3. Get Article by ID (Lấy thông tin bài báo theo ID)
const getArticleById = async (req, res) => {
  try {
    const article = await articleService.getArticleById(req.params.id);
    res.status(200).json(article);
  } catch (error) {
    if (error.message === 'Article not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
};

// 4. Get Most Viewed Articles (Tin nóng)
const getMostViewedArticles = async (req, res) => {
  try {
    const articles = await articleService.getMostViewedArticles();
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching most viewed articles', error: error.message });
  }
};

// 5. Get Article by Category (Lấy bài báo theo danh mục - Xử lý lỗi mới)
const getArticleByCategory = async (req, res) => {
  try {
    const articles = await articleService.getArticleByCategory(req.params.categoryId);
    res.status(200).json(articles);
  } catch (error) {
    if (error.message === 'Category not found') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching articles by category', error: error.message });
  }
};

// 6. Get Article by Author (Lấy bài báo theo author_id - Xử lý lỗi mới)
const getArticleByAuthor = async (req, res) => {
  try {
    const articles = await articleService.getArticleByAuthor(req.params.authorId);
    res.status(200).json(articles);
  } catch (error) {
    if (error.message === 'User not found' || error.message === 'User is not an author') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching articles by author', error: error.message });
  }
};

// 7. Get Article by Published State (Lấy bài báo theo trạng thái duyệt)
const getArticleByPublishedState = async (req, res) => {
  try {
    const articles = await articleService.getArticleByPublishedState(req.params.publishedState);
    res.status(200).json(articles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles by published state', error: error.message });
  }
};

// 8. Get New Published Articles Statistics (Lấy số lượng bài báo mới trong 15 ngày)
const getNewPublishedArticlesStats = async (req, res) => {
  try {
    const stats = await articleService.getNewPublishedArticlesStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching new articles stats', error: error.message });
  }
};

// 9. Get All Viewed Articles by User (Lấy danh sách bài báo đã đọc của người dùng)
const getAllViewedArticlesByUser = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.params.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    // Kiểm tra xem user có quyền xem danh sách bookmark không
    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'You can only view your own histories' });
    }
    const viewedArticles = await articleService.getAllViewedArticlesByUser(userId, page, limit);
    res.status(200).json(viewedArticles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching viewed articles', error: error.message });
  }
};

// 10. Delete a View History Record (Xóa một lịch sử xem bài báo)
const deleteViewHistory = async (req, res) => {
  try {
    const { historyId } = req.params;
    const userId = req.user.id; // Assuming authMiddleware adds the user to req.user
    const result = await articleService.deleteViewHistory(historyId, userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// 11. Get All Post Articles Statistics (Lấy tổng số lượng bài báo đã đăng)
const getAllPostArticlesStats = async (req, res) => {
  try {
    const stats = await articleService.getAllPostArticlesStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles stats', error: error.message });
  }
};

// 12. Update Article (Chỉnh sửa bài viết - Chỉ author được phép)
const updateArticle = async (req, res) => {
  try {
    // Lấy dữ liệu từ request
    const { title, slug, summary, content, CategoryID } = req.body;
    const articleData = { title, slug, summary, content };

    // Kiểm tra xác thực người dùng
    if (!req.user?._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Thêm CategoryID vào articleData nếu có
    if (CategoryID) {
      articleData.CategoryID = CategoryID;
    }

    // Lấy file (thumbnail) từ multer
    const file = req.files && req.files.thumbnails ? req.files.thumbnails[0] : null;

    // Gọi service để cập nhật bài viết
    const updatedArticle = await articleService.updateArticle(req.params.id, articleData, req.user, file);

    // Trả về phản hồi thành công
    res.status(200).json({ message: 'Article updated successfully', article: updatedArticle });
  } catch (error) {
    // Kiểm tra lỗi nếu không tìm thấy bài viết hoặc không có quyền
    if (
      error.message === 'Article not found' ||
      error.message === 'Access denied. You are not the author of this article.'
    ) {
      return res.status(403).json({ message: error.message });
    }
    // Lỗi trong quá trình cập nhật
    res.status(500).json({ message: 'Error updating article', error: error.message });
  }
};

  // 13. Delete Article (Xóa bài viết)
  const deleteArticle = async (req, res) => {
    try {
      const result = await articleService.deleteArticle(req.params.id, req.user);
      res.status(200).json(result);
    } catch (error) {
      if (error.message === 'Article not found' || 
          error.message === 'Access denied. You are not the author or an admin.') {
        return res.status(403).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error deleting article', error: error.message });
    }
  };
  
  // 14. Publish Article (Duyệt bài viết)
  const publishArticle = async (req, res) => {
    try {
      // Kiểm tra quyền admin
      if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin role required.' });
      }
  
      const updatedArticle = await articleService.publishArticle(req.params.id);
      res.status(200).json({ message: 'Article published successfully', article: updatedArticle });
    } catch (error) {
      if (error.message === 'Article not found' || error.message === 'Article is already published') {
        return res.status(400).json({ message: error.message });
      }
      res.status(500).json({ message: 'Error publishing article', error: error.message });
    }
  };

  // 15. Ghi lại lịch sử xem bài viết
const recordArticleView = async (req, res) => {
  try {
    // Kiểm tra req.user (được gán bởi authMiddleware)
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const userId = req.user._id;
    const articleId = req.params.id;

    // Gọi service để ghi lại lịch sử xem
    await articleService.recordArticleView(userId, articleId);

    res.status(200).json({ message: 'Article view recorded successfully' });
  } catch (error) {
    if (
      error.message === 'User not found' ||
      error.message === 'Article not found' ||
      error.message === 'Article is not published, view cannot be recorded'
    ) {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error recording article view', error: error.message });
  }
};


module.exports = {
  createArticle,
  getAllPostArticles,
  getArticleById,
  getMostViewedArticles,
  getArticleByCategory,
  getArticleByAuthor,
  getArticleByPublishedState,
  getNewPublishedArticlesStats,
  getAllViewedArticlesByUser,
  deleteViewHistory,
  getAllPostArticlesStats,
  updateArticle,
  deleteArticle,
  publishArticle,
  recordArticleView
};