const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/bcrypt');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'author', 'user'], required: true },
  avatar: { type: String, default: 'https://res.cloudinary.com/dsm1uhecl/image/upload/v1744786758/defaultAva_qhcu41.jpg' },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },
});

// Middleware để mã hóa mật khẩu trước khi lưu
userSchema.pre('save', async function(next) {
  try {
    // Chỉ mã hóa mật khẩu nếu nó đã bị thay đổi (hoặc là user mới)
    if (!this.isModified('password')) {
      return next();
    }

    // Mã hóa mật khẩu bằng hàm hashPassword từ utils/bcrypt
    this.password = await hashPassword(this.password);
    next();
  } catch (error) {
    next(error);
  }
});

// Phương thức để so sánh mật khẩu khi đăng nhập
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await comparePassword(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);