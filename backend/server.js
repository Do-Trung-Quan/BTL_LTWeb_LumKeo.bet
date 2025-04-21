const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = 3000; // Đồng bộ với cổng 3000 mà front-end đang gọi

// Middleware
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect('mongodb+srv://thuyptit2004:Thuy2004@cluster0.b2b9od0.mongodb.net/websiteDB?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware xử lý lỗi toàn cục
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ message: 'Đã có lỗi xảy ra trên server!' });
});

// Routes
const userRoutes = require('./routes/userRoute');
const notificationRoutes = require('./routes/notificationRoute');

app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});