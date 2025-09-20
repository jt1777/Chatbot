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

  // Reset singleton instance (useful for testing or server restarts)
  public static resetInstance(): void {
    if (VectorStoreService.instance) {
      VectorStoreService.instance.close();
    }
    VectorStoreService.instance = new VectorStoreService();
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
      const db = this.client.db('test');

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

      // Initialize the vector store with explicit database reference
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

      // Create the vector search index - correct MongoDB Atlas format
      const indexDefinition = {
        name: this.INDEX_NAME,
        type: 'vectorSearch',
        definition: {
          fields: [
            {
              type: 'vector',
              path: 'embedding',
              numDimensions: 384, // all-MiniLM-L6-v2 produces 384-dimensional embeddings
              similarity: 'cosine'
            }
          ]
        }
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
      const similarityThreshold = parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7');

      // Use the collection directly to filter by orgId before similarity search
      const db = this.client!.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      // First, get all documents for this orgId
      const orgDocuments = await collection.find({ 'metadata.orgId': orgId }).toArray();
      console.log(`📊 Found ${orgDocuments.length} documents for org ${orgId}`);
      
      // Debug: Check what's actually in the collection
      const allDocs = await collection.find({}).limit(3).toArray();
      console.log(`🔍 Debug: Found ${allDocs.length} total documents in vectors collection`);
      if (allDocs.length > 0) {
        console.log(`🔍 Debug: Sample document metadata:`, allDocs[0].metadata);
        console.log(`🔍 Debug: Sample document orgId:`, allDocs[0].metadata?.orgId);
      }

      if (orgDocuments.length === 0) {
        console.log(`ℹ️ No documents found for org ${orgId}`);
        return [];
      }

      // Perform similarity search using direct MongoDB aggregation
      const queryEmbedding = await this.embeddings.embedQuery(query);
      
      const pipeline = [
        {
          $vectorSearch: {
            index: this.INDEX_NAME,
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: limit * 10, // Get more candidates for better results
            limit: limit
          }
        },
        {
          $match: {
            'metadata.orgId': orgId
          }
        },
        {
          $addFields: {
            score: { $meta: 'vectorSearchScore' }
          }
        }
      ];

      const searchResults = await collection.aggregate(pipeline).toArray();
      
      // Convert to the expected format
      const resultsWithScores = searchResults.map(doc => [
        {
          pageContent: doc.text,
          metadata: doc.metadata
        },
        doc.score
      ]);

      const filteredResults = resultsWithScores.filter(([doc, score]) => {
        return score >= similarityThreshold;
      });

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
      console.log(`🔍 VectorStore: Processing ${documents.length} documents for org ${orgId}`);
      
      // Ensure all documents have the organization ID in metadata and convert pageContent to text
      const documentsWithOrgId = documents.map(doc => ({
        ...doc,
        text: doc.pageContent, // Convert pageContent to text field for MongoDBAtlasVectorSearch
        metadata: {
          ...doc.metadata,
          orgId: orgId
        }
      }));

      console.log(`🔍 VectorStore: Sample document metadata:`, documentsWithOrgId[0]?.metadata);

      try {
        // Use direct MongoDB collection instead of MongoDBAtlasVectorSearch wrapper
        const db = this.client!.db('test');
        const collection = db.collection(this.COLLECTION_NAME);
        
        // Generate embeddings for each document
        const embeddings = await this.embeddings.embedDocuments(
          documentsWithOrgId.map(doc => doc.text)
        );
        
        // Insert documents with embeddings directly
        const documentsToInsert = documentsWithOrgId.map((doc, index) => ({
          text: doc.text,
          embedding: embeddings[index],
          metadata: doc.metadata
        }));
        
        await collection.insertMany(documentsToInsert);
        console.log(`✅ VectorStore: Successfully added ${documents.length} documents to vector store for org ${orgId}`);
      } catch (addError) {
        console.error(`❌ VectorStore: Error in addDocuments call:`, addError);
        throw addError;
      }
      
      // Verify the documents were actually stored
      const count = await this.getDocumentCount(orgId);
      console.log(`🔍 VectorStore: Document count after adding: ${count}`);
      
      // Direct MongoDB check to see what's actually in the collection
      if (count === 0) {
        console.log(`🔍 VectorStore: Checking what's actually in the vectors collection...`);
        const db = this.client!.db('test');
        const collection = db.collection(this.COLLECTION_NAME);
        const allDocs = await collection.find({}).limit(5).toArray();
        console.log(`🔍 VectorStore: Found ${allDocs.length} total documents in vectors collection`);
        if (allDocs.length > 0) {
          console.log(`🔍 VectorStore: Sample document:`, {
            id: allDocs[0]._id,
            hasEmbedding: !!allDocs[0].embedding,
            hasText: !!allDocs[0].text,
            metadata: allDocs[0].metadata
          });
        }
      }
    } catch (error) {
      console.error('❌ VectorStore: Error adding documents:', error);
      throw error;
    }
  }

  async getDocumentCount(orgId?: string): Promise<number> {
    if (!this.isInitialized || !this.client) {
      throw new Error('VectorStoreService not initialized. Call initialize() first.');
    }

    try {
      const db = this.client.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      let count: number;
      if (orgId) {
        count = await collection.countDocuments({ 'metadata.orgId': orgId });
      } else {
        count = await collection.countDocuments();
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
      const db = this.client.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      let result;
      if (orgId) {
        result = await collection.deleteMany({ 'metadata.orgId': orgId });
        console.log(`✅ Cleared ${result.deletedCount} documents for org ${orgId}`);
      } else {
        result = await collection.deleteMany({});
        console.log(`✅ Cleared ${result.deletedCount} documents from all orgs`);
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
      const db = this.client.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      let query: any = { 'metadata.source': source };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      const result = await collection.deleteMany(query);
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
      const db = this.client.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      let query: any = { 'metadata.source': { $in: sources } };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      const result = await collection.deleteMany(query);
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
      const db = this.client.db('test');
      const collection = db.collection(this.COLLECTION_NAME);

      let query: any = { 'metadata.type': type };
      if (orgId) {
        query['metadata.orgId'] = orgId;
      }

      const result = await collection.deleteMany(query);
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
