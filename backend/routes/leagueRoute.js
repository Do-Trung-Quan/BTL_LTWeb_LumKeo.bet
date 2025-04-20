const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../middlewares/fileUpload');

// Chỉ admin mới được tạo hoặc cập nhật/xóa giải đấu
router.post('/leagues', authMiddleware('admin'), upload, leagueController.createLeague); // Tạo giải đấu
router.put('/leagues/:id', authMiddleware('admin'), upload, leagueController.updateLeague); // Cập nhật giải đấu
router.delete('/leagues/:id', authMiddleware('admin'), leagueController.deleteLeague); // Xóa giải đấu

// Public route - Không cần đăng nhập
router.get('/leagues', leagueController.getAllLeagues); // Xem danh sách giải đấu
router.get('/leagues/:id', leagueController.getLeagueById); // Xem chi tiết giải đấu
router.get('/leagues/most-viewed-articles', leagueController.getMostViewedArticlesInEachLeague); // Xem bài viết hot trong từng giải đấu

module.exports = router;