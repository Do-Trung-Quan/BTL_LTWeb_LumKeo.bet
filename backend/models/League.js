const mongoose = require('mongoose');

const leagueSchema = new mongoose.Schema({
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    logo_url: {
        type: String,
        trim: true
    },
    season_time: {
        type: String,
        trim: true
    }
}, {
    timestamps: {
        createdAt: 'created_at',
        updatedAt: false
    }
});

module.exports = mongoose.model('League', leagueSchema);