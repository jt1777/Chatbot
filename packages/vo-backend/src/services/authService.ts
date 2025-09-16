import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { MongoClient, Db, Collection } from 'mongodb';
import { User, AdminAuthRequest, AdminRegisterRequest, ClientAuthRequest, ClientTokenRequest, AuthResponse, JWTPayload } from '@chatbot/shared';

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
      
      // Create unique index on email
      await this.usersCollection.createIndex({ email: 1 }, { unique: true });
      
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

    const { email, password, orgId } = registerData;

    // Check if admin already exists
    const existingAdmin = await this.usersCollection.findOne({ email });
    if (existingAdmin) {
      throw new Error('Admin with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Generate IDs
    const userId = this.generateUserId();
    const finalOrgId = orgId || this.generateOrgId();

    // Create admin user
    const user: User = {
      id: userId,
      orgId: finalOrgId,
      role: 'org_admin',
      email,
      passwordHash,
      createdAt: new Date(),
      updatedAt: new Date()
    };

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
        email: user.email
      }
    };
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
        email: user.email
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

    return {
      token,
      user: {
        id: user.id,
        orgId: user.orgId,
        role: user.role,
        phone: user.phone
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
          name: { $first: '$orgId' }, // For now, use orgId as name
          adminCount: { $sum: 1 }
        } 
      },
      { $sort: { name: 1 } }
    ]).toArray();

    return orgs.map(org => ({
      orgId: org._id,
      name: org.name,
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
}
