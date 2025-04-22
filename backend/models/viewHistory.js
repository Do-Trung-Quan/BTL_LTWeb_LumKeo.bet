const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ArticleID: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
  viewed_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ViewHistory', viewHistorySchema);