import * as dotenv from 'dotenv';
import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { MongoClient } from 'mongodb';
import { Document } from '../types';

// Load environment variables
dotenv.config({ path: '../../.env' });

export async function generateAndStoreEmbeddings(
  documents: Document[], 
  collectionName: string = 'business_docs'
): Promise<MongoDBAtlasVectorSearch> {
  try {
    // Initialize the embedding model
    const embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });

    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db();

    // Initialize the MongoDB vector store
    const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
      collection: db.collection(collectionName),
    });

    // Generate embeddings and store in MongoDB
    await vectorStore.addDocuments(documents);

    console.log(`Generated and stored embeddings for ${documents.length} documents in collection ${collectionName}`);
    await client.close();
    return vectorStore;
  } catch (error) {
    console.error('Error generating or storing embeddings:', (error as Error).message);
    throw error;
  }
}
