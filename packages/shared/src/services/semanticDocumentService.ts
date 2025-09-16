import { promises as fs } from 'fs';
import * as path from 'path';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '../types/document';
import { VectorStoreService } from './vectorStoreService';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/huggingface_transformers';

export class SemanticDocumentService {
  public vectorStoreService: VectorStoreService; // Made public for external access
  private embeddings: HuggingFaceTransformersEmbeddings;
  private semanticSplitter: RecursiveCharacterTextSplitter;
  private standardSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.vectorStoreService = VectorStoreService.getInstance();
    
    // Initialize embeddings (same as VectorStoreService uses)
    this.embeddings = new HuggingFaceTransformersEmbeddings({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      maxRetries: 3,
      timeout: 30000,
    });

    // Semantic splitter - larger chunks for better context
    this.semanticSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 2000, // Larger chunks for semantic coherence
      chunkOverlap: 400, // More overlap to preserve context
      separators: [
        '\n\n\n', // Major section breaks
        '\n\n',   // Paragraph breaks
        '\n',     // Line breaks
        '.',      // Sentence breaks
        '!', '?', // Question/exclamation breaks
        ';', ',', // Clause breaks
        ' ',      // Word breaks
        ''        // Character breaks
      ]
    });

    // Standard splitter for comparison
    this.standardSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
      separators: ['\n\n', '\n', '。', '！', '？', '；', '，', '.', '!', '?', ';', ',', ' ', '']
    });
  }

  /**
   * Semantic chunking using similarity-based splitting
   */
  async semanticChunking(text: string, filename: string): Promise<Document[]> {
    console.log(`🧠 Starting semantic chunking for: ${filename}`);
    
    try {
      // First, split into larger semantic chunks
      const semanticChunks = await this.semanticSplitter.splitText(text);
      console.log(`📝 Created ${semanticChunks.length} semantic chunks`);

      // Convert to Document objects with enhanced metadata
      const documents: Document[] = semanticChunks.map((chunk, index) => ({
        pageContent: chunk,
        metadata: {
          source: filename,
          type: 'upload' as const,
          chunkIndex: index,
          chunkType: 'semantic',
          chunkSize: chunk.length,
          uploadDate: new Date().toISOString(),
          // Add semantic indicators
          hasQuestions: chunk.includes('?'),
          hasNumbers: /\d+/.test(chunk),
          hasNames: /[A-Z][a-z]+ [A-Z][a-z]+/.test(chunk), // Simple name detection
          wordCount: chunk.split(/\s+/).length
        }
      }));

      console.log(`✅ Semantic chunking completed: ${documents.length} chunks created`);
      return documents;

    } catch (error) {
      console.error(`❌ Semantic chunking failed for ${filename}:`, error);
      throw error;
    }
  }

  /**
   * Enhanced document processing with semantic awareness
   */
  async processDocumentWithSemantics(filePath: string, filename: string): Promise<Document[]> {
    try {
      console.log(`🔍 Processing document with semantics: ${filename}`);
      
      // Read the document
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content || content.trim().length < 100) {
        throw new Error('Document content is too short for semantic processing');
      }

      // Use semantic chunking
      const semanticDocs = await this.semanticChunking(content, filename);
      
      // Add to vector store
      await this.vectorStoreService.addDocuments(semanticDocs);
      console.log(`✅ Added ${semanticDocs.length} semantic chunks to vector store`);

      return semanticDocs;

    } catch (error) {
      console.error(`❌ Error processing document with semantics:`, error);
      throw error;
    }
  }

  /**
   * Enhanced similarity search with semantic ranking
   */
  async semanticSearch(query: string, limit: number = 5): Promise<Document[]> {
    console.log(`🔍 Performing semantic search for: "${query}"`);
    
    try {
      // Get more results initially for re-ranking
      const initialLimit = Math.min(limit * 3, 20);
      const results = await this.vectorStoreService.searchSimilarDocuments(query, initialLimit);
      
      console.log(`📊 Retrieved ${results.length} initial results for semantic ranking`);

      // Enhanced ranking based on semantic factors
      const rankedResults = results
        .map(doc => ({
          ...doc,
          semanticScore: this.calculateSemanticScore(doc, query)
        }))
        .sort((a, b) => {
          // Combine similarity score with semantic score
          const scoreA = (a.metadata.similarityScore || 0) * 0.7 + a.semanticScore * 0.3;
          const scoreB = (b.metadata.similarityScore || 0) * 0.7 + b.semanticScore * 0.3;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      console.log(`🎯 Semantic search completed: ${rankedResults.length} results`);
      rankedResults.forEach((doc, index) => {
        console.log(`  ${index + 1}. ${doc.metadata.source} - Combined Score: ${((doc.metadata.similarityScore || 0) * 0.7 + doc.semanticScore * 0.3).toFixed(3)}`);
      });

      return rankedResults;

    } catch (error) {
      console.error(`❌ Semantic search failed:`, error);
      throw error;
    }
  }

  /**
   * Calculate semantic relevance score
   */
  private calculateSemanticScore(doc: Document, query: string): number {
    let score = 0;
    const content = doc.pageContent.toLowerCase();
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Exact phrase matching
    if (content.includes(queryLower)) {
      score += 0.5;
    }

    // Word overlap scoring
    const contentWords = content.split(/\s+/);
    const commonWords = queryWords.filter(word => 
      contentWords.some(cWord => cWord.includes(word) || word.includes(cWord))
    );
    score += (commonWords.length / queryWords.length) * 0.3;

    // Metadata-based scoring
    if (doc.metadata.hasQuestions && query.includes('?')) {
      score += 0.1;
    }
    
    if (doc.metadata.hasNumbers && /\d+/.test(query)) {
      score += 0.1;
    }

    // Chunk quality scoring
    if (doc.metadata.wordCount && doc.metadata.wordCount > 50) {
      score += 0.1; // Prefer substantial chunks
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Get document statistics with semantic analysis
   */
  async getSemanticStats(): Promise<any> {
    const baseStats = await this.vectorStoreService.getDocumentCount();
    
    // Could add more semantic-specific stats here
    return {
      totalDocuments: baseStats,
      semanticChunking: true,
      chunkingStrategy: 'semantic-enhanced'
    };
  }
}
