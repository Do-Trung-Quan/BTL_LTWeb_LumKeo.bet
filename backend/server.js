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
const commentRoutes = require('./routes/commentRoute');
const articleRoutes = require('./routes/articleRoute');



// Test routes directly in server.js - Define specific routes BEFORE using middleware
app.get('/api/test', (req, res) => {
  res.json({ message: 'Test endpoint is working' });
});

// Debug endpoint to test authentication
app.get('/api/auth-test', (req, res) => {
  const token = req.headers.authorization;
  res.json({ 
    message: 'Auth test endpoint', 
    receivedAuthHeader: token ? 'Yes' : 'No',
    headerValue: token
  });
});

// Debug endpoint to test request body parsing
app.post('/api/body-test', (req, res) => {
  res.json({
    message: 'Body test endpoint',
    receivedBody: req.body ? 'Yes' : 'No',
    bodyContent: req.body,
    contentType: req.headers['content-type']
  });
});

// Test endpoint to create a user directly
app.post('/api/create-test-user', async (req, res) => {
  try {
    const User = require('./models/User');
    const { hashPassword } = require('./utils/bcrypt');
    
    // Check if user already exists
    const existingUser = await User.findOne({ username: 'testuser' });
    if (existingUser) {
      return res.json({ 
        message: 'Test user already exists',
        userId: existingUser._id
      });
    }
    
    // Create a new user with a plain text password that will be hashed by the pre-save middleware
    const user = new User({
      username: 'testuser',
      password: 'testpassword',
      role: 'user',
      created_at: new Date()
    });
    
    await user.save();
    
    res.json({ 
      message: 'Test user created successfully',
      userId: user._id
    });
  } catch (error) {
    console.error('Error creating test user:', error);
    res.status(500).json({ 
      message: 'Error creating test user', 
      error: error.message
    });
  }
});

// Test endpoint for login
app.post('/api/test-login', async (req, res) => {
  try {
    const User = require('./models/User');
    const jwt = require('jsonwebtoken');
    const { comparePassword } = require('./utils/bcrypt');
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        message: 'Username and password are required',
        receivedBody: req.body
      });
    }
    
    // Find the user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ 
        message: 'User not found',
        usernameProvided: username
      });
    }
    
    // Manually compare password instead of using the model method
    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ 
        message: 'Invalid credentials',
        passwordProvided: password,
        passwordHashed: user.password.substring(0, 10) + '...' // Only show part of the hash for security
      });
    }
    
    // Create token
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      'Thuy123@',
      { expiresIn: '1h' }
    );
    
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error during test login:', error);
    res.status(500).json({ 
      message: 'Error during login',
      error: error.message,
      stack: error.stack
    });
  }
});

app.get('/api/comment', (req, res) => {
  res.json({ message: 'Comment API direct endpoint is working' });
});

// Add POST handler for the comment endpoint
app.post('/api/comment', (req, res, next) => {
  // Apply authentication middleware first
  const authMiddleware = require('./middlewares/authMiddleware');
  
  // Log the request
  console.log('Comment request body:', req.body);
  console.log('Comment request headers:', req.headers);
  
  authMiddleware()(req, res, (err) => {
    if (err) {
      console.log('Auth middleware error:', err);
      return res.status(401).json({ success: false, message: 'Authentication failed' });
    }
    
    // Log the authenticated user
    console.log('Authenticated user:', req.user);
    
    // Then forward to the commentRoutes controller
    const CommentController = require('./controllers/commentController');
    CommentController.createComment(req, res);
  });
});

// Apply route middleware
app.use('/api/users', userRoutes);
app.use('/api/user', userRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/articles', articleRoutes);


// Don't register /api/comment with the router since we have a direct endpoint now

// Test endpoint to create a test article
app.post('/api/create-test-article', async (req, res) => {
  try {
    const Article = require('./models/Article');
    
    // Create a test article
    const article = new Article({
      title: 'Test Article for Comment Testing',
      slug: 'test-article-' + Date.now(),
      summary: 'This is a test article for testing comments',
      content: 'This is the content of the test article for testing comments',
      is_published: true,
      created_at: new Date(),
      published_date: new Date()
    });
    
    await article.save();
    
    res.json({ 
      message: 'Test article created successfully',
      articleId: article._id,
      article: article
    });
  } catch (error) {
    console.error('Error creating test article:', error);
    res.status(500).json({ 
      message: 'Error creating test article', 
      error: error.message
    });
  }
});

// Test endpoint to view all comments (for debugging)
app.get('/api/test-view-comments', async (req, res) => {
  try {
    const Comment = require('./models/Comment');
    
    // Get all comments
    const comments = await Comment.find()
      .populate('UserID', 'username avatar')
      .populate('ArticleID', 'title');
    
    res.json({ 
      message: 'Comments retrieved successfully',
      count: comments.length,
      comments: comments
    });
  } catch (error) {
    console.error('Error retrieving comments:', error);
    res.status(500).json({ 
      message: 'Error retrieving comments', 
      error: error.message
    });
  }
});

// Start server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});