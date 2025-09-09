class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedDevices = new Map();
  }

  init(io) {
    this.io = io;
    
    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // ESP32 mengirim data
      socket.on('sensor-data', (data) => {
        this.handleSensorData(socket, data);
      });

      // Client frontend meminta data real-time
      socket.on('subscribe-sensor', (deviceId) => {
        socket.join(`sensor-${deviceId}`);
        console.log(`Client ${socket.id} subscribed to device ${deviceId}`);
      });

      socket.on('unsubscribe-sensor', (deviceId) => {
        socket.leave(`sensor-${deviceId}`);
        console.log(`Client ${socket.id} unsubscribed from device ${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedDevices.delete(socket.id);
      });
    });
  }

  handleSensorData(socket, data) {
    // Validasi data
    if (!this.validateSensorData(data)) {
      socket.emit('error', { message: 'Invalid sensor data' });
      return;
    }

    // Simpan device ID
    this.connectedDevices.set(socket.id, data.deviceId);

    // Broadcast data ke room yang sesuai
    this.io.to(`sensor-${data.deviceId}`).emit('sensor-data-update', data);
    
    // Simpan ke database (akan kita implementasi nanti)
    this.saveSensorData(data);
  }

  validateSensorData(data) {
    return data && 
           data.deviceId && 
           data.temperature !== undefined && 
           data.vibration !== undefined && 
           data.current !== undefined && 
           data.voltage !== undefined;
  }

  async saveSensorData(data) {
    // Implementasi penyimpanan ke database
    try {
      const SensorData = require('../models/SensorData');
      const sensorData = new SensorData(data);
      await sensorData.save();
      console.log('Sensor data saved to database');
    } catch (error) {
      console.error('Error saving sensor data:', error);
    }
  }

  // Method untuk mengirim data ke frontend
  broadcastToRoom(room, event, data) {
    if (this.io) {
      this.io.to(room).emit(event, data);
    }
  }
}

module.exports = new WebSocketService();