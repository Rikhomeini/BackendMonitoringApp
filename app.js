// app.js - VERSI YANG DIPERBAIKI
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import routes
const authRoutes = require('./routes/auth');
const sensorRoutes = require('./routes/sensors');
// const aiRoutes = require('./routes/ai'); // Comment dulu jika belum ada

const app = express();
app.use(cors({
  origin: "*",  // ✅ Allow semua origins
  credentials: true
}));

// Middleware
app.use(helmet());
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Tambahkan sebelum routes
app.options('*', cors()); // Enable preflight for all routes
// Routes
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
// app.use('/api/ai', aiRoutes); // Comment dulu jika belum ada

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;