const jwt = require('jsonwebtoken');

const JWT_SECRET = 'Thuy123@';

const authMiddleware = (requiredRole) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Invalid token format' });
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded; // Gán thông tin user từ token vào req.user

      // Kiểm tra vai trò nếu requiredRole được truyền vào
      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }
  };
};

module.exports = authMiddleware;