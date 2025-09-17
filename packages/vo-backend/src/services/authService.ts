import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, Db, Collection } from 'mongodb';
import { User, AdminAuthRequest, AdminRegisterRequest, ClientAuthRequest, ClientTokenRequest, AuthResponse, JWTPayload, Organization, CreateInviteRequest, InviteResponse, JoinOrganizationRequest } from '@chatbot/shared';

// Local type definitions for organization switching
interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'org_admin' | 'client';
  joinedAt: Date;
}

interface SwitchOrganizationResponse {
  token: string;
  user: {
    id: string;
    orgId: string;
    role: 'org_admin' | 'client';
    email?: string;
    phone?: string;
    orgName?: string;
    orgDescription?: string;
    organizations?: OrganizationMembership[];
  };
}

export class AuthService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private usersCollection: Collection<User> | null = null;
  private readonly JWT_SECRET: string;
  private readonly JWT_EXPIRES_IN = '24h';

  constructor() {
    this.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
  }

  async initialize(): Promise<void> {
    try {
      const mongoUri = process.env.MONGODB_URI;
      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is required');
      }

      this.client = new MongoClient(mongoUri);
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
        role: 'org_admin'
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
        role: 'org_admin'
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
        role: 'org_admin',
        joinedAt: new Date()
      });

      // Update the admin with new organization
      await this.usersCollection.updateOne(
        { id: existingAdmin.id },
        {
          $set: {
            orgId: finalOrgId, // Switch to new organization
            orgName: orgName || `Organization ${finalOrgId}`,
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
        role: existingAdmin.role,
        email: existingAdmin.email
      });

      return {
        token,
        user: {
          id: existingAdmin.id,
          orgId: finalOrgId,
          role: existingAdmin.role,
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

      // Create admin user with organization info
      const user: User = {
        id: userId,
        orgId: finalOrgId,
        role: 'org_admin',
        email,
        passwordHash,
        orgName: orgName || `Organization ${finalOrgId}`,
        inviteCode,
        adminCount: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any;

      // Add organizations array
      (user as any).organizations = [{
        orgId: finalOrgId,
        orgName: orgName || `Organization ${finalOrgId}`,
        orgDescription: '',
        role: 'org_admin',
        joinedAt: new Date()
      }];

      await this.usersCollection.insertOne(user);

      // Generate JWT token
      const token = this.generateToken({
        userId: user.id,
        orgId: user.orgId,
        role: user.role,
        email: user.email
      });

      return {
        token,
        user: {
          id: user.id,
          orgId: user.orgId,
          role: user.role,
          email: user.email,
          orgName: user.orgName,
          organizations: (user as any).organizations
        }
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
    const user = await this.usersCollection.findOne({ email, role: 'org_admin' });
    if (!user || !user.passwordHash) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email
    });

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId,
        role: user.role,
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
      orgId: user.orgId,
      role: user.role,
      phone: user.phone
    }, '2h'); // 2 hour expiry for clients

    // Get organization name for the response
    const orgName = await this.getOrganizationName(user.orgId);

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId,
        role: user.role,
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
  async getOrganizations(): Promise<{ orgId: string; name: string; adminCount: number }[]> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const orgs = await this.usersCollection.aggregate([
      { $match: { role: 'org_admin' } },
      { 
        $group: { 
          _id: '$orgId', 
          name: { $first: '$orgName' }, // Use orgName from admin user
          adminCount: { $sum: 1 }
        } 
      },
      { $sort: { name: 1 } }
    ]).toArray();

    return orgs.map(org => ({
      orgId: org._id,
      name: org.name || org._id, // Fallback to orgId if orgName is not set
      adminCount: org.adminCount
    }));
  }

  private generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresIn?: string): string {
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

    const admin = await this.usersCollection.findOne({ id: adminId, role: 'org_admin' });
    if (!admin) {
      throw new Error('Admin not found');
    }

    const inviteCode = this.generateInviteCode();
    const organization: Organization = {
      id: admin.orgId,
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

    const admin = await this.usersCollection.findOne({ id: adminId, role: 'org_admin' });
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

    // Create new admin user in the same organization
    const userId = this.generateUserId();
    const user: User = {
      id: userId,
      orgId: admin.orgId,
      role: 'org_admin',
      email: joinData.email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any;

    // Add organizations array
    (user as any).organizations = [{
      orgId: admin.orgId,
      orgName: admin.orgName || `Organization ${admin.orgId}`,
      role: 'org_admin',
      joinedAt: new Date()
    }];

    await this.usersCollection.insertOne(user);

    // Remove the used invite
    const updatedInvites = { ...admin.pendingInvites };
    delete updatedInvites[joinData.inviteCode];
    
    // Add the new user to the admin's organizations list
    const updatedOrganizations: OrganizationMembership[] = (admin as any).organizations || [];
    const existingOrgIndex = updatedOrganizations.findIndex((org: OrganizationMembership) => org.orgId === admin.orgId);
    
    if (existingOrgIndex >= 0) {
      // Organization already exists in the list, just update the admin count
      // Keep existing data but ensure it's up to date
      // No changes needed for existing organization
    } else {
      // Add the organization to the list
      updatedOrganizations.push({
        orgId: admin.orgId!,
        orgName: admin.orgName || `Organization ${admin.orgId}`,
        role: 'org_admin' as const,
        joinedAt: admin.createdAt || new Date()
      });
    }

    await this.usersCollection.updateOne(
      { id: admin.id },
      { 
        $set: { 
          pendingInvites: updatedInvites,
          organizations: updatedOrganizations,
          adminCount: (admin.adminCount || 1) + 1,
          updatedAt: new Date()
        }
      }
    );

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      orgId: user.orgId,
      role: user.role,
      email: user.email
    });

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId,
        role: user.role,
        email: user.email,
        orgName: admin.orgName
      }
    };
  }

  async getOrganization(orgId: string): Promise<Organization | null> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // First, try to find a user with this orgId as their current org
    const admin = await this.usersCollection.findOne({ orgId, role: 'org_admin' });
    if (admin) {
      const adminCount = await this.usersCollection.countDocuments({ orgId, role: 'org_admin' });

      return {
        id: orgId,
        name: admin.orgName || orgId,
        description: admin.orgDescription || '',
        createdAt: admin.createdAt,
        adminCount,
        inviteCode: admin.inviteCode || ''
      };
    }

    // If no user found with this orgId, look for users who have this org in their organizations array
    const userWithOrg = await this.usersCollection.findOne({ 
      'organizations.orgId': orgId,
      role: 'org_admin'
    });

    if (userWithOrg) {
      const orgMembership = (userWithOrg as any).organizations?.find((org: any) => org.orgId === orgId);
      if (orgMembership) {
        // Count how many users have this organization in their organizations array
        const adminCount = await this.usersCollection.countDocuments({ 
          'organizations.orgId': orgId,
          role: 'org_admin'
        });

        return {
          id: orgId,
          name: orgMembership.orgName || orgId,
          description: orgMembership.orgDescription || 'No description available',
          createdAt: orgMembership.joinedAt || new Date(),
          adminCount,
          inviteCode: ''
        };
      }
    }

    return null;
  }

  async getOrganizationName(orgId: string): Promise<string | null> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    const admin = await this.usersCollection.findOne({ 
      orgId, 
      role: 'org_admin' 
    });

    return admin?.orgName || null;
  }

  async updateOrganizationDescription(orgId: string, orgDescription: string): Promise<void> {
    if (!this.usersCollection) {
      throw new Error('Auth service not initialized');
    }

    // Update direct orgId matches
    const result1 = await this.usersCollection.updateMany(
      { orgId, role: 'org_admin' },
      { 
        $set: { 
          orgDescription,
          updatedAt: new Date()
        }
      }
    );

    // Update organizations array matches
    const result2 = await this.usersCollection.updateMany(
      { 
        'organizations.orgId': orgId,
        role: 'org_admin'
      },
      { 
        $set: { 
          'organizations.$.orgDescription': orgDescription,
          updatedAt: new Date()
        }
      }
    );

    if (result1.matchedCount === 0 && result2.matchedCount === 0) {
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
        orgId: updatedUser.orgId, 
        role: updatedUser.role 
      } as JWTPayload,
      this.JWT_SECRET,
      { expiresIn: this.JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: updatedUser.id,
        orgId: updatedUser.orgId,
        role: updatedUser.role,
        email: updatedUser.email,
        phone: updatedUser.phone,
        orgName: updatedUser.orgName,
        orgDescription: updatedUser.orgDescription,
        organizations: (updatedUser as any).organizations
      }
    };
  }

  private generateInviteCode(): string {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  }
}
