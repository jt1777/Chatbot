# 🚀 Deployment Guide - Ask Akasha

This guide covers deploying the Ask Akasha chatbot with Railway (backend) and TestFlight (iOS frontend).

## Architecture Overview

- **Backend**: Railway (Node.js + Express)
- **Database**: MongoDB Atlas (with Vector Search)
- **Frontend**: React Native iOS app
- **Distribution**: TestFlight → App Store
- **AI**: xAI Grok-3 model

## Prerequisites

Before deployment, ensure you have:

1. **MongoDB Atlas Account** with Vector Search enabled
2. **xAI API Key** for Grok-3 model
3. **Apple Developer Account** for TestFlight/App Store
4. **Railway Account** (free tier available)
5. **GitHub Repository** (for automatic deployments)

## Backend Deployment (Railway)

### 1. Railway Setup

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy from GitHub**
   - Click "Deploy from GitHub"
   - Select your Chatbot repository
   - Choose `feature/VO-single-collection` branch

3. **Configure Service**
   - **Root Directory**: `.` (repository root)
   - **Build Command**: `npm install && npm -w packages/shared run build && npm -w packages/vo-backend run build`
   - **Start Command**: `node packages/vo-backend/dist/server.js`

### 2. Environment Variables

Set these in Railway dashboard:

```bash
# Required
XAI_API_KEY=your_xai_api_key_here
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
NODE_ENV=production
JWT_SECRET=your_secure_jwt_secret_here

# Optional
CORS_ORIGIN=https://your-frontend-domain.com
PORT=3002
```

### 3. MongoDB Atlas Setup

1. **Create Vector Search Index**
   
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

2. **Collection Structure**
   
   Ensure your collection has these fields:
   - `text`: Document content
   - `embedding`: Vector embeddings (384 dimensions)
   - `source`: Document source (filename or URL)
   - `type`: Document type (upload, web, pdf)
   - `metadata`: Additional document metadata
   - `orgId`: Organization ID for multi-tenancy

3. **Document Tracker Collection**
   
   Separate `document_tracker` collection for metadata:
   - `source`: Document source
   - `type`: Document type
   - `chunksCount`: Number of chunks created
   - `uploadDate`: Processing timestamp
   - `orgId`: Organization ID

### 4. Verify Backend Deployment

Test your Railway deployment:

```bash
# Health check
curl https://your-railway-domain.railway.app/

# API health
curl https://your-railway-domain.railway.app/api/health

# Test chat endpoint
curl -X POST https://your-railway-domain.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test query"}'
```

## Frontend Deployment (TestFlight)

### 1. Development Setup

1. **Configure Environment**
   
   Update `packages/vo-frontend/.env`:
   ```bash
   EXPO_PUBLIC_API_BASE_URL=https://your-railway-domain.railway.app
   ```

2. **Update App Configuration**
   
   Edit `packages/vo-frontend/app.json`:
   ```json
   {
     "expo": {
       "name": "Ask Akasha",
       "slug": "ask-akasha-vo",
       "version": "1.0.0",
       "ios": {
         "bundleIdentifier": "com.askakasha.askakasha",
         "buildNumber": "1"
       }
     }
   }
   ```

### 2. iOS Build Process

1. **Clean and Rebuild**
   ```bash
   cd packages/vo-frontend
   
   # Clean previous builds
   rm -rf ios
   npx expo prebuild --platform ios --clean
   
   # Open in Xcode
   open ios/AskAkasha.xcworkspace
   ```

2. **Xcode Configuration**
   - Select "AskAkasha" target
   - Choose "Any iOS Device" or simulator
   - Product → Build (⌘+B)

3. **Archive and Distribute**
   - Product → Archive
   - Distribute App → App Store Connect
   - Follow TestFlight submission process

### 3. Version Management

For each new release:

