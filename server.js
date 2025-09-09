const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
require('dotenv').config();

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Simpan instance io agar bisa diakses di seluruh app
app.set('io', io);

// Import WebSocket service
const WebSocketService = require('./services/websocketService');
WebSocketService.init(io);

// Koneksi MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/industrial-monitoring')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});