import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, Db, Collection, WriteConcern } from 'mongodb';
import { User, AdminAuthRequest, AdminRegisterRequest, ClientAuthRequest, ClientTokenRequest, AuthResponse, JWTPayload, Organization, CreateInviteRequest, InviteResponse, JoinOrganizationRequest, GuestAuthRequest, SwitchOrganizationResponse, OrganizationMembership } from '@chatbot/shared';
import EmailService from './emailService';
import crypto from 'crypto';

// Migration helper for converting old user format to new multi-role format

export class AuthService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private usersCollection: Collection<User> | null = null;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '24h';
  private emailService: EmailService;

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
    this.emailService = EmailService.getInstance();
  }

  async initialize(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      // MongoDB connection options with SSL/TLS configuration
      const options = {
        tls: true,
        tlsAllowInvalidCertificates: false,
        tlsAllowInvalidHostnames: false,
        retryWrites: true,
        writeConcern: new WriteConcern('majority'),
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        maxPoolSize: 10,
        minPoolSize: 2,
      };

      this.client = new MongoClient(mongoUri, options);
      await this.client.connect();
      this.db = this.client.db();
      this.usersCollection = this.db.collection<User>('users');
      
      // Create compound unique index on email + orgName to prevent duplicate email+org combinations
      await this.usersCollection.createIndex({ email: 1, orgName: 1 }, { unique: true });
      
      console.log('🔐 Auth Service initialized successfully');
    } catch (error) {
      console.error('❌ Auth Service initialization failed:', error);
      throw error;
    }
  }



  // Admin registration (creates new org + admin)
  async registerAdmin(registerData: AdminRegisterRequest): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const { email, password, orgId, orgName } = registerData;

    // Check if organization name already exists (case insensitive)
    if (orgName) {
      const existingOrg = await this.usersCollection.findOne({ 
        orgName: { $regex: new RegExp(`^${orgName.trim()}$`, 'i') },
        role: 'admin'
      });
      if (existingOrg) {
        throw new Error('Organization name has already been taken');
      }
    }

    // Check if email + organization combination already exists
    if (orgName) {
      const existingEmailOrg = await this.usersCollection.findOne({ 
        email,
        orgName: { $regex: new RegExp(`^${orgName.trim()}$`, 'i') },
        role: 'admin'
      });
      if (existingEmailOrg) {
        throw new Error('Email and organization has already been created');
      }
    }

    // Check if admin already exists
    const existingAdmin = await this.usersCollection.findOne({ email });
    
    if (existingAdmin) {
      // Admin exists, add new organization to their list
      const finalOrgId = orgId || this.generateOrgId();
      const inviteCode = this.generateInviteCode();
      
      // Add new organization to existing admin's organizations list
      const updatedOrganizations = (existingAdmin as any).organizations || [];
      updatedOrganizations.push({
        orgId: finalOrgId,
        orgName: orgName || `Organization ${finalOrgId}`,
        orgDescription: '',
        isPublic: true,
        role: 'admin',
        joinedAt: new Date()
      });

      // Update the admin with new organization
      await this.usersCollection.updateOne(
        { id: existingAdmin.id },
        {
          $set: {
            orgId: finalOrgId, // Switch to new organization
            orgName: orgName || `Organization ${finalOrgId}`,
            isPublic: true,
            organizations: updatedOrganizations,
            inviteCode: inviteCode,
            adminCount: (existingAdmin.adminCount || 1) + 1,
            updatedAt: new Date()
          }
        }
      );

      // Generate JWT token for the new organization
      const token = this.generateToken({
        userId: existingAdmin.id,
        orgId: finalOrgId,
        role: existingAdmin.role!,
        email: existingAdmin.email
      });

      return {
        token,
        user: {
          id: existingAdmin.id,
          orgId: finalOrgId,
          role: existingAdmin.role!,
          email: existingAdmin.email,
          orgName: orgName || `Organization ${finalOrgId}`,
          organizations: updatedOrganizations
        }
      };
    } else {
      // New admin, create new user
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate IDs
      const userId = this.generateUserId();
      const finalOrgId = orgId || this.generateOrgId();
      const inviteCode = this.generateInviteCode();

      // Generate email verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      // Create admin user with organization info
      const user: User = {
        id: userId,
        orgId: finalOrgId,
        role: 'admin',
        email,
        passwordHash,
        orgName: orgName || `Organization ${finalOrgId}`,
        isPublic: true,
        inviteCode,
        adminCount: 1,
        isEmailVerified: false,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      // Add organizations array
      (user as any).organizations = [{
        orgId: finalOrgId,
        orgName: orgName || `Organization ${finalOrgId}`,
        orgDescription: '',
        isPublic: true,
        role: 'admin',
        joinedAt: new Date()
      }];

      await this.usersCollection.insertOne(user);

      // Send verification email
      try {
        await this.emailService.sendVerificationEmail({
          email: user.email!,
          verificationToken: verificationToken,
          userName: user.email!.split('@')[0] // Use email prefix as name
        });
      } catch (error) {
        console.error('Failed to send verification email:', error);
        // Don't fail registration if email sending fails
      }

      // Return success response without token (user needs to verify email first)
      return {
        token: '', // No token until email is verified
        user: {
          id: user.id,
          orgId: user.orgId!,
          role: user.role!,
          email: user.email,
          orgName: user.orgName,
          organizations: (user as any).organizations,
          isEmailVerified: false
        } as any
      };
    }
  }

  // Admin login
  async loginAdmin(loginData: AdminAuthRequest): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const { email, password } = loginData;

    // Find admin user
    const user = await this.usersCollection.findOne({ email, role: 'admin' });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check if email is verified
    if (!(user as any).isEmailVerified) {
      throw new Error('Please verify your email address before logging in. Check your inbox for a verification email.');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      orgId: user.orgId!,
      role: user.role!,
      currentRole: user.role!,
      email: user.email
    });

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId!,
        role: user.role!,
        email: user.email,
        orgName: user.orgName
      }
    };
  }

  // Client authentication - generate token for existing or new client
  async authenticateClient(authData: ClientAuthRequest): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const { phone, orgId, clientId } = authData;

    if (!orgId) {
      throw new Error('Organization ID is required');
    }

    let user: User | null = null;

    // If clientId provided, find existing client
    if (clientId) {
      user = await this.usersCollection.findOne({ id: clientId, orgId, role: 'client' });
    }
    // If phone provided, find or create client
    else if (phone) {
      user = await this.usersCollection.findOne({ phone, orgId, role: 'client' });
      
      // If client doesn't exist, create new one
      if (!user) {
        const userId = this.generateUserId();
        user = {
          id: userId,
          orgId,
          role: 'client',
          email: `client_${userId}@temp.local`, // Unique email for each client
          phone,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        await this.usersCollection.insertOne(user);
      }
    } else {
      throw new Error('Either phone number or client ID is required');
    }

    if (!user) {
      throw new Error('Client authentication failed');
    }

    // Generate JWT token (shorter expiry for clients)
    const token = this.generateToken({
      userId: user.id,
      orgId: user.orgId!,
      role: user.role!,
      currentRole: user.role!,
      phone: user.phone
    }, '2h'); // 2 hour expiry for clients

    // Get organization name for the response
    const orgName = await this.getOrganizationName(user.orgId!);

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId!,
        role: user.role!,
        phone: user.phone,
        orgName: orgName || undefined
      }
    };
  }

  async verifyToken(token: string): Promise<JWTPayload> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as JWTPayload;
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    return await this.usersCollection.findOne({ id: userId });
  }

  // Get all organizations (for client selection)
  async getOrganizations(): Promise<{ orgId: string; name: string; adminCount: number; isPublic?: boolean }[]> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Debug: Check what admin users exist
    const roleQuery = 'admin';
    console.log('🔍 Role query for admin:', roleQuery);
    
    // Check all users with any role to see if there are missed admins
    const allUsers = await this.usersCollection.find({}).toArray();
    console.log('🔍 ALL users in database:', allUsers.map(user => ({
      email: user.email,
      role: user.role!,
      orgId: user.orgId!,
      orgName: user.orgName,
      isPublic: user.isPublic
    })));
    
    const adminUsers = await this.usersCollection.find({ 
      role: roleQuery 
    }).toArray();
    console.log('🔍 Admin users found:', adminUsers.map(user => ({
      email: user.email,
      role: user.role!,
      orgId: user.orgId!,
      orgName: user.orgName,
      isPublic: user.isPublic
    })));

    // Clean approach: get organizations from organizationAccess field only
    const multiRoleAdminUsers = await this.usersCollection.find({
      role: 'admin',
      organizationAccess: { $exists: true }
    }).toArray();

    console.log('🔍 Admin users with organizationAccess:', multiRoleAdminUsers.map(user => ({
      email: user.email,
      organizationAccess: user.organizationAccess
    })));

    // Extract organizations from organizationAccess where role is admin
    const orgsMap = new Map();
    for (const user of multiRoleAdminUsers) {
      if (user.organizationAccess) {
        for (const [orgId, access] of Object.entries(user.organizationAccess)) {
          if ((access as any).role === 'admin') {
            if (!orgsMap.has(orgId)) {
              // Get org details from the organization
              const orgDetails = await this.getOrganization(orgId);
              // Use the same admin counting method as the API endpoint
              const adminCount = await this.countAdminsForOrganization(orgId);
              orgsMap.set(orgId, {
                _id: orgId,
                name: orgDetails?.name || orgId,
                isPublic: (access as any).isPublic !== false, // Use isPublic from organizationAccess
                adminCount: adminCount
              });
            }
          }
        }
      }
    }

    const orgs = Array.from(orgsMap.values()).sort((a, b) => a.name.localeCompare(b.name));

    console.log('🔍 Organizations from organizationAccess:', orgs);

    return orgs.map(org => ({
      orgId: org._id,
      name: org.name || org._id, // Fallback to orgId if orgName is not set
      adminCount: org.adminCount,
      isPublic: org.isPublic !== false // Default to true if not set
    }));
  }

  private generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn?: string): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: expiresIn || this.JWT_EXPIRES_IN } as any);
  }

  // Generate JWT token for guests (public method for server use)
  generateGuestToken(payload: any): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: '24h' } as any);
  }

  // Generate token with multi-role organization access
  private generateMultiRoleToken(user: User, currentOrgId: string, expiresIn?: string): string {
    const accessibleOrgs: { [orgId: string]: 'admin' | 'client' | 'guest' } = {};
    
    // Build accessible organizations from user's organizationAccess
    if (user.organizationAccess) {
      for (const [orgId, access] of Object.entries(user.organizationAccess)) {
        accessibleOrgs[orgId] = access.role;
      }
    }

    const currentRole = user.organizationAccess?.[currentOrgId]?.role || 'guest';
    
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: user.id,
      orgId: currentOrgId, // Required for backward compatibility
      role: currentRole as any, // Using new standardized role names
      email: user.email,
      currentOrgId: currentOrgId,
      currentRole: currentRole,
      accessibleOrgs: accessibleOrgs
    };

    return jwt.sign(payload, this.JWT_SECRET, { expiresIn: expiresIn || this.JWT_EXPIRES_IN } as any);
  }


  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateOrgId(): string {
    return `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      this.usersCollection = null;
    }
  }

  // Organization management methods
  async createOrganization(adminId: string, orgName: string): Promise<Organization> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const admin = await this.usersCollection.findOne({ id: adminId, role: 'admin' });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const inviteCode = this.generateInviteCode();
    const organization: Organization = {
      id: admin.orgId!,
      name: orgName,
      createdAt: new Date(),
      adminCount: 1,
      inviteCode
    };

    // Update admin with organization name and invite code
    await this.usersCollection.updateOne(
      { id: adminId },
      { 
        $set: { 
          orgName,
          inviteCode,
          updatedAt: new Date()
        }
      }
    );

    return organization;
  }

  async createInvite(adminId: string, inviteData: CreateInviteRequest): Promise<InviteResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const admin = await this.usersCollection.findOne({ id: adminId, role: 'admin' });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const inviteCode = this.generateInviteCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Store invite in database (you might want to create a separate invites collection)
    // For now, we'll store it in the admin's document
    await this.usersCollection.updateOne(
      { id: adminId },
      { 
        $set: { 
          pendingInvites: {
            ...admin.pendingInvites,
            [inviteCode]: {
              email: inviteData.email,
              role: inviteData.role,
              expiresAt,
              createdAt: new Date()
            }
          },
          updatedAt: new Date()
        }
      }
    );

    return {
      inviteCode,
      expiresAt
    };
  }

  async joinOrganization(joinData: JoinOrganizationRequest): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find admin with matching invite code
    const admin = await this.usersCollection.findOne({ 
      'pendingInvites': { $exists: true },
      [`pendingInvites.${joinData.inviteCode}`]: { $exists: true }
    });

    if (!admin || !admin.pendingInvites || !admin.pendingInvites[joinData.inviteCode]) {
      throw new Error('Invalid or expired invite code');
    }

    const invite = admin.pendingInvites[joinData.inviteCode];
    if (!invite) {
      throw new Error('Invalid invite code');
    }

    if (invite.email !== joinData.email) {
      throw new Error('Email does not match invite');
    }

    if (invite.expiresAt < new Date()) {
      throw new Error('Invite code has expired');
    }

    // Check if user already exists
    const existingUser = await this.usersCollection.findOne({ email: joinData.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(joinData.password, saltRounds);

    // Create new user in the same organization based on invite role
    const userId = this.generateUserId();
    const user: User = {
      id: userId,
      orgId: admin.orgId!,
      role: invite.role as 'admin' | 'client',
      email: joinData.email,
      passwordHash,
      isPublic: (admin as any).isPublic || true,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    // Add organizations array
    (user as any).organizations = [{
      orgId: admin.orgId!,
      orgName: admin.orgName || `Organization ${admin.orgId!}`,
      isPublic: (admin as any).isPublic || true,
      role: 'admin',
      joinedAt: new Date()
    }];

    await this.usersCollection.insertOne(user);

    // Remove the used invite
    const updatedInvites = { ...admin.pendingInvites };
    delete updatedInvites[joinData.inviteCode];
    
    // Add the new user to the admin's organizations list
    const updatedOrganizations: OrganizationMembership[] = (admin as any).organizations || [];
    const existingOrgIndex = updatedOrganizations.findIndex((org: OrganizationMembership) => org.orgId === admin.orgId!);
    
    if (existingOrgIndex >= 0) {
      // Organization already exists in the list, just update the admin count
      // Keep existing data but ensure it's up to date
      // No changes needed for existing organization
    } else {
      // Add the organization to the list
      updatedOrganizations.push({
        orgId: admin.orgId!!,
        orgName: admin.orgName || `Organization ${admin.orgId!}`,
        role: 'admin' as const,
        joinedAt: admin.createdAt || new Date()
      });
    }

    // Only increment admin count for admin invites
    const updateData: any = {
      pendingInvites: updatedInvites,
      organizations: updatedOrganizations,
      updatedAt: new Date()
    };

    if (invite.role === 'admin') {
      updateData.adminCount = (admin.adminCount || 1) + 1;
    }

    await this.usersCollection.updateOne(
      { id: admin.id },
      { $set: updateData }
    );

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      orgId: user.orgId!,
      role: user.role!,
      currentRole: user.role!,
      email: user.email
    });

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId!,
        role: user.role!,
        email: user.email,
        orgName: admin.orgName || `Organization ${admin.orgId!}`,
        orgDescription: (admin as any).orgDescription || '',
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as any
    };
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    console.log('🔍 getOrganization called for orgId:', orgId);

    // First, try to find a user with this orgId in their organizationAccess as admin
    const adminWithOrgAccess = await this.usersCollection.findOne({ 
      [`organizationAccess.${orgId}.role`]: 'admin'
    });

    if (adminWithOrgAccess) {
      console.log('🔍 Found admin with organizationAccess:', {
        userId: adminWithOrgAccess.id,
        email: adminWithOrgAccess.email,
        orgAccess: adminWithOrgAccess.organizationAccess?.[orgId]
      });

      const orgAccess = adminWithOrgAccess.organizationAccess?.[orgId];
      console.log('🔍 orgAccess for orgId', orgId, ':', JSON.stringify(orgAccess, null, 2));
      const adminCount = await this.usersCollection.countDocuments({ 
        [`organizationAccess.${orgId}.role`]: 'admin'
      });

      return {
        id: orgId,
        name: orgAccess?.orgName || orgId,
        description: orgAccess?.orgDescription || '',
        isPublic: orgAccess?.isPublic !== false, // Default to true
        createdAt: orgAccess?.joinedAt || new Date(),
        adminCount,
        inviteCode: adminWithOrgAccess.inviteCode || ''
      };
    }

    // Fallback: try to find a user with this orgId as their current org (legacy)
    const admin = await this.usersCollection.findOne({ orgId, role: 'admin' });
    if (admin) {
      console.log('🔍 Found admin with legacy orgId:', {
        userId: admin.id,
        email: admin.email,
        orgName: admin.orgName
      });

      const adminCount = await this.usersCollection.countDocuments({ orgId, role: 'admin' });

      return {
        id: orgId,
        name: admin.orgName || orgId,
        description: admin.orgDescription || '',
        isPublic: (admin as any).isPublic || true,
        createdAt: admin.createdAt,
        adminCount,
        inviteCode: admin.inviteCode || ''
      };
    }

    // If no user found with this orgId, look for users who have this org in their organizations array (legacy)
    const userWithOrg = await this.usersCollection.findOne({ 
      'organizations.orgId': orgId,
      role: 'admin'
    });

    if (userWithOrg) {
      console.log('🔍 Found admin with organizations array:', {
        userId: userWithOrg.id,
        email: userWithOrg.email
      });

      const orgMembership = (userWithOrg as any).organizations?.find((org: any) => org.orgId === orgId);
      if (orgMembership) {
        // Count how many users have this organization in their organizations array
        const adminCount = await this.usersCollection.countDocuments({ 
          'organizations.orgId': orgId,
          role: 'admin'
        });

        return {
          id: orgId,
          name: orgMembership.orgName || orgId,
          description: orgMembership.orgDescription || 'No description available',
          isPublic: (orgMembership as any).isPublic || true,
          createdAt: orgMembership.joinedAt || new Date(),
          adminCount,
          inviteCode: ''
        };
      }
    }

    console.log('🔍 No organization found for orgId:', orgId);
    return null;
  }

  async getOrganizationName(orgId: string): Promise<string | null> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const admin = await this.usersCollection.findOne({ 
      orgId, 
      role: 'admin' 
    });

    return admin?.orgName || null;
  }

  async updateOrganizationDescription(orgId: string, orgDescription: string): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    console.log('🔍 updateOrganizationDescription called for orgId:', orgId, 'description:', orgDescription);

    // Update organizationAccess field (multi-role format)
    const result1 = await this.usersCollection.updateMany(
      { [`organizationAccess.${orgId}.role`]: 'admin' },
      { 
        $set: { 
          [`organizationAccess.${orgId}.orgDescription`]: orgDescription,
          updatedAt: new Date()
        }
      }
    );

    // Update legacy orgId matches
    const result2 = await this.usersCollection.updateMany(
      { orgId, role: 'admin' },
      { 
        $set: { 
          orgDescription,
          updatedAt: new Date()
        }
      }
    );

    // Update organizations array matches (legacy)
    const result3 = await this.usersCollection.updateMany(
      { 
        'organizations.orgId': orgId,
        role: 'admin'
      },
      { 
        $set: { 
          'organizations.$.orgDescription': orgDescription,
          updatedAt: new Date()
        }
      }
    );

    console.log('🔍 Update results:', { result1: result1.matchedCount, result2: result2.matchedCount, result3: result3.matchedCount });

    if (result1.matchedCount === 0 && result2.matchedCount === 0 && result3.matchedCount === 0) {
      throw new Error('Organization not found');
    }
  }

  // Get all organizations for a user
  async getUserOrganizations(userId: string): Promise<OrganizationMembership[]> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    return (user as any).organizations || [];
  }

  // Switch to a different organization
  async switchOrganization(userId: string, orgId: string): Promise<SwitchOrganizationResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user belongs to this organization
    const membership = (user as any).organizations?.find((org: OrganizationMembership) => org.orgId === orgId);
    if (!membership) {
      throw new Error('User does not belong to this organization');
    }

    // Get organization details
    const organization = await this.getOrganization(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    // Update user's current organization
    await this.usersCollection.updateOne(
      { id: userId },
      { 
        $set: { 
          orgId: orgId,
          orgName: organization.name,
          orgDescription: organization.description,
          updatedAt: new Date()
        }
      }
    );

    // Generate new token with updated organization info
    const updatedUser = {
      ...user,
      orgId: orgId,
      orgName: organization.name,
      orgDescription: organization.description,
      organizations: (user as any).organizations
    };

    const token = jwt.sign(
      { 
        userId: updatedUser.id, 
        orgId: updatedUser.orgId!, 
        role: updatedUser.role! 
      } as JWTPayload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: updatedUser.id,
        orgId: updatedUser.orgId!,
        role: updatedUser.role!,
        email: updatedUser.email,
        phone: updatedUser.phone,
        orgName: updatedUser.orgName,
        orgDescription: updatedUser.orgDescription,
        organizations: (updatedUser as any).organizations
      }
    };
  }

  // Update organization visibility (public/private)
  async updateOrganizationVisibility(orgId: string, isPublic: boolean): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Update direct orgId matches (legacy format)
    const result1 = await this.usersCollection.updateMany(
      { orgId, role: 'admin' },
      { 
        $set: { 
          isPublic,
          updatedAt: new Date()
        }
      }
    );

    // Update organizations array matches (legacy format)
    const result2 = await this.usersCollection.updateMany(
      { 
        'organizations.orgId': orgId,
        role: 'admin'
      },
      { 
        $set: { 
          'organizations.$.isPublic': isPublic,
          updatedAt: new Date()
        }
      }
    );

    // Update organizationAccess field (multi-role format)
    const result3 = await this.usersCollection.updateMany(
      { 
        [`organizationAccess.${orgId}.role`]: 'admin'
      },
      { 
        $set: { 
          [`organizationAccess.${orgId}.isPublic`]: isPublic,
          updatedAt: new Date()
        }
      }
    );

    if (result1.matchedCount === 0 && result2.matchedCount === 0 && result3.matchedCount === 0) {
      throw new Error('Organization not found');
    }
  }

  // Register a new client with email and password
  async registerClient(email: string, password: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Check if email already exists (any role)
    const existingUser = await this.usersCollection.findOne({ 
      email: email.trim()
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create new client user with multi-role format
    const userId = this.generateUserId();
    const user: User = {
      id: userId,
      orgId: '', // No organization initially
      role: 'client',
      email: email.trim(),
      passwordHash: passwordHash,
      organizationAccess: {}, // Empty - user can join organizations later
      currentOrgId: '',
      currentRole: 'client',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    try {
      await this.usersCollection.insertOne(user);
    } catch (error: any) {
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        throw new Error('Email already exists');
      }
      throw error;
    }

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail({
        email: user.email!,
        verificationToken: verificationToken,
        userName: user.email!.split('@')[0] // Use email prefix as name
      });
    } catch (error) {
      console.error('Failed to send verification email:', error);
      // Don't fail registration if email sending fails
    }

    // Return success response without token (user needs to verify email first)
    return {
      token: '', // No token until email is verified
      user: {
        id: user.id,
        orgId: user.orgId!,
        currentOrgId: user.currentOrgId,
        role: user.role!,
        currentRole: user.currentRole,
        email: user.email,
        orgName: 'No Organization',
        orgDescription: 'You can join an organization after logging in',
        organizationAccess: user.organizationAccess,
        accessibleOrgs: {}, // Empty initially
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as any
    };
  }

  // Verify email address with token
  async verifyEmail(token: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find user by verification token
    const user = await this.usersCollection.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() } // Token not expired
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Update user to mark email as verified
    const updateResult = await this.usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          isEmailVerified: true,
          emailVerificationToken: undefined,
          emailVerificationExpires: undefined,
          updatedAt: new Date()
        }
      }
    );

    if (updateResult.modifiedCount === 0) {
      throw new Error('Failed to verify email');
    }

    // Send welcome email
    try {
      await this.emailService.sendWelcomeEmail(user.email!, user.email!.split('@')[0]);
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail verification if welcome email fails
    }

    // Generate JWT token for verified user
    const jwtToken = this.generateMultiRoleToken(user, '');

    return {
      token: jwtToken,
      user: {
        id: user.id,
        orgId: user.orgId!,
        currentOrgId: user.currentOrgId,
        role: user.role!,
        currentRole: user.currentRole,
        email: user.email,
        orgName: 'No Organization',
        orgDescription: 'You can join an organization after logging in',
        organizationAccess: user.organizationAccess,
        accessibleOrgs: {},
        createdAt: user.createdAt,
        updatedAt: new Date()
      } as any
    };
  }

  // Resend verification email
  async resendVerificationEmail(email: string): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find user by email
    const user = await this.usersCollection.findOne({ email: email.trim() });

    if (!user) {
      throw new Error('User not found');
    }

    if ((user as any).isEmailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new token
    await this.usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires,
          updatedAt: new Date()
        }
      }
    );

    // Send verification email
    await this.emailService.sendVerificationEmail({
      email: user.email!,
      verificationToken: verificationToken,
      userName: user.email!.split('@')[0]
    });
  }

  // Create organization for existing user (makes them admin)
  async createOrganizationForUser(userId: string, orgName: string): Promise<AuthResponse> {
    console.log('🏢 createOrganizationForUser called:', { userId, orgName });
    
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find the user
    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }
    
    console.log('🏢 User found:', { 
      id: user.id, 
      email: user.email, 
      currentRole: user.role!,
      orgId: user.orgId! 
    });

    // Check if organization name already exists
    const existingOrg = await this.usersCollection.findOne({ 
      orgName: { $regex: new RegExp(`^${orgName}$`, 'i') },
      role: 'admin'
    });
    if (existingOrg) {
      throw new Error('Organization name has already been taken');
    }

    // Generate organization ID and invite code
    const orgId = this.generateOrgId();
    const inviteCode = this.generateInviteCode();

    // User should already have multi-role format in clean database
    const migratedUser = user as User;

    // Add admin access to this new organization
    if (!migratedUser.organizationAccess) {
      migratedUser.organizationAccess = {};
    }
    migratedUser.organizationAccess[orgId] = {
      role: 'admin',
      orgName: orgName,
      orgDescription: '',
      isPublic: true,
      joinedAt: new Date()
    };

    // Update user to be admin of this organization
    const updateResult = await this.usersCollection.updateOne(
      { id: userId },
      { 
        $set: { 
          organizationAccess: migratedUser.organizationAccess,
          currentOrgId: orgId,
          currentRole: 'admin',
          role: 'admin',
          orgId: orgId,
          orgName: orgName,
          isPublic: true, // Default to public
          inviteCode: inviteCode,
          updatedAt: new Date()
        } 
      }
    );
    
    console.log('🏢 Database update result:', { 
      matchedCount: updateResult.matchedCount, 
      modifiedCount: updateResult.modifiedCount 
    });
    
    // Verify the update worked
    const updatedUser = await this.usersCollection.findOne({ id: userId });
    console.log('🏢 User after update:', { 
      id: updatedUser?.id, 
      email: updatedUser?.email, 
      role: updatedUser?.role,
      currentRole: updatedUser?.currentRole,
      orgId: updatedUser?.orgId,
      orgName: updatedUser?.orgName
    });

    // Generate new token with admin access
    const token = this.generateMultiRoleToken(migratedUser, orgId);

    // Build accessibleOrgs from organizationAccess
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};
    if (migratedUser.organizationAccess) {
      for (const [orgIdKey, access] of Object.entries(migratedUser.organizationAccess)) {
        accessibleOrgs[orgIdKey] = {
          role: access.role,
          orgName: access.orgName || `Organization ${orgIdKey}`,
          orgDescription: access.orgDescription,
          isPublic: access.isPublic
        };
      }
    }

    return {
      token,
      user: {
        id: migratedUser.id,
        orgId: orgId,
        currentOrgId: orgId,
        role: 'admin',
        currentRole: 'admin',
        email: migratedUser.email,
        orgName: orgName,
        orgDescription: '',
        organizationAccess: migratedUser.organizationAccess,
        accessibleOrgs: accessibleOrgs,
        createdAt: migratedUser.createdAt,
        updatedAt: new Date()
      } as any
    };
  }

  // Login client with email and password
  async loginClient(email: string, password: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find client by email
    const client = await this.usersCollection.findOne({ 
      email: email.trim(),
      role: 'client'
    });

    if (!client) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, (client as any).passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: client.id,
      orgId: client.orgId!,
      role: client.role!
    } as JWTPayload);

    return {
      token,
      user: {
        id: client.id,
        orgId: client.orgId!,
        role: client.role!,
        email: client.email,
        orgName: client.orgId! ? 'Organization' : 'No Organization',
        orgDescription: client.orgId! ? 'Organization member' : 'You can join an organization after logging in',
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      } as any
    };
  }

  // Multi-role login: Authenticate user and return all accessible organizations
  async loginMultiRole(email: string, password: string, preferredOrgId?: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find user by email (any role)
    const user = await this.usersCollection.findOne({ 
      email: email.trim()
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, (user as any).passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // User should already have multi-role format in clean database
    const migratedUser = user as User;

    // Determine which organization to start with
    let currentOrgId = preferredOrgId;
    if (!currentOrgId) {
      // Use user's current org or first available org
      currentOrgId = migratedUser.currentOrgId || Object.keys(migratedUser.organizationAccess || {})[0];
    }

    // Allow users with no organizations to log in (they can create/join orgs later)
    if (!currentOrgId) {
      currentOrgId = ''; // Empty org - user will see organization selection screen
    }

    // Verify user has access to the requested organization (skip if no org)
    if (currentOrgId && !migratedUser.organizationAccess?.[currentOrgId]) {
      throw new Error('Access denied to requested organization');
    }

    // Get organization details (skip if no org)
    const organization = currentOrgId ? await this.getOrganization(currentOrgId) : null;
    const currentRole = currentOrgId && migratedUser.organizationAccess?.[currentOrgId] 
      ? migratedUser.organizationAccess[currentOrgId]!.role 
      : 'client'; // Default role for users with no organizations

    // Build accessible organizations info
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};
    
    if (migratedUser.organizationAccess) {
      for (const [orgId, access] of Object.entries(migratedUser.organizationAccess)) {
        const org = await this.getOrganization(orgId);
        if (org) {
          accessibleOrgs[orgId] = {
            role: access.role,
            orgName: org.name,
            orgDescription: org.description,
            isPublic: org.isPublic
          };
        }
      }
    }

    // Generate multi-role token
    const token = this.generateMultiRoleToken(migratedUser, currentOrgId);

    const result = {
      token,
      user: {
        id: migratedUser.id,
        orgId: currentOrgId,
        role: currentRole as any, // Using new standardized role names
        email: migratedUser.email,
        orgName: organization?.name || (currentOrgId ? 'Unknown Organization' : 'No Organization'),
        currentOrgId: currentOrgId,
        currentRole: currentRole,
        accessibleOrgs: accessibleOrgs
      }
    };

    console.log('🔄 Login result for user:', {
      userId: migratedUser.id,
      email: migratedUser.email,
      currentOrgId,
      currentRole,
      accessibleOrgsCount: Object.keys(accessibleOrgs).length,
      accessibleOrgs: accessibleOrgs
    });

    return result;
  }

  // Switch to a different organization (multi-role)
  async switchOrganizationMultiRole(userId: string, newOrgId: string): Promise<SwitchOrganizationResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Find user
    const user = await this.usersCollection.findOne({ id: userId });
    if (!user) {
      throw new Error('User not found');
    }

    console.log('🔄 switchOrganizationMultiRole - user before migration:', {
      id: user.id,
      email: user.email,
      role: user.role!,
      orgId: user.orgId!,
      hasOrganizationAccess: !!user.organizationAccess,
      organizationAccessKeys: user.organizationAccess ? Object.keys(user.organizationAccess) : []
    });

    // User should already have multi-role format in clean database
    const migratedUser = user as User;
    
    console.log('🔄 switchOrganizationMultiRole - user after migration:', {
      id: migratedUser.id,
      hasOrganizationAccess: !!migratedUser.organizationAccess,
      organizationAccessKeys: migratedUser.organizationAccess ? Object.keys(migratedUser.organizationAccess) : [],
      organizationAccess: migratedUser.organizationAccess
    });

    // Verify user has access to the new organization
    if (!migratedUser.organizationAccess?.[newOrgId]) {
      throw new Error('Access denied to requested organization');
    }

    // Get organization details
    const organization = await this.getOrganization(newOrgId);
    const newRole = migratedUser.organizationAccess![newOrgId].role;

    // Build accessible organizations info
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};
    
    if (migratedUser.organizationAccess) {
      for (const [orgId, access] of Object.entries(migratedUser.organizationAccess)) {
        const org = await this.getOrganization(orgId);
        if (org) {
          accessibleOrgs[orgId] = {
            role: access.role,
            orgName: org.name,
            orgDescription: org.description,
            isPublic: org.isPublic
          };
        }
      }
    }

    // Update user's current organization
    await this.usersCollection.updateOne(
      { id: userId },
      { 
        $set: { 
          currentOrgId: newOrgId,
          currentRole: newRole,
          updatedAt: new Date()
        } 
      }
    );

    // Generate new token with updated organization
    const token = this.generateMultiRoleToken(migratedUser, newOrgId);

    const result = {
      token,
      user: {
        id: migratedUser.id,
        orgId: newOrgId,
        role: newRole as any, // Using new standardized role names
        email: migratedUser.email,
        orgName: organization?.name || 'Unknown Organization',
        orgDescription: organization?.description,
        currentOrgId: newOrgId,
        currentRole: newRole,
        accessibleOrgs: accessibleOrgs
      }
    };

    return result;
  }

  // Join a client with an invite code using email and password
  async joinClientWithInvite(email: string, password: string, inviteCode: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Check if email already exists
    const existingUser = await this.usersCollection.findOne({
      email: email.trim()
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Find admin with matching invite code
    const admin = await this.usersCollection.findOne({ 
      'pendingInvites': { $exists: true },
      [`pendingInvites.${inviteCode}`]: { $exists: true }
    });

    if (!admin || !admin.pendingInvites || !admin.pendingInvites[inviteCode]) {
      throw new Error('Invalid or expired invite code');
    }

    const invite = admin.pendingInvites[inviteCode];
    if (invite.expiresAt < new Date()) {
      throw new Error('Invite code has expired');
    }

    // Get organization info from admin
    let orgId: string;
    let orgName: string;
    let orgDescription: string;
    let isPublic: boolean;

    if (admin.organizationAccess && Object.keys(admin.organizationAccess).length > 0) {
      // Multi-role admin - get org from organizationAccess
      const adminOrgs = Object.keys(admin.organizationAccess);
      orgId = adminOrgs[0] || ''; // Use first organization
      const orgAccess = admin.organizationAccess[orgId];
      if (orgAccess) {
        orgName = orgAccess.orgName || `Organization ${orgId}`;
        orgDescription = orgAccess.orgDescription || '';
        isPublic = orgAccess.isPublic !== false;
      } else {
        // Fallback if orgAccess is undefined
        orgName = `Organization ${orgId}`;
        orgDescription = '';
        isPublic = true;
      }
    } else {
      // Legacy admin - use old format
      orgId = admin.orgId!;
      orgName = admin.orgName || `Organization ${admin.orgId!}`;
      orgDescription = (admin as any).orgDescription || '';
      isPublic = (admin as any).isPublic !== false;
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create new client user with multi-role format
    const userId = this.generateUserId();
    const user: User = {
      id: userId,
      orgId: orgId, // Legacy field for compatibility
      role: 'client', // Legacy field for compatibility
      email: email.trim(),
      passwordHash: passwordHash,
      organizationAccess: {
        [orgId]: {
          role: 'client',
          orgName: orgName,
          orgDescription: orgDescription,
          isPublic: isPublic,
          joinedAt: new Date()
        }
      },
      currentOrgId: orgId,
      currentRole: 'client',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.usersCollection.insertOne(user);

    // Remove the used invite
    const updatedInvites = { ...admin.pendingInvites };
    delete updatedInvites[inviteCode];

    await this.usersCollection.updateOne(
      { id: admin.id },
      { $set: { pendingInvites: updatedInvites } }
    );

    // Generate multi-role JWT token
    const token = this.generateMultiRoleToken(user, orgId);

    // Build accessible organizations info
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};

    if (user.organizationAccess) {
      for (const [orgIdKey, access] of Object.entries(user.organizationAccess)) {
        accessibleOrgs[orgIdKey] = {
          role: access.role,
          orgName: access.orgName || `Organization ${orgIdKey}`,
          orgDescription: access.orgDescription,
          isPublic: access.isPublic
        };
      }
    }

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId!,
        currentOrgId: user.currentOrgId,
        role: user.role!,
        currentRole: user.currentRole,
        email: user.email,
        orgName: orgName,
        accessibleOrgs: accessibleOrgs
      }
    };
  }

  // Create a guest user with limited access
  async createGuest(orgId?: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // If orgId provided, verify organization exists and is public
    let organization: Organization | null = null;
    if (orgId) {
      organization = await this.getOrganization(orgId);
      if (!organization) {
        throw new Error('Organization not found');
      }
      if (!organization.isPublic) {
        throw new Error('Organization is private and requires invitation');
      }
    }

    // Create guest user with multi-role format
    const userId = this.generateUserId();
    const guestExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user: User = {
      id: userId,
      orgId: orgId || '',
      currentOrgId: orgId || '',
      role: 'guest',
      currentRole: 'guest',
      email: `guest_${userId}@temp.local`, // Generate unique email for guests
      organizationAccess: orgId ? { [orgId]: { role: 'guest', joinedAt: new Date() } } : {},
      isGuest: true,
      guestExpiresAt,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    await this.usersCollection.insertOne(user);

    // Generate multi-role JWT token
    const token = this.generateMultiRoleToken(user, orgId || '');

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId!,
        currentOrgId: user.currentOrgId,
        role: user.role!,
        currentRole: user.currentRole,
        email: user.email,
        orgName: organization?.name || 'No Organization',
        orgDescription: organization?.description || 'Guest access - limited functionality',
        organizationAccess: user.organizationAccess,
        isGuest: true,
        guestExpiresAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      } as any
    };
  }

  // Clean up expired guest users
  async cleanupExpiredGuests(): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const result = await this.usersCollection.deleteMany({
      role: 'guest',
      guestExpiresAt: { $lt: new Date() }
    });

    console.log(`Cleaned up ${result.deletedCount} expired guest users`);
  }

  // Clean up guest user on logout
  async cleanupGuestOnLogout(userId: string): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Only delete if user is actually a guest
    const user = await this.usersCollection.findOne({ id: userId });
    if (user && user.role! === 'guest') {
      await this.usersCollection.deleteOne({ id: userId });
      console.log(`🗑️ Cleaned up guest user ${userId} on logout`);
    }
  }

  // Join client to organization
  async joinClientToOrganization(userId: string, orgId: string): Promise<AuthResponse> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    console.log('🔍 joinClientToOrganization called with:', { userId, orgId });

    // Find the user (all guests now have database records)
    const user = await this.usersCollection.findOne({ id: userId });
    console.log('🔍 User found in database:', user ? { id: user.id, email: user.email, role: user.role! } : 'NOT FOUND');
    
    if (!user) {
      // Let's also check if user exists with different query
      const allUsers = await this.usersCollection.find({}).toArray();
      console.log('🔍 All users in database:', allUsers.map(u => ({ id: u.id, email: u.email, role: u.role })));
      throw new Error('User not found');
    }

    // Verify the organization exists and is public
    const organization = await this.getOrganization(orgId);
    if (!organization) {
      throw new Error('Organization not found');
    }

    if (!organization.isPublic) {
      throw new Error('Organization is private and requires invitation');
    }



    // User should already have multi-role format in clean database
    const migratedUser = user as User;

    // Update user's organization and current org/role
    const setData: any = {
      orgId: orgId,
      orgName: organization.name,
      orgDescription: organization.description,
      currentOrgId: orgId,
      currentRole: 'client', // When joining an organization, user becomes a client
      updatedAt: new Date()
    };

    // Also add to organizationAccess if it doesn't exist
    if (!migratedUser.organizationAccess) {
      migratedUser.organizationAccess = {};
    }
    migratedUser.organizationAccess[orgId] = {
      role: 'client', // When joining an organization, user becomes a client
      joinedAt: new Date()
    };
    setData.organizationAccess = migratedUser.organizationAccess;

    const updateQuery: any = { $set: setData };

    const updatedUser = await this.usersCollection.findOneAndUpdate(
      { id: userId },
      updateQuery,
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      throw new Error('Failed to update user organization');
    }

    // Generate new multi-role JWT token with updated organization
    const token = this.generateMultiRoleToken(updatedUser, orgId);

    // Build accessible organizations info
    const accessibleOrgs: { [orgId: string]: { role: 'admin' | 'client' | 'guest'; orgName: string; orgDescription?: string; isPublic?: boolean } } = {};
    
    if (updatedUser.organizationAccess) {
      for (const [orgId, access] of Object.entries(updatedUser.organizationAccess)) {
        const org = await this.getOrganization(orgId);
        if (org) {
          accessibleOrgs[orgId] = {
            role: access.role,
            orgName: org.name,
            orgDescription: org.description,
            isPublic: org.isPublic
          };
        }
      }
    }

    return {
      token,
      user: {
        id: updatedUser.id,
        orgId: updatedUser.orgId!,
        currentOrgId: updatedUser.currentOrgId || updatedUser.orgId!,
        role: updatedUser.role!,
        currentRole: updatedUser.currentRole || updatedUser.role!,
        email: updatedUser.email,
        orgName: updatedUser.orgName || organization.name,
        orgDescription: updatedUser.orgDescription || organization.description,
        organizationAccess: updatedUser.organizationAccess,
        accessibleOrgs: accessibleOrgs,
        createdAt: updatedUser.createdAt,
        updatedAt: updatedUser.updatedAt
      } as any
    };
  }

  // Count admins for a specific organization
  async countAdminsForOrganization(orgId: string): Promise<number> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Count admins from organizationAccess field (multi-role format)
    const adminCount = await this.usersCollection.countDocuments({ 
      [`organizationAccess.${orgId}.role`]: 'admin' 
    });

    return adminCount;
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}
