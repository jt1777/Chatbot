import { Document } from '../types/document';
import { VectorStoreService } from './vectorStoreService';

export class RAGService {
  private vectorStoreService: VectorStoreService;

  constructor() {
    this.vectorStoreService = VectorStoreService.getInstance();
  }

  async initialize(): Promise<void> {
    await this.vectorStoreService.initialize();
    console.log('RAG Service initialized successfully');
  }

  async searchSimilarDocuments(query: string, limit: number = 5): Promise<Document[]> {
    return await this.vectorStoreService.searchSimilarDocuments(query, limit);
  }

  async addDocuments(documents: Document[]): Promise<void> {
    return await this.vectorStoreService.addDocuments(documents);
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
