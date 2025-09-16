export interface User {
  id: string;
  orgId: string;
  role: 'org_admin' | 'client';
  email?: string; // Only for admins
  phone?: string; // Only for clients
  passwordHash?: string; // Only for admins
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