1. **Update Version Numbers**
   
   In `packages/vo-frontend/app.json`:
   ```json
   {
     "expo": {
       "version": "1.0.1",        // App version
       "ios": {
         "buildNumber": "2"       // Build number (increment each build)
       }
     }
   }
   ```

2. **Commit and Push**
   ```bash
   git add packages/vo-frontend/app.json
   git commit -m "Bump version to 1.0.1"
   git push origin feature/VO-single-collection
   ```

3. **Rebuild in Xcode**
   - Clean build folder (⌘+Shift+K)
   - Product → Archive
   - Distribute to App Store Connect

## Deployment Workflow

### For Backend Changes
1. **Make changes** to `packages/vo-backend/`
2. **Commit and push** to `feature/VO-single-collection`
3. **Railway auto-deploys** (no manual action needed)

### For Frontend Changes
1. **Make changes** to `packages/vo-frontend/`
2. **Update version** in `app.json` (if needed)
3. **Commit and push** to `feature/VO-single-collection`
4. **Rebuild in Xcode** → Archive → Submit to TestFlight

## Environment-Specific Configuration

### Development
- **Backend**: `http://localhost:3002`
- **Frontend**: `http://localhost:8081`
- **Database**: Local MongoDB or Atlas

### Production
- **Backend**: Railway domain
- **Frontend**: TestFlight/App Store
- **Database**: MongoDB Atlas

## Monitoring and Maintenance

### Railway Backend
- **Logs**: Available in Railway dashboard
- **Metrics**: CPU, memory, response times
- **Health Checks**: Built-in health endpoints

### TestFlight
- **Crash Reports**: Available in App Store Connect
- **Test Feedback**: From beta testers
- **Analytics**: App Store Connect analytics

### MongoDB Atlas
- **Performance**: Query performance monitoring
- **Storage**: Database size and growth
- **Indexes**: Vector search index performance

## Troubleshooting

### Backend Issues
- **Check Railway logs** for error messages
- **Verify environment variables** are set correctly
- **Test API endpoints** with curl or Postman
- **Check MongoDB connection** and indexes

### Frontend Issues
- **Check Xcode build logs** for compilation errors
- **Verify API URL** in environment variables
- **Test on simulator** before TestFlight
- **Check bundle identifier** matches App Store Connect

### Common Issues
- **CORS errors**: Check `CORS_ORIGIN` environment variable
- **MongoDB connection**: Verify connection string and network access
- **Build failures**: Clean Xcode build folder and rebuild
- **Version conflicts**: Ensure version numbers are incremented

## Security Considerations

### Backend Security
- **JWT secrets**: Use strong, unique secrets
- **CORS**: Restrict to known origins
- **Rate limiting**: Implement API rate limiting
- **Input validation**: Validate all API inputs

### Frontend Security
- **API keys**: Never commit API keys to repository
- **Environment variables**: Use `.env` files (gitignored)
- **Code signing**: Ensure proper iOS code signing

### Database Security
- **Network access**: Restrict MongoDB Atlas to Railway IPs
- **User permissions**: Use least-privilege database users
- **Encryption**: Enable encryption in transit and at rest

## Scaling Considerations

### Backend Scaling
- **Railway**: Automatic scaling based on usage
- **MongoDB Atlas**: Automatic scaling for database
- **Load balancing**: Multiple Railway instances if needed

### Frontend Scaling
- **TestFlight**: Handles distribution automatically
- **App Store**: Global distribution
- **Updates**: Over-the-air updates via Expo

## Support and Maintenance

### Regular Tasks
- **Monitor Railway usage** and costs
- **Update dependencies** regularly
- **Review TestFlight feedback**
- **Monitor MongoDB performance**

### Emergency Procedures
- **Backend down**: Check Railway status and logs
- **Database issues**: Check MongoDB Atlas status
- **App crashes**: Review crash reports in App Store Connect
- **Security issues**: Rotate secrets and review access

For additional support, check the project's GitHub issues or contact the development team.