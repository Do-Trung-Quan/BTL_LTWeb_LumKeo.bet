const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const ViewHistory = require('../models/viewHistory');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');
require('dotenv').config();  

const JWT_SECRET = process.env.JWT_SECRET

// Generate a new JWT token
const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role,
    avatar: user.avatar
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Adjust expiration as needed
};

// Hàm kiểm tra username có tồn tại hay không
const checkUsernameExists = async (username) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Username already exists');
  }
};

// Hàm tạo mới một user
const createUser = async ({ username, password, role, avatar }) => {
  await checkUsernameExists(username); // Kiểm tra trước khi tạo user mới

  const user = new User({
    username,
    password,
    role,
    avatar: avatar || undefined,
    created_at: new Date(),
  });

  return await user.save();
};

// Hàm kiểm tra mật khẩu khi đăng nhập
const checkPasswordMatch = async (user, password) => {
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Invalid credentials');
  }
};

// Hàm đăng nhập user
const loginUser = async ({ username, password }) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('User not found');
  }

  // Kiểm tra mật khẩu (có thể cần thêm hàm kiểm tra mật khẩu đúng)
  await checkPasswordMatch(user, password);

  user.last_login = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
);

  // Trả về đối tượng gồm user và token
  return { user, token };
};

// Hàm reset mật khẩu
const resetPassword = async ({ username, newPassword }) => {
  // Input validation
  if (!username || !newPassword) {
    throw new Error('Username và mật khẩu mới là bắt buộc.');
  }

  if (newPassword.length < 6) {
    throw new Error('Mật khẩu mới phải có ít nhất 6 ký tự.');
  }

  // Find the user
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Người dùng không tồn tại.');
  }

  user.password = newPassword;
  await user.save();
  // Return a success result
  return { success: true, message: 'Đặt lại mật khẩu thành công!' };
};

// Hàm lấy tất cả users
const getUsers = async (page = 1, limit = 10, keyword = '') => {
  const skip = (page - 1) * limit;

  // Build query with role and keyword filter
  const query = { role: 'user' };
  if (keyword && keyword.trim() !== '') {
    query.username = { $regex: keyword.trim(), $options: 'i' }; // Case-insensitive search
  }

  const users = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  return {
    data: users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// Hàm lấy tất cả authors
const getAuthors = async (page = 1, limit = 10, keyword = '') => {
  const skip = (page - 1) * limit;

  // Build query with role and keyword filter
  const query = { role: 'author' };
  if (keyword && keyword.trim() !== '') {
    query.username = { $regex: keyword.trim(), $options: 'i' }; // Case-insensitive search
  }

  const authors = await User.find(query)
    .select('-password')
    .skip(skip)
    .limit(limit);

  const total = await User.countDocuments(query);

  return {
    data: authors,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUserById = async (userId) => {
  const user = await User.findById(userId).select('-password');
  if (!user) {
    throw new Error('User not found');
  }
  return user;
};


// Hàm xóa user
const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('User not found');

  await Promise.all([
    Article.deleteMany({ UserID: userId }),
    Comment.deleteMany({ UserID: userId }),
    Bookmark.deleteMany({ UserID: userId }),
    ViewHistory.deleteMany({ UserID: userId }),
    Notification.deleteMany({ UserID: userId }),
  ]);

  if (user.avatar && !user.avatar.includes('defaultAva')) {
    const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }

  await User.findByIdAndDelete(userId);
};



// Update username
const updateUsername = async (userId, username) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await checkUsernameExists(username); // Kiểm tra username trước khi cập nhật

  user.username = username;
  const updatedUser = await user.save();

  // Generate a new token with the updated username
  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

// Update password
const updatePassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.password = newPassword;
  const updatedUser = await user.save();

  // Generate a new token (optional, since password updates don't affect the token payload)
  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

// Update avatar for user
const updateAvatar = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Nếu có file avatar mới, upload lên Cloudinary và lấy URL
  let avatarUrl = user.avatar; // Dùng avatar cũ nếu không có file mới
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' }, // Lưu vào thư mục 'avatars'
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    avatarUrl = result.secure_url; // Lấy URL avatar từ Cloudinary
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  );

  // Generate a new token with the updated avatar
  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

// Hàm thống kê số lượng người dùng mới theo ngày trong 15 ngày qua
const getNewUsersStatistics = async () => {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  // Aggregate to group users by day
  const stats = await User.aggregate([
    {
      $match: {
        role: 'user',
        created_at: { $gte: fifteenDaysAgo, $lte: now }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
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

// Hàm thống kê số lượng tác giả mới theo ngày trong 15 ngày qua
const getNewAuthorsStatistics = async () => {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

  // Aggregate to group authors by day
  const stats = await User.aggregate([
    {
      $match: {
        role: 'author',
        created_at: { $gte: fifteenDaysAgo, $lte: now }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$created_at" }
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

// Hàm thống kê tất cả người dùng
const getAllUsersStatistics = async () => {
  const count = await User.countDocuments({ role: 'user' });
  return { count };
};

// Hàm thống kê tất cả tác giả
const getAllAuthorsStatistics = async () => {
  const count = await User.countDocuments({ role: 'author' });
  return { count };
};

const logOut = (token) => {
  try {
    // Optional: Decode token without verifying expiration for logging
    let payload = null;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
      console.log('Token payload (decoded):', payload);
    } catch (verifyError) {
      console.warn('Token verification failed (possibly expired):', verifyError.message);
      // Proceed with logout even if token is invalid or expired
    }

    // Simulate adding token to a blacklist (in-memory for this example)
    if (!global.blacklist) {
      global.blacklist = new Set();
    }
    global.blacklist.add(token);

    // Invalidate token by adding expiration check (optional enhancement)
    const decoded = jwt.decode(token, { complete: true });
    if (decoded && decoded.payload.exp) {
      const expiry = new Date(decoded.payload.exp * 1000);
      console.log('Token will expire on:', expiry);
    }

    return { success: true, message: 'Đăng xuất thành công' };
  } catch (error) {
    console.error('Logout service error:', error.message);
    return { success: false, message: 'Lỗi khi xử lý đăng xuất' };
  }
};

const validateToken = (token) => {
  try {
    if (!token) {
      throw new Error('No token provided');
    }

    // Check if token is in blacklist
    if (global.blacklist && global.blacklist.has(token)) {
      throw new Error('Token has been blacklisted');
    }

    // Verify JWT signature (without ignoring expiration)
    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      message: 'Token is valid',
      payload: decoded
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Invalid token'
    };
  }
};

// Xuất các hàm
module.exports = {
  createUser,
  loginUser,
  resetPassword,
  getUsers,
  getAuthors,
  getUserById,
  deleteUser,
  updateUsername,
  updatePassword,
  updateAvatar,
  getNewUsersStatistics,
  getNewAuthorsStatistics,
  getAllUsersStatistics,
  getAllAuthorsStatistics,
  logOut,
  validateToken
};
