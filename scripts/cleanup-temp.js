#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

async function cleanupTemp() {
  const tempDir = path.join(__dirname, '..', 'temp');
  
  try {
    console.log(`🧹 Cleaning up temp directory: ${tempDir}`);
    
    // Check if temp directory exists
    try {
      await fs.access(tempDir);
    } catch {
      console.log('✅ Temp directory does not exist, nothing to clean');
      return;
    }
    
    // Read all files in temp directory
    const files = await fs.readdir(tempDir);
    
    if (files.length === 0) {
      console.log('✅ Temp directory is already empty');
      return;
    }
    
    console.log(`Found ${files.length} files to delete:`, files);
    
    // Delete all files
    const deletePromises = files.map(async (file) => {
      const filePath = path.join(tempDir, file);
      try {
        await fs.unlink(filePath);
        console.log(`🗑️  Deleted: ${file}`);
      } catch (error) {
        console.warn(`❌ Could not delete ${file}:`, error.message);
      }
    });
    
    await Promise.all(deletePromises);
    console.log('🎉 Temp directory cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  cleanupTemp();
}

module.exports = { cleanupTemp };
