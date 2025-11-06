const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const connectDB = require('./config/database');
const logger = require('./middleware/logger');

const app = express();

// Trust Vercel proxy for rate-limiting and correct client IP
app.set('trust proxy', 1);

// Connect to database
connectDB();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // Higher limit for development
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// CORS setup
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://college-sync-hub-y9n7.vercel.app',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (process.env.NODE_ENV === 'development' && origin.includes('localhost')) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn(`🚫 CORS blocked for origin: ${origin}`);
    return callback(null, true); // allow but log
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Authorization', 'Content-Length', 'X-Request-Id'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug incoming origins
app.use((req, res, next) => {
  console.log('👉 Request Origin:', req.headers.origin || 'No origin');
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/college', require('./routes/college'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/subjects', require('./routes/subjects'));
app.use('/api/faculty', require('./routes/faculty'));
app.use('/api/coding', require('./routes/coding'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/coding-questions', require('./routes/codingQuestions'));

// Root route
app.get('/', (req, res) => {
  res.send('🚀 Server is running!');
});

// Favicon handling (optional, create public/favicon.ico)
const path = require('path');
app.use('/favicon.ico', express.static(path.join(__dirname, 'public', 'favicon.ico')));
app.use('/favicon.png', express.static(path.join(__dirname, 'public', 'favicon.png')));

// Serve uploaded assets (attachments) so attachmentUrl paths are reachable
// Files are stored under server/uploads/... by the notifications route
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  logger.errorLog(err, { context: 'Unhandled error' });
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

const http = require('http');
const server = http.createServer(app);

// Initialize Socket.IO for real-time activity updates
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

// Periodically emit active student count every 15 seconds
const User = require('./models/User');
const emitActiveCounts = async () => {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const activeStudents = await User.countDocuments({ role: 'student', lastLogin: { $gte: fifteenMinutesAgo } });
    io.emit('activity:update', { activeStudents });
  } catch (err) {
  logger.errorLog(err, { context: 'Failed to emit active counts' });
  }
};
setInterval(emitActiveCounts, 15 * 1000);
// Emit once at startup
emitActiveCounts();

const PORT = process.env.PORT || 5000;

// Only start listening when this module is the entry point (not when required by tests)
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

module.exports = server; // export the server for tests (supertest can use it)
