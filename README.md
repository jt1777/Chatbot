# Ask Akasha - AI Chatbot with RAG

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
- **Multi-Platform**: iOS app via TestFlight, web interface
- **Organization Management**: Multi-tenant organization support with role-based access

## Project Structure

```
Chatbot/
├── packages/
│   ├── vo-frontend/           # React Native iOS App
│   │   ├── App.tsx            # Main application component
│   │   ├── src/
│   │   │   ├── components/    # UI components
│   │   │   ├── contexts/      # React contexts
│   │   │   ├── hooks/         # Custom hooks
│   │   │   └── config/        # API configuration
│   │   ├── ios/               # iOS native code
│   │   └── package.json
│   │
│   ├── vo-backend/            # Node.js API Server
│   │   ├── src/
│   │   │   ├── server.ts      # Express server & API endpoints
│   │   │   ├── services/      # Core business logic
│   │   │   │   ├── vectorStoreService.ts  # MongoDB vector operations
│   │   │   │   ├── ragService.ts         # RAG search logic
│   │   │   │   ├── documentService.ts    # Document processing
│   │   │   │   ├── authService.ts        # Authentication & authorization
│   │   │   │   └── documentTracker.ts    # Document metadata tracking
│   │   │   └── types/         # TypeScript type definitions
│   │   └── package.json
│   │
│   ├── datapipeline/          # Batch Document Processing
│   │   ├── src/
│   │   │   ├── index.ts       # Main pipeline orchestrator
│   │   │   ├── loaders/       # Document loaders (PDF, web scraping)
│   │   │   ├── preprocess/    # Text splitting & preprocessing
│   │   │   ├── embeddings/    # Embedding generation
│   │   │   └── services/      # Shared services
│   │   ├── data/              # Raw & processed documents
│   │   └── package.json
│   │
│   └── shared/                # Shared utilities and types
│       ├── src/
│       │   ├── types/         # Shared TypeScript types
│       │   └── utils/         # Utility functions
│       └── package.json
│
├── Dockerfile                 # Railway deployment configuration
├── package.json              # Root package.json for workspace
└── README.md
```

## Quick Start

### Prerequisites

- Node.js 18+
- Xcode (for iOS development)
- MongoDB Atlas account
- xAI API key

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/Chatbot.git
   cd Chatbot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   **Backend** (`packages/vo-backend/.env`):
   ```bash
   XAI_API_KEY=your_xai_api_key_here
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   NODE_ENV=development
   JWT_SECRET=your_jwt_secret
   CORS_ORIGIN=http://localhost:8081
   ```

   **Frontend** (`packages/vo-frontend/.env`):
   ```bash
   EXPO_PUBLIC_API_BASE_URL=http://localhost:3002
   ```

4. **Start the backend**
   ```bash
   cd packages/vo-backend
   npm run dev
   ```

5. **Start the frontend**
   ```bash
   cd packages/vo-frontend
   npx expo start
   ```

6. **Open in iOS Simulator**
   - Press `i` in the Expo CLI
   - Or scan QR code with Expo Go app

## Production Deployment

### Backend (Railway)
- **Automatic deployment** on git push to `feature/VO-single-collection`
- **Environment variables** configured in Railway dashboard
- **MongoDB Atlas** for database and vector storage

### Frontend (TestFlight)
- **Local Xcode builds** for iOS app
- **TestFlight distribution** for beta testing
- **App Store submission** when ready

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Key Features

### RAG (Retrieval-Augmented Generation)
- Upload PDF documents and web content
- Automatic text chunking and embedding generation
- Semantic search across knowledge base
- AI responses with source citations

### Organization Management
- Multi-tenant architecture
- Role-based access control (Admin, Client, Guest)
- Organization-specific knowledge bases
- Invite code system for joining organizations

### Document Processing
- PDF text extraction
- Web scraping capabilities
- Intelligent text chunking
- Vector embedding generation
- Document metadata tracking

### Chat Interface
- Real-time chat with AI
- Source citation display
- Document-based responses
- Conversation history

## Technology Stack

- **Frontend**: React Native, Expo, TypeScript
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB Atlas with Vector Search
- **AI**: xAI Grok-3 model
- **Deployment**: Railway (backend), TestFlight (iOS)
- **Authentication**: JWT-based with role management

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For questions or issues, please open a GitHub issue or contact the development team.