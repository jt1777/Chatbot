const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';

async function resetDatabase() {
  let client;
  
  try {
    console.log('🚀 VO Database Reset Script');
    console.log('============================');
    console.log('🔌 Connecting to MongoDB...');
    
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db('farsight');
    
    console.log('🗑️ Clearing all VO-related data...');
    
    // Clear users collection
    const usersResult = await db.collection('users').deleteMany({});
    console.log(`✅ Deleted ${usersResult.deletedCount} users`);
    
    // Clear all vector collections (business_docs_*)
    const collections = await db.listCollections().toArray();
    const vectorCollections = collections.filter(col => col.name.startsWith('business_docs_'));
    
    console.log(`📄 Found ${vectorCollections.length} vector collections to clear:`);
    for (const collection of vectorCollections) {
      const result = await db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Deleted ${result.deletedCount} documents from ${collection.name}`);
    }
    
    // Clear document tracker collections
    const trackerResult = await db.collection('document_tracker').deleteMany({});
    console.log(`✅ Deleted ${trackerResult.deletedCount} document tracker records`);
    
    // Clear any other VO-related collections
    const otherCollections = ['organizations', 'invites', 'sessions', 'conversations'];
    for (const collectionName of otherCollections) {
      try {
        const result = await db.collection(collectionName).deleteMany({});
        if (result.deletedCount > 0) {
          console.log(`✅ Deleted ${result.deletedCount} records from ${collectionName}`);
        }
      } catch (error) {
        // Collection might not exist, that's okay
        console.log(`ℹ️ Collection ${collectionName} doesn't exist or is empty`);
      }
    }
    
    console.log('');
    console.log('🎉 VO Database reset completed successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Start the backend: cd packages/vo-backend && npm run dev');
    console.log('   2. Start the frontend: cd packages/vo-frontend && npm start');
    console.log('   3. Register a new admin and create an organization');
    console.log('   4. Test file uploads and organization management');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    console.error('Make sure MONGODB_URI is set in your .env file');
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
resetDatabase();
