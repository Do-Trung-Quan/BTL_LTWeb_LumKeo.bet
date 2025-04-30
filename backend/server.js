const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();  
const http = require('http');
const articleService = require('./services/articleService');
const commentService = require('./services/commentService');
const initializeWebSocket = require('./utils/websocket');
const notificationService = require('./services/notificationService');

const app = express();
const server = http.createServer(app);
const port = 3000; // Đồng bộ với cổng 3000 mà front-end đang gọi

// Middleware
app.use(cors());
app.use(express.json());

// Initialize WebSocket
const websocket = initializeWebSocket(server);

// Pass WebSocket to services
articleService.initWebSocket(websocket);
commentService.initWebSocket(websocket);
notificationService.initWebSocket(websocket);

// Kết nối MongoDB
const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((error) => console.log('Error connecting to MongoDB:', error));

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Đã có lỗi xảy ra trên server!' });
});

const cookieParser = require('cookie-parser');
app.use(cookieParser());

// Routes
const userRoutes = require('./routes/userRoute');
const articleRoutes = require('./routes/articleRoute')
const categoryRoutes = require('./routes/categoryRoute');
const leagueRoutes = require('./routes/leagueRoute');
const bookmarkRoutes = require('./routes/bookmarkRoute');
const commentRoutes = require('./routes/commentRoute')
const notificationRoutes = require('./routes/notificationRoute');

// Apply route middleware
app.use('/api', userRoutes);
app.use('/api', articleRoutes);
app.use('/api', categoryRoutes);
app.use('/api', leagueRoutes);
app.use('/api', bookmarkRoutes);
app.use('/api', commentRoutes);
app.use('/api', notificationRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});