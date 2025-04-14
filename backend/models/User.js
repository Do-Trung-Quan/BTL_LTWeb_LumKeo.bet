const mongoose = require('mongoose');
const { hashPassword } = require('../utils/bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'author', 'user'], 
    required: true 
  },
  avatar: { 
    type: String, 
    default: './images/defaultAva.png' 
  },
  created_at: { type: Date, default: Date.now }
});

// Mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await hashPassword(this.password);
  }
  next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
