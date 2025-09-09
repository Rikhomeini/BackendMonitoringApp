// test-imports.js
try {
  const sensorController = require('./controllers/sensorController');
  const authMiddleware = require('./middleware/auth');
  
  console.log('✅ sensorController loaded successfully');
  console.log('✅ authMiddleware loaded successfully');
  console.log('getSensorData type:', typeof sensorController.getSensorData);
  console.log('authenticate type:', typeof authMiddleware.authenticate);
} catch (error) {
  console.error('❌ Import error:', error.message);
}