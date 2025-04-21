const express = require('express');
const mongoose = require('mongoose');
const path= require('path');
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

// Cấu hình để phục vụ các file trong thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
const userRoutes = require('./routes/userRoute');
const articleRoutes = require('./routes/articleRoute');
const categoryRoutes = require('./routes/categoryRoute');
const leagueRoutes = require('./routes/leagueRoute');
const bookmarkRoutes = require('./routes/bookmarkRoute');

app.use('/api', userRoutes);
app.use('/api', articleRoutes);
app.use('/api', categoryRoutes);
app.use('/api', leagueRoutes);
app.use('/api', bookmarkRoutes);


// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});