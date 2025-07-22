import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * @route POST /onboarding/validate-token
 * @desc Validate onboarding token for new hires
 * @access Public (no auth required)
 */
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    console.log('🔍 Validating onboarding token:', token);

    // Find the onboarding session by token
    const session = await prisma.onboardingSession.findUnique({
      where: { token: token },
      include: {
        jobApplication: {
          include: {
            jobPosting: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });

    if (!session) {
      console.log('❌ Invalid token:', token);
      return res.status(404).json({
        success: false,
        error: 'Invalid token'
      });
    }

    // Check if token has expired
    if (new Date() > session.expiresAt) {
      console.log('⏰ Expired token:', token);
      return res.status(410).json({
        success: false,
        error: 'Token has expired'
      });
    }

    // Check if already used (if we implement one-time use)
    if (session.status === 'completed') {
      console.log('✅ Already completed onboarding:', token);
      return res.status(410).json({
        success: false,
        error: 'This onboarding has already been completed'
      });
    }

    console.log('✅ Valid token for:', session.email);

    // Return session data for onboarding
    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        token: session.token,
        currentStep: session.currentStep || 'welcome',
        status: session.status,
        expiresAt: session.expiresAt
      },
      employee: {
        id: session.id, // Use session ID as temporary employee ID
        name: `${session.firstName} ${session.lastName}`,
        firstName: session.firstName,
        lastName: session.lastName,
        email: session.email,
        position: session.jobTitle,
        department: session.jobApplication?.jobPosting?.department || 'Unknown',
        startDate: new Date().toISOString(),
        manager: 'HR Team',
        organizationName: session.organizationName
      }
    });

  } catch (error) {
    console.error('❌ Error validating access code:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /onboarding/update-progress
 * @desc Update onboarding progress
 * @access Public (no auth required)
 */
router.put('/update-progress', async (req, res) => {
  try {
    const { token, currentStep, formData } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    console.log('📝 Updating onboarding progress:', token, 'step:', currentStep);

    // Update the session
    const updatedSession = await prisma.onboardingSession.update({
      where: { token },
      data: {
        currentStep,
        formData: formData || {},
        updatedAt: new Date()
      }
    });

    console.log('✅ Updated onboarding progress for:', token);

    return res.status(200).json({
      success: true,
      session: updatedSession
    });

  } catch (error) {
    console.error('❌ Error updating onboarding progress:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /onboarding/complete
 * @desc Complete onboarding and create employee record
 * @access Public (no auth required)
 */
router.post('/complete', async (req, res) => {
  try {
    const { token, finalData } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        error: 'Token is required'
      });
    }

    console.log('🎯 Completing onboarding for:', token);

    // Mark session as completed
    const completedSession = await prisma.onboardingSession.update({
      where: { token },
      data: {
        status: 'completed',
        completedAt: new Date(),
        formData: finalData || {}
      }
    });

    console.log('✅ Onboarding completed for:', token);

    // TODO: Create actual employee record here when they complete onboarding
    // This is where we would create the User and Employee records in the database

    return res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      session: completedSession
    });

  } catch (error) {
    console.error('❌ Error completing onboarding:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;