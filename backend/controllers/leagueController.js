const leagueService = require('../services/leagueService');

// 1. Create League
const createLeague = async (req, res) => {
  try {
    // 👇 Dùng fields thì file sẽ nằm trong req.files.logo[0]
    const file = req.files && req.files.logo ? req.files.logo[0] : null;
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!file.buffer || file.size === 0) {
      return res.status(400).json({ message: 'File is empty or corrupted' });
    }

    const { name, slug, season_time} = req.body;
    const leagueData = { name, slug, season_time};

    const league = await leagueService.createLeague(leagueData, file);
    res.status(201).json({ message: 'League created successfully', league });
  } catch (error) {
    console.error('Error creating league:', error);
    res.status(500).json({ message: 'Error creating league', error: error.message });
  }
};



// 2. Get All Leagues
const getAllLeagues = async (req, res) => {
  try {
    const leagues = await leagueService.getAllLeagues();  
    res.status(200).json(leagues);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching leagues', error: error.message });
  }
};

// 3. Get League by ID
const getLeagueById = async (req, res) => {
  try {
    const league = await leagueService.getLeagueById(req.params.id);  // Sử dụng leagueService thay vì categoryService
    res.status(200).json(league);
  } catch (error) {
    if (error.message === 'League not found' || error.message === 'Not a league') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error fetching league', error: error.message });
  }
};

// 4. Update League
const updateLeague = async (req, res) => {
  try {
    // Lấy dữ liệu từ request
    const { name, slug, season_time, parentCategory } = req.body;
    const leagueData = { name, slug, season_time, parentCategory };

    // Lấy file (logo) từ multer
    const file = req.files && req.files.logo ? req.files.logo[0] : null;

    // Gọi service để cập nhật giải đấu
    const updatedLeague = await leagueService.updateLeague(req.params.id, leagueData, file);

    // Trả về phản hồi thành công
    res.status(200).json({ message: 'League updated successfully', league: updatedLeague });
  } catch (error) {
    // Kiểm tra lỗi nếu không tìm thấy giải đấu hoặc không phải loại 'League'
    if (error.message === 'League not found' || error.message === 'Not a league') {
      return res.status(404).json({ message: error.message });
    }
    // Lỗi trong quá trình cập nhật
    res.status(500).json({ message: 'Error updating league', error: error.message });
  }
};

// 5. Delete League
const deleteLeague = async (req, res) => {
  try {
    const result = await leagueService.deleteLeague(req.params.id);  // Sử dụng leagueService thay vì categoryService
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'League not found' || error.message === 'Not a league') {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: 'Error deleting league', error: error.message });
  }
};

// 6. Get Most Viewed Articles in Each League
const getMostViewedArticlesInEachLeague = async (req, res) => {
  try {
    const result = await leagueService.getMostViewedArticlesInEachLeague();  // Sử dụng leagueService thay vì categoryService
    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching most viewed articles', error: error.message });
  }
};

module.exports = {
  createLeague,
  getAllLeagues,
  getLeagueById,
  updateLeague,
  deleteLeague,
  getMostViewedArticlesInEachLeague
};
