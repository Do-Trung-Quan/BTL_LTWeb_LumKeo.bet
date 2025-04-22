const WebSocket = require('ws');
const User = require('../models/User');

function initializeWebSocket(server) {
  // Tạo WebSocket Server gắn với server HTTP hiện tại
  const wss = new WebSocket.Server({ server });
  const clients = new Map(); // Lưu trữ các client theo userId

  wss.on('connection', (ws, req) => {
    // Lấy userId từ tham số URL
    const urlParams = new URLSearchParams(req.url.split('?')[1]);
    const userId = urlParams.get('userId');

    if (userId) {
      // Lưu WebSocket kết nối vào Map với userId làm khóa
      clients.set(userId, ws);
      console.log(`Client connected: userId=${userId}`);

      // Xử lý khi client ngắt kết nối
      ws.on('close', () => {
        clients.delete(userId);
        console.log(`Client disconnected: userId=${userId}`);
      });

      // Xử lý lỗi WebSocket
      ws.on('error', (error) => {
        console.error(`WebSocket error for userId=${userId}:`, error);
        clients.delete(userId);
      });
    } else {
      // Nếu không có userId, đóng kết nối
      ws.close();
      console.log('Connection closed: No userId provided');
    }
  });

  return {
    // Gửi thông báo tới người dùng theo userId
    notifyUser(userId, message) {
      const ws = clients.get(userId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message)); // Gửi thông báo
        console.log(`Notification sent to userId=${userId}:`, message);
      } else {
        console.log(`No active client for userId=${userId}`);
      }
    },

    // Gửi thông báo tới tất cả admin
    async notifyAdmins(message) {
      const admins = await User.find({ role: 'admin' }).lean();
      for (const admin of admins) {
        const ws = clients.get(admin._id.toString());
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(message)); // Gửi thông báo
          console.log(`Notification sent to adminId=${admin._id}:`, message);
        }
      }
    }
  };
}

module.exports = initializeWebSocket;
