const express = require('express');
const router = express.Router();
const bookmarkController = require('../controllers/bookmarkController');
const authMiddleware = require('../middlewares/authMiddleware');

// Tạo bookmark
router.post('/bookmarks/', authMiddleware(['user', 'author']), bookmarkController.createBookmark);

// Lấy bookmark theo ID
router.get('/bookmarks/:id/', authMiddleware(['user', 'author']), bookmarkController.getBookmarkById);

// Lấy danh sách bookmark theo User
router.get('/bookmarks/user/:userId/', authMiddleware(['user', 'author']), bookmarkController.getBookmarksByUser);

// Xóa bookmark
router.delete('/bookmarks/:id/', authMiddleware(['user', 'author']), bookmarkController.deleteBookmark);

module.exports = router;