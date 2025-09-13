import * as dotenv from 'dotenv';
import { scrapeAndSave } from './loaders/webscrape';
import { convertPDFsToText } from './loaders/pdfloader';
import { splitDocuments } from './preprocess/textsplitter';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { MongoClient } from 'mongodb';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Document, PipelineOptions } from './types';

export async function runPipeline(options: PipelineOptions = {}): Promise<void> {
  const { clearExisting = false, chunkSize = 1000, chunkOverlap = 200, collectionName = 'business_docs' } = options;
  
  try {
    // Ensure environment variables are loaded
    dotenv.config({ path: '../.env' });
    
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    // Step 0: Clear existing data if requested
    if (clearExisting) {
      console.log('🗑️  Clearing existing knowledge base...');
      const client = new MongoClient(mongoUri);
      await client.connect();
      const db = client.db();
      await db.collection(collectionName).deleteMany({});
      await client.close();
      console.log('✅ Existing knowledge base cleared');
    }

    // Step 1: Scrape website
    const urls = [
      'https://www.ginsmall.com/%E5%96%AE%E6%AC%A1%E5%B7%A5%E7%A8%8B%E4%BF%9D%E9%9A%AA%E8%A8%88%E5%8A%83/?gad_source=1&gad_campaignid=21939767481&gclid=Cj0KCQjwzt_FBhCEARIsAJGFWVnAWJ8DZ07wl6xZ1tukrSskbIHtWwprWiQYB6p2PBlcpR-SYcab5vQaAodFEALw_wcB'
    ];
    const outputFile = 'website_data.txt'; // Just the filename, webscrape.ts will handle the path
    await scrapeAndSave(urls, outputFile);
    
    // Get the full path for loading the file
    const webOutputPath = path.join(__dirname, '../data/raw/website_data.txt');

    // Step 2: Convert PDFs to text
    const textFiles = await convertPDFsToText('raw', 'processed');

    // Step 3: Load documents (web-scraped text and PDF-derived text)
    const docs: Document[] = [];
    
    // Load web-scraped content
    try {
      const webContent = await fs.readFile(webOutputPath, 'utf8');
      docs.push({
        pageContent: webContent,
        metadata: { source: webOutputPath, type: 'web' }
      });
    } catch (error) {
      console.log('No web content found, skipping...');
    }
    
    // Load PDF-converted content
    for (const textFile of textFiles) {
      const content = await fs.readFile(textFile, 'utf8');
      docs.push({
        pageContent: content,
        metadata: { source: textFile, type: 'pdf' }
      });
    }

    if (docs.length === 0) {
      console.log('No documents to process');
      return;
    }

    // Step 4: Split documents
    const splitDocs = await splitDocuments(docs, {
      chunkSize, // Balanced for both English and Chinese text
      chunkOverlap,
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', '.', '!', '?', ';', ',', ' ', ''],
    });

    // Step 5: Generate embeddings and update vector store
    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });
    
    // Connect to MongoDB
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();
    const collection = db.collection(collectionName);
    
    // Initialize the MongoDB vector store
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: collection,
    });
    
    await vectorStore.addDocuments(splitDocs);
    await client.close();

    console.log('Pipeline completed successfully');
  } catch (error) {
    console.error('Pipeline error:', (error as Error).message);
    throw error;
  }
}

// Smart update: Check for duplicates and handle accordingly
export async function smartUpdate(options: PipelineOptions = {}): Promise<void> {
  console.log('🔄 Smart update mode - checking for existing content...');
  
  const { collectionName = 'business_docs' } = options;
  
  // Ensure environment variables are loaded
  dotenv.config({ path: '../.env' });
  
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }
  
  // Check if knowledge base exists
  const client = new MongoClient(mongoUri);
  await client.connect();
  const db = client.db();
  const existingDocs = await db.collection(collectionName).countDocuments();
  await client.close();
  
  if (existingDocs > 0) {
    console.log(`📊 Found ${existingDocs} existing documents in knowledge base`);
    console.log('⚠️  Running incremental update (may create duplicates)');
    console.log('💡 For clean rebuild, use: runPipeline({ clearExisting: true })');
  } else {
    console.log('📝 No existing documents found - running fresh build');
  }
  
  await runPipeline(options);
}

// Export types and functions for use in other modules
export * from './types';
export * from './loaders/webscrape';
export * from './loaders/pdfloader';
export * from './preprocess/textsplitter';
export * from './embeddings/embed_docs';

// For direct execution
if (require.main === module) {
  smartUpdate(); // Smart update (recommended)
}
