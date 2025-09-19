const { MongoClient } = require('mongodb');

async function cleanupLegacyRoles() {
  const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017/vo-chatbot');
  
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    
    console.log('🧹 Starting legacy role cleanup...');
    
    // Update any remaining org_admin roles to admin
    const result1 = await usersCollection.updateMany(
      { role: 'org_admin' },
      { $set: { role: 'admin' } }
    );
    console.log(`✅ Updated ${result1.modifiedCount} users with org_admin role to admin`);
    
    // Update organizationAccess roles
    const result2 = await usersCollection.updateMany(
      { 'organizationAccess.$[].role': 'org_admin' },
      { $set: { 'organizationAccess.$[].role': 'admin' } }
    );
    console.log(`✅ Updated ${result2.modifiedCount} organizationAccess entries`);
    
    // Update currentRole if it's org_admin
    const result3 = await usersCollection.updateMany(
      { currentRole: 'org_admin' },
      { $set: { currentRole: 'admin' } }
    );
    console.log(`✅ Updated ${result3.modifiedCount} currentRole entries`);
    
    // Remove legacy orgId field from users (optional - comment out if you want to keep it)
    // const result4 = await usersCollection.updateMany(
    //   { orgId: { $exists: true } },
    //   { $unset: { orgId: 1 } }
    // );
    // console.log(`✅ Removed orgId field from ${result4.modifiedCount} users`);
    
    console.log('🎉 Legacy role cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await client.close();
  }
}

cleanupLegacyRoles();
