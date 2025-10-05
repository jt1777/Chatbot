import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/authService';
import { JWTPayload, AuthenticatedRequest } from '@chatbot/shared';

const authService = new AuthService();

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    // All tokens are now proper JWTs (including guests)
    const decoded = await authService.verifyToken(token);
    
    // Attach user info to request
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireRole = (allowedRoles: ('client' | 'admin' | 'guest')[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Use only currentRole field
    const userRole = user.currentRole;
    
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

export const requireOrgAdmin = requireRole(['admin']);
export const requireUser = requireRole(['client', 'admin', 'guest']);

export { authService };
