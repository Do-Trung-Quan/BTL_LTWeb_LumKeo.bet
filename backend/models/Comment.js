const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {type: String, required: true, maxlength: 255},
  created_at: {type: Date, default: Date.now},
  updated_at: {type: Date},
  UserID: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  ArticleID: {type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true},
  CommentID: {type: mongoose.Schema.Types.ObjectId, ref: 'Comment'}
}, { timestamps: false });

module.exports = mongoose.model('Comment', commentSchema);