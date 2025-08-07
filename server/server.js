const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
// forcing re deplyment
dotenv.config();

const app = express();

//app.use(cors());
const allowedOrigins = [
  'http://localhost:3000',                        // your local CRA dev server
  'https://email-verification-9wk8.onrender.com', // your deployed front-end (if you ever host it there)
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));

// Request logging middleware
app.use(morgan('combined'));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Debug middleware to log all requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', req.body);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    port: process.env.PORT || 5000
  });
});

const contactRoute = require('./routes/contact');
app.use(contactRoute);

// Add auth routes
const authRoute = require('./routes/auth');
app.use(authRoute);

// 404 handler - place this last
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// Validate required environment variables
if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required');
  process.exit(1);
}

// MongoDB connection with better error handling
mongoose.connect(MONGODB_URI)
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('🗄️  Database:', mongoose.connection.db.databaseName);
  console.log('📚 Collections:', Object.keys(mongoose.connection.collections));
  console.log('👥 User collection: users (Mongoose model: User)');
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Backend URL: http://localhost:${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log('📋 Available routes:');
    console.log('   POST /api/register - User registration');
    console.log('   POST /api/contact - Contact form submission');
    console.log('   POST /api/auth/login - User login');
    console.log('   GET  /api/auth/verify - Email verification');
    console.log('   POST /api/auth/google - Google authentication');
    console.log('   POST /api/auth/google-signup - Google signup');
    console.log('   GET  /api/health - Health check');
  });
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// MongoDB connection monitoring
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});

// Global error handlers
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
}); 