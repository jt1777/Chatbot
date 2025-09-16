# AI Chatbot with RAG Implementation

A full-stack RAG (Retrieval-Augmented Generation) chatbot built with React Native, Node.js, and MongoDB Atlas. The system allows users to upload documents, scrape websites, and chat with an AI that answers questions based on the uploaded knowledge base.

## Features

- **RAG-Powered Chat**: AI answers questions based on uploaded documents
- **Semantic Search**: Advanced semantic search with intelligent document ranking
- **Document Management**: Upload PDFs, scrape websites, manage knowledge base
- **Individual Document Deletion**: Select and delete specific documents from the knowledge base
- **RAG Configuration**: Customizable chunk size, overlap, similarity thresholds, and search limits
- **Dual Chat Modes**: Strict mode (documents only) vs General mode (AI + documents)
- **Real-time Processing**: Live document upload and processing
- **Pagination**: Efficient document browsing with pagination
- **Source Citations**: Shows which documents were used for answers
- **Cross-Platform**: Works on web, iOS, and Android

## Project Structure

```
Chatbot/
├── frontend/                 # React Native Web App
│   ├── App.tsx              # Main application component
│   ├── src/
│   │   ├── components/      # UI components
│   │   └── config/         # API configuration
│   └── package.json
│
├── backend/                 # Node.js API Server
│   ├── src/
│   │   ├── server.ts       # Express server & API endpoints
│   │   ├── services/       # Core business logic
│   │   │   ├── vectorStoreService.ts  # MongoDB vector operations
│   │   │   ├── ragService.ts         # RAG search logic
│   │   │   ├── documentService.ts    # Document processing
│   │   │   └── documentTracker.ts    # Document metadata tracking
│   │   └── types/          # TypeScript type definitions
│   └── package.json
│
├── datapipeline/            # Batch Document Processing
│   ├── src/
│   │   ├── index.ts        # Main pipeline orchestrator
│   │   ├── loaders/        # Document loaders (PDF, web scraping)
│   │   ├── preprocess/     # Text splitting & preprocessing
│   │   ├── embeddings/     # Embedding generation
│   │   └── services/       # Shared services
│   ├── data/               # Raw & processed documents
│   └── package.json
│
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Expo CLI: `npm install -g @expo/cli`
- MongoDB Atlas account
- xAI API key (for Grok-3)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create your `.env` file:
   ```bash
   XAI_API_KEY=your_xai_api_key_here
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   PORT=3002
   ```

4. Start the backend server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Run on device/emulator:
   - Press `i` for iOS simulator
   - Press `a` for Android emulator
   - Press `w` for web browser
   - Scan QR code with Expo Go app on your phone

### Data Pipeline Setup (Optional)

For batch document processing:

1. Navigate to the datapipeline directory:
   ```bash
   cd datapipeline
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the pipeline:
   ```bash
   npm run dev
   ```

## API Endpoints

### POST /api/chat
Send a message to the chatbot.

**Request Body:**
```json
{
  "message": "What is the main topic of the uploaded documents?",
  "userId": "optional-user-identifier",
  "useRAG": true
}
```

**Response:**
```json
{
  "reply": "Based on the uploaded documents, the main topic is...",
  "sources": ["document1.pdf", "website.com"]
}
```

