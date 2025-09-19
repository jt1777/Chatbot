const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'chatbot';

async function fixSpecificOrg() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const usersCollection = db.collection('users');
    
    const orgId = 'org_1758281451729_1ofz9xca0';
    
    // Find the user with this organization
    const user = await usersCollection.findOne({
      [`organizationAccess.${orgId}.role`]: 'admin'
    });
    
    if (!user) {
      console.log('No user found with this organization');
      return;
    }
    
    console.log('Found user:', user.email);
    console.log('Current orgAccess:', JSON.stringify(user.organizationAccess[orgId], null, 2));
    
    // Update the organization access with proper data
    const updatedOrgAccess = {
      ...user.organizationAccess[orgId],
      orgName: 'My Organization', // Set a proper name
      orgDescription: user.organizationAccess[orgId].orgDescription || '',
      isPublic: user.organizationAccess[orgId].isPublic !== false
    };
    
    console.log('Updated orgAccess:', JSON.stringify(updatedOrgAccess, null, 2));
    
    // Update the user
    await usersCollection.updateOne(
      { id: user.id },
      { 
        $set: { 
          [`organizationAccess.${orgId}`]: updatedOrgAccess
        } 
      }
    );
    
    console.log('Organization data fixed successfully');
    
  } catch (error) {
    console.error('Error fixing organization data:', error);
  } finally {
    await client.close();
  }
}

fixSpecificOrg().catch(console.error);
