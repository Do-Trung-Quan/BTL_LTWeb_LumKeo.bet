const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');
const User = require('../models/User');

const JWT_SECRET = 'Thuy123@';
const NEW_USER_DAYS = 15;

const UserService = {
  async createUser({ username, password, role, avatar }) {
    try {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new Error('Username already exists');
      }

      const user = new User({
        username,
        password,
        role,
        avatar: avatar || undefined,
        created_at: new Date()
      });

      const savedUser = await user.save();
      return {
        success: true,
        data: savedUser,
        message: 'User created successfully',
      };
    } catch (error) {
      throw new Error(`Failed to create user: ${error.message}`);
    }
  },

  async loginUser({ username, password }) {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('User not found');
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        throw new Error('Invalid credentials');
      }

      user.last_login = new Date();
      await user.save();

      const token = jwt.sign(
        { id: user._id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
      );

      return {
        success: true,
        data: { user, token },
        message: 'Login successful',
      };
    } catch (error) {
      throw new Error(`Failed to login: ${error.message}`);
    }
  },

  async resetPassword({ username, newPassword }) {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        throw new Error('User not found');
      }

      user.password = newPassword;
      await user.save();

      return {
        success: true,
        message: 'Password reset successfully',
      };
    } catch (error) {
      throw new Error(`Failed to reset password: ${error.message}`);
    }
  },

  async getUsers() {
    try {
      const users = await User.find({ role: 'user' }).select('-password');
      return {
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }
  },

  async getAuthors() {
    try {
      const authors = await User.find({ role: 'author' }).select('-password');
      return {
        success: true,
        data: authors,
        message: 'Authors retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get authors: ${error.message}`);
    }
  },

  async getAuthorById(authorId) {
    try {
      const author = await User.findById(authorId).select('-password');
      if (!author || author.role !== 'author') {
        throw new Error('Author not found');
      }

      return {
        success: true,
        data: author,
        message: 'Author retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get author: ${error.message}`);
    }
  },

  async deleteUser(userId) {
    try {
      const user = await User.findByIdAndDelete(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.avatar && !user.avatar.includes('defaultAva')) {
        const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }

      return {
        success: true,
        message: 'User deleted successfully',
      };
    } catch (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  },

  async updateUser(userId, { username, password, avatar }, currentUser) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Kiểm tra quyền: user chỉ có thể cập nhật thông tin của chính họ, trừ khi là admin
      if (currentUser.role !== 'admin' && currentUser.id !== userId) {
        throw new Error('You can only update your own profile');
      }

      if (username) {
        const existingUser = await User.findOne({ username });
        if (existingUser && existingUser._id.toString() !== userId) {
          throw new Error('Username already exists');
        }
        user.username = username;
      }
      if (password) {
        user.password = password;
      }
      if (avatar) {
        user.avatar = avatar;
      }

      const updatedUser = await user.save();

      return {
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      };
    } catch (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }
  },

  async getNewUsersStatistics() {
    try {
      const currentDate = new Date('2025-04-15');
      const pastDate = new Date(currentDate);
      pastDate.setDate(currentDate.getDate() - NEW_USER_DAYS);

      const count = await User.countDocuments({
        role: 'user',
        created_at: {
          $gte: new Date(pastDate.toISOString()), 
          $lte: new Date(currentDate.toISOString())  
        },
      });

      return {
        success: true,
        data: { count },
        message: 'New users statistics retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get new users statistics: ${error.message}`);
    }
  },

  async getNewAuthorsStatistics() {
    try {
      const currentDate = new Date('2025-04-15');
      const pastDate = new Date(currentDate);
      pastDate.setDate(currentDate.getDate() - NEW_USER_DAYS);

      const count = await User.countDocuments({
        role: 'author',
        created_at: { 
          $gte: new Date(pastDate.toISOString()), 
          $lte: new Date(currentDate.toISOString()) 
        },
      });

      return {
        success: true,
        data: { count },
        message: 'New authors statistics retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get new authors statistics: ${error.message}`);
    }
  },

  async getAllUsersStatistics() {
    try {
      const count = await User.countDocuments({ role: 'user' });

      return {
        success: true,
        data: { count },
        message: 'All users statistics retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get all users statistics: ${error.message}`);
    }
  },

  async getAllAuthorsStatistics() {
    try {
      const count = await User.countDocuments({ role: 'author' });

      return {
        success: true,
        data: { count },
        message: 'All authors statistics retrieved successfully',
      };
    } catch (error) {
      throw new Error(`Failed to get all authors statistics: ${error.message}`);
    }
  },

  async uploadAvatar(userId, file) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.avatar && !user.avatar.includes('defaultAva')) {
        const publicId = user.avatar.split('/').slice(-2).join('/').split('.')[0];
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }

      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'avatars',
        allowed_formats: ['jpg', 'png', 'gif'],
      });

      await fs.unlink(file.path);

      const avatarUrl = result.secure_url;
      user.avatar = avatarUrl;

      const updatedUser = await user.save();

      return {
        success: true,
        data: updatedUser,
        message: 'Avatar uploaded successfully',
      };
    } catch (error) {
      if (file && file.path) {
        await fs.unlink(file.path).catch(() => {});
      }
      throw new Error(`Failed to upload avatar: ${error.message}`);
    }
  },
};

module.exports = UserService;

