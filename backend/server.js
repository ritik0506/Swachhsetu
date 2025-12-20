const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');
const notificationService = require('./services/notificationService');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const hpp = require('hpp');

// Route imports
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const garbageRoutes = require('./routes/garbageRoutes');
const aiRoutes = require('./routes/aiRoutes');
const geocodingRoutes = require('./routes/geocodingRoutes');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Connect to MongoDB
connectDB();

// CORS must be configured FIRST before other middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware (must be before security middleware)
app.use(express.json({ limit: '10mb' })); // Limit body size
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Security Middleware
// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "http://localhost:5173"], // Allow API calls from frontend
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Rate limiting to prevent brute force attacks
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI endpoints (stricter)
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 AI requests per 15 minutes
  message: 'Too many AI requests, please try again later.',
});

app.use('/api/', limiter);
app.use('/api/ai/', aiLimiter);

// Prevent HTTP Parameter Pollution attacks
app.use(hpp());

// Static files
app.use('/uploads', express.static('uploads'));

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  // Join user-specific room
  socket.on('join', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Initialize notification service with Socket.IO
notificationService.initializeSocketIO(io);

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/garbage', garbageRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/geocoding', geocodingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'SwachhSetu API is running' });
});

// Routes test endpoint
app.get('/api/routes-test', (req, res) => {
  res.json({
    success: true,
    availableRoutes: [
      '/api/auth/*',
      '/api/reports/*',
      '/api/dashboard/*',
      '/api/admin/*',
      '/api/garbage/*'
    ],
    message: 'All routes are registered'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!', 
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Socket.io ready for real-time updates`);
});

// Start AI worker if AI features are enabled
if (process.env.ENABLE_AI_TRIAGE === 'true' || 
    process.env.ENABLE_AI_TRANSLATION === 'true' || 
    process.env.ENABLE_AI_FOLLOWUP === 'true') {
  try {
    require('./queues/aiWorker');
    console.log('🤖 AI worker started');
  } catch (error) {
    console.warn('⚠️  Failed to start AI worker:', error.message);
  }
}

// Start follow-up sender cron job
if (process.env.ENABLE_AI_FOLLOWUP === 'true') {
  try {
    const { startFollowUpSender } = require('./jobs/followUpSender');
    startFollowUpSender();
  } catch (error) {
    console.warn('⚠️  Failed to start follow-up sender:', error.message);
  }
}

module.exports = { app, io };
