import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import multer from 'multer';
import { RAGService, DocumentService, SemanticDocumentService, VectorStoreService, ChatRequest, ChatResponse, AdminAuthRequest, AdminRegisterRequest, ClientAuthRequest, ClientTokenRequest, CreateInviteRequest, JoinOrganizationRequest, UpdateOrgDescriptionRequest } from '@chatbot/shared';

// Local type definition for organization switching
interface SwitchOrganizationRequest {
  orgId: string;
}
import { AuthService } from './services/authService';
import { authenticateToken, requireOrgAdmin, requireUser, authService } from './middleware/auth';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3002', 10);

// Initialize auth service after environment variables are loaded
authService.initialize().catch(console.error);

// Check for xAI API key
if (!process.env.XAI_API_KEY) {
  throw new Error('XAI_API_KEY environment variable is required');
}

// In-memory conversation history storage (for demo purposes)
const conversationHistory = new Map<string, string[]>();

// Initialize services
const ragService = new RAGService();
const documentService = new DocumentService();
const semanticDocumentService = new SemanticDocumentService();
const vectorStoreService = VectorStoreService.getInstance();
const authServiceInstance = new AuthService();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and text files are allowed'));
    }
  }
});

app.use(cors());
app.use(express.json());

// Initialize services (non-blocking, allows guest access even if database is temporarily unavailable)
documentService.initialize().catch(console.error);
authServiceInstance.initialize().catch(console.error);

// Reset VectorStoreService singleton to ensure fresh initialization on server start
VectorStoreService.resetInstance();
// VectorStoreService is now initialized by RAG service when needed

app.get('/', (req, res) => {
  res.send('Backend running');
});

