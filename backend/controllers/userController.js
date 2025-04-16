const User = require('../models/User');
const { comparePassword } = require('../utils/bcrypt');
const jwt = require('jsonwebtoken');

// Đăng ký user mới
exports.registerUser = async (req, res) => {
  console.log(req.body);
  try {
    
    const { username, password, role } = req.body;
    

    // Kiểm tra username đã tồn tại chưa
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Tên người dùng đã tồn tại, vui lòng chọn tên khác.' });
    }

    // Kiểm tra role khi đăng ký
    if (!['author', 'user'].includes(role)) {
      return res.status(400).json({ message: 'Quyền (role) chỉ được phép là "author" hoặc "user" khi đăng ký.' });
    }

    // Tạo user mới
    const user = new User({ username, password, role });
    await user.save();

    res.status(201).json({ message: 'Đăng ký tài khoản thành công!', user });
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};

// Đăng nhập user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    console.log(req.body);

    // Validate request body
    if (!username || !password) {
      return res.status(400).json({ message: 'Vui lòng cung cấp tên đăng nhập và mật khẩu.' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Tên đăng nhập hoặc mật khẩu không chính xác.' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, 'thuyptit2004_secret2025!', { expiresIn: '1h' });

    res.json({ message: 'Đăng nhập thành công!', token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};
// Lấy thông tin user
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};

// Cập nhật avatar
exports.updateAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
    }

    user.avatar = req.body.avatar; // URL của avatar gửi từ client
    await user.save();

    res.json({ message: 'Cập nhật ảnh đại diện thành công!', user });
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};

// Reset mật khẩu
exports.resetPassword = async (req, res) => {
  try {
    const { username, newPassword, confirmPassword } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công!' });
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};

// API công khai để lấy danh sách người dùng
exports.getPublicUsers = async (req, res) => {
  try {
    // Chỉ trả về username và role, không trả _id và createdAt để giảm rủi ro
    const users = await User.find({ role: { $in: ['user', 'author'] } }).select('username role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: `Lỗi máy chủ: ${error.message}` });
  }
};