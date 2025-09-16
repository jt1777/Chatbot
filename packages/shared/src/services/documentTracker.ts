import { MongoClient } from 'mongodb';

export interface DocumentRecord {
  _id?: string;
  source: string;
  type: 'upload' | 'web';
  filename?: string;
  url?: string;
  uploadDate: string;
  chunksCount: number;
}

export class DocumentTracker {
  private client: MongoClient | null = null;
  private collection: any = null;

  async initialize(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    this.client = new MongoClient(mongoUri);
    await this.client.connect();
    const db = this.client.db();
    this.collection = db.collection('document_tracker');
    
    console.log('📋 Document Tracker initialized');
  }

  async addDocument(source: string, type: 'upload' | 'web', chunksCount: number): Promise<void> {
    if (!this.collection) {
      throw new Error('DocumentTracker not initialized');
    }

    const existingDoc = await this.collection.findOne({ source });
    
    if (existingDoc) {
      // Update existing document with new chunk count
      await this.collection.updateOne(
        { source },
        { 
          $set: { 
            chunksCount,
            uploadDate: new Date().toISOString()
          }
        }
      );
      console.log(`📝 Updated document: ${source}`);
    } else {
      // Add new document
      const documentRecord: DocumentRecord = {
        source,
        type,
        filename: type === 'upload' ? source : undefined,
        url: type === 'web' ? source : undefined,
        uploadDate: new Date().toISOString(),
        chunksCount
      };

      await this.collection.insertOne(documentRecord);
      console.log(`📝 Added new document: ${source}`);
    }
  }

  async getDocumentStats(): Promise<{ count: number; documents: DocumentRecord[] }> {
    if (!this.collection) {
      throw new Error('DocumentTracker not initialized');
    }

    const documents = await this.collection.find({}).sort({ uploadDate: -1 }).toArray();
    
    return {
      count: documents.length,
      documents
    };
  }

  async clearAllDocuments(): Promise<void> {
    if (!this.collection) {
      throw new Error('DocumentTracker not initialized');
    }

    await this.collection.deleteMany({});
    console.log('🗑️ Cleared all document records');
  }

  async removeDocument(source: string): Promise<void> {
    if (!this.collection) {
      throw new Error('DocumentTracker not initialized');
    }

    console.log(`🔍 DocumentTracker: Attempting to remove document with source: "${source}"`);
    
    // First check if the document exists
    const existingDoc = await this.collection.findOne({ source });
    if (existingDoc) {
      console.log(`🔍 DocumentTracker: Found document to remove:`, {
        source: existingDoc.source,
        type: existingDoc.type,
        chunksCount: existingDoc.chunksCount
      });
    } else {
      console.log(`⚠️ DocumentTracker: No document found with source: "${source}"`);
    }
    
    const result = await this.collection.deleteOne({ source });
    if (result.deletedCount > 0) {
      console.log(`✅ DocumentTracker: Removed document record: ${source}`);
    } else {
      console.log(`⚠️ DocumentTracker: Document record not found: ${source}`);
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
    }
  }
}
