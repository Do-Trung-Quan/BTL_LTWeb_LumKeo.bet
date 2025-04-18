const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {type: String, required: true, maxlength: 255},
  slug: {type: String, required: true, maxlength: 50, unique: true},  // Đảm bảo slug duy nhất trong toàn collection
  type: {type: String, enum: ['Category', 'League'], required: true},
  parentCategory: {type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null} // Chỉ có League cần parentCategory, Category thì để null
}, 
{ discriminatorKey: 'type', collection: 'categories', timestamps: false });

const Category = mongoose.model('Category', categorySchema);