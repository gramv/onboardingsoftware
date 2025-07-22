import { PrismaClient } from '@prisma/client';
import { registerUser, loginUser, refreshAccessToken, logoutUser } from '../authService';
import { hashPassword } from '@/utils/auth/password';
import * as tokenService from '../tokenService';

// Added comment to trigger hooks - test generation hook

// Mock PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

// Mock token service
jest.mock('../tokenService', () => ({
  generateAccessToken: jest.fn(() => 'mock-access-token'),
  generateRefreshToken: jest.fn(() => 'mock-refresh-token'),
  storeRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
  validateStoredRefreshToken: jest.fn(),
  invalidateRefreshToken: jest.fn(),
}));

// Mock password utils
jest.mock('@/utils/auth/password', () => ({
  hashPassword: jest.fn(() => 'hashed-password'),
  comparePassword: jest.fn(() => true),
}));

describe('Auth Service', () => {
  let prisma: any;
  
  beforeEach(() => {
    prisma = new PrismaClient();
    jest.clearAllMocks();
  });
  
  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      // Mock user doesn't exist yet
      prisma.user.findUnique.mockResolvedValue(null);
      
      // Mock user creation
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee',
        organizationId: 'org-123',
        isActive: true,
      };
      prisma.user.create.mockResolvedValue(mockUser);
      
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee' as const,
        organizationId: 'org-123',
      };
      
      const result = await registerUser(userData);
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(hashPassword).toHaveBeenCalledWith('password123');
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'test@example.com',
          passwordHash: 'hashed-password',
          firstName: 'Test',
          lastName: 'User',
          role: 'employee',
          organizationId: 'org-123',
          languagePreference: 'en',
        },
      });
      expect(result).toEqual(mockUser);
    });
    
    it('should throw an error if user already exists', async () => {
      // Mock user already exists
      prisma.user.findUnique.mockResolvedValue({
        id: 'existing-user',
        email: 'test@example.com',
      });
      
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee' as const,
        organizationId: 'org-123',
      };
      
      await expect(registerUser(userData)).rejects.toThrow('User with this email already exists');
      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });
  
  describe('loginUser', () => {
    it('should login a user successfully', async () => {
      // Mock user exists
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        passwordHash: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        role: 'employee',
        organizationId: 'org-123',
        isActive: true,
        mfaEnabled: false,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      // Mock refresh token verification
      (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        tokenFamily: 'family-123',
      });
      
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };
      
      const result = await loginUser(credentials);
      
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      expect(tokenService.generateRefreshToken).toHaveBeenCalledWith('user-123');
      expect(tokenService.storeRefreshToken).toHaveBeenCalledWith('user-123', 'mock-refresh-token', 'family-123');
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        user: expect.objectContaining({
          id: 'user-123',
          email: 'test@example.com',
        }),
        permissions: expect.any(Array),
      });
    });
    
    it('should throw an error if user does not exist', async () => {
      // Mock user doesn't exist
      prisma.user.findUnique.mockResolvedValue(null);
      
      const credentials = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };
      
      await expect(loginUser(credentials)).rejects.toThrow('Invalid email or password');
    });
  });
  
  describe('refreshAccessToken', () => {
    it('should refresh access token successfully', async () => {
      // Mock refresh token verification
      (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        tokenFamily: 'family-123',
      });
      
      // Mock token validation
      (tokenService.validateStoredRefreshToken as jest.Mock).mockResolvedValue(true);
      
      // Mock user exists
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'employee',
        organizationId: 'org-123',
        isActive: true,
      };
      prisma.user.findUnique.mockResolvedValue(mockUser);
      
      const result = await refreshAccessToken('valid-refresh-token');
      
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(tokenService.validateStoredRefreshToken).toHaveBeenCalledWith('user-123', 'family-123');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' },
      });
      expect(tokenService.generateAccessToken).toHaveBeenCalled();
      
      expect(result).toEqual({
        accessToken: 'mock-access-token',
      });
    });
    
    it('should throw an error if refresh token is invalid', async () => {
      // Mock invalid refresh token
      (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue(null);
      
      await expect(refreshAccessToken('invalid-token')).rejects.toThrow('Invalid refresh token');
    });
  });
  
  describe('logoutUser', () => {
    it('should logout a user successfully', async () => {
      // Mock refresh token verification
      (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue({
        userId: 'user-123',
        tokenFamily: 'family-123',
      });
      
      await logoutUser('user-123', 'valid-refresh-token');
      
      expect(tokenService.verifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(tokenService.invalidateRefreshToken).toHaveBeenCalledWith('user-123', 'family-123');
    });
    
    it('should not throw if refresh token is invalid', async () => {
      // Mock invalid refresh token
      (tokenService.verifyRefreshToken as jest.Mock).mockReturnValue(null);
      
      await expect(logoutUser('user-123', 'invalid-token')).resolves.not.toThrow();
      expect(tokenService.invalidateRefreshToken).not.toHaveBeenCalled();
    });
  });
});