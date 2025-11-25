const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const http = require('http');
const socketIo = require('socket.io');
const notificationService = require('./services/notificationService');

// Route imports
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const adminRoutes = require('./routes/adminRoutes');
const garbageRoutes = require('./routes/garbageRoutes');
const aiRoutes = require('./routes/aiRoutes');

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

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
