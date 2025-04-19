const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  noti_entity_ID: { type: String },
  noti_entity_type: { type: String, maxlength: 255 },
  content: { type: String, maxlength: 255 },
  is_read: { type: Boolean, default: false },
  created_at: { type: Date, default: Date.now },
  UserID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

module.exports = mongoose.model('Notification', notificationSchema);
