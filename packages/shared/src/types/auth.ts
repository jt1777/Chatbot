export interface User {
  id: string;
  orgId: string;
  role: 'org_admin' | 'client';
  email: string; // Required but can be empty string for clients
  phone?: string; // Only for clients
  passwordHash?: string; // Only for admins
  orgName?: string; // Organization name
  inviteCode?: string; // Organization invite code
  pendingInvites?: { [inviteCode: string]: { email: string; role: string; expiresAt: Date; createdAt: Date } };
  adminCount?: number; // Number of admins in organization
  createdAt: Date;
  updatedAt: Date;
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

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    orgId: string;
    role: 'org_admin' | 'client';
    email?: string;
    phone?: string;
    orgName?: string;
  };
}

export interface JWTPayload {
  userId: string;
  orgId: string;
  role: 'org_admin' | 'client';
  email?: string;
  phone?: string;
  iat: number;
  exp: number;
}

export interface AuthenticatedRequest {
  user: JWTPayload;
}

// Organization management
export interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  adminCount: number;
  inviteCode: string;
}

export interface CreateInviteRequest {
  email: string;
  role: 'org_admin';
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
