const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect('mongodb://localhost:27017/industrial-monitoring');
    console.log('✅ Connected to MongoDB successfully!');
    
    // Check if our collection exists
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Collections:');
    collections.forEach(col => console.log(' -', col.name));
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();