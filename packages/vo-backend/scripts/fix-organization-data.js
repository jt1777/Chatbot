const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'chatbot';

async function fixOrganizationData() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    // Find all users with organizationAccess
    const usersWithOrgAccess = await usersCollection.find({
      organizationAccess: { $exists: true, $ne: {} }
    }).toArray();
    
    console.log(`Found ${usersWithOrgAccess.length} users with organizationAccess`);
    
    let updatedCount = 0;
    
    for (const user of usersWithOrgAccess) {
      let needsUpdate = false;
      const updatedOrgAccess = { ...user.organizationAccess };
      
      // Check each organization in organizationAccess
      for (const [orgId, orgAccess] of Object.entries(user.organizationAccess)) {
        if (!orgAccess.orgName || !orgAccess.orgDescription || orgAccess.isPublic === undefined) {
          console.log(`Fixing organization data for user ${user.email}, orgId: ${orgId}`);
          console.log('Current orgAccess:', orgAccess);
          
          // Try to find organization name from legacy fields or other users
          let orgName = orgAccess.orgName;
          let orgDescription = orgAccess.orgDescription;
          let isPublic = orgAccess.isPublic;
          
          // If missing, try to get from user's legacy fields
          if (!orgName && user.orgId === orgId) {
            orgName = user.orgName || `Organization ${orgId}`;
          }
          
          if (orgDescription === undefined && user.orgId === orgId) {
            orgDescription = user.orgDescription || '';
          }
          
          if (isPublic === undefined && user.orgId === orgId) {
            isPublic = user.isPublic !== false;
          }
          
          // If still missing, try to find from other admin users of the same org
          if (!orgName || orgDescription === undefined || isPublic === undefined) {
            const otherAdmin = await usersCollection.findOne({
              [`organizationAccess.${orgId}.role`]: 'admin',
              id: { $ne: user.id }
            });
            
            if (otherAdmin && otherAdmin.organizationAccess[orgId]) {
              const otherOrgAccess = otherAdmin.organizationAccess[orgId];
              if (!orgName && otherOrgAccess.orgName) {
                orgName = otherOrgAccess.orgName;
              }
              if (orgDescription === undefined && otherOrgAccess.orgDescription !== undefined) {
                orgDescription = otherOrgAccess.orgDescription;
              }
              if (isPublic === undefined && otherOrgAccess.isPublic !== undefined) {
                isPublic = otherOrgAccess.isPublic;
              }
            }
          }
          
          // Set defaults if still missing
          orgName = orgName || `Organization ${orgId}`;
          orgDescription = orgDescription || '';
          isPublic = isPublic !== false;
          
          updatedOrgAccess[orgId] = {
            ...orgAccess,
            orgName,
            orgDescription,
            isPublic
          };
          
          needsUpdate = true;
          console.log('Updated orgAccess:', updatedOrgAccess[orgId]);
        }
      }
      
      if (needsUpdate) {
        await usersCollection.updateOne(
          { id: user.id },
          { $set: { organizationAccess: updatedOrgAccess } }
        );
        updatedCount++;
        console.log(`Updated user ${user.email}`);
      }
    }
    
    console.log(`Fixed organization data for ${updatedCount} users`);
    
  } catch (error) {
    console.error('Error fixing organization data:', error);
  } finally {
    await client.close();
  }
}

fixOrganizationData().catch(console.error);
