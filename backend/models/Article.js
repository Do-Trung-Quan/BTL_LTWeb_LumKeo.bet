// models/news.js
const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    content: {
        type: String,
        required: true
    },
    summary: {
        type: String,
        required: true
    },
    author_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    league_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'League',
        default: null
    },
    image_url: {
        type: String,
        trim: true
    },
    published_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('News', newsSchema);