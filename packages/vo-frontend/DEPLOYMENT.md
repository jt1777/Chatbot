# VO Frontend Deployment Guide

## Environment Configuration

### Development
- Uses `.env` file with local IP: `http://192.168.1.86:3002`
- Or ngrok tunnel: `https://a5c089d51d0a.ngrok-free.app`

### Production
- Uses `.env.production` file
- Update `EXPO_PUBLIC_API_BASE_URL` with your production API URL

## Deployment Options

### 1. Development Testing
```bash
# Start development server
npm start

# Start with dev client
npm run start:dev

# Start production mode locally
npm run start:prod
```

### 2. Web Deployment
```bash
# Build for web
npm run web:prod

# Deploy to hosting service (Vercel, Netlify, etc.)
# Upload the 'dist' folder contents
```

### 3. Mobile App Deployment

#### Install EAS CLI
```bash
npm install -g @expo/eas-cli
eas login
```

#### Build for App Stores
```bash
# Build for Android
npm run build:android

# Build for iOS
npm run build:ios

# Build for both platforms
npm run build:all
```

#### Submit to App Stores
```bash
# Submit to Google Play Store
npm run submit:android

# Submit to Apple App Store
npm run submit:ios
```

## Environment Variables

### Required for Production
- `EXPO_PUBLIC_API_BASE_URL`: Your production API URL
- `EXPO_PUBLIC_ENV`: Set to "production"

### Optional
- `EXPO_PUBLIC_APP_NAME`: App display name
- `EXPO_PUBLIC_APP_VERSION`: App version
- `EXPO_PUBLIC_ENABLE_DEBUG`: Enable/disable debug mode
- `EXPO_PUBLIC_ENABLE_ANALYTICS`: Enable/disable analytics

## Pre-deployment Checklist

1. ✅ Update `.env.production` with correct API URL
2. ✅ Test app with production environment
3. ✅ Update version numbers in `app.json`
4. ✅ Configure app icons and splash screens
5. ✅ Test on both iOS and Android devices
6. ✅ Verify all API endpoints work with production backend

## Troubleshooting

### Common Issues
1. **API Connection Issues**: Check `EXPO_PUBLIC_API_BASE_URL` in environment file
2. **Build Failures**: Ensure all dependencies are installed
3. **App Store Rejection**: Check bundle identifier and app name consistency

### Debug Commands
```bash
# Check environment variables
expo config --type public

# Clear cache
expo start --clear

# Check build logs
eas build:list
```
