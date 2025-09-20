import * as dotenv from 'dotenv';
import { VectorStoreService } from '@chatbot/shared';
import { Document } from '../types';

// Load environment variables
dotenv.config({ path: '../../.env' });

export async function generateAndStoreEmbeddings(
  documents: Document[],
  orgId: string
): Promise<void> {
  try {
    // Initialize VectorStoreService
    const vectorStoreService = VectorStoreService.getInstance();
    await vectorStoreService.initialize();

    // Generate embeddings and store in MongoDB
    await vectorStoreService.addDocuments(documents, orgId);

    console.log(`Generated and stored embeddings for ${documents.length} documents for org ${orgId}`);
    // Note: Don't close the service as it's a singleton
    // await vectorStoreService.close();
  } catch (error) {
    console.error('Error generating or storing embeddings:', (error as Error).message);
    throw error;
  }
}
