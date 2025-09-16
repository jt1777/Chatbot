// Test script to verify RAG setup in Atlas
require('dotenv').config({ path: './.env' }); // Use datapipeline's .env file

const { MongoClient } = require('mongodb');
const { HuggingFaceTransformersEmbeddings } = require('@langchain/community/embeddings/huggingface_transformers');
const { MongoDBAtlasVectorSearch } = require('@langchain/mongodb');

async function testRAGSetup() {
  console.log('🔍 Testing RAG Setup in Atlas...\n');

  try {
    // 1. Check if documents exist in MongoDB Atlas
    console.log('1. Checking MongoDB Atlas documents...');
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db();
    const collection = db.collection('business_docs');
    
    const docCount = await collection.countDocuments();
    console.log(`   📊 Found ${docCount} documents in business_docs collection`);
    
    if (docCount === 0) {
      console.log('   ❌ No documents found! Run the datapipeline first.');
      await client.close();
      return;
    }

    // Show sample documents
    const sampleDocs = await collection.find({}).limit(3).toArray();
    console.log('   📄 Sample documents:');
    sampleDocs.forEach((doc, index) => {
      const content = doc.text || doc.pageContent || 'No content field found';
      console.log(`      ${index + 1}. ${content.substring(0, 100)}...`);
    });

    // 2. Test RAG search functionality
    console.log('\n2. Testing RAG search...');
    
    // Initialize embeddings (same as datapipeline)
    const embeddings = new HuggingFaceTransformersEmbeddings({
      modelName: 'sentence-transformers/all-MiniLM-L6-v2'
    });

    // Initialize vector store with correct index name
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: collection,
      indexName: "vector_index"
    });

    const testQueries = [
      // CDC Medical content queries
      'infection prevention in outpatient settings',
      'hand hygiene recommendations',
      'standard precautions',
      'ambulatory care infection control',
      'personal protective equipment',
      // Chinese construction insurance queries  
      '什麼是工程保險?',  // What is engineering insurance?
      'CAR保險包括什麼?', // What does CAR insurance include?
      '單次工程保險',      // Single project insurance
      'contractors all risks insurance'
    ];

    for (const query of testQueries) {
      console.log(`\n   🔍 Query: "${query}"`);
      try {
        const results = await vectorStore.similaritySearch(query, 2);
        if (results.length > 0) {
          console.log(`   ✅ Found ${results.length} relevant documents:`);
          results.forEach((doc, index) => {
            const content = doc.pageContent || doc.text || 'No content';
            console.log(`      ${index + 1}. ${content.substring(0, 150)}...`);
          });
        } else {
          console.log('   ❌ No relevant documents found');
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
    }

    await client.close();
    console.log('\n✅ RAG testing completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRAGSetup();
