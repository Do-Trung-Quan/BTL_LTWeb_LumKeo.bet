const mongoose = require('mongoose');
const NotificationSchema = new mongoose.Schema({
  noti_entity_ID: { type: mongoose.Schema.Types.ObjectId, required: true },
  noti_entity_type: { type: String, enum: ['Article', 'Comment'], required: true },
  content: { type: String, required: true },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
});
module.exports = mongoose.model('Notification', NotificationSchema);