import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { MongoClient } from 'mongodb';
import { Document } from '../types/document';

export class RAGService {
  private vectorStore: MongoDBAtlasVectorSearch | null = null;
  private client: MongoClient | null = null;
  private embeddings: HuggingFaceTransformersEmbeddings;

  constructor() {
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });
  }

  async initialize(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      const db = this.client.db();
      const collection = db.collection('business_docs');

      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
      });

      console.log('RAG Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize RAG Service:', error);
      throw error;
    }
  }

  async searchSimilarDocuments(query: string, limit: number = 5): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('RAG Service not initialized. Call initialize() first.');
    }

    try {
      const results = await this.vectorStore.similaritySearch(query, limit);
      return results.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || 'unknown',
          type: doc.metadata.type || 'upload',
          ...doc.metadata
        }
      }));
    } catch (error) {
      console.error('Error searching similar documents:', error);
      throw error;
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('RAG Service not initialized. Call initialize() first.');
    }

    try {
      await this.vectorStore.addDocuments(documents);
      console.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  async getDocumentCount(): Promise<number> {
    if (!this.client) {
      throw new Error('RAG Service not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const count = await db.collection('business_docs').countDocuments();
      return count;
    } catch (error) {
      console.error('Error getting document count:', error);
      throw error;
    }
  }

  async clearAllDocuments(): Promise<void> {
    if (!this.client) {
      throw new Error('RAG Service not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      await db.collection('business_docs').deleteMany({});
      console.log('All documents cleared from vector store');
    } catch (error) {
      console.error('Error clearing documents:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.vectorStore = null;
      console.log('RAG Service connection closed');
    }
  }
}
