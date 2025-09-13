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
XAI_API_KEY=your_xai_api_key
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
PORT=3002
```

## Testing Configuration

The app will log the current API configuration in the console:
```
🔧 API Configuration: {
  baseUrl: "https://your-url.com",
  source: "environment"
}
```

This helps verify your configuration is working correctly.
