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
  private isIndexCreated: boolean = false;
  private readonly COLLECTION_NAME = 'vectors';
  private readonly INDEX_NAME = 'vector_index';

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

  async initialize(orgId?: string): Promise<void> {
    if (this.isInitialized) {
      console.log('VectorStoreService already initialized');
      return;
    }

    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      console.log(`🔧 Initializing vector store with single collection: ${this.COLLECTION_NAME}`);

      this.client = new MongoClient(mongoUri);
      await this.client.connect();
      const db = this.client.db();

      // Ensure the vectors collection exists
      const collection = db.collection(this.COLLECTION_NAME);

      // Check if collection exists, create if not
      const collections = await db.listCollections({ name: this.COLLECTION_NAME }).toArray();
      if (collections.length === 0) {
        console.log(`🔧 Creating collection: ${this.COLLECTION_NAME}`);
        await db.createCollection(this.COLLECTION_NAME);
      } else {
        console.log(`🔧 Collection ${this.COLLECTION_NAME} already exists`);
      }

      // Check if vector index exists, create if not
      await this.ensureVectorIndex(collection);

      // Initialize the vector store
      this.vectorStore = new MongoDBAtlasVectorSearch(this.embeddings, {
        collection: collection,
        indexName: this.INDEX_NAME,
        textKey: 'text',
        embeddingKey: 'embedding',
      });

      this.isInitialized = true;
      console.log('VectorStoreService initialized successfully');
      console.log('🔧 MongoDB collection:', collection.collectionName);
      console.log('🔧 Vector index name:', this.INDEX_NAME);
      console.log('🔧 Embedding field: embedding');
    } catch (error) {
      console.error('Failed to initialize VectorStoreService:', error);
      throw error;
    }
  }

  private async ensureVectorIndex(collection: any): Promise<void> {
    try {
      // Check if vector index already exists
      const searchIndexes = await collection.listSearchIndexes().toArray();
      const existingIndex = searchIndexes.find((index: any) => index.name === this.INDEX_NAME);

      if (existingIndex) {
        console.log(`🔧 Vector index '${this.INDEX_NAME}' already exists`);
        this.isIndexCreated = true;
        return;
      }

      console.log(`🔧 Creating vector index '${this.INDEX_NAME}'...`);

      // Create the vector search index
      const indexDefinition = {
        name: this.INDEX_NAME,
        type: 'vectorSearch',
        fields: [
          {
            numDimensions: 384, // all-MiniLM-L6-v2 produces 384-dimensional embeddings
            path: 'embedding',
            similarity: 'cosine',
            type: 'vector'
          }
        ]
      };

      await collection.createSearchIndex(indexDefinition);

      // Wait for index to be ready (poll for status)
      await this.waitForIndexReady(collection);

      this.isIndexCreated = true;
      console.log(`✅ Vector index '${this.INDEX_NAME}' created successfully`);
    } catch (error) {
      console.error('❌ Failed to create vector index:', error);
      throw error;
    }
  }

  private async waitForIndexReady(collection: any, maxRetries: number = 30): Promise<void> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const indexes = await collection.listSearchIndexes().toArray();
        const index = indexes.find((idx: any) => idx.name === this.INDEX_NAME);

        if (index && index.status === 'READY') {
          console.log(`🔧 Vector index '${this.INDEX_NAME}' is ready`);
          return;
        }

        console.log(`🔧 Waiting for vector index '${this.INDEX_NAME}' to be ready... (attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      } catch (error) {
        console.error(`❌ Error checking index status (attempt ${i + 1}):`, error);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    throw new Error(`Vector index '${this.INDEX_NAME}' failed to become ready within ${maxRetries * 2} seconds`);
  }

  async searchSimilarDocuments(query: string, orgId: string, limit: number = 5): Promise<Document[]> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      console.log('🔍 Vector search: Querying for:', query);
      console.log('🔍 Vector search: Limit:', limit);
      
      const similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');
      console.log('🎯 Similarity threshold:', similarityThreshold);
      console.log('🏢 Filtering results for orgId:', orgId);

      // Use the collection directly to filter by orgId before similarity search
      const db = this.client!.db();
      const collection = db.collection(this.COLLECTION_NAME);

      // First, get all documents for this orgId
      const orgDocuments = await collection.find({ 'metadata.orgId': orgId }).toArray();
      console.log(`📊 Found ${orgDocuments.length} documents for org ${orgId}`);

      if (orgDocuments.length === 0) {
        console.log(`ℹ️ No documents found for org ${orgId}`);
        return [];
      }

      // Perform similarity search with pre-filter
      const resultsWithScores = await this.vectorStore.similaritySearchWithScore(query, limit);
      console.log('📊 Vector search: Raw results with scores:', resultsWithScores.length);

      // Filter results to only include documents from this orgId
      const orgFilteredResults = resultsWithScores.filter(([doc, score]) => {
        const docOrgId = doc.metadata.orgId;
        const isFromOrg = docOrgId === orgId;
        if (!isFromOrg) {
          console.log(`❌ Filtered out result from different org: ${docOrgId}`);
        }
        return isFromOrg;
      });

      console.log(`📊 Org-filtered results: ${orgFilteredResults.length}/${resultsWithScores.length} documents from org ${orgId}`);

      orgFilteredResults.forEach((result, index) => {
        const [doc, score] = result;
        console.log(`📄 Result ${index + 1}: Score = ${score.toFixed(3)}, Org = ${doc.metadata.orgId}, Preview = "${doc.pageContent.substring(0, 100)}..."`);
      });

      const filteredResults = orgFilteredResults.filter(([doc, score]) => {
        const isRelevant = score >= similarityThreshold;
        if (!isRelevant) {
          console.log(`❌ Filtered out result with score ${score.toFixed(3)} (below threshold ${similarityThreshold})`);
        }
        return isRelevant;
      });

      console.log(`✅ Final filtered results: ${filteredResults.length}/${orgFilteredResults.length} documents above threshold for org ${orgId}`);

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

  async addDocuments(documents: Document[], orgId: string): Promise<void> {
    if (!this.isInitialized || !this.vectorStore) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      // Ensure all documents have the organization ID in metadata
      const documentsWithOrgId = documents.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          orgId: orgId
        }
      }));

      await this.vectorStore.addDocuments(documentsWithOrgId);
      console.log(`Added ${documents.length} documents to vector store for org ${orgId}`);
    } catch (error) {
      console.error('Error adding documents:', error);
      throw error;
    }
  }

  async getDocumentCount(orgId?: string): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const collection = db.collection(this.COLLECTION_NAME);

      let count: number;
      if (orgId) {
        count = await collection.countDocuments({ 'metadata.orgId': orgId });
        console.log(`📊 Document count for org ${orgId}: ${count}`);
      } else {
        count = await collection.countDocuments();
        console.log(`📊 Total document count: ${count}`);
      }

      // Debug: Check document structure
      const sampleDoc = await collection.findOne({});
      if (sampleDoc) {
        console.log('🔍 Sample document fields:', Object.keys(sampleDoc));
        console.log('🔍 Has embedding field:', 'embedding' in sampleDoc);
        console.log('🔍 Has text field:', 'text' in sampleDoc);
        console.log('🔍 Has pageContent field:', 'pageContent' in sampleDoc);
        console.log('🔍 Has orgId in metadata:', sampleDoc.metadata?.orgId);
      }

      return count;
    } catch (error) {
      console.error('Error getting document count:', error);
      throw error;
    }
  }

  async clearAllDocuments(orgId?: string): Promise<void> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const collection = db.collection(this.COLLECTION_NAME);

      let result;
      if (orgId) {
        result = await collection.deleteMany({ 'metadata.orgId': orgId });
        console.log(`Cleared ${result.deletedCount} documents for org ${orgId} from collection ${this.COLLECTION_NAME}`);
      } else {
        result = await collection.deleteMany({});
        console.log(`Cleared all ${result.deletedCount} documents from collection ${this.COLLECTION_NAME}`);
      }
    } catch (error) {
      console.error('Error clearing documents:', error);
      throw error;
    }
  }

  async deleteDocumentsBySource(source: string, orgId?: string): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const collection = db.collection(this.COLLECTION_NAME);

      let query: any = { 'metadata.source': source };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      const result = await collection.deleteMany(query);
      const context = orgId ? ` for org ${orgId}` : '';
      console.log(`Deleted ${result.deletedCount} documents with source: ${source}${context}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting documents by source:', error);
      throw error;
    }
  }

  async deleteDocumentsBySources(sources: string[], orgId?: string): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const collection = db.collection(this.COLLECTION_NAME);
      console.log(`🔍 VectorStore: Deleting documents with sources:`, sources);

      let query: any = { 'metadata.source': { $in: sources } };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      // First, let's check what documents exist with these sources
      const existingDocs = await collection.find(query).toArray();
      console.log(`🔍 VectorStore: Found ${existingDocs.length} existing documents to delete`);
      existingDocs.forEach(doc => {
        console.log(`  - Source: "${doc.metadata?.source}", Type: ${doc.metadata?.type}, Org: ${doc.metadata?.orgId}`);
      });

      const result = await collection.deleteMany(query);
      const context = orgId ? ` for org ${orgId}` : '';
      console.log(`✅ VectorStore: Deleted ${result.deletedCount} documents with sources: ${sources.join(', ')}${context}`);
      return result.deletedCount;
    } catch (error) {
      console.error('Error deleting documents by sources:', error);
      throw error;
    }
  }

  async deleteDocumentsByType(type: 'upload' | 'web' | 'pdf', orgId?: string): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db();
      const collection = db.collection(this.COLLECTION_NAME);

      let query: any = { 'metadata.type': type };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      const result = await collection.deleteMany(query);
      const context = orgId ? ` for org ${orgId}` : '';
      console.log(`Deleted ${result.deletedCount} documents with type: ${type}${context}`);
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
