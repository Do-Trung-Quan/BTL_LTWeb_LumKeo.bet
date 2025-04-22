const express = require('express');
const router = express.Router();

const UserController = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');


// Các API không yêu cầu phân quyền
router.post('/register', UserController.register);
router.post('/login', UserController.login);
router.post('/reset-password', UserController.resetPassword);

// Các API yêu cầu quyền admin
router.get('/users', authMiddleware(['admin']), UserController.getUsers);
router.get('/authors', authMiddleware(['admin']), UserController.getAuthors);
router.get('/authors/:authorId', authMiddleware(['admin']), UserController.getAuthorById);
router.delete('/users/:userId', authMiddleware(['admin']), UserController.deleteUser);

router.get('/statistics/new-users', authMiddleware(['admin']), UserController.getNewUsersStatistics);
router.get('/statistics/new-authors', authMiddleware(['admin']), UserController.getNewAuthorsStatistics);
router.get('/statistics/all-users', authMiddleware(['admin']), UserController.getAllUsersStatistics);
router.get('/statistics/all-authors', authMiddleware(['admin']), UserController.getAllAuthorsStatistics);

// API cập nhật user (chỉ yêu cầu đăng nhập)
router.put('/users/:userId/username', authMiddleware(), UserController.updateUsername);
router.put('/users/:userId/password', authMiddleware(), UserController.updatePassword);
router.put('/users/:userId/avatar', authMiddleware(), upload, UserController.updateAvatar);

module.exports = router;
