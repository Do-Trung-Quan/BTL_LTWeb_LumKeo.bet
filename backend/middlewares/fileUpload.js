const multer = require('multer');

// Dùng memoryStorage để có file.buffer upload lên Cloudinary
const storage = multer.memoryStorage();

// Kiểm tra loại file (chỉ cho phép ảnh)
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpeg, png, gif) are allowed'), false);
  }
};

// Middleware upload file với nhiều trường
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file: 5MB
}).fields([
  { name: 'avatar', maxCount: 1 },      // Trường avatar
  { name: 'thumbnails', maxCount: 1 }, // Trường thumbnails
  { name: 'logo', maxCount: 1 }        // Trường logo
]);

module.exports = upload;
