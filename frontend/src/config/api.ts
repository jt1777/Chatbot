// API Configuration
// This will automatically use environment variables if available, with fallbacks

const getApiBaseUrl = (): string => {
  // Try to get from environment variable first (works in Expo)
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL;
  }
  
  // Fallback to localhost for development
  return 'http://localhost:3002';
};

export const API_BASE_URL = getApiBaseUrl();

// API endpoints
export const API_ENDPOINTS = {
  CHAT: `${API_BASE_URL}/api/chat`,
  DOCUMENTS_STATS: `${API_BASE_URL}/api/documents/stats`,
  DOCUMENTS_SCRAPE: `${API_BASE_URL}/api/documents/scrape`,
  DOCUMENTS_UPLOAD: `${API_BASE_URL}/api/documents/upload`,
  DOCUMENTS_CLEAR: `${API_BASE_URL}/api/documents/clear`,
  DOCUMENTS_SEARCH: `${API_BASE_URL}/api/documents/search`,
};

// Log the current configuration (helpful for debugging)
console.log('🔧 API Configuration:', {
  baseUrl: API_BASE_URL,
  source: process.env.EXPO_PUBLIC_API_BASE_URL ? 'environment' : 'fallback'
});
