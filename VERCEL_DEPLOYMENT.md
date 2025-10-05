# VO Backend Vercel Deployment Guide

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **Vercel CLI**: Install with `npm i -g vercel`
3. **Environment Variables**: Have your API keys ready

## Required Environment Variables

You'll need to set these in Vercel dashboard:

### Required
- `XAI_API_KEY`: Your xAI API key
- `MONGODB_URI`: Your MongoDB Atlas connection string

### Optional
- `JWT_SECRET`: Custom JWT secret (auto-generated if not provided)
- `CORS_ORIGIN`: Your frontend domain (for CORS)

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Deploy from Backend Directory
```bash
cd packages/vo-backend
vercel
```

### 4. Set Environment Variables
In Vercel dashboard:
1. Go to your project
2. Settings → Environment Variables
3. Add each variable:
   - `XAI_API_KEY`: `your_actual_xai_key`
   - `MONGODB_URI`: `your_mongodb_connection_string`

### 5. Redeploy with Environment Variables
```bash
vercel --prod
```

## After Deployment

1. **Get your Vercel URL**: `https://your-project.vercel.app`
2. **Update Frontend**: Update `.env.production` with Vercel URL
3. **Test API**: Visit `https://your-project.vercel.app/api/health` (if you add a health endpoint)

## Frontend Configuration

Update your frontend `.env.production`:
```bash
EXPO_PUBLIC_API_BASE_URL=https://your-project.vercel.app
```

## Troubleshooting

### Common Issues
1. **Build Failures**: Check TypeScript compilation
2. **Environment Variables**: Ensure all required vars are set
3. **CORS Issues**: Add your frontend domain to CORS_ORIGIN
4. **MongoDB Connection**: Verify connection string format

### Debug Commands
```bash
# Check deployment logs
vercel logs

# Check environment variables
vercel env ls

# Redeploy
vercel --prod
```

## Production Checklist

- [ ] All environment variables set
- [ ] MongoDB Atlas whitelist includes Vercel IPs
- [ ] Frontend updated with Vercel URL
- [ ] API endpoints tested
- [ ] CORS configured for production domain
