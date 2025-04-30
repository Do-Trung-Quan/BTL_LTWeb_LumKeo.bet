const User = require('../models/User');
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
const getUsers = async () => {
  const users = await User.find({ role: 'user' }).select('-password');
  return users;
};

// Hàm lấy tất cả authors
const getAuthors = async () => {
  const authors = await User.find({ role: 'author' }).select('-password');
  return authors;
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
  const user = await User.findByIdAndDelete(userId);
  if (!user) {
    throw new Error('User not found');
  }

  if (user.avatar && !user.avatar.includes('defaultAva')) {
    const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
    await cloudinary.uploader.destroy(publicId).catch(() => {});
  }
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

// Hàm thống kê số lượng người dùng mới
const getNewUsersStatistics = async () => {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

  const count = await User.countDocuments({
    role: 'user',
    created_at: {
      $gte: fifteenDaysAgo
    },
  });

  return { total: count };
};

// Hàm thống kê số lượng tác giả mới
const getNewAuthorsStatistics = async () => {
  const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
  const count = await User.countDocuments({
    role: 'author',
    created_at: {
      $gte: fifteenDaysAgo
    },
  });

  return { total: count };
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
};
