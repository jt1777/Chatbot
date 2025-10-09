export interface User {
  id: string;
  // Legacy fields for backward compatibility
  orgId?: string; // Legacy field for backward compatibility
  role?: 'admin' | 'client' | 'guest'; // Legacy field for backward compatibility
  email?: string;
  phone?: string; // Only for clients
  passwordHash?: string; // Password hash for admins and registered clients
  orgName?: string; // Current organization name
  orgDescription?: string; // Current organization description
  isPublic?: boolean; // Organization visibility (public/private)
  organizations?: OrganizationMembership[]; // All organizations user belongs to (for admins)
  inviteCode?: string; // Organization invite code
  pendingInvites?: { [inviteCode: string]: { email: string; role: string; expiresAt: Date; createdAt: Date } };
  adminCount?: number; // Number of admins in organization
  isGuest?: boolean; // Flag to identify guest users
  guestExpiresAt?: Date; // When guest session expires
  
  // NEW: Multi-role organization access (optional for backward compatibility)
  organizationAccess?: {
    [orgId: string]: {
      role: 'admin' | 'client' | 'guest';
      joinedAt: Date;
      orgName?: string;
      orgDescription?: string;
      isPublic?: boolean;
      permissions?: string[];
    }
  };
  
  // NEW: Current active organization context (optional for backward compatibility)
  currentOrgId?: string;
  currentRole?: 'admin' | 'client' | 'guest';
  
  // Email verification fields
  isEmailVerified?: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMembership {
  orgId: string;
  orgName: string;
  role: 'admin' | 'client' | 'guest';
  joinedAt: Date;
  orgDescription?: string; // Organization description
  isPublic?: boolean; // Organization visibility
}

// Admin authentication
export interface AdminAuthRequest {
  email: string;
  password: string;
}

export interface AdminRegisterRequest {
  email: string;
  password: string;
  orgId?: string; // If not provided, will create new org
  orgName?: string; // Organization name for new orgs
  inviteCode?: string; // For joining existing organization
}

// Client authentication
export interface ClientAuthRequest {
  phone?: string;
  orgId?: string;
  clientId?: string; // For existing clients
}

export interface ClientTokenRequest {
  phone?: string;
  orgId: string;
}

export interface ClientRegisterRequest {
  email: string;
  password: string;
}

export interface GuestAuthRequest {
  orgId?: string; // Optional organization to join as guest
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    orgId: string;
    role: 'admin' | 'client' | 'guest';
    email?: string;
    phone?: string;
    orgName?: string;
    organizations?: OrganizationMembership[];
    
    // NEW: Multi-role organization access (optional for backward compatibility)
    currentOrgId?: string;
    currentRole?: 'admin' | 'client' | 'guest';
    accessibleOrgs?: {
      [orgId: string]: {
        role: 'admin' | 'client' | 'guest';
        orgName: string;
        orgDescription?: string;
        isPublic?: boolean;
      };
    };
  };
}

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: 'admin' | 'client' | 'guest';
  email?: string;
  phone?: string;
  iat: number;
  exp: number;
  
  // NEW: Multi-role organization access (optional for backward compatibility)
  currentOrgId?: string;
  currentRole?: 'admin' | 'client' | 'guest';
  accessibleOrgs?: {
    [orgId: string]: 'admin' | 'client' | 'guest';
  };
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

// Organization management
export interface Organization {
  id: string;
  name: string;
  description?: string;
  isPublic?: boolean;
  createdAt: Date;
  adminCount: number;
  inviteCode: string;
}

export interface CreateInviteRequest {
  email: string;
  role: 'admin' | 'client';
}

export interface InviteResponse {
  inviteCode: string;
  expiresAt: Date;
}

export interface JoinOrganizationRequest {
  inviteCode: string;
  email: string;
  password: string;
}

export interface UpdateOrgDescriptionRequest {
  orgDescription: string;
}

export interface SwitchOrganizationRequest {
  orgId: string;
}

export interface SwitchOrganizationResponse {
  token: string;
  user: {
    id: string;
    orgId: string;
    role: 'admin' | 'client' | 'guest';
    email?: string;
    phone?: string;
    orgName?: string;
    orgDescription?: string;
    organizations?: OrganizationMembership[];
    
    // NEW: Multi-role organization access (optional for backward compatibility)
    currentOrgId?: string;
    currentRole?: 'admin' | 'client' | 'guest';
    accessibleOrgs?: {
      [orgId: string]: {
        role: 'admin' | 'client' | 'guest';
        orgName: string;
        orgDescription?: string;
        isPublic?: boolean;
      };
    };
  };
}
