const jwt = require('jsonwebtoken');

// Lấy JWT_SECRET từ biến môi trường
const JWT_SECRET = 'Thuy123@'; 

const authMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    // Kiểm tra định dạng token
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Token is empty' });
    }

    try {
      // Giải mã token
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Kiểm tra payload có _id không
      if (!decoded._id && !decoded.id) {
        return res.status(401).json({ success: false, message: 'Token payload does not contain user ID' });
      }

      // Gán thông tin user vào req.user
      req.user = {
        _id: decoded._id || decoded.id,
        role: decoded.role,
      };

      // Kiểm tra vai trò: Nếu allowedRoles được truyền vào, kiểm tra xem user có vai trò trong danh sách không
      if (allowedRoles && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      next(); // Tiến hành với request nếu đã xác thực xong
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
    }
  };
};

module.exports = authMiddleware;