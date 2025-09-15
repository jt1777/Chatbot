# AI Chatbot with RAG Implementation

A full-stack RAG (Retrieval-Augmented Generation) chatbot built with React Native, Node.js, and MongoDB Atlas. The system allows users to upload documents, scrape websites, and chat with an AI that answers questions based on the uploaded knowledge base.

## Features

- **RAG-Powered Chat**: AI answers questions based on uploaded documents
- **Document Management**: Upload PDFs, scrape websites, manage knowledge base
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
   RAG_SEARCH_LIMIT=5
   SIMILARITY_THRESHOLD=0.7
   CHUNK_SIZE=1000
   CHUNK_OVERLAP=200
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

### DELETE /api/documents/clear
Clear all documents from the knowledge base.

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

## Development Notes

- **VectorStoreService**: Centralized singleton for all vector operations
- **Document Processing**: Real-time uploads via backend, batch processing via datapipeline
- **Error Handling**: Comprehensive error handling throughout the stack
- **Type Safety**: Full TypeScript implementation across all components
- **Modular Architecture**: Clean separation of concerns with service-based design

## Troubleshooting

- **Backend won't start**: Check your xAI API key and MongoDB URI in `.env`
- **No documents found**: Ensure MongoDB Atlas has a vector search index named `vector_index`
- **Frontend won't compile**: Ensure all dependencies are installed and NativeWind is configured
- **Upload fails**: Check file size limits (10MB) and supported formats (PDF, TXT)
- **Search returns no results**: Try adjusting `SIMILARITY_THRESHOLD` in backend `.env`

## Production Considerations

- **MongoDB Atlas**: Ensure proper network access and vector search index configuration
- **API Rate Limits**: Monitor xAI API usage and implement rate limiting if needed
- **File Storage**: Consider cloud storage for large document collections
- **Caching**: Implement Redis for conversation history and frequent queries
- **Monitoring**: Add logging and monitoring for production deployment
