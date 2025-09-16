import { Document } from '../types/document';
import { VectorStoreService } from './vectorStoreService';

export class RAGService {
  private vectorStoreService: VectorStoreService;

  constructor() {
    this.vectorStoreService = VectorStoreService.getInstance();
  }

  async initialize(orgId: string): Promise<void> {
    await this.vectorStoreService.initialize(orgId);
    console.log(`RAG Service initialized successfully for org ${orgId}`);
  }

  async searchSimilarDocuments(query: string, orgId: string, limit: number = 5): Promise<Document[]> {
    return await this.vectorStoreService.searchSimilarDocuments(query, orgId, limit);
  }

  async addDocuments(documents: Document[], orgId: string): Promise<void> {
    return await this.vectorStoreService.addDocuments(documents, orgId);
  }

  async getDocumentCount(): Promise<number> {
    return await this.vectorStoreService.getDocumentCount();
  }

  async clearAllDocuments(): Promise<void> {
    return await this.vectorStoreService.clearAllDocuments();
  }

  async close(): Promise<void> {
    return await this.vectorStoreService.close();
  }
}
