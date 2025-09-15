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

# Optional (with defaults)
PORT=3002
RAG_SEARCH_LIMIT=5
SIMILARITY_THRESHOLD=0.7
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
```

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

This helps verify your configuration is working correctly.
