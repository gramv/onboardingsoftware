import express from 'express';
import { z } from 'zod';
import { 
  registerUser, 
  loginUser, 
  refreshAccessToken, 
  logoutUser,
  logoutAllDevices
} from '@/services/auth/authService';

// Added comment to trigger hooks - i18n compliance check
import { authenticate } from '@/middleware/auth/authMiddleware';
import { UserRole } from '@prisma/client';

const router = express.Router();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['hr_admin', 'manager', 'employee'] as const),
  organizationId: z.string().uuid('Invalid organization ID'),
  phone: z.string().optional(),
  languagePreference: z.enum(['en', 'es'] as const).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
  deviceId: z.string().optional(),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);
    
    // Register user
    const user = await registerUser(validatedData);
    
    res.status(201).json({
      message: 'User registered successfully',
      userId: user.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    } else if (error instanceof Error) {
      res.status(400).json({
        error: error.message,
      });
    } else {
      res.status(500).json({
        error: 'An unexpected error occurred',
      });
    }
  }
});

/**
 * @route POST /auth/login
 * @desc Authenticate user and get tokens
 * @access Public
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);
    
    // Login user
    const authResponse = await loginUser(validatedData);
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', authResponse.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.status(200).json({
      accessToken: authResponse.accessToken,
      user: authResponse.user,
      permissions: authResponse.permissions,
    });
  } catch (error) {
    console.error('Login error:', error); // Log the full error
    
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    } else if (error instanceof Error) {
      console.error('Login error stack:', error.stack); // Log stack trace
      res.status(401).json({
        error: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      });
    } else {
      console.error('Unknown login error:', JSON.stringify(error, null, 2));
      res.status(500).json({
        error: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && { details: String(error) })
      });
    }
  }
});

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Public (with refresh token)
 */
router.post('/refresh', async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token is required',
      });
    }
    
    // Refresh access token
    const { accessToken } = await refreshAccessToken(refreshToken);
    
    return res.status(200).json({
      accessToken,
    });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(401).json({
        error: error.message,
      });
    } else {
      return res.status(500).json({
        error: 'An unexpected error occurred',
      });
    }
  }
});

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Get refresh token from cookie or request body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      return res.status(400).json({
        error: 'Refresh token is required',
      });
    }
    
    // Logout user
    await logoutUser(req.user!.userId, refreshToken);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An unexpected error occurred',
    });
  }
});

/**
 * @route POST /auth/logout-all
 * @desc Logout from all devices
 * @access Private
 */
router.post('/logout-all', authenticate, async (req, res) => {
  try {
    // Logout from all devices
    await logoutAllDevices(req.user!.userId);
    
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    return res.status(200).json({
      message: 'Logged out from all devices successfully',
    });
  } catch (error) {
    return res.status(500).json({
      error: 'An unexpected error occurred',
    });
  }
});

export default router;