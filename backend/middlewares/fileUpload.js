const multer = require('multer');

// Use memoryStorage to store files in memory for Cloudinary upload
const storage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép tải lên các file ảnh (jpeg, png, gif, jpg)!'), false);
  }
};

// Multer middleware setup
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit file size to 5MB
}).fields([
  { name: 'avatar', maxCount: 1 },      // Field for avatar
  { name: 'thumbnails', maxCount: 1 },  // Field for thumbnails
  { name: 'logo', maxCount: 1 }         // Field for logo
]);

module.exports = upload;