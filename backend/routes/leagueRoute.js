const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

// Lấy danh sách giải đấu
router.get('/', leagueController.getAllLeagues);

// Lấy chi tiết giải đấu
router.get('/:id', leagueController.getLeagueById);

// Tạo giải đấu mới
router.post('/', leagueController.createLeague);

// Cập nhật giải đấu
router.put('/:id', leagueController.updateLeague);

// Xóa giải đấu
router.delete('/:id', leagueController.deleteLeague);

module.exports = router;