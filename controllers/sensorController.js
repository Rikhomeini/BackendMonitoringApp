// controllers/sensorController.js - VERSI YANG DIPERBAIKI
const SensorData = require('../models/SensorData');

const getSensorData = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const data = await SensorData.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SensorData.countDocuments();

    res.json({
      data,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getLatestData = async (req, res) => {
  try {
    const data = await SensorData.findOne().sort({ timestamp: -1 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getDataByDevice = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const data = await SensorData.find({ deviceId })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await SensorData.countDocuments({ deviceId });

    res.json({
      data,
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const receiveSensorData = async (req, res) => {
  try {
    const sensorData = new SensorData(req.body);
    await sensorData.save();

    // Kirim data real-time via WebSocket
    const io = req.app.get('io');
    if (io) {
      io.to(`sensor-${req.body.deviceId}`).emit('sensor-data-update', req.body);
    }

    res.status(201).json({ message: 'Data received successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getSensorStats = async (req, res) => {
  try {
    const { period = '24h' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24);
    }

    const stats = await SensorData.aggregate([
      {
        $match: {
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          avgTemperature: { $avg: '$temperature.value' },
          maxTemperature: { $max: '$temperature.value' },
          minTemperature: { $min: '$temperature.value' },
          avgVibration: { $avg: '$vibration.value' },
          maxVibration: { $max: '$vibration.value' },
          avgCurrent: { $avg: '$current.value' },
          maxCurrent: { $max: '$current.value' },
          avgVoltage: { $avg: '$voltage.value' },
          minVoltage: { $min: '$voltage.value' },
          maxVoltage: { $max: '$voltage.value' }
        }
      }
    ]);

    res.json(stats[0] || {});
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Ekspor fungsi dengan benar
module.exports = {
  getSensorData,
  getLatestData,
  getDataByDevice,
  receiveSensorData,
  getSensorStats
};