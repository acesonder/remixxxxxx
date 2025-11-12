const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
require('dotenv').config();

const moduleManager = require('./modules/moduleManager');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/modules', (req, res) => {
  const modules = moduleManager.getAllModules();
  res.json(modules);
});

app.post('/api/modules/:moduleId/enable', (req, res) => {
  const { moduleId } = req.params;
  try {
    moduleManager.enableModule(moduleId);
    res.json({ success: true, message: `Module ${moduleId} enabled` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/modules/:moduleId/disable', (req, res) => {
  const { moduleId } = req.params;
  try {
    moduleManager.disableModule(moduleId);
    res.json({ success: true, message: `Module ${moduleId} disabled` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/modules/:moduleId/configure', (req, res) => {
  const { moduleId } = req.params;
  const config = req.body;
  try {
    moduleManager.configureModule(moduleId, config);
    res.json({ success: true, message: `Module ${moduleId} configured` });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

// Initialize modules and register routes
moduleManager.initializeModules(app, io);

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Loaded modules:', moduleManager.getEnabledModules().map(m => m.name).join(', '));
});

module.exports = { app, server, io };
