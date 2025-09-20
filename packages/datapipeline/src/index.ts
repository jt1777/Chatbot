import * as dotenv from 'dotenv';
import { scrapeAndSave } from './loaders/webscrape';
import { convertPDFsToText } from './loaders/pdfloader';
import { splitDocuments } from './preprocess/textsplitter';
import { VectorStoreService } from '@chatbot/shared';
import { promises as fs } from 'fs';
import * as path from 'path';
import { Document, PipelineOptions } from './types';

export async function runPipeline(options: PipelineOptions): Promise<void> {
  const { clearExisting = false, chunkSize = 1000, chunkOverlap = 200, orgId } = options;
  
  try {
    // Ensure environment variables are loaded
    dotenv.config({ path: '../.env' });
    
    // Initialize VectorStoreService with single collection
    const vectorStoreService = VectorStoreService.getInstance();
    await vectorStoreService.initialize();

    // Step 0: Clear existing data for this org if requested
    if (clearExisting) {
      console.log(`🗑️  Clearing existing knowledge base for org ${orgId}...`);
      await vectorStoreService.clearAllDocuments(orgId);
      console.log(`✅ Existing knowledge base cleared for org ${orgId}`);
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
        metadata: { source: webOutputPath, type: 'web', orgId: orgId }
      });
    } catch (error) {
      console.log('No web content found, skipping...');
    }
    
    // Load PDF-converted content
    for (const textFile of textFiles) {
      const content = await fs.readFile(textFile, 'utf8');
      docs.push({
        pageContent: content,
        metadata: { source: textFile, type: 'pdf', orgId: orgId }
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

    // Step 5: Add documents to vector store
    await vectorStoreService.addDocuments(splitDocs, orgId);
    await vectorStoreService.close();

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
  
  // Initialize VectorStoreService to check existing documents
  const vectorStoreService = VectorStoreService.getInstance();
  await vectorStoreService.initialize(collectionName);
  
  try {
    // Check if knowledge base exists
    const client = vectorStoreService.getClient();
    if (client) {
      const db = client.db();
      const existingDocs = await db.collection(collectionName).countDocuments();
      
      if (existingDocs > 0) {
        console.log(`📊 Found ${existingDocs} existing documents in knowledge base`);
        console.log('⚠️  Running incremental update (may create duplicates)');
        console.log('💡 For clean rebuild, use: runPipeline({ clearExisting: true })');
      } else {
        console.log('📝 No existing documents found - running fresh build');
      }
    }
  } finally {
    await vectorStoreService.close();
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
