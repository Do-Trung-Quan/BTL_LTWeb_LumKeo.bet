const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  slug: { type: String, required: true, maxlength: 50, unique: true },
  type: { type: String, enum: ['Category', 'League'], required: true },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }
}, { discriminatorKey: 'type', collection: 'categories', timestamps: false });

module.exports = mongoose.model('Category', categorySchema);