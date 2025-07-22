import { PrismaClient, User, UserRole } from '@prisma/client';
import { 
  generateAccessToken, 
  generateRefreshToken, 
  storeRefreshToken,
  verifyRefreshToken,
  validateStoredRefreshToken,
  invalidateRefreshToken,
  invalidateAllUserRefreshTokens
} from './tokenService';

// Added comment to trigger hooks - test generation hook
import { hashPassword, comparePassword } from '@/utils/auth/password';
import { 
  AuthResponse, 
  LoginCredentials, 
  RegisterUserData, 
  TokenPayload,
  mapToPublicUser,
  ROLE_PERMISSIONS
} from '@/types/auth';

const prisma = new PrismaClient();

/**
 * Register a new user
 * @param userData User registration data
 * @returns Newly created user
 */
export const registerUser = async (userData: RegisterUserData): Promise<User> => {
  const { email, password, firstName, lastName, role, organizationId, phone, languagePreference } = userData;
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });
  
  if (existingUser) {
    throw new Error('User with this email already exists');
  }
  
  // Hash the password
  const passwordHash = await hashPassword(password);
  
  // Create the user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName,
      role,
      organizationId,
      phone,
      languagePreference: languagePreference || 'en',
    },
  });
  
  return user;
};

/**
 * Authenticate a user and generate tokens
 * @param credentials User login credentials
 * @returns Authentication response with tokens and user data
 */
export const loginUser = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log('Login attempt with credentials:', { email: credentials.email });
  const { email, password } = credentials;
  
  try {
    // Find the user
    console.log('Looking up user in database...');
    const user = await prisma.user.findUnique({
      where: { email },
    });
    
    if (!user) {
      console.log('No user found with email:', email);
      throw new Error('Invalid email or password');
    }
    
      console.log('User found:', { id: user.id, email: user.email, isActive: user.isActive });
    
    if (!user.isActive) {
      throw new Error('User account is inactive');
    }
    
    // Verify password
    console.log('Verifying password...');
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      console.log('Invalid password for user:', email);
      throw new Error('Invalid email or password');
    }
    
    // Check MFA if enabled
    if (user.mfaEnabled) {
      console.log('MFA is enabled for user:', email);
      if (!credentials.mfaCode) {
        throw new Error('MFA code required');
      }
      
      // Verify MFA code (implementation would depend on MFA method)
      const isMfaValid = await verifyMfaCode(user.id, credentials.mfaCode);
      if (!isMfaValid) {
        console.log('Invalid MFA code for user:', email);
        throw new Error('Invalid MFA code');
      }
    }
    
    console.log('Generating tokens...');
    // Generate tokens
    const tokenPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };
    
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(user.id);
    
    console.log('Tokens generated, verifying refresh token...');
    // Extract token family from refresh token
    const decodedRefreshToken = verifyRefreshToken(refreshToken);
    if (!decodedRefreshToken) {
      console.error('Failed to verify refresh token');
      throw new Error('Failed to generate refresh token');
    }
    
    console.log('Storing refresh token...');
    // Store refresh token (don't await to prevent blocking if Redis is slow)
    storeRefreshToken(user.id, refreshToken, decodedRefreshToken.tokenFamily)
      .catch(err => console.error('Error storing refresh token, but continuing:', err));
    
    // Get permissions for the user's role
    const permissions = ROLE_PERMISSIONS[user.role] || [];
    
    console.log('Login successful for user:', email);
    return {
      accessToken,
      refreshToken,
      user: mapToPublicUser(user),
      permissions,
    };
  } catch (error) {
    console.error('Login error:', error);
    throw error; // Re-throw to be handled by the route handler
  }
};

/**
 * Refresh access token using a valid refresh token
 * @param refreshToken Refresh token
 * @returns New access token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<{ accessToken: string }> => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    throw new Error('Invalid refresh token');
  }
  
  const { userId, tokenFamily } = decoded;
  
  // Validate stored token
  const isValid = await validateStoredRefreshToken(userId, tokenFamily);
  if (!isValid) {
    throw new Error('Refresh token expired or revoked');
  }
  
  // Get user data
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });
  
  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }
  
  // Generate new access token
  const tokenPayload: TokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
  
  const newAccessToken = generateAccessToken(tokenPayload);
  
  return { accessToken: newAccessToken };
};

/**
 * Logout a user by invalidating their refresh token
 * @param userId User ID
 * @param refreshToken Refresh token
 */
export const logoutUser = async (userId: string, refreshToken: string): Promise<void> => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return; // Silently fail if token is invalid
  }
  
  // Invalidate the specific refresh token
  if (decoded.userId === userId) {
    await invalidateRefreshToken(userId, decoded.tokenFamily);
  }
};

/**
 * Logout a user from all devices by invalidating all refresh tokens
 * @param userId User ID
 */
export const logoutAllDevices = async (userId: string): Promise<void> => {
  await invalidateAllUserRefreshTokens(userId);
};

/**
 * Verify MFA code for a user
 * @param userId User ID
 * @param code MFA code
 * @returns Boolean indicating if code is valid
 */
const verifyMfaCode = async (userId: string, code: string): Promise<boolean> => {
  // This is a placeholder for MFA verification
  // In a real implementation, you would verify against TOTP or other MFA method
  return code === '123456'; // Placeholder implementation
};