const mongoose = require('mongoose');

const bookmarkSchema = new mongoose.Schema({
  created_at: { type: Date, default: Date.now },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ArticleID: { type: mongoose.Schema.Types.ObjectId, ref: 'Article'}
});

module.exports = mongoose.model('Bookmark', bookmarkSchema);