// Admin authentication endpoints
app.post('/api/auth/admin/register', async (req, res) => {
  try {
    const registerData = req.body as AdminRegisterRequest;
    const result = await authServiceInstance.registerAdmin(registerData);
    res.json(result);
  } catch (error: any) {
    console.error('Admin registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const loginData = req.body as AdminAuthRequest;
    const result = await authServiceInstance.loginAdmin(loginData);
    res.json(result);
  } catch (error: any) {
    console.error('Admin login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Client authentication endpoints
app.post('/api/auth/client/token', async (req, res) => {
  try {
    const authData = req.body as ClientAuthRequest;
    const result = await authServiceInstance.authenticateClient(authData);
    res.json(result);
  } catch (error: any) {
    console.error('Client authentication error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Client login with email/password
app.post('/api/auth/client/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authServiceInstance.loginClient(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Client login error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Client registration endpoint
app.post('/api/auth/client/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authServiceInstance.registerClient(email, password);
    res.json(result);
  } catch (error: any) {
    console.error('Client registration error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Client invitation endpoint
app.post('/api/auth/client/invitation', async (req, res) => {
  try {
    const { email, password, inviteCode } = req.body;
    
    if (!email || !password || !inviteCode) {
      return res.status(400).json({ error: 'Email, password, and invite code are required' });
    }

    const result = await authServiceInstance.joinClientWithInvite(email, password, inviteCode);
    res.json(result);
  } catch (error: any) {
    console.error('Client invitation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Guest authentication endpoint - creates proper JWT tokens
app.post('/api/auth/guest', async (req, res) => {
  try {
    // console.log('🎭 Creating guest user with database record');
    
    // Use the proper createGuest method which creates a database record
    const result = await authServiceInstance.createGuest();
    
    res.json(result);
  } catch (error: any) {
    console.error('Guest authentication error:', error);
    
    // Fallback for development when database is unavailable
    if (error.message === 'Auth service not initialized') {
      // console.log('🎭 Database unavailable, creating temporary guest token');
      
      const guestId = 'guest_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      const jwtPayload = {
        userId: guestId,
        orgId: '',
        role: 'guest',
        currentRole: 'guest',
        email: 'guest@temporary.local',
        currentOrgId: '',
        accessibleOrgs: {}
      };
      
      const guestToken = authServiceInstance.generateGuestToken(jwtPayload);
      const guestUser = {
        id: guestId,
        email: 'guest@temporary.local',
        role: 'guest',
        currentRole: 'guest',
        isGuest: true,
        guestExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        orgId: '',
        orgName: '',
        currentOrgId: '',
        accessibleOrgs: {}
      };
      
      res.json({ token: guestToken, user: guestUser });
    } else {
      res.status(400).json({ error: error.message });
    }
  }
});

// User logout endpoint - cleans up guest records
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    
    // Clean up guest records on logout
    await authServiceInstance.cleanupGuestOnLogout(userId);
    
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup expired guests endpoint (admin only)
app.post('/api/admin/cleanup-guests', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    await authServiceInstance.cleanupExpiredGuests();
    res.json({ success: true, message: 'Expired guests cleaned up' });
  } catch (error: any) {
    console.error('Guest cleanup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Client join organization endpoint
app.post('/api/client/join-organization', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.body;
    const userId = (req as any).user.userId;
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const result = await authServiceInstance.joinClientToOrganization(userId, orgId);
    res.json(result);
  } catch (error: any) {
    console.error('Client join organization error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get organizations for client selection
app.get('/api/orgs', async (req, res) => {
  try {
    const orgs = await authServiceInstance.getOrganizations();
    res.json(orgs);
  } catch (error: any) {
    console.error('Get organizations error:', error);
    
    // Provide more helpful error messages
    if (error.message === 'Auth service not initialized') {
      res.status(503).json({ 
        error: 'Database connection unavailable. Please try again in a moment.',
        organizations: [] // Return empty array as fallback
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Token verification
app.post('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({ valid: true, user: (req as any).user });
});

// Get public organizations only
app.get('/api/orgs/public', async (req, res) => {
  try {
    const allOrgs = await authServiceInstance.getOrganizations();
    
    // console.log('🔍 All organizations:', allOrgs.map(org => ({ 
    //   name: org.name, 
    //   orgId: org.orgId, 
    //   isPublic: org.isPublic 
    // })));
    
    // Filter for public organizations only
    const publicOrgs = allOrgs.filter(org => org.isPublic === true);
    
    // console.log('🔍 Public organizations:', publicOrgs.map(org => ({ 
    //   name: org.name, 
    //   orgId: org.orgId, 
    //   isPublic: org.isPublic 
    // })));
    
    res.json(publicOrgs);
  } catch (error: any) {
    console.error('Get public organizations error:', error);
    
    if (error.message === 'Auth service not initialized') {
      res.status(503).json({ 
        error: 'Database connection unavailable. Please try again in a moment.',
        organizations: [] 
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Search organizations by name
app.get('/api/orgs/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    const allOrgs = await authServiceInstance.getOrganizations();
    
    let filteredOrgs = allOrgs;
    
    // Filter by search query if provided
    if (query && query.trim()) {
      const searchTerm = query.trim().toLowerCase();
      filteredOrgs = allOrgs.filter(org => 
        org.name.toLowerCase().includes(searchTerm)
      );
    }
    
    // Only return public organizations for search
    const publicFilteredOrgs = filteredOrgs.filter(org => org.isPublic === true);
    
    res.json(publicFilteredOrgs);
  } catch (error: any) {
    console.error('Search organizations error:', error);
    
    if (error.message === 'Auth service not initialized') {
      res.status(503).json({ 
        error: 'Database connection unavailable. Please try again in a moment.',
        organizations: [] 
      });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Multi-role authentication endpoints
app.post('/api/auth/multi-role/login', async (req, res) => {
  try {
    const { email, password, preferredOrgId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await authService.loginMultiRole(email, password, preferredOrgId);
    res.json(result);
  } catch (error: any) {
    console.error('Multi-role login error:', error);
    res.status(401).json({ error: error.message });
  }
});

// Switch organization (multi-role)
app.post('/api/auth/multi-role/switch-organization', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    const { orgId } = req.body;
    
    // console.log('🔄 Switch organization endpoint called:', {
    //   userId: user.userId,
    //   targetOrgId: orgId,
    //   currentOrgId: user.orgId,
    //   currentRole: user.role
    // });
    
    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const result = await authService.switchOrganizationMultiRole(user.userId, orgId);
    // console.log('🔄 Switch organization successful');
    res.json(result);
  } catch (error: any) {
    console.error('❌ Switch organization error:', error.message);
    console.error('❌ Full error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get user's accessible organizations (multi-role)
app.get('/api/auth/multi-role/organizations', authenticateToken, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user from database to get full organizationAccess
    const userData = await authService.getUserById(user.userId);
    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Migrate user if needed
    const migratedUser = await (authService as any).migrateUserToMultiRole(userData);
    
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};
    
    if (migratedUser.organizationAccess) {
      for (const [orgId, access] of Object.entries(migratedUser.organizationAccess)) {
        const org = await authService.getOrganization(orgId);
        if (org) {
          accessibleOrgs[orgId] = {
            role: (access as any).role,
            orgName: org.name,
            orgDescription: org.description,
            isPublic: org.isPublic
          };
        }
      }
    }

    res.json({
      currentOrgId: migratedUser.currentOrgId,
      currentRole: migratedUser.currentRole,
      accessibleOrgs: accessibleOrgs
    });
  } catch (error: any) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Organization management endpoints
// Create organization (for existing users to become admin)
app.post('/api/org/create-new', authenticateToken, requireUser, async (req, res) => {
  try {
    const { orgName } = req.body;
    const userId = (req as any).user.userId;
    
    if (!orgName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }
    
    const result = await authServiceInstance.createOrganizationForUser(userId, orgName);
    res.json(result);
  } catch (error: any) {
    console.error('Create organization error:', error);
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/org/create', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const user = (req as any).user;
    const { orgName } = req.body;
    
    if (!orgName) {
      return res.status(400).json({ error: 'Organization name is required' });
    }

    const organization = await authService.createOrganization(user.userId, orgName);
    res.json(organization);
  } catch (error: any) {
    console.error('Organization creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/org/invite', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const user = (req as any).user;
    const inviteData: CreateInviteRequest = req.body;
    
    if (!inviteData.email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const invite = await authService.createInvite(user.userId, inviteData);
    res.json(invite);
  } catch (error: any) {
    console.error('Invite creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/org/join', async (req, res) => {
  try {
    const joinData: JoinOrganizationRequest = req.body;
    
    if (!joinData.inviteCode || !joinData.email || !joinData.password) {
      return res.status(400).json({ error: 'Invite code, email, and password are required' });
    }

    const result = await authService.joinOrganization(joinData);
    res.json(result);
  } catch (error: any) {
    console.error('Join organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/org/info', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;
    // console.log('🔍 /api/org/info - using orgId:', orgId, 'from user:', { currentOrgId: user.currentOrgId, orgId: user.orgId });
    const organization = await authService.getOrganization(orgId);
    
    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error: any) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update organization description
app.put('/api/org/description', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const user = (req as any).user;
    const { orgDescription } = req.body as UpdateOrgDescriptionRequest;

    if (!orgDescription) {
      return res.status(400).json({ error: 'Organization description is required' });
    }

    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;
    // console.log('🔍 /api/org/description - using orgId:', orgId, 'for user:', user.email);
    
    await authService.updateOrganizationDescription(orgId, orgDescription);
    res.json({ success: true, message: 'Organization description updated successfully' });
  } catch (error: any) {
    console.error('Update organization description error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update organization visibility (public/private)
app.put('/api/org/visibility', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const user = (req as any).user;
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
      return res.status(400).json({ error: 'isPublic must be a boolean value' });
    }

    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;
    await authService.updateOrganizationVisibility(orgId, isPublic);
    res.json({ success: true, message: `Organization is now ${isPublic ? 'public' : 'private'}` });
  } catch (error: any) {
    console.error('Update organization visibility error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get admin counts for user's accessible organizations
app.get('/api/user/org-admin-counts', authenticateToken, requireUser, async (req, res) => {
  try {
    console.log('🔍 Admin counts endpoint called');
    const user = (req as any).user;
    const { orgIds } = req.query;
    
    console.log('🔍 Request details:', { 
      userId: user?.userId, 
      orgIds, 
      orgIdsType: typeof orgIds,
      isArray: Array.isArray(orgIds)
    });
    
    if (!orgIds) {
      console.log('❌ No orgIds parameter provided');
      return res.status(400).json({ error: 'orgIds query parameter is required' });
    }

// Handle both string and array formats
let orgIdsArray: string[];
if (Array.isArray(orgIds)) {
  orgIdsArray = orgIds as string[];
} else if (typeof orgIds === 'string') {
  orgIdsArray = [orgIds];
} else {
  console.log('❌ Invalid orgIds parameter type:', { orgIds, type: typeof orgIds });
  return res.status(400).json({ error: 'orgIds must be a string or array' });
}

    if (orgIdsArray.length === 0) {
      console.log('🔍 Empty orgIds array, returning empty admin counts');
      return res.json({});
    }

    console.log('🔍 Processing orgIds:', orgIdsArray);

    const adminCounts: { [orgId: string]: number } = {};

    for (const orgId of orgIdsArray) {
      try {
        console.log(`🔍 Counting admins for org: ${orgId}`);
        // Count admins directly from the database using the authService method
        const adminCount = await authService.countAdminsForOrganization(orgId as string);
        adminCounts[orgId as string] = adminCount;
        console.log(`✅ Admin count for ${orgId}: ${adminCount}`);
      } catch (error) {
        console.error(`❌ Error getting admin count for org ${orgId}:`, error);
        adminCounts[orgId as string] = 0;
      }
    }
    
    console.log('🔍 Final admin counts:', adminCounts);
    res.json(adminCounts);
  } catch (error: any) {
    console.error('❌ Get org admin counts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all organizations for the current user
app.get('/api/user/organizations', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const organizations = await authService.getUserOrganizations(user.userId);
    res.json(organizations);
  } catch (error: any) {
    console.error('Get user organizations error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Switch to a different organization
app.post('/api/user/switch-organization', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = (req as any).user;
    const { orgId } = req.body as SwitchOrganizationRequest;

    if (!orgId) {
      return res.status(400).json({ error: 'Organization ID is required' });
    }

    const result = await authService.switchOrganization(user.userId, orgId);
    res.json(result);
  } catch (error: any) {
    console.error('Switch organization error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat', authenticateToken, requireUser, async (req, res) => {
  const { message, userId = 'default', useRAG = true } = req.body as ChatRequest;
  const user = (req as any).user; // Get user from auth middleware

  try {
    // Get conversation history for context
    const history = conversationHistory.get(userId) || [];

    let systemContent = 'You are a helpful AI assistant. Keep your responses conversational and friendly.';
    let sources: string[] = [];
    const requestId = Date.now();

    // If RAG is enabled, search for relevant documents
    if (useRAG) {
      try {
        // console.log(`\n🚀 === NEW RAG REQUEST ${requestId} ===`);
        // console.log('🔍 RAG: Searching for documents related to:', message);
        // console.log('🔍 RAG: Organization:', user.orgId);
        // console.log('🔍 RAG: RAG_SEARCH_LIMIT env var:', process.env.RAG_SEARCH_LIMIT);
        const searchLimit = parseInt(process.env.RAG_SEARCH_LIMIT || '10', 10);
        // console.log('🔍 RAG: Parsed search limit:', searchLimit);
        
        // Initialize RAG service (now handles VectorStoreService internally)
        await ragService.initialize();
        
        // Use semantic search if enabled
        const useSemanticSearch = process.env.USE_SEMANTIC_SEARCH === 'true';
        // console.log('🧠 RAG: Using semantic search:', useSemanticSearch);
        
        // Use currentOrgId for multi-role system, fallback to orgId for legacy
        const orgId = user.currentOrgId || user.orgId;
        
        const relevantDocs = useSemanticSearch 
          ? await semanticDocumentService.semanticSearch(message, orgId, searchLimit)
          : await ragService.searchSimilarDocuments(message, orgId, searchLimit);
        // console.log('📄 RAG: Found', relevantDocs.length, 'relevant documents');
        // console.log('📄 RAG: Search limit was', searchLimit);
        
        if (relevantDocs.length > 0) {
          const context = relevantDocs
            .map(doc => `Source: ${doc.metadata.source}\nContent: ${doc.pageContent}`)
            .join('\n\n---\n\n');
          
          systemContent = `You are a helpful AI assistant that ONLY answers questions based on the provided context. You must follow these rules strictly:

1. ONLY use information from the context below to answer questions
2. If the context doesn't contain relevant information to answer the question, respond with: "I don't have information about that in my knowledge base. Please ask about topics covered in the uploaded documents."
3. Do NOT use your general knowledge or pre-training data
4. Always cite which document the information comes from
5. Be helpful but stay strictly within the provided context

Context from uploaded documents:
${context}

Answer the user's question using ONLY the information provided above.`;

          sources = relevantDocs.map(doc => doc.metadata.source);
          // console.log('✅ RAG: Using context from', sources.length, 'sources');
          // console.log('✅ RAG: Sources are:', sources);
          
          // Debug: Show similarity scores for each document
          // console.log('🔍 RAG: Document similarity scores:');
          // relevantDocs.forEach((doc, index) => {
          //   console.log(`  ${index + 1}. ${doc.metadata.source} - Score: ${doc.metadata.similarityScore?.toFixed(3) || 'N/A'}`);
          // });
        } else {
          // console.log('❌ RAG: No relevant documents found for query');
          // Return early with a clear message when no documents are found
          return res.json({
            message: "I don't have information about that in my knowledge base. Please ask about topics covered in the uploaded documents, or try rephrasing your question.",
            sources: []
          });
        }
      } catch (ragError) {
        console.error('❌ RAG search error:', ragError);
        // Return error message instead of continuing without RAG
        return res.json({
          message: "I'm having trouble accessing my knowledge base right now. Please try again later.",
          sources: []
        });
      }
    }

    // Create messages array for xAI API (OpenAI-compatible format)
    const messages = [
      {
        role: 'system',
        content: systemContent
      }
    ];

    // Add recent conversation history (limit to last 10 messages for context)
    const recentHistory = history.slice(-10);
    for (let i = 0; i < recentHistory.length - 1; i += 2) {
      if (recentHistory[i]) {
        const userMsg = recentHistory[i]!.replace('User: ', '');
        messages.push({ role: 'user', content: userMsg });
      }
      if (recentHistory[i + 1]) {
        const botMsg = recentHistory[i + 1]!.replace('Bot: ', '');
        messages.push({ role: 'assistant', content: botMsg });
      }
    }

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Call xAI API
    const response = await axios.post('https://api.x.ai/v1/chat/completions', {
      model: 'grok-3',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
      stream: false
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const botReply = response.data.choices[0].message.content;

    // Store conversation in history
    history.push(`User: ${message}`);
    history.push(`Bot: ${botReply}`);
    conversationHistory.set(userId, history);

    const chatResponse: ChatResponse = {
      reply: botReply,
      sources: sources.length > 0 ? sources : undefined
    };

    // console.log(`📤 REQUEST ${requestId} - Sending to frontend - Sources:`, chatResponse.sources);
    // console.log(`✅ === END RAG REQUEST ${requestId} ===\n`);
    res.json(chatResponse);
  } catch (error: any) {
    console.error('xAI API error:', error.response?.data || error.message);
    res.status(500).json({
      error: 'Failed to generate response',
      details: error.response?.data?.error || error.message
    });
  }
});

// Semantic document processing endpoint
app.post('/api/documents/upload-semantic', authenticateToken, requireOrgAdmin, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // console.log(`🧠 Processing file with semantic chunking: ${req.file.originalname}`);
    
    if (req.file.mimetype === 'text/plain') {
      const user = (req as any).user; // Get user from auth middleware
      const content = req.file.buffer.toString('utf-8');
      const docs = await semanticDocumentService.semanticChunking(content, req.file.originalname, user.orgId);
      await semanticDocumentService.vectorStoreService.addDocuments(docs, user.orgId);
      
      res.json({
        message: 'Semantic processing completed',
        filename: req.file.originalname,
        chunks: docs.length,
        type: 'semantic',
        success: true
      });
    } else {
      res.status(400).json({
        error: 'Only text files supported for semantic processing currently'
      });
    }

  } catch (error: any) {
    console.error('Semantic upload error:', error);
    res.status(500).json({
      error: 'Failed to process file semantically',
      details: error.message
    });
  }
});

// Document upload endpoint
app.post('/api/documents/upload', authenticateToken, requireOrgAdmin, upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const user = (req as any).user; // Get user from auth middleware
    const files = req.files as Express.Multer.File[];
    let allDocuments: any[] = [];
    let processedFiles: string[] = [];

    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;

    // Process each file
    for (const file of files) {
      const { originalname, mimetype, buffer } = file;
    let documents;

    if (mimetype === 'application/pdf') {
        documents = await documentService.processPDFBuffer(buffer, originalname, orgId);
    } else if (mimetype === 'text/plain') {
      const content = buffer.toString('utf-8');
        documents = await documentService.processTextFile(content, originalname, orgId);
    } else {
        console.warn(`Skipping unsupported file type: ${mimetype} for file: ${originalname}`);
        continue;
      }

      // Add organization context to documents
      const documentsWithOrgId = documents.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          orgId: orgId
        }
      }));

      allDocuments.push(...documentsWithOrgId);
      processedFiles.push(originalname);
    
    // Track the document
      await documentService.trackDocument(originalname, 'upload', documents.length, orgId);
    }

    if (allDocuments.length === 0) {
      return res.status(400).json({ error: 'No valid files to process' });
    }

    // Initialize RAG service for this organization and add all documents
    console.log(`🔍 Upload: About to add ${allDocuments.length} documents to vector store for org ${orgId}`);
    await ragService.initialize();
    await ragService.addDocuments(allDocuments, orgId);
    console.log(`✅ Upload: Successfully added documents to vector store`);

    res.json({
      message: 'Files uploaded and processed successfully',
      files: processedFiles,
      totalChunksCreated: allDocuments.length
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    res.status(500).json({
      error: 'Failed to process uploaded files',
      details: error.message
    });
  }
});

// Website scraping endpoint
app.post('/api/documents/scrape', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const { url } = req.body;
    const user = (req as any).user; // Get user from auth middleware
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;

    const documents = await documentService.scrapeWebsite(url, orgId);
    
    // Add organization context to documents
    const documentsWithOrgId = documents.map(doc => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        orgId: orgId
      }
    }));

    // Initialize RAG service for this organization and add documents
    await ragService.initialize();
    await ragService.addDocuments(documentsWithOrgId, orgId);
    
    // Track the document
    await documentService.trackDocument(url, 'web', documents.length, orgId);

    res.json({
      message: 'Website scraped and processed successfully',
      url,
      chunksCreated: documents.length
    });
  } catch (error: any) {
    console.error('Website scraping error:', error);
    res.status(500).json({
      error: 'Failed to scrape website',
      details: error.message
    });
  }
});

// RAG Configuration endpoints
app.get('/api/config/rag', authenticateToken, requireUser, (req, res) => {
  const config = {
    chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
    similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
    useSemanticSearch: process.env.USE_SEMANTIC_SEARCH === 'true',
    ragSearchLimit: parseInt(process.env.RAG_SEARCH_LIMIT || '10', 10)
  };
  
  // console.log('📋 RAG Config requested:', config);
  res.json(config);
});

app.post('/api/config/rag', authenticateToken, requireOrgAdmin, (req, res) => {
  try {
    const { chunkSize, chunkOverlap, similarityThreshold, useSemanticSearch, ragSearchLimit } = req.body;
    
    // Update environment variables in memory
    if (chunkSize !== undefined) process.env.CHUNK_SIZE = chunkSize.toString();
    if (chunkOverlap !== undefined) process.env.CHUNK_OVERLAP = chunkOverlap.toString();
    if (similarityThreshold !== undefined) process.env.SIMILARITY_THRESHOLD = similarityThreshold.toString();
    if (useSemanticSearch !== undefined) process.env.USE_SEMANTIC_SEARCH = useSemanticSearch.toString();
    if (ragSearchLimit !== undefined) process.env.RAG_SEARCH_LIMIT = ragSearchLimit.toString();
    
    const updatedConfig = {
      chunkSize: parseInt(process.env.CHUNK_SIZE || '1000', 10),
      chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200', 10),
      similarityThreshold: parseFloat(process.env.SIMILARITY_THRESHOLD || '0.7'),
      useSemanticSearch: process.env.USE_SEMANTIC_SEARCH === 'true',
      ragSearchLimit: parseInt(process.env.RAG_SEARCH_LIMIT || '10', 10)
    };
    
    // console.log('⚙️ RAG Config updated:', updatedConfig);
    
    res.json({
      message: 'RAG configuration updated successfully',
      config: updatedConfig
    });
    
  } catch (error: any) {
    console.error('❌ Error updating RAG config:', error);
    res.status(500).json({
      error: 'Failed to update RAG configuration',
      details: error.message
    });
  }
});

// Get document statistics
app.get('/api/documents/stats', authenticateToken, requireUser, async (req, res) => {
  try {
    const user = (req as any).user; // Get user from auth middleware
    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;
    const stats = await documentService.getDocumentStats(orgId);
    res.json(stats);
  } catch (error: any) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get document statistics',
      details: error.message
    });
  }
});

// Delete selected documents
app.delete('/api/documents/delete', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const { documentIds } = req.body;
    
    if (!documentIds || !Array.isArray(documentIds) || documentIds.length === 0) {
      return res.status(400).json({ error: 'Document IDs are required' });
    }

    // console.log(`🗑️ Delete request received:`, { documentIds, count: documentIds.length });
    // console.log(`🗑️ Document IDs types:`, documentIds.map(id => ({ id, type: typeof id })));
    
    // Initialize RAG service and delete documents by their source names
    await ragService.initialize();
    const deletedCount = await documentService.deleteDocumentsBySources(documentIds);
    
    // console.log(`✅ Deleted ${deletedCount} document chunks for sources: ${documentIds.join(', ')}`);
    
    res.json({
      message: `${documentIds.length} document(s) deleted successfully`,
      deletedCount: deletedCount,
      deletedIds: documentIds
    });

  } catch (error: any) {
    console.error('Delete selected documents error:', error);
    res.status(500).json({
      error: 'Failed to delete selected documents',
      details: error.message
    });
  }
});

// Clear all documents
app.delete('/api/documents/clear', authenticateToken, requireOrgAdmin, async (req, res) => {
  try {
    const user = (req as any).user; // Get user from auth middleware
    // Use currentOrgId for multi-role system, fallback to orgId for legacy
    const orgId = user.currentOrgId || user.orgId;
    await ragService.initialize(); // Initialize RAG service for this organization
    await ragService.clearAllDocuments(orgId);
    res.json({ message: 'All documents cleared successfully' });
  } catch (error: any) {
    console.error('Clear documents error:', error);
    res.status(500).json({
      error: 'Failed to clear documents',
      details: error.message
    });
  }
});

// Search documents endpoint (for testing)
app.post('/api/documents/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const results = await ragService.searchSimilarDocuments(query, limit);
    res.json({
      query,
      results: results.map(doc => ({
        content: doc.pageContent.substring(0, 200) + '...',
        source: doc.metadata.source,
        type: doc.metadata.type
      }))
    });
  } catch (error: any) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Failed to search documents',
      details: error.message
    });
  }
});

// console.log('About to start server...');
const server = app.listen(PORT, '0.0.0.0', () => {
  // console.log(`Server running on port ${PORT}`);
  // console.log(`Server accessible at http://0.0.0.0:${PORT}`);
  // console.log(`Local access: http://localhost:${PORT}`);
  // console.log(`Network access: http://192.168.1.86:${PORT}`);
  // console.log('Server started successfully, keeping alive...');
});

server.on('error', (error: any) => {
  console.error('Server error:', error);
});

server.on('close', () => {
  // console.log('Server closed');
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Handle multiple shutdown signals
const gracefulShutdown = async (signal: string) => {
  // console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  try {
    // Close HTTP server first
    server.close(async (err) => {
      if (err) {
        console.error('❌ Error closing HTTP server:', err);
      } else {
        // console.log('✅ HTTP server closed');
      }
      
      try {
        // Close RAG service connections (MongoDB, embeddings)
        // console.log('🔌 Closing RAG service...');
        await ragService.close();
        // console.log('✅ RAG service closed');
        
        // console.log('✅ All services closed successfully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during service shutdown:', error);
        process.exit(1);
      }
    });
    
    // Force exit after 5 seconds if graceful shutdown fails
    setTimeout(() => {
      console.error('❌ Forceful shutdown after timeout');
      process.exit(1);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // nodemon restart

// console.log('Script execution completed');
