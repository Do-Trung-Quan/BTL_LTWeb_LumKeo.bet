const jwt = require('jsonwebtoken');

// Thay thế với biến môi trường để bảo mật hơn
const JWT_SECRET = 'Thuy123@';

const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    // Lấy token từ header Authorization
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];  // Cắt lấy token từ "Bearer <token>"
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    try {
      // Giải mã token
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Gán thông tin user vào req.user

      // Kiểm tra vai trò nếu requiredRole được truyền vào
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      next();  // Tiến hành với request nếu đã xác thực xong
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token', error: error.message });
    }
  };
};

module.exports = authMiddleware;
