const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  slug: { type: String, required: true, maxlength: 50, unique: true },
  type: { type: String, enum: ['Category', 'League'], required: true },
  views: { type: Number, default: 0 },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  logo_url: { type: String, maxlength: 255 },   // chỉ dùng cho League
  season_time: { type: String, maxlength: 50 }, // chỉ dùng cho League
  created_at: { type: Date, default: Date.now }
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;
