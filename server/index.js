const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
app.use('/api/', apiLimiter);

// Routes
const authRoutes = require('./routes/auth');
const moduleRoutes = require('./routes/modules');
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const assessmentRoutes = require('./routes/assessments');
const caseManagementRoutes = require('./routes/caseManagement');
const resourceRoutes = require('./routes/resources');
const settingsRoutes = require('./routes/settings');
const analyticsRoutes = require('./routes/analytics');
const appointmentRoutes = require('./routes/appointments');
const documentRoutes = require('./routes/documents');
const financialRoutes = require('./routes/financial');
const surveyRoutes = require('./routes/surveys');
const trainingRoutes = require('./routes/training');
const inventoryRoutes = require('./routes/inventory');

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/case-management', caseManagementRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/training', trainingRoutes);
app.use('/api/inventory', inventoryRoutes);

// Socket.IO for real-time features
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', data);
  });

  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', data);
  });

  socket.on('location-update', (data) => {
    io.to(data.roomId).emit('location-changed', data);
  });

  socket.on('video-call-signal', (data) => {
    socket.to(data.to).emit('video-call-signal', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Database connection
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('MongoDB connected successfully');
    } else {
      console.log('MongoDB URI not provided, running without database');
    }
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

connectDB();

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { app, io };
