import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client'; // eslint-disable-line @typescript-eslint/no-unused-vars
import {
    hrAdminGuard,
    managerGuard,
    employeeGuard,
    organizationGuard,
    permissionGuard
} from '../roleGuards';

// Added comment to trigger hooks - test generation hook

// Mock PrismaClient
jest.mock('@prisma/client', () => {
    const mockPrismaClient = {
        employee: {
            findUnique: jest.fn(),
            findFirst: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
    };
    return {
        PrismaClient: jest.fn(() => mockPrismaClient),
    };
});

describe('Role Guards', () => {
    let req: Partial<Request>;
    let res: Partial<Response>;
    let next: jest.Mock;

    beforeEach(() => {
        req = {};
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn(),
        };
        next = jest.fn();
    });

    describe('hrAdminGuard', () => {
        it('should allow HR admin users', () => {
            req.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'hr_admin',
                organizationId: 'org-123',
            };

            hrAdminGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject non-HR admin users', () => {
            req.user = {
                userId: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
                organizationId: 'org-123',
            };

            hrAdminGuard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'HR Administrator access required' });
        });

        it('should reject unauthenticated requests', () => {
            req.user = undefined;

            hrAdminGuard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        });
    });

    describe('managerGuard', () => {
        it('should allow manager users', () => {
            req.user = {
                userId: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
                organizationId: 'org-123',
            };

            managerGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow HR admin users', () => {
            req.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'hr_admin',
                organizationId: 'org-123',
            };

            managerGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject employee users', () => {
            req.user = {
                userId: 'user-123',
                email: 'employee@example.com',
                role: 'employee',
                organizationId: 'org-123',
            };

            managerGuard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Manager access required' });
        });
    });

    describe('employeeGuard', () => {
        it('should allow any authenticated user', () => {
            req.user = {
                userId: 'user-123',
                email: 'employee@example.com',
                role: 'employee',
                organizationId: 'org-123',
            };

            employeeGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject unauthenticated requests', () => {
            req.user = undefined;

            employeeGuard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(401);
            expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
        });
    });

    describe('organizationGuard', () => {
        it('should allow HR admin to access any organization', () => {
            req.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'hr_admin',
                organizationId: 'org-123',
            };
            req.params = { organizationId: 'org-456' };

            organizationGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should allow users to access their own organization', () => {
            req.user = {
                userId: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
                organizationId: 'org-123',
            };
            req.params = { organizationId: 'org-123' };

            organizationGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject users accessing other organizations', () => {
            req.user = {
                userId: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
                organizationId: 'org-123',
            };
            req.params = { organizationId: 'org-456' };

            organizationGuard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Cannot access data from other organizations' });
        });

        it('should set default organization ID if none provided', () => {
            req.user = {
                userId: 'user-123',
                email: 'manager@example.com',
                role: 'manager',
                organizationId: 'org-123',
            };
            req.params = {};
            req.query = {};

            organizationGuard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(req.query.organizationId).toBe('org-123');
        });
    });

    describe('permissionGuard', () => {
        it('should allow users with required permissions', () => {
            req.user = {
                userId: 'user-123',
                email: 'admin@example.com',
                role: 'hr_admin',
                organizationId: 'org-123',
            };
            req.permissions = ['view:all-employees', 'manage:all-employees'];

            const guard = permissionGuard(['view:all-employees']);
            guard(req as Request, res as Response, next);

            expect(next).toHaveBeenCalled();
            expect(res.status).not.toHaveBeenCalled();
        });

        it('should reject users without required permissions', () => {
            req.user = {
                userId: 'user-123',
                email: 'employee@example.com',
                role: 'employee',
                organizationId: 'org-123',
            };
            req.permissions = ['view:profile', 'edit:profile'];

            const guard = permissionGuard(['manage:all-employees']);
            guard(req as Request, res as Response, next);

            expect(next).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
        });
    });
});