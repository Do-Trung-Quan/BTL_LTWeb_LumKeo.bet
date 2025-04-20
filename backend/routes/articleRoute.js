const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');

// Route cần quyền 'admin' hoặc 'author'
router.post('/articles', authMiddleware('author'), upload, articleController.createArticle);
router.get('/articles/published/:publishedState', authMiddleware('admin'), articleController.getArticleByPublishedState);
router.get('/articles/stats/new', authMiddleware('admin'), articleController.getNewPublishedArticlesStats);
router.get('/articles/stats/total', authMiddleware('admin'), articleController.getAllPostArticlesStats);
router.put('/articles/:id', authMiddleware(), articleController.updateArticle); // Cập nhật bài viết - Chỉ author của bài viết
router.delete('/articles/:id', authMiddleware(), articleController.deleteArticle); // Xóa bài viết - Author hoặc Admin
router.put('/articles/:id/publish', authMiddleware('admin'), articleController.publishArticle); // Duyệt bài viết - Chỉ Admin

//Route yêu cầu đăng nhập
router.get('/articles/author/:authorId', authMiddleware(),  articleController.getArticleByAuthor);
router.get('/articles/viewed/:userId',  authMiddleware(),articleController.getAllViewedArticlesByUser);
router.post('/articles/:id/thumbnail', authMiddleware(), upload, articleController.uploadThumbnail);

// Route public (không cần phân quyền, người dùng có thể truy cập tự do)
router.get('/articles', articleController.getAllPostArticles);
router.get('/articles/:id', articleController.getArticleById);
router.get('/articles/most-viewed', articleController.getMostViewedArticles);
router.get('/articles/category/:categoryId', articleController.getArticleByCategory);


module.exports = router;