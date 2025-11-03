// API configuration for the landing page
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002'

export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/admin/login`,
  REGISTER: `${API_BASE_URL}/api/auth/admin/register`,
  AUTH_VERIFY: `${API_BASE_URL}/api/auth/verify`,
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
  ORGANIZATIONS_CREATE: `${API_BASE_URL}/api/org/create-new`,
  ORGANIZATIONS_JOIN: `${API_BASE_URL}/api/organizations/join`,
  ORGANIZATIONS_INVITE: `${API_BASE_URL}/api/org/invite`,
  ORGANIZATIONS_VISIBILITY: `${API_BASE_URL}/api/org/visibility`,
  ORGANIZATIONS_INFO: `${API_BASE_URL}/api/org/info`,
  ORGANIZATIONS_DESCRIPTION: `${API_BASE_URL}/api/org/description`,
  
  // Chat endpoints
  CHAT: `${API_BASE_URL}/api/chat`,
  
  // Search endpoints
  SEARCH: `${API_BASE_URL}/api/search`,

  // Multi-role endpoints
  MULTI_ROLE_ORGANIZATIONS: `${API_BASE_URL}/api/auth/multi-role/organizations`,
  MULTI_ROLE_SWITCH_ORG: `${API_BASE_URL}/api/auth/multi-role/switch-organization`,
  MULTI_ROLE_LOGIN: `${API_BASE_URL}/api/auth/multi-role/login`,
}

export const getAuthHeaders = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json',
})

export const getAuthHeadersWithFile = (token: string) => ({
  'Authorization': `Bearer ${token}`,
  // Don't set Content-Type for file uploads, let the browser set it with boundary
})
