const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'farsight';

async function migrateRoles() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI not found in environment variables');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI, {
    tls: true,
    tlsInsecure: false,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
    socketTimeoutMS: 30000,
  });

  try {
    console.log('🔄 Connecting to MongoDB...');
    await client.connect();
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');

    console.log('🔄 Starting role migration...');

    // 1. Update users with role: 'org_admin' to role: 'admin'
    const legacyRoleUpdate = await usersCollection.updateMany(
      { role: 'org_admin' },
      { $set: { role: 'admin' } }
    );
    console.log(`✅ Updated ${legacyRoleUpdate.modifiedCount} users with legacy role 'org_admin' to 'admin'`);

    // 2. Update organizationAccess entries with role: 'org_admin' to role: 'admin'
    const users = await usersCollection.find({ 
      organizationAccess: { $exists: true, $ne: null } 
    }).toArray();

    let orgAccessUpdates = 0;
    for (const user of users) {
      let needsUpdate = false;
      const updatedOrgAccess = { ...user.organizationAccess };

      for (const [orgId, access] of Object.entries(user.organizationAccess)) {
        if (access.role === 'org_admin') {
          updatedOrgAccess[orgId] = {
            ...access,
            role: 'admin'
          };
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { organizationAccess: updatedOrgAccess } }
        );
        orgAccessUpdates++;
      }
    }
    console.log(`✅ Updated organizationAccess for ${orgAccessUpdates} users`);

    // 3. Update currentRole field from 'org_admin' to 'admin'
    const currentRoleUpdate = await usersCollection.updateMany(
      { currentRole: 'org_admin' },
      { $set: { currentRole: 'admin' } }
    );
    console.log(`✅ Updated ${currentRoleUpdate.modifiedCount} users with currentRole 'org_admin' to 'admin'`);

    console.log('🎉 Role migration completed successfully!');

    // Show summary
    const adminCount = await usersCollection.countDocuments({ role: 'admin' });
    const orgAdminCount = await usersCollection.countDocuments({ role: 'org_admin' });
    console.log(`📊 Summary: ${adminCount} admin users, ${orgAdminCount} org_admin users remaining`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Database connection closed');
  }
}

migrateRoles();
