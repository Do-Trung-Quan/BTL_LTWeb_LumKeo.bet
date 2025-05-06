const mongoose = require('mongoose');
const { cascadeDeleteComment } = require('../utils/cascade');

const commentSchema = new mongoose.Schema({
  content: { type: String, required: true, maxlength: 255, trim: true },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ArticleID: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  CommentID: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }
}, { timestamps: false });

commentSchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) await cascadeDeleteComment(doc._id);
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
