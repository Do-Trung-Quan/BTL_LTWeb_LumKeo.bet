const Article = require('../models/Article');
const ViewHistory = require('../models/viewHistory');
const Category = require('../models/Category'); 
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const Notification = require('../models/Notification');
const notificationService = require('../services/notificationService');
const User = require('../models/User'); 
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

let websocket = null; // Will be initialized in main server file

// Initialize websocket
const initWebSocket = (ws) => {
  websocket = ws;
};

// 1. Create Article (Thêm bài viết)

const createArticle = async (articleData, file) => {
  // Kiểm tra UserID
  const { UserID, CategoryID } = articleData;
  if (!mongoose.Types.ObjectId.isValid(UserID)) {
    throw new Error('Invalid UserID format');
  }
  const userExists = await User.findById(UserID);
  if (!userExists) {
    throw new Error('UserID does not exist');
  }

  // Kiểm tra CategoryID
  if (!mongoose.Types.ObjectId.isValid(CategoryID)) {
    throw new Error('Invalid CategoryID format');
  }
  const categoryExists = await Category.findById(CategoryID);
  if (!categoryExists) {
    throw new Error('CategoryID does not exist');
  }

  let thumbnailUrl = null;

  // Nếu có file ảnh được gửi, upload lên Cloudinary
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'thumbnails' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    thumbnailUrl = result.secure_url;
  }

  // Tạo bài viết với thông tin và URL thumbnail
  const article = await Article.create({
    ...articleData,
    thumbnail: thumbnailUrl,
    created_at: Date.now(),
  });

  // Populate để trả về thông tin đầy đủ
  const populatedArticle = await Article.findById(article._id)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  // Create notifications for admins
  try {
    console.log('Creating notification for article:', article._id);
    await notificationService.createPendingArticleNotification(article._id);
    console.log('Notification created successfully');
  } catch (error) {
    console.error('Failed to create pending article notification:', error.message);
  }

  return populatedArticle;
};

// 2. Get All Post Articles (Lấy tất cả bài đăng đã duyệt, sắp xếp theo ngày đăng DESC)
const getAllPostArticles = async (page, limit) => {
  try {
    const query = { is_published: true }; // Use consistent field name
    const options = {
      sort: { published_date: -1 },
      populate: [
        { path: 'UserID', select: 'username avatar' },
        { path: 'CategoryID', select: 'name slug type' }
      ]
    };

    let articles, total;
    if (limit === 0) {
      articles = await Article.find(query, null, options).lean();
      total = articles.length;
    } else {
      const skip = (page - 1) * limit;
      articles = await Article.find(query, null, { ...options, skip, limit }).lean();
      total = await Article.countDocuments(query);
    }

    return {
      articles,
      total,
      page,
      limit,
      totalPages: limit > 0 ? Math.ceil(total / limit) : 1
    };
  } catch (error) {
    throw new Error(`Error fetching articles: ${error.message}`);
  }
};

// 3. Get Article by ID (Lấy thông tin bài báo theo ID)
const getArticleById = async (articleId) => {
  const article = await Article.findById(articleId)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');
  if (!article) throw new Error('Article not found');
  return article;
};

