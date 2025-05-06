const mongoose = require('mongoose');
const { hashPassword, comparePassword } = require('../utils/bcrypt');
const { cascadeDeleteUser } = require('../utils/cascade');

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'author', 'user'], required: true },
  avatar: { type: String, default: 'https://res.cloudinary.com/dsm1uhecl/image/upload/v1744786758/defaultAva_qhcu41.jpg' },
  created_at: { type: Date, default: Date.now },
  last_login: { type: Date, default: null },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await comparePassword(candidatePassword, this.password);
};

userSchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) await cascadeDeleteUser(doc._id);
  next();
});

module.exports = mongoose.model('User', userSchema);
