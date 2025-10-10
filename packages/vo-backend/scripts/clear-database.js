const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
// MongoDB database names cannot contain spaces. Use DB_NAME to override if needed.
const DB_NAME = process.env.DB_NAME || 'test';

async function clearDatabase() {
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    console.log('📍 Using MongoDB URI:', MONGODB_URI.substring(0, 20) + '...');
    // MongoDB connection options with SSL/TLS configuration
    const options = {
      tls: true,
      tlsAllowInvalidCertificates: false,
      tlsAllowInvalidHostnames: false,
      retryWrites: true,
      writeConcern: { w: 'majority' },
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };

    client = new MongoClient(MONGODB_URI, options);
    await client.connect();
    
    const db = client.db(DB_NAME);
    console.log('🗃️  Target database:', DB_NAME);
    
    console.log('🗑️ Clearing all collections...');
    
    // Clear users collection
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    // Clear all vector collections (business_docs_*)
    const collections = await db.listCollections().toArray();
    const vectorCollections = collections.filter(col => col.name.startsWith('business_docs_'));
    
    for (const collection of vectorCollections) {
      const result = await db.collection(collection.name).deleteMany({});
      console.log(`✅ Deleted ${result.deletedCount} documents from ${collection.name}`);
    }
    
    // Clear document tracker collections
    const trackerResult = await db.collection('document_tracker').deleteMany({});
    console.log(`✅ Deleted ${trackerResult.deletedCount} document tracker records`);
    
    // Clear any other collections that might exist
    const otherCollections = ['organizations', 'invites', 'sessions'];
    for (const collectionName of otherCollections) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} records from ${collectionName}`);
      } catch (error) {
        // Collection might not exist, that's okay
        console.log(`ℹ️ Collection ${collectionName} doesn't exist or is empty`);
      }
    }
    
    console.log('🎉 Database cleared successfully!');
    console.log('📝 You can now register new admins and create organizations.');
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
clearDatabase();