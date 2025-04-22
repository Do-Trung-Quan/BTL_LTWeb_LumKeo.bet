const UserService = require('../services/userService');

const register = async (req, res) => {
  try {
    const { username, password, role, avatar } = req.body;
    const result = await UserService.createUser({ username, password, role, avatar });
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await UserService.loginUser({ username, password });
    res.status(200).json(result);
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
    const result = await UserService.getUsers();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuthors = async (req, res) => {
  try {
    const result = await UserService.getAuthors();
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getAuthorById = async (req, res) => {
  try {
    const { authorId } = req.params;
    const result = await UserService.getAuthorById(authorId);
    res.status(200).json(result);
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
    res.status(200).json({ message: 'Username updated successfully', user: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const result = await UserService.updatePassword(req.params.userId, newPassword);
    res.status(200).json({ message: 'Password updated successfully', user: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};


// Hàm xử lý cập nhật avatar cho người dùng
const updateAvatar = async (req, res) => {
  try {
    // Lấy file avatar từ multer
    const file = req.files && req.files.avatar ? req.files.avatar[0] : null;

    // Kiểm tra nếu không có file avatar
    if (!file) {
      return res.status(400).json({ success: false, message: 'No avatar uploaded' });
    }

     // Log file nhận được từ multer để debug
     console.log("Uploaded file:", file);

    // Gọi service để cập nhật avatar người dùng
    const updatedUser = await UserService.updateAvatar(req.params.userId, file);

    // Trả về phản hồi thành công
    res.status(200).json({ message: 'Avatar updated successfully', user: updatedUser });
  } catch (error) {
    console.error("Error updating avatar:", error);
    // Xử lý lỗi
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

module.exports = {
  register,
  login,
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
  getAllAuthorsStatistics
};
