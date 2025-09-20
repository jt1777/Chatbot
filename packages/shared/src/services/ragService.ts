import { Document } from '../types/document';
import { VectorStoreService } from './vectorStoreService';

export class RAGService {
  private vectorStoreService: VectorStoreService;

  constructor() {
    this.vectorStoreService = VectorStoreService.getInstance();
  }

  async initialize(): Promise<void> {
    await this.vectorStoreService.initialize();
    console.log('RAG Service initialized successfully with single collection');
  }

  async searchSimilarDocuments(query: string, orgId: string, limit: number = 5): Promise<Document[]> {
    return await this.vectorStoreService.searchSimilarDocuments(query, orgId, limit);
  }

  async addDocuments(documents: Document[], orgId: string): Promise<void> {
    return await this.vectorStoreService.addDocuments(documents, orgId);
  }

  async getDocumentCount(orgId?: string): Promise<number> {
    return await this.vectorStoreService.getDocumentCount(orgId);
  }

  async clearAllDocuments(orgId: string): Promise<void> {
    return await this.vectorStoreService.clearAllDocuments(orgId);
  }

  async close(): Promise<void> {
    return await this.vectorStoreService.close();
  }
}
