import express from 'express';
import { z } from 'zod';
import { WalkInOnboardingService } from '@/services/onboarding/walkInOnboardingService';
import { authenticate, requirePermission } from '@/middleware/auth/authMiddleware';
import { PERMISSIONS } from '@/types/auth';
import { translationService } from '@/utils/i18n/translationService';
import { PrismaClient, Prisma } from '@prisma/client';

const router = express.Router();
const walkInOnboardingService = new WalkInOnboardingService();
const prisma = new PrismaClient();

/**
 * @route POST /walkin-onboarding/create
 * @desc Create a new walk-in onboarding session
 * @access Private (Manager, HR Admin)
 */
router.post('/create',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING]),
  async (req, res) => {
    try {
      const locale = req.user?.languagePreference || 'en';
      
      const createWalkInSchema = z.object({
        firstName: z.string().min(1, 'First name is required'),
        lastName: z.string().min(1, 'Last name is required'),
        email: z.string().email('Valid email is required'),
        position: z.string().min(1, 'Position is required'),
        department: z.string().min(1, 'Department is required'),
        hourlyRate: z.number().positive('Hourly rate must be positive'),
        organizationId: z.string().uuid('Valid organization ID is required'),
        employmentType: z.enum(['full_time', 'part_time', 'contract', 'temporary']).default('full_time')
      });
      
      // Validate request body
      const validatedData = createWalkInSchema.parse(req.body);
      
      // Create walk-in onboarding session
      const result = await walkInOnboardingService.createWalkInOnboarding(
        validatedData,
        req.user!.userId
      );
      
      return res.status(201).json({
        success: true,
        message: translationService.t('onboarding.walkIn.created', {}, locale),
        data: {
          candidate: {
            firstName: result.session.firstName,
            lastName: result.session.lastName,
            email: result.session.email,
            position: result.session.jobTitle,
            department: validatedData.department || '',
            hourlyRate: validatedData.hourlyRate || 0,
            hireDate: new Date().toISOString().split('T')[0],
            employmentType: validatedData.employmentType || 'full_time'
          },
          session: {
            id: result.session.id,
            token: result.session.token,
            expiresAt: result.session.expiresAt
          },
          onboardingUrl: result.onboardingUrl
        }
      });
    } catch (error) {
      console.error('Error creating walk-in onboarding:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'An unexpected error occurred'
        });
      }
    }
  }
);

/**
 * @route GET /walkin-onboarding/active
 * @desc Get active walk-in onboarding sessions for the organization
 * @access Private (Manager, HR Admin)
 */
router.get('/active',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING]),
  async (req, res) => {
    try {
      const organizationId = req.user!.organizationId;
      
      // Get active walk-in sessions
      const sessions = await walkInOnboardingService.getActiveWalkInSessions(
        organizationId,
        req.user!.userId
      );
      
      return res.status(200).json({
        success: true,
        data: sessions
      });
    } catch (error) {
      console.error('Error getting active walk-in sessions:', error);
      
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      } else {
        return res.status(500).json({
          success: false,
          error: 'An unexpected error occurred'
        });
      }
    }
  }
);


export default router;