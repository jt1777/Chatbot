import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import multer from 'multer';
import { RAGService } from './services/ragService';
import { DocumentService } from './services/documentService';
import { ChatRequest, ChatResponse } from './types/document';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Check for xAI API key
if (!process.env.XAI_API_KEY) {
  throw new Error('XAI_API_KEY environment variable is required');
}

// In-memory conversation history storage (for demo purposes)
const conversationHistory = new Map<string, string[]>();

// Initialize services
const ragService = new RAGService();
const documentService = new DocumentService(ragService);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

app.use(cors());
app.use(express.json());

// Initialize RAG service
ragService.initialize().catch(console.error);

app.get('/', (req, res) => {
  res.send('Backend running');
});

app.post('/api/chat', async (req, res) => {
  const { message, userId = 'default', useRAG = true } = req.body as ChatRequest;

  try {
    // Get conversation history for context
    const history = conversationHistory.get(userId) || [];

    let systemContent = 'You are a helpful AI assistant. Keep your responses conversational and friendly.';
    let sources: string[] = [];

    // If RAG is enabled, search for relevant documents
    if (useRAG) {
      try {
        console.log('🔍 RAG: Searching for documents related to:', message);
        const relevantDocs = await ragService.searchSimilarDocuments(message, 3);
        console.log('📄 RAG: Found', relevantDocs.length, 'relevant documents');
        
        if (relevantDocs.length > 0) {
          console.log('📋 RAG: Document sources:', relevantDocs.map(doc => doc.metadata.source));
          
          const context = relevantDocs
            .map(doc => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
            .join('\n\n---\n\n');
          
          systemContent = `You are a helpful AI assistant with access to a knowledge base. Use the following context to answer questions when relevant, but also use your general knowledge. If the context doesn't contain relevant information, say so and provide a helpful general response.

Context:
${context}

Instructions:
- Cite sources when using information from the context
- Be conversational and friendly
- If the context doesn't help, provide general assistance`;

          sources = relevantDocs.map(doc => doc.metadata.source);
          console.log('✅ RAG: Using context from', sources.length, 'sources');
        } else {
          console.log('❌ RAG: No relevant documents found for query');
        }
      } catch (ragError) {
        console.error('❌ RAG search error:', ragError);
        // Continue without RAG if there's an error
      }
    }

    // Create messages array for xAI API (OpenAI-compatible format)
    const messages = [
      {
        role: 'system',
        content: systemContent
      }
    ];

    // Add recent conversation history (limit to last 10 messages for context)
    const recentHistory = history.slice(-10);
    for (let i = 0; i < recentHistory.length - 1; i += 2) {
      if (recentHistory[i]) {
        const userMsg = recentHistory[i]!.replace('User: ', '');
        messages.push({ role: 'user', content: userMsg });
      }
      if (recentHistory[i + 1]) {
        const botMsg = recentHistory[i + 1]!.replace('Bot: ', '');
        messages.push({ role: 'assistant', content: botMsg });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call xAI API
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-3',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const botReply = response.data.choices[0].message.content;

    // Store conversation in history
    history.push(`User: ${message}`);
    history.push(`Bot: ${botReply}`);
    conversationHistory.set(userId, history);

    const chatResponse: ChatResponse = {
      reply: botReply,
      sources: sources.length > 0 ? sources : undefined
    };

    res.json(chatResponse);
  } catch (error: any) {
    console.error('xAI API error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.response?.data?.error || error.message
    });
  }
});

// Document upload endpoint
app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, mimetype, buffer } = req.file;
    let documents;

    if (mimetype === 'application/pdf') {
      documents = await documentService.processPDFBuffer(buffer, originalname);
    } else if (mimetype === 'text/plain') {
      const content = buffer.toString('utf-8');
      documents = await documentService.processTextFile(content, originalname);
    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

    await documentService.addDocumentsToVectorStore(documents);

    res.json({
      message: 'File uploaded and processed successfully',
      filename: originalname,
      chunksCreated: documents.length
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to process uploaded file',
      details: error.message
    });
  }
});

// Website scraping endpoint
app.post('/api/documents/scrape', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const documents = await documentService.scrapeWebsite(url);
    await documentService.addDocumentsToVectorStore(documents);

    res.json({
      message: 'Website scraped and processed successfully',
      url,
      chunksCreated: documents.length
    });
  } catch (error: any) {
    console.error('Website scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape website',
      details: error.message
    });
  }
});

// Get document statistics
app.get('/api/documents/stats', async (req, res) => {
  try {
    const stats = await documentService.getDocumentStats();
    res.json(stats);
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get document statistics',
      details: error.message
    });
  }
});

// Clear all documents
app.delete('/api/documents/clear', async (req, res) => {
  try {
    await ragService.clearAllDocuments();
    res.json({ message: 'All documents cleared successfully' });
  } catch (error: any) {
    console.error('Clear documents error:', error);
    res.status(500).json({
      error: 'Failed to clear documents',
      details: error.message
    });
  }
});

// Search documents endpoint (for testing)
app.post('/api/documents/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await ragService.searchSimilarDocuments(query, limit);
    res.json({
      query,
      results: results.map(doc => ({
        content: doc.pageContent.substring(0, 200) + '...',
        source: doc.metadata.source,
        type: doc.metadata.type
      }))
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      details: error.message
    });
  }
});

console.log('About to start server...');
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log('Server started successfully, keeping alive...');
});

server.on('error', (error: any) => {
  console.error('Server error:', error);
});

server.on('close', () => {
  console.log('Server closed');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    // Force exit to avoid native module cleanup issues
    setTimeout(() => {
      process.exit(0);
    }, 100);
  });
});

console.log('Script execution completed');
