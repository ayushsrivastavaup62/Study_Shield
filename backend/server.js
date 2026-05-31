const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://youtubestudyshield.netlify.app'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, postman, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is in the allowed origins list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // Dynamically check FRONTEND_URL or ALLOWED_ORIGINS env variables if defined
    if (process.env.FRONTEND_URL) {
      const urls = process.env.FRONTEND_URL.split(',').map(url => url.trim());
      if (urls.includes(origin)) {
        return callback(null, true);
      }
    }
    
    if (process.env.ALLOWED_ORIGINS) {
      const urls = process.env.ALLOWED_ORIGINS.split(',').map(url => url.trim());
      if (urls.includes(origin)) {
        return callback(null, true);
      }
    }
    
    // If running in development, allow any localhost origin
    if (process.env.NODE_ENV === 'development' && origin.startsWith('http://localhost:')) {
      return callback(null, true);
    }
    
    return callback(null, false);
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/studyshield';
console.log(`[DATABASE] Attempting to connect to MongoDB at: ${mongoURI}`);

mongoose.connection.on('connecting', () => {
  console.log('[DATABASE] Connecting to MongoDB...');
});

mongoose.connection.on('connected', () => {
  console.log('[DATABASE] MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('[DATABASE] MongoDB connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.warn('[DATABASE] MongoDB disconnected. The application is now running in fallback mode (Auth/analytics features will be unavailable or return fast errors, but search and classification will still work).');
});

mongoose.connection.on('reconnected', () => {
  console.log('[DATABASE] MongoDB reconnected successfully');
});

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout before failing fast
})
.catch((err) => {
  console.error('[DATABASE] Initial MongoDB connection failed. Running in DB-fallback mode:', err.message);
});

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/videos', require('./routes/videos'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/quizzes', require('./routes/quizzes'));
app.use('/api/user', require('./routes/user'));

// Health check route
app.get('/api/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbStatusIndex = mongoose.connection.readyState;
  const dbStatus = dbStates[dbStatusIndex] || 'unknown';
  
  console.log(`[BACKEND] Health check request. DB Status: ${dbStatus}`);
  
  res.json({ 
    status: 'ok', 
    message: 'StudyShield API is running',
    database: {
      status: dbStatus,
      connected: dbStatusIndex === 1,
      fallbackMode: dbStatusIndex !== 1
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`StudyShield server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
