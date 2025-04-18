const mongoose = require('mongoose');
const Category = require('./Category');

const leagueSchema = new mongoose.Schema({
  logo_url: { type: String, maxlength: 255 },
  season_time: { type: String, maxlength: 50 },
  created_at: { type: Date, default: Date.now }
});

module.exports = Category.discriminator('League', leagueSchema);