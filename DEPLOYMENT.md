# 🚀 Deployment Guide

## Environment Configuration

The frontend automatically detects the environment and uses the appropriate API URL.

### Development Mode (Default)
- Uses `http://localhost:3002`
- No configuration needed
- Just run both backend and frontend locally

### Demo/Production Mode
Create a `.env` file in the `frontend/` directory:

```bash
# frontend/.env
EXPO_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

## Prerequisites

Before deployment, ensure you have:

1. **MongoDB Atlas Account** with Vector Search enabled
2. **xAI API Key** for Grok-3 model
3. **ngrok** for local tunneling (optional)

## Quick Demo Setup with ngrok

### 1. Start Backend
```bash
cd backend
npm run dev
```

### 2. Expose with ngrok
```bash
ngrok http 3002
```

### 3. Configure Frontend
Create `frontend/.env`:
```bash
EXPO_PUBLIC_API_BASE_URL=https://c2d69131f166.ngrok-free.app
```
*(Replace with your actual ngrok URL)*

### 4. Start Frontend
```bash
cd frontend
npx expo start --web
```

## Deployment Options

### Option 1: ngrok + Vercel (Quick Demo)
- ✅ Ready in 10 minutes
- ✅ Free
- ❌ Temporary URLs
- ❌ Requires your computer running

### Option 2: Railway + Vercel (Production)
- ✅ Permanent URLs
- ✅ Free tier available
- ✅ Automatic deployments
- ✅ Professional setup

### Option 3: Heroku (Simple)
- ✅ Easy setup
- ✅ Reliable
- ❌ Paid ($7-14/month)

## Environment Variables

### Frontend (.env)
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-backend-url.com
```

### Backend (.env)
```bash
# Required
XAI_API_KEY=your_xai_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Optional
PORT=3002
```

**Note**: RAG configuration is now managed through the API/UI configuration system, not environment variables.

### Data Pipeline (.env)
```bash
# Same as backend - copy from backend/.env
XAI_API_KEY=your_xai_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
```

## MongoDB Atlas Setup

### 1. Create Vector Search Index

In MongoDB Atlas, create a vector search index on your collection:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 384,
      "similarity": "cosine"
    }
  ]
}
```

### 2. Collection Structure

Ensure your collection has these fields:
- `text`: The document content
- `embedding`: Vector embeddings (384 dimensions)
- `source`: Document source (filename or URL)
- `type`: Document type (upload, web, pdf)
- `metadata`: Additional document metadata including source, type, and similarity scores

### 3. Document Tracker Collection

The system also uses a separate `document_tracker` collection for metadata:
- `source`: Document source (filename or URL)
- `type`: Document type (upload, web)
- `chunksCount`: Number of chunks created
- `uploadDate`: When the document was processed

## Feature Configuration

### Semantic Search Setup
To enable semantic search for better document understanding:

1. **Enable via Configuration**:
   - Use the RAG Configuration API or UI to set `useSemanticSearch: true`
   - Or access the RAG Configuration panel in the frontend

2. **Upload Documents with Semantic Processing**:
   Use the `/api/documents/upload-semantic` endpoint for enhanced chunking

3. **Configure via UI**:
   - Access the RAG Configuration panel in the frontend
   - Toggle "Use Semantic Search" option
   - Adjust chunk size and overlap for optimal performance

### RAG Configuration Management
The system provides real-time configuration updates:

1. **Via Frontend UI**:
   - Navigate to the Documents tab
   - Click "RAG Configuration" button
   - Adjust parameters using sliders and toggles
   - Save changes (takes effect immediately)

2. **Via API**:
   ```bash
   # Get current configuration
   curl http://localhost:3002/api/config/rag
   
   # Update configuration
   curl -X POST http://localhost:3002/api/config/rag \
     -H "Content-Type: application/json" \
     -d '{"useSemanticSearch": true, "chunkSize": 1500}'
   ```

## Testing Configuration

The app will log the current API configuration in the console:
```
🔧 API Configuration: {
  baseUrl: "https://your-url.com",
  source: "environment"
}
```

## Health Checks

### Backend Health
```bash
curl http://localhost:3002/
# Should return: "Backend running"
```

### Document Stats
```bash
curl http://localhost:3002/api/documents/stats
# Should return document count and list
```

### RAG Test
```bash
curl -X POST http://localhost:3002/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test query", "useRAG": true}'
```

### Document Management Test
```bash
# Test document deletion
curl -X DELETE http://localhost:3002/api/documents/delete \
  -H "Content-Type: application/json" \
  -d '{"documentIds": ["test-document.pdf"]}'

