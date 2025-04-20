const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 255 },
  slug: { type: String, required: true, unique: true, maxlength: 50 },
  summary: { type: String, maxlength: 255 },
  content: { type: String, maxlength: 255 },
  thumbnail: { type: String, maxlength: 255 },
  is_published: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
  published_date: { type: Date },
  views: { type: Number, default: 0 },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  CategoryID: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
});

module.exports = mongoose.model('Article', articleSchema);
