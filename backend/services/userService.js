const User = require('../models/User');
const cloudinary = require('cloudinary').v2;
const jwt = require('jsonwebtoken');

const JWT_SECRET = 'Thuy123@';
const NEW_USER_DAYS = 15;

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

  await checkPasswordMatch(user, password);

  user.last_login = new Date();
  await user.save();

  const token = jwt.sign(
    { id: user._id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return { user, token };
};

// Hàm reset mật khẩu
const resetPassword = async ({ username, newPassword }) => {
  const user = await User.findOne({ username });
  if (!user) {
    throw new Error('User not found');
  }

  user.password = newPassword;
  await user.save();
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

// Hàm tìm author theo ID
const getAuthorById = async (authorId) => {
  const author = await User.findById(authorId).select('-password');
  if (!author || author.role !== 'author') {
    throw new Error('Author not found');
  }

  return author;
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


// Hàm cập nhật username
const updateUsername = async (userId, username) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  await checkUsernameExists(username); // Kiểm tra username trước khi cập nhật

  user.username = username;
  return await user.save();
};

// Hàm cập nhật password
const updatePassword = async (userId, newPassword) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  user.password = newPassword;
  return await user.save();
};

// Hàm cập nhật avatar cho người dùng
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
  return updatedUser;
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
  getAuthorById,
  deleteUser,
  updateUsername,
  updatePassword,
  updateAvatar,
  getNewUsersStatistics,
  getNewAuthorsStatistics,
  getAllUsersStatistics,
  getAllAuthorsStatistics,
};
