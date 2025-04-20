const Article = require('../models/Article');
const ViewHistory = require('../models/viewHistory');
const Category = require('../models/Category'); 
const User = require('../models/User'); 
const cloudinary = require('../config/cloudinary');

// 1. Create Article (Thêm bài viết)
const createArticle = async (articleData, file) => {
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
  
    // Tạo bài viết với thông tin và URL thumbnail (nếu có)
    const article = await Article.create({
      ...articleData,
      thumbnail: thumbnailUrl,
      created_at: Date.now()
    });
  
    // Populate để trả về thông tin đầy đủ
    return await Article.findById(article._id)
      .populate('UserID', 'username avatar')
      .populate('CategoryID', 'name slug type');
  };

// 2. Get All Post Articles (Lấy tất cả bài đăng đã duyệt, sắp xếp theo ngày đăng DESC)
const getAllPostArticles = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const articles = await Article.find({ is_published: true })
    .sort({ published_date: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');
  return articles;
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
const getMostViewedArticles = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const articles = await Article.find({ is_published: true })
    .sort({ views: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');
  return articles;
};

// 5. Get Article by Category (Lấy bài báo theo danh mục - Hỗ trợ "Giải đấu")
const getArticleByCategory = async (categoryId, page = 1, limit = 10) => {
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
  return articles;
};

// 6. Get Article by Author (Lấy bài báo theo author_id - Kiểm tra role)
const getArticleByAuthor = async (authorId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  // Kiểm tra role của UserID (giả định role là 'author')
  const user = await require('../models/user.model').findById(authorId);
  if (!user) throw new Error('User not found');
  if (user.role !== 'author') throw new Error('User is not an author');

  const articles = await Article.find({ UserID: authorId })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');
  return articles;
};

// 7. Get Article by Published State (Lấy bài báo theo trạng thái duyệt)
const getArticleByPublishedState = async (publishedState, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const isPublished = publishedState === 'published' ? true : false;
  const articles = await Article.find({ is_published: isPublished })
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate('UserID', 'username avatar')
    .populate('CategoryID', 'name slug type');
  return articles;
};

// 8. Get New Published Articles Statistics (Lấy số lượng bài báo mới trong 15 ngày)
const getNewPublishedArticlesStats = async () => {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const count = await Article.countDocuments({
    is_published: true,
    published_date: { $gte: fifteenDaysAgo }
  });
  return { total: count };
};

// 9. Get All Viewed Articles by User (Lấy danh sách bài báo đã đọc của người dùng)
const getAllViewedArticlesByUser = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const viewedArticles = await ViewHistory.find({ UserID: userId })
    .sort({ viewed_at: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'ArticleID',
      populate: [
        { path: 'UserID', select: 'username avatar' },
        { path: 'CategoryID', select: 'name slug type' }
      ]
    });
  return viewedArticles;
};

// 10. Get All Post Articles Statistics (Lấy tổng số lượng bài báo đã đăng)
const getAllPostArticlesStats = async () => {
  const count = await Article.countDocuments({ is_published: true });
  return { total: count };
};

// 11. Update Article (Chỉnh sửa bài viết - Chỉ author của bài viết được phép)
const updateArticle = async (articleId, articleData, user, file) => {
  // Tìm bài viết theo ID
  const article = await Article.findById(articleId);
  if (!article) throw new Error('Article not found');

  // Kiểm tra quyền: Chỉ author của bài viết mới được sửa
  if (article.UserID.toString() !== user._id) {
    throw new Error('Access denied. You are not the author of this article.');
  }

  let thumbnailUrl = article.thumbnail_url; // Dùng ảnh cũ nếu không có file mới

  // Nếu có file thumbnail mới thì upload lên Cloudinary
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'article_thumbnails' }, // Lưu trong thư mục article_thumbnails
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    thumbnailUrl = result.secure_url; // Lấy URL mới
  }

  // Cập nhật bài viết với thông tin mới và thumbnail (nếu có)
  const updatedArticle = await Article.findByIdAndUpdate(
    articleId,
    { $set: { ...articleData, thumbnail_url: thumbnailUrl, updated_at: Date.now() } },
    { new: true, runValidators: true }
  )
  .populate('UserID', 'username avatar')
  .populate('CategoryID', 'name slug type');

  return updatedArticle;
};

  // 12. Delete Article (Xóa bài viết - Author hoặc Admin được phép)
const deleteArticle = async (articleId, user) => {
    const article = await Article.findById(articleId);
    if (!article) throw new Error('Article not found');
  
    // Kiểm tra quyền: Chỉ author của bài viết hoặc admin được phép xóa
    if (article.UserID.toString() !== user._id && user.role !== 'admin') {
      throw new Error('Access denied. You are not the author or an admin.');
    }
  
    await Article.findByIdAndDelete(articleId);
    return { message: 'Article deleted successfully' };
  };

// 13. Publish Article (Duyệt bài viết - Chỉ Admin được phép)
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
          updated_at: Date.now()
        }
      },
      { new: true, runValidators: true }
    )
      .populate('UserID', 'username avatar')
      .populate('CategoryID', 'name slug type');
    return updatedArticle;
};

// 14. API Upload Thumbnail
const uploadThumbnail = async (articleId, file, user) => {
    const article = await Article.findById(articleId);
    if (!article) throw new Error('Article not found');
    if (article.UserID.toString() !== user._id) {
      throw new Error('Access denied. You are not the author of this article.');
    }
  
    // Upload file lên Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'thumbnails' }, // Lưu vào thư mục 'thumbnails' trên Cloudinary
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
  
    // Cập nhật trường thumbnail với URL từ Cloudinary
    const updatedArticle = await Article.findByIdAndUpdate(
      articleId,
      { $set: { thumbnail: result.secure_url, updated_at: Date.now() } },
      { new: true, runValidators: true }
    ).populate('UserID', 'username avatar')
     .populate('CategoryID', 'name slug type');  
    return updatedArticle;
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
  getAllPostArticlesStats,
  uploadThumbnail,
  updateArticle,
  deleteArticle,
  publishArticle
};