import { promises as fs } from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '../types/document';
import { RAGService } from './ragService';

export class DocumentService {
  private ragService: RAGService;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor(ragService: RAGService) {
    this.ragService = ragService;
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', '.', '!', '?', ';', ',', ' ', '']
    });
  }

  async processPDFBuffer(buffer: Buffer, filename: string): Promise<Document[]> {
    try {
      const { text } = await pdfParse(buffer);
      
      if (!text || text.trim().length < 50) {
        throw new Error('PDF appears to have no extractable text or is scanned');
      }

      const document: Document = {
        pageContent: text,
        metadata: {
          source: filename,
          type: 'upload',
          uploadDate: new Date().toISOString()
        }
      };

      // Split document into chunks
      const splitDocs = await this.textSplitter.splitDocuments([document]);
      
      // Convert to our Document type
      const typedDocs: Document[] = splitDocs.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || filename,
          type: doc.metadata.type || 'upload',
          ...doc.metadata
        }
      }));
      
      console.log(`Processed PDF: ${filename}, created ${typedDocs.length} chunks`);
      return typedDocs;
    } catch (error) {
      console.error(`Error processing PDF ${filename}:`, error);
      throw error;
    }
  }

  async processTextFile(content: string, filename: string): Promise<Document[]> {
    try {
      if (!content || content.trim().length < 10) {
        throw new Error('Text file appears to be empty');
      }

      const document: Document = {
        pageContent: content,
        metadata: {
          source: filename,
          type: 'upload',
          uploadDate: new Date().toISOString()
        }
      };

      // Split document into chunks
      const splitDocs = await this.textSplitter.splitDocuments([document]);
      
      // Convert to our Document type
      const typedDocs: Document[] = splitDocs.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || filename,
          type: doc.metadata.type || 'upload',
          ...doc.metadata
        }
      }));
      
      console.log(`Processed text file: ${filename}, created ${typedDocs.length} chunks`);
      return typedDocs;
    } catch (error) {
      console.error(`Error processing text file ${filename}:`, error);
      throw error;
    }
  }

  async scrapeWebsite(url: string): Promise<Document[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, nav, footer, header').remove();

      // Extract text from relevant elements
      const text = $('p, h1, h2, h3, h4, h5, h6')
        .map((i, el) => $(el).text().trim())
        .get()
        .filter(text => text.length > 0)
        .join('\n\n');

      if (!text || text.trim().length < 50) {
        throw new Error('Website appears to have no extractable content');
      }

      const document: Document = {
        pageContent: text,
        metadata: {
          source: url,
          type: 'web',
          scrapedDate: new Date().toISOString()
        }
      };

      // Split document into chunks
      const splitDocs = await this.textSplitter.splitDocuments([document]);
      
      // Convert to our Document type
      const typedDocs: Document[] = splitDocs.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || url,
          type: doc.metadata.type || 'web',
          ...doc.metadata
        }
      }));
      
      console.log(`Scraped website: ${url}, created ${typedDocs.length} chunks`);
      return typedDocs;
    } catch (error) {
      console.error(`Error scraping website ${url}:`, error);
      throw error;
    }
  }

  async addDocumentsToVectorStore(documents: Document[]): Promise<void> {
    try {
      await this.ragService.addDocuments(documents);
      console.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async getDocumentStats(): Promise<{ count: number; types: Record<string, number> }> {
    try {
      // This is a simplified version - in a real implementation,
      // you'd query MongoDB to get detailed statistics
      const count = await this.ragService.getDocumentCount();
      
      return {
        count,
        types: {
          pdf: 0, // Would need to query MongoDB for actual counts by type
          web: 0,
          upload: 0
        }
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      throw error;
    }
  }
}
