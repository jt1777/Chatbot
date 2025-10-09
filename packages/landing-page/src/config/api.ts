// API configuration for the landing page
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/admin/login`,
  REGISTER: `${API_BASE_URL}/api/auth/admin/register`,
  VERIFY_EMAIL: `${API_BASE_URL}/api/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/api/auth/resend-verification`,
  
  // Document endpoints
  DOCUMENTS_STATS: `${API_BASE_URL}/api/documents/stats`,
  DOCUMENTS_UPLOAD: `${API_BASE_URL}/api/documents/upload`,
  DOCUMENTS_SCRAPE: `${API_BASE_URL}/api/documents/scrape`,
  DOCUMENTS_DELETE: `${API_BASE_URL}/api/documents/delete`,
  DOCUMENTS_CLEAR: `${API_BASE_URL}/api/documents/clear`,
  DOCUMENTS_SEARCH: `${API_BASE_URL}/api/documents/search`,
  
  // Organization endpoints
  ORGANIZATIONS: `${API_BASE_URL}/api/organizations`,
  ORGANIZATIONS_CREATE: `${API_BASE_URL}/api/organizations/create`,
  ORGANIZATIONS_JOIN: `${API_BASE_URL}/api/organizations/join`,
  ORGANIZATIONS_INVITE: `${API_BASE_URL}/api/organizations/invite`,
  
  // Chat endpoints
  CHAT: `${API_BASE_URL}/api/chat`,
  
  // Search endpoints
  SEARCH: `${API_BASE_URL}/api/search`,
}

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
})

export const getAuthHeadersWithFile = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  // Don't set Content-Type for file uploads, let the browser set it with boundary
})
