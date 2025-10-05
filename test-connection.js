const { MongoClient } = require('mongodb');
require('dotenv').config();

async function testConnection() {
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('❌ MONGODB_URI environment variable not set');
    console.log('💡 Set it with: MONGODB_URI="your-connection-string" node test-connection.js');
    return;
  }
  
  try {
    console.log('🔌 Testing MongoDB connection...');
    console.log('📍 URI:', uri.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
    
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('✅ Connection successful!');
    
    // Test a simple operation
    const db = client.db();
    const collections = await db.listCollections().toArray();
    console.log('📋 Available collections:', collections.map(c => c.name));
    
    await client.close();
    console.log('🔌 Connection closed');
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();
