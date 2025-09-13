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
        indexName: 'vector_index', // Specify the index name
        textKey: 'text', // Field containing the text
        embeddingKey: 'embedding', // Field containing the embeddings
      });

      console.log('RAG Service initialized successfully');
      console.log('🔧 MongoDB collection:', collection.collectionName);
      console.log('🔧 Vector index name: vector_index');
      console.log('🔧 Embedding field: embedding');
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
      console.log('🔍 Vector search: Querying for:', query);
      console.log('🔍 Vector search: Limit:', limit);
      
      const results = await this.vectorStore.similaritySearch(query, limit);
      console.log('📊 Vector search: Raw results count:', results.length);
      
      if (results.length > 0 && results[0]) {
        console.log('📄 Vector search: First result preview:', results[0].pageContent.substring(0, 100) + '...');
      }
      
      return results.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || 'unknown',
          type: doc.metadata.type || 'upload',
          ...doc.metadata
        }
      }));
    } catch (error) {
      console.error('❌ Vector search error:', error);
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
      const collection = db.collection('business_docs');
      const count = await collection.countDocuments();
      
      // Debug: Check document structure
      const sampleDoc = await collection.findOne({});
      if (sampleDoc) {
        console.log('🔍 Sample document fields:', Object.keys(sampleDoc));
        console.log('🔍 Has embedding field:', 'embedding' in sampleDoc);
        console.log('🔍 Has text field:', 'text' in sampleDoc);
        console.log('🔍 Has pageContent field:', 'pageContent' in sampleDoc);
      }
      
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
