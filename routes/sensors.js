const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensorController');
// ✅ HAPUS import auth middleware karena tidak perlu
// const { authenticate } = require('../middleware/auth');

// ✅ HAPUS middleware authenticate dari semua routes
router.get('/data', sensorController.getSensorData);
router.get('/data/latest', sensorController.getLatestData);
router.get('/data/:deviceId', sensorController.getDataByDevice);
router.post('/data', sensorController.receiveSensorData);
router.get('/stats', sensorController.getSensorStats);

module.exports = router;