### POST /api/documents/upload
Upload a PDF or text file to the knowledge base.

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "message": "File uploaded and processed successfully",
  "filename": "document.pdf",
  "chunksCreated": 15
}
```

### POST /api/documents/upload-semantic
Upload a file with semantic chunking for enhanced search quality.

**Request:** Multipart form data with `file` field

**Response:**
```json
{
  "message": "File uploaded and processed with semantic chunking",
  "filename": "document.pdf",
  "chunksCreated": 8,
  "chunkingMethod": "semantic"
}
```

### POST /api/documents/scrape
Scrape a website and add to knowledge base.

**Request Body:**
```json
{
  "url": "https://example.com"
}
```

### GET /api/documents/stats
Get document statistics.

**Response:**
```json
{
  "count": 5,
  "documents": [...]
}
```

### DELETE /api/documents/delete
Delete selected documents from the knowledge base.

**Request Body:**
```json
{
  "documentIds": ["document1.pdf", "website.com"]
}
```

**Response:**
```json
{
  "message": "2 document(s) deleted successfully",
  "deletedCount": 15,
  "deletedIds": ["document1.pdf", "website.com"]
}
```

### DELETE /api/documents/clear
Clear all documents from the knowledge base.

### GET /api/config/rag
Get current RAG configuration settings.

**Response:**
```json
{
  "chunkSize": 1000,
  "chunkOverlap": 200,
  "similarityThreshold": 0.7,
  "useSemanticSearch": false,
  "ragSearchLimit": 10
}
```

### POST /api/config/rag
Update RAG configuration settings.

**Request Body:**
```json
{
  "chunkSize": 1500,
  "chunkOverlap": 300,
  "similarityThreshold": 0.75,
  "useSemanticSearch": true,
  "ragSearchLimit": 15
}
```

**Response:**
```json
{
  "message": "RAG configuration updated successfully",
  "config": {
    "chunkSize": 1500,
    "chunkOverlap": 300,
    "similarityThreshold": 0.75,
    "useSemanticSearch": true,
    "ragSearchLimit": 15
  }
}
```

## Key Technologies

- **Frontend**: React Native, Expo, TypeScript, NativeWind, Axios
- **Backend**: Node.js, Express, TypeScript
- **AI**: xAI Grok-3, HuggingFace Transformers (embeddings)
- **Database**: MongoDB Atlas with Vector Search
- **Document Processing**: PDF parsing, web scraping, text chunking
- **Styling**: Tailwind CSS (via NativeWind)

## How RAG Works

1. **Document Ingestion**: PDFs and websites are processed and split into chunks
2. **Embedding Generation**: Each chunk is converted to vector embeddings using HuggingFace
3. **Vector Storage**: Embeddings are stored in MongoDB Atlas with vector search index
4. **Query Processing**: User questions are converted to embeddings
5. **Similarity Search**: MongoDB finds the most relevant document chunks
6. **Context Building**: Relevant chunks are combined into context
7. **AI Generation**: xAI Grok-3 generates responses using the context
8. **Source Citation**: Response includes which documents were used

## Semantic Search Features

### Advanced Semantic Search
The system includes sophisticated semantic search capabilities that go beyond simple keyword matching:

- **Semantic Chunking**: Documents are split using semantic-aware algorithms with larger chunks (2000 chars) and more overlap (400 chars) for better context preservation
- **Intelligent Ranking**: Combines vector similarity scores with semantic relevance scoring
- **Enhanced Context**: Better understanding of document meaning and relationships
- **Improved Accuracy**: More relevant results for complex queries

### Semantic vs Standard Search
- **Standard Search**: Uses smaller chunks (1000 chars) with basic text splitting
- **Semantic Search**: Uses larger chunks (2000 chars) with semantic-aware splitting
- **Hybrid Scoring**: Combines 70% similarity score + 30% semantic score for final ranking
- **Configurable**: Can be enabled/disabled via RAG configuration

## RAG Configuration

### Configurable Parameters
The system provides extensive configuration options for fine-tuning RAG performance:

#### Chunk Size (500-3000 characters)
- **Smaller chunks (500-1000)**: More precise matching, better for specific facts
- **Larger chunks (1500-3000)**: Better context, more comprehensive answers
- **Default**: 1000 characters

#### Chunk Overlap (50-500 characters)
- **Less overlap (50-200)**: Faster processing, less redundancy
- **More overlap (300-500)**: Better context preservation, more comprehensive coverage
- **Default**: 200 characters

#### Similarity Threshold (0.5-0.9)
- **Lower threshold (0.5-0.6)**: More results, potentially less relevant
- **Higher threshold (0.7-0.9)**: Fewer but more relevant results
- **Default**: 0.7

#### Search Results Limit (3-20)
- **Fewer results (3-8)**: Faster responses, focused answers
- **More results (10-20)**: More comprehensive context, potentially slower
- **Default**: 10

#### Semantic Search Toggle
- **Disabled**: Uses standard vector search with basic chunking
- **Enabled**: Uses semantic search with enhanced chunking and ranking
- **Default**: Disabled

### Configuration Management
- **Real-time Updates**: Configuration changes take effect immediately
- **Persistent Storage**: Settings are stored in environment variables
- **UI Controls**: Intuitive sliders and toggles in the frontend
- **API Access**: Configuration can be read and updated via REST API

## Document Management Features

### Individual Document Deletion
The system supports selective deletion of documents from the knowledge base:

- **Frontend Selection**: Users can select multiple documents from the knowledge base list
- **Source-Based Deletion**: Documents are identified by their source (filename or URL)
- **Vector Store Cleanup**: All document chunks are removed from MongoDB Atlas vector store
- **Metadata Tracking**: Document tracker is updated to reflect deletions
- **Real-time Updates**: UI refreshes immediately after deletion

### Deletion Methods Available:
- `deleteDocumentsBySource(source)` - Delete a single document by source
- `deleteDocumentsBySources(sources[])` - Delete multiple documents at once
- `deleteDocumentsByType(type)` - Delete all documents of a specific type (upload/web)

## Development Notes

- **VectorStoreService**: Centralized singleton for all vector operations with individual deletion support
- **Document Processing**: Real-time uploads via backend, batch processing via datapipeline
- **Error Handling**: Comprehensive error handling throughout the stack
- **Type Safety**: Full TypeScript implementation across all components
- **Modular Architecture**: Clean separation of concerns with service-based design
- **MongoDB Vector Operations**: Uses native MongoDB `deleteMany()` for efficient document removal

## Troubleshooting

- **Backend won't start**: Check your xAI API key and MongoDB URI in `.env`
- **No documents found**: Ensure MongoDB Atlas has a vector search index named `vector_index`
- **Frontend won't compile**: Ensure all dependencies are installed and NativeWind is configured
- **Upload fails**: Check file size limits (10MB) and supported formats (PDF, TXT)
- **Search returns no results**: Try adjusting similarity threshold via RAG configuration
- **Document deletion fails**: Check backend console logs for detailed debugging information
- **Documents still appear after deletion**: Ensure the frontend is using `doc.source` as the document identifier
- **Semantic search not working**: Enable semantic search via RAG configuration API or UI
- **Poor search quality**: Try adjusting chunk size, overlap, or similarity threshold via RAG configuration
- **Configuration not saving**: Check that the backend is running and accessible from the frontend
- **Slow search performance**: Reduce search limit or increase similarity threshold via RAG configuration

## Production Considerations

- **MongoDB Atlas**: Ensure proper network access and vector search index configuration
- **API Rate Limits**: Monitor xAI API usage and implement rate limiting if needed
- **File Storage**: Consider cloud storage for large document collections
- **Caching**: Implement Redis for conversation history and frequent queries
- **Monitoring**: Add logging and monitoring for production deployment
