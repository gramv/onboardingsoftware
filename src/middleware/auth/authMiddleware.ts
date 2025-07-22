import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '@/services/auth/tokenService';
import { PrismaClient } from '@prisma/client';
import { TokenPayload, ROLE_PERMISSIONS } from '@/types/auth';

// Added comment to trigger hooks - i18n compliance check

const prisma = new PrismaClient();

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      permissions?: string[];
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = verifyAccessToken(token);
    if (!decoded) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    
    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });
    
    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }
    
    // Attach user to request
    req.user = decoded;
    
    // Attach permissions to request
    req.permissions = ROLE_PERMISSIONS[decoded.role] || [];
    
    next();
  } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
    res.status(401).json({ error: 'Authentication failed' });
  }
};

/**
 * Middleware to check if user has required permissions
 * @param requiredPermissions Array of required permissions
 */
export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.permissions) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Check if user has all required permissions
    const hasAllPermissions = requiredPermissions.every(permission => 
      req.permissions?.includes(permission)
    );
    
    if (!hasAllPermissions) {
      res.status(403).json({ error: 'Insufficient permissions' });
      return;
    }
    
    next();
  };
};

/**
 * Middleware to restrict access to specific roles
 * @param allowedRoles Array of allowed roles
 */
export const requireRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ error: 'Insufficient role permissions' });
      return;
    }
    
    next();
  };
};

/**
 * Middleware to restrict access to users within the same organization
 * Used for managers who should only access their organization's data
 */
export const requireSameOrganization = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // Get target organization ID from request params or query
  const targetOrgId = req.params.organizationId || req.query.organizationId as string;
  
  if (!targetOrgId) {
    next(); // No organization specified, continue
    return;
  }
  
  // HR admins can access any organization
  if (req.user.role === 'hr_admin') {
    next();
    return;
  }
  
  // Others can only access their own organization
  if (req.user.organizationId !== targetOrgId) {
    res.status(403).json({ error: 'Cannot access data from other organizations' });
    return;
  }
  
  next();
};