const UserService = require('../services/userService');

const UserController = {
  async register(req, res) {
    try {
      const { username, password, role, avatar } = req.body;
      const result = await UserService.createUser({ username, password, role, avatar });
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async login(req, res) {
    try {
      const { username, password } = req.body;
      const result = await UserService.loginUser({ username, password });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async resetPassword(req, res) {
    try {
      const { username, newPassword } = req.body;
      const result = await UserService.resetPassword({ username, newPassword });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getUsers(req, res) {
    try {
      const result = await UserService.getUsers();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAuthors(req, res) {
    try {
      const result = await UserService.getAuthors();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAuthorById(req, res) {
    try {
      const { authorId } = req.params;
      const result = await UserService.getAuthorById(authorId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async deleteUser(req, res) {
    try {
      const { userId } = req.params;
      const result = await UserService.deleteUser(userId);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async updateUser(req, res) {
    try {
      const { userId } = req.params;
      const { username, password, avatar } = req.body;
      const currentUser = req.user; // Lấy thông tin user hiện tại từ token
      const result = await UserService.updateUser(userId, { username, password, avatar }, currentUser);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getNewUsersStatistics(req, res) {
    try {
      const result = await UserService.getNewUsersStatistics();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getNewAuthorsStatistics(req, res) {
    try {
      const result = await UserService.getNewAuthorsStatistics();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAllUsersStatistics(req, res) {
    try {
      const result = await UserService.getAllUsersStatistics();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async getAllAuthorsStatistics(req, res) {
    try {
      const result = await UserService.getAllAuthorsStatistics();
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  async uploadImgFile(req, res) {
    try {
      const userId = req.user.id;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      const result = await UserService.uploadAvatar(userId, file);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },
};

module.exports = UserController;