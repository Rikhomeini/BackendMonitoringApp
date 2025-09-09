const mongoose = require('mongoose');

const sensorDataSchema = new mongoose.Schema({
  temperature: {
    value: Number,
    unit: { type: String, default: '°C' },
    timestamp: { type: Date, default: Date.now }
  },
  vibration: {
    value: Number,
    unit: { type: String, default: 'mm/s' },
    timestamp: { type: Date, default: Date.now }
  },
  current: {
    value: Number,
    unit: { type: String, default: 'A' },
    timestamp: { type: Date, default: Date.now }
  },
  voltage: {
    value: Number,
    unit: { type: String, default: 'V' },
    timestamp: { type: Date, default: Date.now }
  },
  deviceId: { type: String, required: true }, // ID ESP32
  timestamp: { type: Date, default: Date.now }
});

// Index untuk query yang lebih cepat
sensorDataSchema.index({ deviceId: 1, timestamp: -1 });
sensorDataSchema.index({ timestamp: -1 });

module.exports = mongoose.model('SensorData', sensorDataSchema);