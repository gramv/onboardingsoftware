import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { PERMISSIONS } from '@/types/auth'; // eslint-disable-line @typescript-eslint/no-unused-vars

// Added comment to trigger hooks - i18n compliance check

const prisma = new PrismaClient();

/**
 * Guard middleware for HR Administrator role
 */
export const hrAdminGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== 'hr_admin') {
    res.status(403).json({ error: 'HR Administrator access required' });
    return;
  }
  
  next();
};

/**
 * Guard middleware for Manager role
 */
export const managerGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  if (req.user.role !== 'manager' && req.user.role !== 'hr_admin') {
    res.status(403).json({ error: 'Manager access required' });
    return;
  }
  
  next();
};

/**
 * Guard middleware for Employee role (all authenticated users)
 */
export const employeeGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  next();
};

/**
 * Guard middleware for organization-based access
 * Ensures users can only access data from their own organization
 * HR Admins can access all organizations
 */
export const organizationGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  // HR Admins can access all organizations
  if (req.user.role === 'hr_admin') {
    next();
    return;
  }
  
  // Get target organization ID from request params or query
  const targetOrgId = req.params.organizationId || req.query.organizationId as string;
  
  if (!targetOrgId) {
    // If no organization specified, default to user's organization
    req.query.organizationId = req.user.organizationId;
    next();
    return;
  }
  
  // Check if user belongs to the target organization
  if (req.user.organizationId !== targetOrgId) {
    res.status(403).json({ error: 'Cannot access data from other organizations' });
    return;
  }
  
  next();
};

/**
 * Guard middleware for employee data access
 * Ensures users can only access their own data or data of employees in their organization
 * HR Admins can access all employee data
 * Managers can access data of employees in their organization
 * Employees can only access their own data
 */
export const employeeDataGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  
  const targetEmployeeId = req.params.employeeId || req.query.employeeId as string;
  
  if (!targetEmployeeId) {
    res.status(400).json({ error: 'Employee ID is required' });
    return;
  }
  
  try {
    // Get the target employee
    const employee = await prisma.employee.findUnique({
      where: { id: targetEmployeeId },
      include: { user: true },
    });
    
    if (!employee) {
      res.status(404).json({ error: 'Employee not found' });
      return;
    }
    
    // HR Admins can access all employee data
    if (req.user.role === 'hr_admin') {
      next();
      return;
    }
    
    // Managers can access data of employees in their organization
    if (req.user.role === 'manager' && req.user.organizationId === employee.user.organizationId) {
      next();
      return;
    }
    
    // Employees can only access their own data
    if (req.user.role === 'employee') {
      // Get the employee record for the current user
      const currentEmployee = await prisma.employee.findFirst({
        where: { userId: req.user.userId },
      });
      
      if (!currentEmployee || currentEmployee.id !== targetEmployeeId) {
        res.status(403).json({ error: 'Cannot access data of other employees' });
        return;
      }
    }
    
    next();
  } catch (error) {
    console.error('Error in employee data guard:', error);
    res.status(500).json({ error: 'An unexpected error occurred' });
  }
};

/**
 * Permission-based guard middleware
 * @param requiredPermissions Array of required permissions
 */
export const permissionGuard = (requiredPermissions: string[]) => {
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
 * Role-based guard middleware
 * @param allowedRoles Array of allowed roles
 */
export const roleGuard = (allowedRoles: string[]) => {
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