const UserService = require('../services/userService');

const register = async (req, res) => {
  try {
    const { username, password, role, email, avatar } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email là bắt buộc' });
    }
    const result = await UserService.createUser({ username, password, role, email, avatar });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const result = await UserService.loginUser({ username, password });
    
    if (!result.token) {
      throw new Error('Token không được tạo');
    }

    res.cookie('token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ message: 'Đăng nhập thành công', user: result.user, token: result.token });
  } catch (error) {
    console.error(error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await UserService.sendOtp(email);
    res.status(200).json({ success: true, otp: result.otp }); // Return OTP for testing (remove in production)
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { username, newPassword } = req.body;
    const result = await UserService.resetPassword({ username, newPassword });
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || '';

    const result = await UserService.getUsers(page, limit, keyword);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuthors = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const keyword = req.query.keyword || '';

    const result = await UserService.getAuthors(page, limit, keyword);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserService.getUserById(userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await UserService.deleteUser(userId);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateUsername = async (req, res) => {
  try {
    const { username } = req.body;
    const result = await UserService.updateUsername(req.params.userId, username);
    res.status(200).json({
      message: 'Cập nhật tên người dùng thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await UserService.updateEmail(req.params.userId, email);
    res.status(200).json({
      message: 'Cập nhật email thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu cũ và mật khẩu mới là bắt buộc' });
    }

    const result = await UserService.updatePassword(req.params.userId, oldPassword, newPassword);
    res.status(200).json({
      message: 'Cập nhật mật khẩu thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updateAvatar = async (req, res) => {
  try {
    const file = req.files && req.files.avatar ? req.files.avatar[0] : null;

    if (!file) {
      return res.status(400).json({ success: false, message: 'Chưa tải lên avatar' });
    }

    console.log("Uploaded file:", file);

    const result = await UserService.updateAvatar(req.params.userId, file);

    res.status(200).json({
      message: 'Cập nhật avatar thành công',
      user: result.user,
      token: result.token
    });
  } catch (error) {
    console.error("Error updating avatar:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

const getNewUsersStatistics = async (req, res) => {
  try {
    const result = await UserService.getNewUsersStatistics();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getNewAuthorsStatistics = async (req, res) => {
  try {
    const result = await UserService.getNewAuthorsStatistics();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllUsersStatistics = async (req, res) => {
  try {
    const result = await UserService.getAllUsersStatistics();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAllAuthorsStatistics = async (req, res) => {
  try {
    const result = await UserService.getAllAuthorsStatistics();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const logOut = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy token' });
    }

    const serviceResponse = await UserService.logOut(token);
    if (!serviceResponse.success) {
      return res.status(500).json({ success: false, message: serviceResponse.message });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.status(200).json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    console.error('Logout controller error:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đăng xuất' });
  }
};

const validateToken = async (req, res) => {
  try {
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);

    const tokenFromBody = req.body?.token;
    const tokenFromHeader = req.headers.authorization?.split(' ')[1];
    const token = tokenFromBody || tokenFromHeader;

    console.log('ValidateTokenController - Token received:', token ? 'Yes' : 'No', 'Value:', token);

    if (!token) {
      return res.status(400).json({ success: false, message: 'Không có token được cung cấp' });
    }

    const result = await UserService.validateToken(token);
    console.log('ValidateTokenController - Validation result:', result);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        payload: result.payload
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message
      });
    }
  } catch (error) {
    console.error('ValidateTokenController - Unexpected error:', error.message, 'Stack:', error.stack);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi xác thực token', error: error.message });
  }
};

module.exports = {
  register,
  login,
  sendOtp,
  resetPassword,
  getUsers,
  getAuthors,
  getUserById,
  deleteUser,
  updateUsername,
  updatePassword,
  updateAvatar,
  updateEmail,
  getNewUsersStatistics,
  getNewAuthorsStatistics,
  getAllUsersStatistics,
  getAllAuthorsStatistics,
  logOut,
  validateToken 
};