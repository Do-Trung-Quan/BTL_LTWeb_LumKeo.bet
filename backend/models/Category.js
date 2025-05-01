const mongoose = require('mongoose');
const { cascadeDeleteCategory } = require('../utils/cascade');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 255 },
  slug: { type: String, required: true, maxlength: 50, unique: true },
  type: { type: String, enum: ['Category', 'League'], required: true },
  views: { type: Number, default: 0 },
  parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  logo_url: { type: String, maxlength: 255 },
  season_time: { type: String, maxlength: 50 },
  created_at: { type: Date, default: Date.now }
});

categorySchema.pre('findOneAndDelete', async function (next) {
  const doc = await this.model.findOne(this.getFilter());
  if (doc) await cascadeDeleteCategory(doc._id);
  next();
});

module.exports = mongoose.model('Category', categorySchema);
