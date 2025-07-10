const User = require('../models/User');
const Article = require('../models/Article');
const Comment = require('../models/Comment');
const Bookmark = require('../models/Bookmark');
const ViewHistory = require('../models/viewHistory');
const Notification = require('../models/Notification');
const cloudinary = require('cloudinary').v2;
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
require('dotenv').config();  

const JWT_SECRET = process.env.JWT_SECRET;

// Hàm kiểm tra mật khẩu
const validatePassword = (password) => {
  const minLength = 8;
  const hasNumber = /\d/;
  const hasLetter = /[a-zA-Z]/;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/;

  if (!password) {
    throw new Error('Mật khẩu là bắt buộc');
  }
  if (password.length < minLength) {
    throw new Error(`Mật khẩu phải có ít nhất ${minLength} ký tự`);
  }
  if (!hasNumber.test(password)) {
    throw new Error('Mật khẩu phải chứa ít nhất một số');
  }
  if (!hasLetter.test(password)) {
    throw new Error('Mật khẩu phải chứa ít nhất một chữ cái');
  }
  if (!hasSpecialChar.test(password)) {
    throw new Error('Mật khẩu phải chứa ít nhất một ký tự đặc biệt');
  }
  return true;
};

// Generate a new JWT token
const generateToken = (user) => {
  const payload = {
    id: user._id,
    username: user.username,
    role: user.role,
    avatar: user.avatar
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

// Hàm kiểm tra username có tồn tại hay không
const checkUsernameExists = async (username) => {
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    throw new Error('Tên người dùng đã tồn tại');
  }
};

// Hàm tạo mới một user
const createUser = async ({ username, password, role, email, avatar }) => {
  await checkUsernameExists(username);

  // Kiểm tra mật khẩu
  validatePassword(password);

  const user = new User({
    username,
    password,
    role,
    email, 
    avatar: avatar || undefined,
    created_at: new Date(),
  });

  return await user.save();
};

// Hàm kiểm tra mật khẩu khi đăng nhập
const checkPasswordMatch = async (user, password) => {
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new Error('Thông tin đăng nhập không hợp lệ');
  }
};

// Hàm đăng nhập user
const loginUser = async ({ username, password }) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  await checkPasswordMatch(user, password);

  user.last_login = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id.toString(), username: user.username, role: user.role, avatar: user.avatar },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

const sendOtp = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Email không hợp lệ hoặc không tìm thấy tài khoản');
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'Lumkeo.bet@gmail.com',
      pass: 'gbju rmpd pxbd xpod'
    }
  });

  const mailOptions = {
    from: 'Lumkeo.bet@gmail.com',
    to: email,
    subject: 'Your OTP for Password Reset',
    text: `Your OTP for password reset is: ${otp}. This code is valid for 10 minutes.`
  };

  await transporter.sendMail(mailOptions);
  return { otp };
};

// Hàm reset mật khẩu
const resetPassword = async ({ username, newPassword }) => {
  // Input validation
  if (!username || !newPassword) {
    throw new Error('Username và mật khẩu mới là bắt buộc');
  }

  // Kiểm tra mật khẩu mới
  validatePassword(newPassword);

  // Find the user
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  user.password = newPassword;
  await user.save();
  // Return a success result
  return { success: true, message: 'Đặt lại mật khẩu thành công' };
};

const getUsers = async (page = 1, limit = 10, keyword = '') => {
  const skip = (page - 1) * limit;

  const query = { role: 'user' };
  if (keyword && keyword.trim() !== '') {
    query.username = { $regex: keyword.trim(), $options: 'i' };
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

const getAuthors = async (page = 1, limit = 10, keyword = '') => {
  const skip = (page - 1) * limit;

  const query = { role: 'author' };
  if (keyword && keyword.trim() !== '') {
    query.username = { $regex: keyword.trim(), $options: 'i' };
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
    throw new Error('Người dùng không tồn tại');
  }
  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new Error('Người dùng không tồn tại');

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

const updateUsername = async (userId, username) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  await checkUsernameExists(username);

  user.username = username;
  const updatedUser = await user.save();

  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

const updateEmail = async (userId, email) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw new Error('Định dạng email không hợp lệ');
  }

  const existingUser = await User.findOne({ email, _id: { $ne: userId } });
  if (existingUser) {
    throw new Error('Email đã được sử dụng');
  }

  user.email = email;
  const updatedUser = await user.save();

  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

const updatePassword = async (userId, oldPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }
  const isMatch = await user.comparePassword(oldPassword);
  if (!isMatch) {
    throw new Error('Mật khẩu cũ không chính xác');
  }

  // Kiểm tra mật khẩu mới
  validatePassword(newPassword);

  user.password = newPassword;
  const updatedUser = await user.save();

  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};


const updateAvatar = async (userId, file) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('Người dùng không tồn tại');
  }

  let avatarUrl = user.avatar;
  if (file) {
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'avatars' },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(file.buffer);
    });
    avatarUrl = result.secure_url;
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { new: true, runValidators: true }
  );

  const newToken = generateToken(updatedUser);

  return {
    user: updatedUser,
    token: newToken
  };
};

const getNewUsersStatistics = async () => {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

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
      $sort: { _id: 1 }
    }
  ]);

  const result = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const found = stats.find(stat => stat._id === dateStr);
    result.push({
      date: dateStr,
      count: found ? found.count : 0
    });
  }

  return { dailyStats: result, total: result.reduce((sum, day) => sum + day.count, 0) };
};

const getNewAuthorsStatistics = async () => {
  const now = new Date();
  const fifteenDaysAgo = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

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
      $sort: { _id: 1 }
    }
  ]);

  const result = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date(now.getTime() - (14 - i) * 24 * 60 * 60 * 1000);
    const dateStr = date.toISOString().split('T')[0];
    const found = stats.find(stat => stat._id === dateStr);
    result.push({
      date: dateStr,
      count: found ? found.count : 0
    });
  }

  return { dailyStats: result, total: result.reduce((sum, day) => sum + day.count, 0) };
};

const getAllUsersStatistics = async () => {
  const count = await User.countDocuments({ role: 'user' });
  return { count };
};

const getAllAuthorsStatistics = async () => {
  const count = await User.countDocuments({ role: 'author' });
  return { count };
};

const logOut = (token) => {
  try {
    if (!global.blacklist) {
      global.blacklist = new Set();
    }
    global.blacklist.add(token);

    return { success: true, message: 'Đăng xuất thành công' };
  } catch (error) {
    console.error('Logout service error:', error.message);
    return { success: false, message: 'Lỗi khi xử lý đăng xuất' };
  }
};

const validateToken = (token) => {
  try {
    if (!token) {
      throw new Error('Không có token được cung cấp');
    }

    if (global.blacklist && global.blacklist.has(token)) {
      throw new Error('Token đã bị đưa vào danh sách đen');
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    return {
      success: true,
      message: 'Token hợp lệ',
      payload: decoded
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Token không hợp lệ'
    };
  }
};

module.exports = {
  createUser,
  loginUser,
  sendOtp,
  resetPassword,
  getUsers,
  getAuthors,
  getUserById,
  deleteUser,
  updateUsername,
  updateEmail,
  updatePassword,
  updateAvatar,
  getNewUsersStatistics,
  getNewAuthorsStatistics,
  getAllUsersStatistics,
  getAllAuthorsStatistics,
  logOut,
  validateToken
};