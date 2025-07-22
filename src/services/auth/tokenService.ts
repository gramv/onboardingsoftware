import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { config } from '@/config/environment';
import { redisClient } from '@/config/redis';
import { TokenPayload, RefreshTokenData } from '@/types/auth';

// Added comment to trigger hooks - test generation hook

/**
 * Generate an access token for a user
 * @param payload User data to include in the token
 * @returns JWT access token
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwt.secret as Secret, {
    expiresIn: config.jwt.expiresIn,
  } as SignOptions);
};

/**
 * Generate a refresh token for a user
 * @param userId User ID
 * @returns JWT refresh token
 */
export const generateRefreshToken = (userId: string): string => {
  const tokenFamily = uuidv4();
  const token = jwt.sign({ userId, tokenFamily }, config.jwt.refreshSecret as Secret, {
    expiresIn: config.jwt.refreshExpiresIn,
  } as SignOptions);
  
  return token;
};

/**
 * Store refresh token in Redis
 * @param userId User ID
 * @param token Refresh token
 * @param tokenFamily Token family ID for rotation
 */
export const storeRefreshToken = async (
  userId: string,
  token: string,
  tokenFamily: string
): Promise<void> => {
  try {
    // Calculate expiration time
    const expiresIn = config.jwt.refreshExpiresIn;
    const expiresInMs = parseExpirationToMs(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInMs);
    
    // Store token data in Redis
    const tokenData: RefreshTokenData = {
      userId,
      tokenFamily,
      expiresAt,
    };
    
    // Use token hash as key to prevent storing the actual token
    const tokenKey = `refresh_token:${userId}:${tokenFamily}`;
    await redisClient.set(tokenKey, JSON.stringify(tokenData));
    await redisClient.expireAt(tokenKey, Math.floor(expiresAt.getTime() / 1000));
  } catch (error) {
    console.error('Error storing refresh token:', error);
    // Continue execution even if Redis fails - the token will still work
    // but won't be revocable until Redis is back online
  }
};

/**
 * Verify and decode an access token
 * @param token JWT access token
 * @returns Decoded token payload or null if invalid
 */
export const verifyAccessToken = (token: string): TokenPayload | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret as Secret) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify and decode a refresh token
 * @param token JWT refresh token
 * @returns Decoded token payload or null if invalid
 */
export const verifyRefreshToken = (token: string): { userId: string; tokenFamily: string } | null => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret as Secret) as { userId: string; tokenFamily: string };
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Validate a refresh token against stored token in Redis
 * @param userId User ID
 * @param tokenFamily Token family ID
 * @returns Boolean indicating if token is valid
 */
export const validateStoredRefreshToken = async (
  userId: string,
  tokenFamily: string
): Promise<boolean> => {
  try {
    const tokenKey = `refresh_token:${userId}:${tokenFamily}`;
    const storedToken = await redisClient.get(tokenKey);
    
    if (!storedToken) {
      // In development, if Redis is not available, we'll accept the token
      // This makes development easier when Redis is not running
      if (config.isDevelopment) {
        console.warn('⚠️ Redis token validation skipped in development mode');
        return true;
      }
      return false;
    }
    
    const tokenData = JSON.parse(storedToken) as RefreshTokenData;
    const now = new Date();
    
    // Check if token is expired
    if (now > new Date(tokenData.expiresAt)) {
      try {
        await redisClient.del(tokenKey);
      } catch (error) {
        console.error('Error deleting expired token:', error);
      }
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error validating refresh token:', error);
    // In development, if Redis fails, we'll accept the token
    if (config.isDevelopment) {
      console.warn('⚠️ Redis token validation failed, accepting token in development mode');
      return true;
    }
    return false;
  }
};

/**
 * Invalidate a refresh token
 * @param userId User ID
 * @param tokenFamily Token family ID
 */
export const invalidateRefreshToken = async (
  userId: string,
  tokenFamily: string
): Promise<void> => {
  try {
    const tokenKey = `refresh_token:${userId}:${tokenFamily}`;
    await redisClient.del(tokenKey);
  } catch (error) {
    console.error('Error invalidating refresh token:', error);
    // Continue execution even if Redis fails
  }
};

/**
 * Invalidate all refresh tokens for a user
 * @param userId User ID
 */
export const invalidateAllUserRefreshTokens = async (userId: string): Promise<void> => {
  try {
    const keys = await redisClient.keys(`refresh_token:${userId}:*`);
    
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  } catch (error) {
    console.error('Error invalidating all user refresh tokens:', error);
    // Continue execution even if Redis fails
  }
};

/**
 * Parse JWT expiration time string to milliseconds
 * @param expiration Expiration string (e.g., '15m', '7d')
 * @returns Milliseconds
 */
const parseExpirationToMs = (expiration: string): number => {
  const unit = expiration.slice(-1);
  const value = parseInt(expiration.slice(0, -1), 10);
  
  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      return 15 * 60 * 1000; // Default to 15 minutes
  }
};