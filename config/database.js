const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Untuk MongoDB lokal
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/industrial-monitoring', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Event listeners untuk monitoring koneksi
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });
    
    // Tangani penutupan aplikasi dengan benar
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;