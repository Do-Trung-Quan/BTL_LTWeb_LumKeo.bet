const cloudinary = require('cloudinary').v2;

  cloudinary.config({
    cloud_name: 'dsm1uhecl',
    api_key: '118225892873696',
    api_secret: 'Ks-yVnCE9rmTML5wOPmYmoozy74',
  });

  module.exports = cloudinary;