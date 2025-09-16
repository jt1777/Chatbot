import { promises as fs } from 'fs';
import * as path from 'path';
import pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '../types/document';
import { VectorStoreService } from './vectorStoreService';
import { DocumentTracker } from './documentTracker';
import { createWorker } from 'tesseract.js';
const { Poppler } = require('node-poppler');

export class DocumentService {
  private vectorStoreService: VectorStoreService;
  private documentTracker: DocumentTracker;
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.vectorStoreService = VectorStoreService.getInstance();
    this.documentTracker = new DocumentTracker();
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', '.', '!', '?', ';', ',', ' ', '']
    });
  }

  async initialize(): Promise<void> {
    await this.documentTracker.initialize();
    try {
      await fs.mkdir('./temp', { recursive: true });
    } catch (error) {
      console.warn('Could not create temp directory:', error);
    }
  }

  async processPDFBuffer(buffer: Buffer, filename: string): Promise<Document[]> {
    try {
      let text: string;
      let extractionMethod: 'text' | 'ocr' = 'text';
      let ocrConfidence: number | null = null;

      try {
        const pdfResult = await pdfParse(buffer);
        text = pdfResult.text;
        if (!text || text.trim().length < 50) {
          console.log(`PDF ${filename} has no extractable text, trying OCR...`);
          const { text: ocrText, confidence } = await this.extractTextWithOCR(buffer, filename);
          text = ocrText;
          extractionMethod = 'ocr';
          ocrConfidence = confidence;
        }
      } catch (pdfError) {
        console.log(`PDF text extraction failed for ${filename}, trying OCR...`);
        const { text: ocrText, confidence } = await this.extractTextWithOCR(buffer, filename);
        text = ocrText;
        extractionMethod = 'ocr';
        ocrConfidence = confidence;
      }

      if (!text || text.trim().length < 10) {
        throw new Error('PDF appears to have no extractable content even with OCR');
      }

      const document: Document = {
        pageContent: text,
        metadata: {
          source: filename,
          type: 'upload',
          uploadDate: new Date().toISOString(),
          extractionMethod,
          ocrConfidence
        }
      };

      const splitDocs = await this.textSplitter.splitDocuments([document]);
      const typedDocs: Document[] = splitDocs.map(doc => ({
        pageContent: doc.pageContent,
        metadata: {
          source: doc.metadata.source || filename,
          type: doc.metadata.type || 'upload',
          extractionMethod,
          ocrConfidence,
          ...doc.metadata
        }
      }));

      console.log(`Processed PDF: ${filename} (${extractionMethod}), created ${typedDocs.length} chunks`);
      return typedDocs;
    } catch (error) {
      console.error(`Error processing PDF ${filename}:`, error);
      throw error;
    }
  }

  private async extractTextWithOCR(buffer: Buffer, filename: string): Promise<{ text: string; confidence: number }> {
    const worker = await createWorker('eng');
    const poppler = new Poppler('/opt/homebrew/bin'); // Path to Poppler binaries on ARM64 Mac
    
    // Declare cleanup variables outside try block
    let tempPdfPath: string | null = null;
    let createdImageFiles: string[] = [];
    
    try {
      // Save PDF buffer to temporary file
      tempPdfPath = path.join('./temp', `${filename}_${Date.now()}.pdf`);
      await fs.writeFile(tempPdfPath, buffer);
      console.log(`Saved PDF to: ${tempPdfPath}`);

      // Convert PDF to images using node-poppler (much faster!)
      const outputDir = './temp';
      const outputPrefix = path.join(outputDir, `${filename}_page`);
      
      console.log('Converting PDF to images with node-poppler...');
      console.log(`Output prefix: ${outputPrefix}`);
      await poppler.pdfToCairo(tempPdfPath, outputPrefix, {
        pngFile: true,
        singleFile: false,
        firstPageToConvert: 1,
        lastPageToConvert: -1, // All pages
        resolutionXYAxis: 300, // High resolution for better OCR
        cropBox: false,
        jpegFile: false
      });
      
      console.log('✅ PDF conversion completed, finding generated image files...');
      
      // Find all generated PNG files in the temp directory
      const prefixFilename = `${filename}_page`;
      console.log(`Looking for files in ${outputDir} with prefix: ${prefixFilename}`);
      const tempDirContents = await fs.readdir(outputDir);
      console.log(`All files in temp directory:`, tempDirContents);
      
      const imageFiles = tempDirContents
        .filter(file => file.startsWith(prefixFilename) && file.endsWith('.png'))
        .sort(); // Sort to ensure correct page order
      
      console.log(`✅ Found ${imageFiles.length} images:`, imageFiles);
      
      if (imageFiles.length === 0) {
        throw new Error(`No image files were generated. Expected files starting with: ${prefixFilename}`);
      }
      
      // Store image files for cleanup
      createdImageFiles = imageFiles.map(file => path.join(outputDir, file));
      
      let fullText = '';
      let totalConfidence = 0;

      // Process each page with OCR
      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        if (!imageFile) {
          console.warn(`Skipping undefined image file at index ${i}`);
          continue;
        }
        
        const imagePath = path.join(outputDir, imageFile);
        
        console.log(`🔍 Processing page ${i + 1}/${imageFiles.length} with OCR...`);
        console.log(`Image path: ${imagePath}`); // Debug log
        
        const { data: { text, confidence } } = await worker.recognize(imagePath);
        console.log(`✅ OCR completed for page ${i + 1}, confidence: ${confidence}%`);
        
        fullText += text + '\n\n--- Page Break ---\n\n';
        totalConfidence += confidence;
      }

      const avgConfidence = totalConfidence / imageFiles.length;
      console.log(`🎉 OCR completed with average confidence: ${avgConfidence.toFixed(2)}%`);
      
      return { text: fullText.trim(), confidence: avgConfidence };
    } catch (error) {
      throw new Error(`OCR processing failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // Always clean up, regardless of success or failure
      await worker.terminate();
      
      // Clean up temp PDF file
      if (tempPdfPath) {
        try {
          await fs.unlink(tempPdfPath);
          console.log(`🧹 Cleaned up temp PDF`);
        } catch (cleanupError) {
          console.warn(`Could not delete temp PDF file:`, cleanupError);
        }
      }

      // Clean up image files
      for (const imagePath of createdImageFiles) {
        try {
          await fs.unlink(imagePath);
          console.log(`🧹 Cleaned up image: ${path.basename(imagePath)}`);
        } catch (cleanupError) {
          console.warn(`Could not delete image file ${path.basename(imagePath)}:`, cleanupError);
        }
      }
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

      const splitDocs = await this.textSplitter.splitDocuments([document]);
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

      $('script, style, nav, footer, header').remove();
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

      const splitDocs = await this.textSplitter.splitDocuments([document]);
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
      await this.vectorStoreService.addDocuments(documents);
      console.log(`Added ${documents.length} documents to vector store`);
    } catch (error) {
      console.error('Error adding documents to vector store:', error);
      throw error;
    }
  }

  async trackDocument(source: string, type: 'upload' | 'web', chunksCount: number): Promise<void> {
    await this.documentTracker.addDocument(source, type, chunksCount);
  }

  async getDocumentStats(): Promise<{ count: number; documents: any[] }> {
    try {
      console.log('🔍 Getting document stats...');
      const stats = await this.documentTracker.getDocumentStats();
      console.log('📊 Document stats:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting document stats:', error);
      throw error;
    }
  }

  async clearAllDocuments(): Promise<void> {
    await this.documentTracker.clearAllDocuments();
  }

  async deleteDocumentsBySource(source: string): Promise<number> {
    try {
      const deletedCount = await this.vectorStoreService.deleteDocumentsBySource(source);
      await this.documentTracker.removeDocument(source);
      console.log(`Deleted ${deletedCount} document chunks for source: ${source}`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting documents by source:', error);
      throw error;
    }
  }

  async deleteDocumentsBySources(sources: string[]): Promise<number> {
    try {
      const deletedCount = await this.vectorStoreService.deleteDocumentsBySources(sources);
      for (const source of sources) {
        await this.documentTracker.removeDocument(source);
      }
      console.log(`Deleted ${deletedCount} document chunks for sources: ${sources.join(', ')}`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting documents by sources:', error);
      throw error;
    }
  }

  async deleteDocumentsByType(type: 'upload' | 'web' | 'pdf'): Promise<number> {
    try {
      const deletedCount = await this.vectorStoreService.deleteDocumentsByType(type);
      // Note: DocumentTracker doesn't track by type, so we'll need to get sources by type first
      const stats = await this.documentTracker.getDocumentStats();
      const sourcesToRemove = stats.documents
        .filter((doc: any) => doc.type === type)
        .map((doc: any) => doc.source);
      
      for (const source of sourcesToRemove) {
        await this.documentTracker.removeDocument(source);
      }
      console.log(`Deleted ${deletedCount} document chunks for type: ${type}`);
      return deletedCount;
    } catch (error) {
      console.error('Error deleting documents by type:', error);
      throw error;
    }
  }
}