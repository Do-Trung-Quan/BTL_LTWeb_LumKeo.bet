const bcrypt = require('bcrypt');

// Mã hóa mật khẩu
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// So sánh mật khẩu
const comparePassword = async (candidatePassword, hashedPassword) => {
  return await bcrypt.compare(candidatePassword, hashedPassword);
};

module.exports = { hashPassword, comparePassword };