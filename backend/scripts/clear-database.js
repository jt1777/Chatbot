#!/usr/bin/env node

const { MongoClient } = require('mongodb');
require('dotenv').config();

async function clearDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  
  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const client = new MongoClient(mongoUri);

  try {
    console.log('🔌 Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db();
    const collection = db.collection('business_docs');
    
    // Get count before clearing
    const countBefore = await collection.countDocuments();
    console.log(`📊 Documents before clearing: ${countBefore}`);
    
    if (countBefore === 0) {
      console.log('✅ Database is already empty!');
      return;
    }

    // Ask for confirmation
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const answer = await new Promise((resolve) => {
      rl.question(`⚠️  Are you sure you want to delete all ${countBefore} documents? (yes/no): `, resolve);
    });
    
    rl.close();

    if (answer.toLowerCase() !== 'yes') {
      console.log('❌ Operation cancelled');
      return;
    }

    // Clear the collection
    console.log('🗑️  Clearing documents...');
    const result = await collection.deleteMany({});
    
    console.log(`✅ Successfully deleted ${result.deletedCount} documents`);
    
    // Verify it's empty
    const countAfter = await collection.countDocuments();
    console.log(`📊 Documents after clearing: ${countAfter}`);
    
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
clearDatabase().catch(console.error);
