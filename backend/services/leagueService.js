const Category = require('../models/Category');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const ViewHistory = require('../models/viewHistory');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2; // Đảm bảo Cloudinary đã được cấu hình

// 1. Create League (Tạo giải đấu: V.League, Ligue 1, La Liga, Bundesliga, Premier League, Serie A)
const createLeague = async (leagueData, file) => {
  let logoUrl = null;

  // Nếu có file ảnh được gửi, upload lên Cloudinary
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'league_logos' }, // Lưu vào thư mục 'league_logos' trên Cloudinary
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    logoUrl = result.secure_url;
  }

  // Tạo League với thông tin và URL logo (nếu có)
  // Tìm kiếm category "Giải đấu" và lấy ObjectId của nó
  const parentCategory = await Category.findOne({ name: 'Giải đấu' });

  if (!parentCategory) {
    console.error('Category "Giải đấu" not found');
    throw new Error('Category "Giải đấu" not found');
  }

  // Tạo League với thông tin và URL logo (nếu có)
  const league = await Category.create({
    ...leagueData,
    type: 'League', // Đảm bảo type là 'League'
    logo_url: logoUrl,
    parentCategory: parentCategory._id, // Gán ObjectId của category "Giải đấu"
    created_at: Date.now()
  });

  // Populate để trả về thông tin đầy đủ
  return await Category.findById(league._id)
    .populate('parentCategory', 'name slug');
};

// 2. Get All Leagues (Lấy tất cả giải đấu, filter theo type = League)
const getAllLeagues = async () => {
  const leagues = await Category.find({ type: 'League' })
    .populate('parentCategory', 'name slug');
  return leagues;
};

// 3. Get League by ID (Lấy giải đấu theo ID)
const getLeagueById = async (leagueId) => {
  const league = await Category.findById(leagueId)
    .populate('parentCategory', 'name slug');
  if (!league) throw new Error('League not found');
  if (league.type !== 'League') throw new Error('Not a league');
  return league;
};

// 4. Update League (Cập nhật giải đấu)
const updateLeague = async (leagueId, leagueData, file) => {
  // Tìm giải đấu theo ID
  const league = await Category.findById(leagueId);
  if (!league) throw new Error('League not found');
  if (league.type !== 'League') throw new Error('Not a league');

  let logoUrl = league.logo_url; // Dùng logo cũ nếu không có file mới

  // Nếu có file ảnh mới được gửi, upload lên Cloudinary
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'league_logos' }, // Lưu vào thư mục 'league_logos'
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    logoUrl = result.secure_url; // Lấy URL logo từ Cloudinary
  }

  // Cập nhật League với thông tin mới và URL logo (nếu có)
  const updatedLeague = await Category.findByIdAndUpdate(
    leagueId,
    { $set: { ...leagueData, logo_url: logoUrl } },
    { new: true, runValidators: true }
  ).populate('parentCategory', 'name slug'); // Populated để trả về thông tin category

  return updatedLeague;
};

// 5. Delete League (Xóa giải đấu)
const deleteLeague = async (leagueId) => {
  const league = await Category.findById(leagueId);
  if (!league) throw new Error('League not found');
  if (league.type !== 'League') throw new Error('Not a league');

  const articles = await Article.find({ CategoryID: leagueId });
  const articleIds = articles.map(a => a._id);

  await Promise.all([
    Comment.deleteMany({ ArticleID: { $in: articleIds } }),
    Bookmark.deleteMany({ ArticleID: { $in: articleIds } }),
    ViewHistory.deleteMany({ ArticleID: { $in: articleIds } }),
    Notification.deleteMany({ noti_entity_ID: { $in: articleIds }, noti_entity_type: 'Article' }),
    Article.deleteMany({ CategoryID: leagueId }),
  ]);

  await Category.findByIdAndDelete(leagueId);
  return { message: 'League deleted successfully' };
};


// 6. Get Most Viewed Articles in Each League (Lấy bài báo có lượt xem cao nhất trong từng giải đấu)
const getMostViewedArticlesInEachLeague = async () => {
  const leagues = await Category.find({ type: 'League' })
    .populate('parentCategory', 'name slug');
  const result = [];

  for (const league of leagues) {
    const mostViewedArticle = await Article.find({
      CategoryID: league._id,
      is_published: true
    })
      .sort({ views: -1 })
      .populate('UserID', 'username avatar')
      .populate('CategoryID', 'name slug type');

    result.push({
      league: { _id: league._id, name: league.name, slug: league.slug, logo_url: league.logo_url, season_time: league.season_time },
      mostViewedArticle: mostViewedArticle || null
    });
  }

  return result;
};

module.exports = {
  createLeague,
  getAllLeagues,
  getLeagueById,
  updateLeague,
  deleteLeague,
  getMostViewedArticlesInEachLeague
};
