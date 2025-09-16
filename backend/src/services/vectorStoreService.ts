import { MongoDBAtlasVectorSearch } from '@langchain/mongodb';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';
import { MongoClient } from 'mongodb';

export interface Document {
  pageContent: string;
  metadata: {
    source: string;
    type: 'upload' | 'web' | 'pdf';
    similarityScore?: number;
    uploadDate?: string;
    scrapedDate?: string;
    [key: string]: any;
  };
}

export class VectorStoreService {
  private static instance: VectorStoreService;
  private vectorStore: MongoDBAtlasVectorSearch | null = null;
  private client: MongoClient | null = null;
  private embeddings: HuggingFaceTransformersEmbeddings;
  private isInitialized: boolean = false;

  private constructor() {
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2'
    });
  }

  // Singleton pattern to ensure single instance
  public static getInstance(): VectorStoreService {
    if (!VectorStoreService.instance) {
      VectorStoreService.instance = new VectorStoreService();
    }
    return VectorStoreService.instance;
  }

  async initialize(collectionName: string = 'business_docs'): Promise<void> {
    if (this.isInitialized) {
      console.log('VectorStoreService already initialized');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      const db = this.client.db();
      const collection = db.collection(collectionName);

      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: 'vector_index',
        textKey: 'text',
        embeddingKey: 'embedding',
      });

      this.isInitialized = true;
      console.log('VectorStoreService initialized successfully');
      console.log('🔧 MongoDB collection:', collection.collectionName);
      console.log('🔧 Vector index name: vector_index');
      console.log('🔧 Embedding field: embedding');
    } catch (error) {
      console.error('Failed to initialize VectorStoreService:', error);
      throw error;
    }
  }

  async searchSimilarDocuments(query: string, limit: number = 5): Promise<Document[]> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      console.log('🔍 Vector search: Querying for:', query);
      console.log('🔍 Vector search: Limit:', limit);
      
      const similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
      console.log('🎯 Similarity threshold:', similarityThreshold);
      
      const resultsWithScores = await this.vectorStore.similaritySearchWithScore(query, limit);
      console.log('📊 Vector search: Raw results with scores:', resultsWithScores.length);
      
      resultsWithScores.forEach((result, index) => {
        const [doc, score] = result;
        console.log(`📄 Result ${index + 1}: Score = ${score.toFixed(3)}, Preview = "${doc.pageContent.substring(0, 100)}..."`);
      });
      
      const filteredResults = resultsWithScores.filter(([doc, score]) => {
        const isRelevant = score >= similarityThreshold;
        if (!isRelevant) {
          console.log(`❌ Filtered out result with score ${score.toFixed(3)} (below threshold ${similarityThreshold})`);
        }
        return isRelevant;
      });
      
      console.log(`✅ Filtered results: ${filteredResults.length}/${resultsWithScores.length} documents above threshold`);
      
      return filteredResults.map(([doc, score]) => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || 'unknown',
          type: doc.metadata.type || 'upload',
          similarityScore: score,
          ...doc.metadata
        }
      }));
    } catch (error) {
      console.error('❌ Vector search error:', error);
      throw error;
    }
  }

  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
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
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
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

  async clearAllDocuments(collectionName: string = 'business_docs'): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      await db.collection(collectionName).deleteMany({});
      console.log(`All documents cleared from collection ${collectionName}`);
    } catch (error) {
      console.error('Error clearing documents:', error);
      throw error;
    }
  }

  async deleteDocumentsBySource(source: string, collectionName: string = 'business_docs'): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const result = await db.collection(collectionName).deleteMany({ 
        'metadata.source': source 
      });
      console.log(`Deleted ${result.deletedCount} documents with source: ${source}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting documents by source:', error);
      throw error;
    }
  }

  async deleteDocumentsBySources(sources: string[], collectionName: string = 'business_docs'): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      console.log(`🔍 VectorStore: Deleting documents with sources:`, sources);
      
      // First, let's check what documents exist with these sources
      const existingDocs = await db.collection(collectionName).find({ 
        'metadata.source': { $in: sources }
      }).toArray();
      console.log(`🔍 VectorStore: Found ${existingDocs.length} existing documents to delete`);
      existingDocs.forEach(doc => {
        console.log(`  - Source: "${doc.metadata?.source}", Type: ${doc.metadata?.type}`);
      });
      
      const result = await db.collection(collectionName).deleteMany({ 
        'metadata.source': { $in: sources }
      });
      console.log(`✅ VectorStore: Deleted ${result.deletedCount} documents with sources: ${sources.join(', ')}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting documents by sources:', error);
      throw error;
    }
  }

  async deleteDocumentsByType(type: 'upload' | 'web' | 'pdf', collectionName: string = 'business_docs'): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const result = await db.collection(collectionName).deleteMany({ 
        'metadata.type': type 
      });
      console.log(`Deleted ${result.deletedCount} documents with type: ${type}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting documents by type:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.vectorStore = null;
      this.isInitialized = false;
      console.log('VectorStoreService connection closed');
    }
  }

  // Getter for embeddings (for use by other services)
  getEmbeddings(): HuggingFaceTransformersEmbeddings {
    return this.embeddings;
  }

  // Getter for MongoDB client (for use by other services)
  getClient(): MongoClient | null {
    return this.client;
  }
}
