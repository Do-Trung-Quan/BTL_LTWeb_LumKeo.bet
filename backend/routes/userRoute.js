const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middlewares/auth');

// Đăng ký user
router.post('/register', userController.registerUser);

// Đăng nhập user
router.post('/login', userController.loginUser);

// Lấy thông tin user (yêu cầu xác thực)
router.get('/me', auth, userController.getUser);

// Cập nhật avatar (yêu cầu xác thực)
router.put('/avatar', auth, userController.updateAvatar);

// Route Reset Mật Khẩu
router.post('/reset-password', userController.resetPassword);

router.get('/public', userController.getPublicUsers);

module.exports = router;