// 4. Get Most Viewed Articles (Tin nóng)
const getMostViewedArticles = async (page, limit) => {
  const skip = (page - 1) * limit;
  const articles = await Article.find({ is_published: true })
    .sort({ views: -1, published_date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  const total = await Article.countDocuments({ is_published: true });

  return {
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};


// 5. Get Article by Category (Lấy bài báo theo danh mục - Hỗ trợ "Giải đấu")
const getArticleByCategory = async (categoryId, page, limit) => {
  const skip = (page - 1) * limit;

  // Kiểm tra xem categoryId có phải là danh mục "Giải đấu" không
  const category = await Category.findById(categoryId);
  if (!category) throw new Error('Category not found');

  let categoryIds = [categoryId]; // Mảng chứa các CategoryID để tìm bài viết

  // Nếu là danh mục "Giải đấu", lấy tất cả League thuộc danh mục này
  if (category.name === 'Giải đấu' && category.type === 'Category') {
    const leagues = await Category.find({ parentCategory: categoryId, type: 'League' });
    const leagueIds = leagues.map(league => league._id);
    categoryIds = [...categoryIds, ...leagueIds]; // Thêm các _id của League vào mảng
  }

  // Tìm bài viết thuộc các CategoryID hoặc LeagueID
  const articles = await Article.find({ CategoryID: { $in: categoryIds }, is_published: true })
    .sort({ published_date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  // Đếm tổng số bài viết theo từng danh mục hoặc league
  const counts = await Promise.all(
    categoryIds.map(async (id) => {
      const cat = await Category.findById(id);
      const count = await Article.countDocuments({ CategoryID: id, is_published: true });
      return {
        categoryId: id,
        categoryName: cat.name,
        type: cat.type,
        articleCount: count,
      };
    })
  );

  // Đếm tổng số bài viết cho tất cả các danh mục/league trong categoryIds
  const totalArticles = await Article.countDocuments({ CategoryID: { $in: categoryIds }, is_published: true });

  return {
    articles,
    counts, // Số lượng bài viết theo từng danh mục/league
    totalArticles, // Tổng số bài viết trong tất cả danh mục/league
    page,
    limit,
    totalPages: Math.ceil(totalArticles / limit),
  };
};

// 6. Get Article by Author (Lấy bài báo theo author_id - Kiểm tra role)
const getArticleByAuthor = async (authorId, page, limit) => {
  const skip = (page - 1) * limit;
  // Kiểm tra role của UserID (giả định role là 'author')
  const user = await User.findById(authorId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'author') throw new Error('User is not an author');

  const articles = await Article.find({ UserID: authorId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  const total = await Article.countDocuments({ UserID: authorId });

  return {
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};


// 7. Get Article by Published State (Lấy bài báo theo trạng thái duyệt)
const getArticleByPublishedState = async (publishedState, page, limit) => {
  const skip = (page - 1) * limit;
  const isPublished = publishedState === 'published' ? true : false;
  const articles = await Article.find({ is_published: isPublished })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  const total = await Article.countDocuments({ is_published: isPublished });

  return {
    articles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  };
};

// 8. Get New Published Articles Statistics (Lấy số lượng bài báo mới trong 15 ngày)
const getNewPublishedArticlesStats = async () => {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  // Aggregate to group articles by day
  const stats = await Article.aggregate([
    {
      $match: {
        is_published: true,
        published_date: { $gte: fifteenDaysAgo, $lte: now }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$published_date" }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 } // Sort by date ascending
    }
  ]);

  // Create an array of the last 15 days with 0 counts for days with no data
  const result = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    const found = stats.find(stat => stat._id === dateStr);
    result.push({
      date: dateStr,
      count: found ? found.count : 0
    });
  }

  return { dailyStats: result, total: result.reduce((sum, day) => sum + day.count, 0) };
};

// 9. Get All Viewed Articles by User (Lấy danh sách bài báo đã đọc của người dùng)
const getAllViewedArticlesByUser = async (userId, page, limit) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }
  const skip = (page - 1) * limit;
  const viewedArticles = await ViewHistory.find({ UserID: userId })
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
    .sort({ viewed_at: -1 }); // Sắp xếp theo thời gian xem, mới nhất trước

  const total = await ViewHistory.countDocuments({ UserID: userId });
  return {
    data: viewedArticles,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};


// 10. Delete a View History Record (Xóa một lịch sử xem bài báo)
const deleteViewHistory = async (historyId, userId) => {
  const history = await ViewHistory.findOneAndDelete({
    _id: historyId,
    UserID: userId // Ensure the history belongs to the user
  });

  if (!history) {
    throw new Error('Lịch sử xem không tồn tại hoặc bạn không có quyền xóa.');
  }

  return { success: true, message: 'Xóa lịch sử xem thành công!' };
};

// 11. Get All Post Articles Statistics (Lấy tổng số lượng bài báo đã đăng)
const getAllPostArticlesStats = async () => {
  const count = await Article.countDocuments({ is_published: true });
  return { total: count };
};

// 12. Update Article (Chỉnh sửa bài viết - Chỉ author của bài viết được phép)
const updateArticle = async (articleId, articleData, user, file) => {
  // Tìm bài viết theo ID
  const article = await Article.findById(articleId);
  if (!article) throw new Error('Article not found');

  // Kiểm tra quyền: Chỉ author của bài viết mới được sửa
  if (article.UserID.toString() !== user._id.toString()) {
    throw new Error('Access denied. You are not the author of this article.');
  }

  // Kiểm tra CategoryID nếu có
  if (articleData.CategoryID) {
    if (!mongoose.Types.ObjectId.isValid(articleData.CategoryID)) {
      throw new Error('Invalid CategoryID format');
    }
    const categoryExists = await Category.findById(articleData.CategoryID);
    if (!categoryExists) {
      throw new Error('CategoryID does not exist');
    }
  }

  let thumbnailUrl = article.thumbnail; // Dùng thumbnail cũ nếu không có file mới

  // Nếu có file ảnh mới được gửi, upload lên Cloudinary
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'article_thumbnails' }, // Lưu vào thư mục 'article_thumbnails'
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    thumbnailUrl = result.secure_url; // Lấy URL thumbnail từ Cloudinary
  }

  // Cập nhật Article với thông tin mới và URL thumbnail (nếu có)
  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    { $set: { ...articleData, thumbnail: thumbnailUrl, updated_at: Date.now() } },
    { new: true, runValidators: true }
  )
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  return updatedArticle;
};

  // 13. Delete Article (Xóa bài viết - Author hoặc Admin được phép)
  const deleteArticle = async (articleId, user) => {
    const article = await Article.findById(articleId);
    if (!article) throw new Error('Article not found');
  
    if (article.UserID.toString() !== user._id.toString() && user.role !== 'admin') {
      throw new Error('Access denied. You are not the author or an admin.');
    }
  
    // Xóa liên quan
    await Promise.all([
      Comment.deleteMany({ ArticleID: articleId }),
      Bookmark.deleteMany({ ArticleID: articleId }),
      ViewHistory.deleteMany({ ArticleID: articleId }),
      Notification.deleteMany({ noti_entity_ID: articleId, noti_entity_type: 'Article' }),
    ]);
  
    await Article.findByIdAndDelete(articleId);
    return { message: 'Article deleted successfully' };
  };
  

// 14. Publish Article (Duyệt bài viết - Chỉ Admin được phép)
const publishArticle = async (articleId) => {
  const article = await Article.findById(articleId);
  if (!article) throw new Error('Article not found');
  if (article.is_published) throw new Error('Article is already published');

  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    {
      $set: {
        is_published: true,
        published_date: Date.now(),
        updated_at: Date.now(),
      },
    },
    { new: true, runValidators: true }
  )
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');

  // Send notification to the article's author
  try {
    console.log('Creating notification for article publish:', article._id);
    const notification = await notificationService.createNotification({
      noti_entity_ID: article._id,
      noti_entity_type: 'Article',
      content: `Your article "${article.title}" has been published`,
      UserID: article.UserID,
    });
    console.log('Publish notification created:', notification);
    if (websocket) {
      websocket.notifyUser(article.UserID.toString(), {
        type: 'ARTICLE_NOTIFICATION',
        message: `Your article "${article.title}" has been published`,
        articleId: article._id,
        createdAt: Date.now(),
      });
    }
  } catch (error) {
    console.error('Failed to create publish notification:', error.message);
  }
  return updatedArticle;
};

// 15. Ghi lại lịch sử xem bài viết
const recordArticleView = async (userId, articleId) => {
  // Kiểm tra userId và articleId hợp lệ
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new Error('Invalid UserID format');
  }
  if (!mongoose.Types.ObjectId.isValid(articleId)) {
    throw new Error('Invalid ArticleID format');
  }

  // Kiểm tra user có tồn tại không
  const userExists = await User.findById(userId);
  if (!userExists) {
    throw new Error('User not found');
  }

  // Kiểm tra bài viết có tồn tại không
  const articleExists = await Article.findById(articleId);
  if (!articleExists) {
    throw new Error('Article not found');
  }

  // Kiểm tra bài viết có được publish không
  if (!articleExists.is_published) {
    throw new Error('Article is not published, view cannot be recorded');
  }

  // Tạo bản ghi ViewHistory
  await ViewHistory.create({
    UserID: userId,
    ArticleID: articleId,
    viewed_at: Date.now(),
  });

  // Tăng số lượt xem của bài viết
  await Article.findByIdAndUpdate(articleId, { $inc: { views: 1 } });
};

// 16. Count published articles by Author ID
const countPublishedArticlesByAuthor = async (userId) => {
  try {
    const count = await Article.countDocuments({
      UserID: userId,
      is_published: true
    });
    return count;
  } catch (error) {
    console.error('Error counting published articles:', error);
    throw new Error('Failed to count published articles');
  }
};

// 17. Get article ID by slug
const getArticleIdBySlug = async (slug) => {
  try {
    const article = await Article.findOne({ slug, is_published: true }).select('_id');
    if (!article) {
      throw new Error('Article not found');
    }
    return article._id;
  } catch (error) {
    console.error('Error fetching article ID:', error);
    throw new Error('Failed to fetch article ID');
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
  recordArticleView, 
  initWebSocket,
  countPublishedArticlesByAuthor,
  getArticleIdBySlug
};