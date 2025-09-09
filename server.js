// server.js - Production Ready Configuration
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const http = require('http');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

// Check for required environment variables on startup
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar] && process.env.NODE_ENV === 'production') {
    console.error(`ERROR: Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
});

// Production CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://localhost:5173',
    process.env.FRONTEND_URL,
    /\.netlify\.app$/,
    /\.vercel\.app$/,
    /\.railway\.app$/,
    /\.github\.io$/,
    new RegExp(process.env.FRONTEND_URL || '')
  ].filter(Boolean),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection with optimized settings
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/industrial-monitoring', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  family: 4,
  maxPoolSize: 10,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Industrial AI Monitoring API',
    status: 'online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: dbStatus,
    memory: process.memoryUsage(),
    nodeVersion: process.version
  });
});

// Import routes
const sensorRoutes = require('./routes/sensors');
const aiRoutes = require('./routes/ai');
const maintenanceRoutes = require('./routes/maintenance');

// Use routes
app.use('/api/sensors', sensorRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/maintenance', maintenanceRoutes);

// Additional test endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    server: 'running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    clientIP: req.ip,
    userAgent: req.get('User-Agent')
  });
});

// Socket.io with CORS
const io = socketIo(server, {
  cors: corsOptions
});

// Helper function untuk generate simulated data
function getSimulatedData() {
  const now = new Date();
  return {
    temperature: (25 + Math.random() * 10).toFixed(2),
    vibration: (Math.random() * 5).toFixed(3),
    current: (10 + Math.random() * 5).toFixed(2),
    voltage: (220 + Math.random() * 20).toFixed(1),
    pressure: (100 + Math.random() * 50).toFixed(1),
    humidity: (40 + Math.random() * 30).toFixed(1),
    timestamp: now.toISOString(),
    machineId: 'machine-001',
    status: Math.random() > 0.1 ? 'normal' : 'warning'
  };
}

// Socket.io real-time updates
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id, 'Total clients:', io.engine.clientsCount);
  
  // Send initial data immediately
  socket.emit('sensor-data', getSimulatedData());
  socket.emit('connection-established', { 
    message: 'Connected to industrial monitoring server',
    clientId: socket.id,
    timestamp: new Date().toISOString()
  });

  // Send periodic updates every 3 seconds
  const sensorInterval = setInterval(() => {
    const data = getSimulatedData();
    socket.emit('sensor-data', data);
    
    // Broadcast to all clients for dashboard updates
    socket.broadcast.emit('sensor-update', data);
  }, 3000);

  // Handle client messages
  socket.on('request-data', (payload) => {
    console.log('Data request from:', socket.id, payload);
    socket.emit('sensor-data', getSimulatedData());
  });

  socket.on('client-message', (message) => {
    console.log('Message from client:', socket.id, message);
    socket.emit('server-ack', { 
      received: true, 
      message: 'Message received',
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
    clearInterval(sensorInterval);
    
    // Notify other clients
    socket.broadcast.emit('client-disconnected', {
      clientId: socket.id,
      timestamp: new Date().toISOString(),
      totalClients: io.engine.clientsCount
    });
  });

  socket.on('error', (error) => {
    console.error('Socket error:', socket.id, error);
    clearInterval(sensorInterval);
  });
});

// Broadcast system status every minute
setInterval(() => {
  const systemStatus = {
    onlineClients: io.engine.clientsCount,
    serverUptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    timestamp: new Date().toISOString()
  };
  
  io.emit('system-status', systemStatus);
}, 60000);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? {} : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler - must be last middleware
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'GET /api/test',
      'GET /api/status',
      'GET /api/sensors',
      'GET /api/ai',
      'GET /api/maintenance'
    ]
  });
});

// Graceful shutdown handlers
function gracefulShutdown() {
  console.log('\nReceived shutdown signal. Closing servers gracefully...');
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close MongoDB connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      
      // Close Socket.IO
      io.close(() => {
        console.log('Socket.IO server closed.');
        process.exit(0);
      });
    });
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown();
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log('═'.repeat(50));
  console.log(`🚀 Industrial AI Monitoring Server Started`);
  console.log('═'.repeat(50));
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
  console.log(`⏰ Server Time: ${new Date().toLocaleString()}`);
  console.log('═'.repeat(50));
  console.log('📋 Available Endpoints:');
  console.log(`   GET / - Health check`);
  console.log(`   GET /api/health - Detailed health status`);
  console.log(`   GET /api/test - Test endpoint`);
  console.log(`   GET /api/status - Server status`);
  console.log(`   GET /api/sensors - Sensor data routes`);
  console.log(`   GET /api/ai - AI prediction routes`);
  console.log(`   GET /api/maintenance - Maintenance routes`);
  console.log('═'.repeat(50));
});

// Export for testing
module.exports = { app, server, io };