# Test semantic upload
curl -X POST http://localhost:3002/api/documents/upload-semantic \
  -F "file=@test-document.pdf"
```

### Configuration Test
```bash
# Test RAG configuration
curl http://localhost:3002/api/config/rag

# Test configuration update
curl -X POST http://localhost:3002/api/config/rag \
  -H "Content-Type: application/json" \
  -d '{"useSemanticSearch": true, "similarityThreshold": 0.8}'
```

This helps verify your configuration is working correctly.

## Production Deployment Considerations

### Performance Optimization

#### For Semantic Search
- **Memory Usage**: Semantic search uses larger chunks (2000 chars) which may increase memory usage
- **Processing Time**: Semantic chunking takes longer than standard chunking
- **Recommendation**: Start with `USE_SEMANTIC_SEARCH=false` and enable after testing

#### For Document Deletion
- **MongoDB Performance**: Individual deletions use `deleteMany()` queries which are efficient
- **Index Optimization**: Ensure `metadata.source` is indexed for fast deletion queries
- **Batch Operations**: Consider batching deletions for large document sets

### Environment-Specific Configuration

RAG configuration is now managed through the API/UI system rather than environment variables. You can set different configurations for different environments using the configuration endpoints:

#### Development Configuration
```bash
curl -X POST http://localhost:3002/api/config/rag \
  -H "Content-Type: application/json" \
  -d '{
    "ragSearchLimit": 5,
    "similarityThreshold": 0.6,
    "chunkSize": 800,
    "chunkOverlap": 150,
    "useSemanticSearch": false
  }'
```

#### Production Configuration
```bash
curl -X POST http://localhost:3002/api/config/rag \
  -H "Content-Type: application/json" \
  -d '{
    "ragSearchLimit": 10,
    "similarityThreshold": 0.7,
    "chunkSize": 1200,
    "chunkOverlap": 300,
    "useSemanticSearch": true
  }'
```

#### High-Volume Configuration
```bash
curl -X POST http://localhost:3002/api/config/rag \
  -H "Content-Type: application/json" \
  -d '{
    "ragSearchLimit": 15,
    "similarityThreshold": 0.75,
    "chunkSize": 1500,
    "chunkOverlap": 400,
    "useSemanticSearch": true
  }'
```

### Monitoring and Logging

#### Key Metrics to Monitor
- **Search Response Time**: Monitor RAG query performance
- **Document Processing Time**: Track upload and chunking performance
- **Memory Usage**: Watch for memory spikes during semantic processing
- **MongoDB Query Performance**: Monitor vector search and deletion operations

#### Logging Configuration
The system provides detailed logging for:
- Document upload and processing
- Search operations and results
- Configuration changes
- Error handling and debugging

### Security Considerations

#### API Endpoints
- **Document Deletion**: Ensure proper authorization for delete operations
- **Configuration Updates**: Restrict access to RAG configuration endpoints
- **File Uploads**: Validate file types and sizes (10MB limit)

#### MongoDB Security
- **Network Access**: Configure IP whitelist in MongoDB Atlas
- **Database Users**: Use least-privilege database users
- **Encryption**: Enable encryption in transit and at rest

### Scaling Considerations

#### Horizontal Scaling
- **Stateless Backend**: The backend is stateless and can be scaled horizontally
- **MongoDB Atlas**: Automatically handles database scaling
- **Load Balancing**: Use load balancer for multiple backend instances

#### Vertical Scaling
- **Memory**: Increase memory for semantic search workloads
- **CPU**: More CPU cores for parallel document processing
- **Storage**: Monitor MongoDB storage usage for large document collections
