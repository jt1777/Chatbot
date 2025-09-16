import * as dotenv from 'dotenv';
import { VectorStoreService } from '../services/vectorStoreService';
import { Document } from '../types';

// Load environment variables
dotenv.config({ path: '../../.env' });

export async function generateAndStoreEmbeddings(
  documents: Document[], 
  collectionName: string = 'business_docs'
): Promise<void> {
  try {
    // Initialize VectorStoreService
    const vectorStoreService = VectorStoreService.getInstance();
    await vectorStoreService.initialize(collectionName);

    // Generate embeddings and store in MongoDB
    await vectorStoreService.addDocuments(documents);

    console.log(`Generated and stored embeddings for ${documents.length} documents in collection ${collectionName}`);
    await vectorStoreService.close();
  } catch (error) {
    console.error('Error generating or storing embeddings:', (error as Error).message);
    throw error;
  }
}
