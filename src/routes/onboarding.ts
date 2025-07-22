import express from 'express';
import { z } from 'zod';
import { OnboardingService } from '@/services/onboarding/onboardingService';
import { authenticate, requirePermission } from '@/middleware/auth/authMiddleware';
import { PERMISSIONS } from '@/types/auth';
import { translationService, ONBOARDING_SUCCESS_KEYS, ONBOARDING_ERROR_KEYS } from '@/utils/i18n/translationService';
import { EmailService } from '@/services/email/emailService';

const router = express.Router();
const onboardingService = new OnboardingService();
const emailService = new EmailService();

// Validation schemas
const startOnboardingSchema = z.object({
  employeeId: z.string().uuid(),
  token: z.string().min(6),
  languagePreference: z.enum(['en', 'es'] as const).optional(),
});

const updateProgressSchema = z.object({
  currentStep: z.string().optional(),
  formData: z.any().optional(),
  languagePreference: z.enum(['en', 'es'] as const).optional(),
});

const submitOnboardingSchema = z.object({
  formData: z.any(),
  signatures: z.array(z.object({
    documentType: z.string(),
    signatureData: z.string(),
    timestamp: z.string().transform((str) => new Date(str)),
  })).optional(),
});

// Helper function to extract user locale from request
const getUserLocale = (req: express.Request): string => {
  return req.user?.languagePreference || 'en';
};

/**
 * @route POST /onboarding/validate-token
 * @desc Validate token and return session/employee info
 * @access Public (with token)
 */
router.post('/validate-token', async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    const validateTokenSchema = z.object({
      token: z.string().min(6),
    });
    
    // Validate request body
    const validatedData = validateTokenSchema.parse(req.body);
    console.log('🔍 Validating token:', validatedData.token);
    
    // Validate token
    const validation = await onboardingService.validateToken(validatedData.token);
    console.log('✅ Validation result:', { isValid: validation.isValid, isExpired: validation.isExpired });
    
    if (!validation.isValid || !validation.session) {
      console.log('❌ Validation failed:', validation.error);
      return res.status(400).json({
        success: false,
        error: validation.error || 'Invalid token',
        isExpired: validation.isExpired,
      });
    }
    
    // Safely extract employee data with fallbacks
    const session = validation.session;
    const employee = session.employee;
    const user = employee?.user;
    
    console.log('📋 Session data:', {
      sessionId: session.id,
      employeeId: session.employeeId,
      hasEmployee: !!employee,
      hasUser: !!user
    });
    
    return res.status(200).json({
      success: true,
      session: {
        id: session.id,
        employeeId: session.employeeId,
        token: session.token,
        languagePreference: session.languagePreference || 'en',
        currentStep: session.currentStep || 'welcome',
        formData: session.formData || {},
        status: session.status,
        expiresAt: session.expiresAt,
      },
      employee: {
        id: employee?.id || '',
        name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'Demo Employee',
        position: employee?.position || 'Employee',
        department: employee?.department || 'General',
        startDate: employee?.hireDate || new Date().toISOString(),
        manager: '',
      },
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    console.error('💥 Error in validate-code:', error);
    console.error('📚 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        details: error.message,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Unknown error occurred',
      });
    }
  }
});

/**
 * @route POST /onboarding/start
 * @desc Start onboarding process with access code validation
 * @access Public (with access code)
 */
router.post('/start', async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    // Validate request body
    const validatedData = startOnboardingSchema.parse(req.body);
    
    // Validate access code first
    const validation = await onboardingService.validateToken(validatedData.token);
    
    if (!validation.isValid) {
      return res.status(400).json({
        error: validation.error,
        isExpired: validation.isExpired,
      });
    }
    
    // Check if the access code matches the employee ID
    if (validation.session?.employeeId !== validatedData.employeeId) {
      return res.status(400).json({
        error: translationService.t(ONBOARDING_ERROR_KEYS.TOKEN_EMPLOYEE_MISMATCH, {}, locale),
      });
    }
    
    // Update language preference if provided
    if (validatedData.languagePreference && 
        validatedData.languagePreference !== validation.session.languagePreference) {
      await onboardingService.updateProgress(validation.session.id, {
        languagePreference: validatedData.languagePreference,
      });
    }
    
    return res.status(200).json({
      message: translationService.t(ONBOARDING_SUCCESS_KEYS.ONBOARDING_STARTED, {}, locale),
      session: {
        id: validation.session.id,
        employeeId: validation.session.employeeId,
        languagePreference: validatedData.languagePreference || validation.session.languagePreference,
        currentStep: validation.session.currentStep,
        formData: validation.session.formData,
        expiresAt: validation.session.expiresAt,
        employee: {
          firstName: validation.session.employee?.user?.firstName || 'Demo',
          lastName: validation.session.employee?.user?.lastName || 'Employee',
          organizationName: validation.session.employee?.user?.organization?.name || 'Organization',
        },
      },
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: translationService.t('common.errors.validation', {}, locale),
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    } else {
      return res.status(500).json({
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

/**
 * @route GET /onboarding/session/:id
 * @desc Get onboarding session progress
 * @access Public (session-based) or Private (authenticated)
 */
router.get('/session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    // For authenticated users, use their ID as requester
    // For unauthenticated users (during onboarding), we'll allow access to their own session
    const requesterId = req.user?.userId || 'onboarding-session';
    
    // Get session
    const session = await onboardingService.getSession(id, requesterId);
    
    return res.status(200).json({
      session: {
        id: session.id,
        employeeId: session.employeeId,
        languagePreference: session.languagePreference,
        currentStep: session.currentStep,
        formData: session.formData,
        status: session.status,
        expiresAt: session.expiresAt,
        completedAt: session.completedAt,
        employee: {
          firstName: session.employee.user.firstName,
          lastName: session.employee.user.lastName,
          email: session.employee.user.email,
          organizationName: session.employee.user.organization.name,
        },
      },
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    } else {
      return res.status(500).json({
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

/**
 * @route PUT /onboarding/session/:id
 * @desc Update onboarding session progress
 * @access Public (session-based) or Private (authenticated)
 */
router.put('/session/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    // Validate request body
    const validatedData = updateProgressSchema.parse(req.body);
    
    // Update progress
    const session = await onboardingService.updateProgress(id, validatedData);
    
    return res.status(200).json({
      message: translationService.t(ONBOARDING_SUCCESS_KEYS.PROGRESS_UPDATED, {}, locale),
      session: {
        id: session.id,
        employeeId: session.employeeId,
        languagePreference: session.languagePreference,
        currentStep: session.currentStep,
        formData: session.formData,
        status: session.status,
        expiresAt: session.expiresAt,
        updatedAt: session.updatedAt,
      },
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: translationService.t('common.errors.validation', {}, locale),
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    } else {
      return res.status(500).json({
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

/**
 * @route POST /onboarding/submit
 * @desc Submit completed onboarding for review
 * @access Public (session-based)
 */
router.post('/submit', async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    // Validate request body
    const validatedData = submitOnboardingSchema.parse(req.body);
    
    // Extract session ID from form data or require it in the request
    const sessionId = validatedData.formData?.sessionId || req.body.sessionId;
    
    if (!sessionId) {
      return res.status(400).json({
        error: translationService.t(ONBOARDING_ERROR_KEYS.SESSION_ID_REQUIRED, {}, locale),
      });
    }
    
    // First, update the session with final form data
    await onboardingService.updateProgress(sessionId, {
      currentStep: 'review',
      formData: validatedData.formData,
    });
    
    // Complete the onboarding session
    const completedSession = await onboardingService.completeSession(sessionId);
    
    // Send notification to manager for review
    try {
      const { notificationService } = await import('@/services/notification/notificationService');
      
      // Get the employee's manager (assuming there's a managerId field or we can derive it)
      // For now, we'll notify all managers in the same organization
      // TODO: Implement proper manager lookup
      
      await notificationService.notifyUser('manager-user-id', {
        type: 'system',
        title: translationService.t('onboarding.notifications.completedTitle', {
          employeeName: `${completedSession.employee.user.firstName} ${completedSession.employee.user.lastName}`
        }, locale),
        content: translationService.t('onboarding.notifications.completedMessage', {
          employeeName: `${completedSession.employee.user.firstName} ${completedSession.employee.user.lastName}`,
          organizationName: completedSession.employee.user.organization.name
        }, locale),
        priority: 'high',
        data: {
          sessionId: completedSession.id,
          employeeId: completedSession.employeeId,
          action: 'review_onboarding'
        }
      });
    } catch (notificationError) {
      console.error('Failed to send notification:', notificationError);
      // Don't fail the entire process if notification fails
    }
    
    return res.status(200).json({
      message: translationService.t(ONBOARDING_SUCCESS_KEYS.ONBOARDING_SUBMITTED, {}, locale),
      session: {
        id: completedSession.id,
        employeeId: completedSession.employeeId,
        status: completedSession.status,
        completedAt: completedSession.completedAt,
        employee: {
          firstName: completedSession.employee.user.firstName,
          lastName: completedSession.employee.user.lastName,
          email: completedSession.employee.user.email,
          organizationName: completedSession.employee.user.organization.name,
        },
      },
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: translationService.t('common.errors.validation', {}, locale),
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    } else {
      return res.status(500).json({
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

/**
 * @route POST /onboarding/session/:id/forms
 * @desc Submit I-9 and W-4 forms during onboarding
 * @access Public (session-based)
 */
router.post('/session/:id/forms', async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    const { id: sessionId } = req.params;
    
    const submitFormsSchema = z.object({
      i9Data: z.any().optional(),
      w4Data: z.any().optional(),
      language: z.enum(['en', 'es'] as const).default('en'),
    });
    
    // Validate request body
    const validatedData = submitFormsSchema.parse(req.body);
    
    // Validate onboarding session
    const session = await onboardingService.getSession(sessionId, 'onboarding-session');
    
    if (!session || session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_ACTIVE, {}, locale),
      });
    }
    
    // Store form data in the session
    const formData = {
      i9Data: validatedData.i9Data,
      w4Data: validatedData.w4Data,
      language: validatedData.language,
      submittedAt: new Date().toISOString()
    };
    
    // Update session with form data
    await onboardingService.updateProgress(sessionId, {
      currentStep: 'signature',
      formData: {
        ...session.formData,
        forms: formData
      }
    });
    
    return res.status(200).json({
      success: true,
      submissionId: `${sessionId}-forms`,
      message: translationService.t('forms.messages.submitSuccess', {}, locale),
      data: {
        formData,
        nextStep: 'signature'
      }
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: translationService.t('common.errors.validation', {}, locale),
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

/**
 * @route POST /onboarding/session/:id/signature
 * @desc Submit digital signature during onboarding
 * @access Public (session-based)
 */
router.post('/session/:id/signature', async (req, res) => {
  try {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    const { id: sessionId } = req.params;
    
    const submitSignatureSchema = z.object({
      signatures: z.record(z.string()).optional(),
      signatureBase64: z.string().optional(),
      documentIds: z.array(z.string()).optional(),
    }).refine(data => data.signatures || data.signatureBase64, {
      message: "Either signatures object or signatureBase64 string is required"
    });
    
    // Validate request body
    const validatedData = submitSignatureSchema.parse(req.body);
    
    // Validate onboarding session
    const session = await onboardingService.getSession(sessionId, 'onboarding-session');
    
    if (!session || session.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        error: translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_ACTIVE, {}, locale),
      });
    }
    
    // Store signature data in the session
    const signatureData = {
      signatures: validatedData.signatures || { main: validatedData.signatureBase64 },
      signatureBase64: validatedData.signatureBase64, // Keep for backward compatibility
      documentIds: validatedData.documentIds || [],
      signedAt: new Date().toISOString()
    };
    
    // Update session with signature data
    await onboardingService.updateProgress(sessionId, {
      currentStep: 'complete',
      formData: {
        ...session.formData,
        signature: signatureData
      }
    });
    
    return res.status(200).json({
      success: true,
      message: translationService.t('signatures.messages.signSuccess', {}, locale),
      data: {
        signatureData,
        nextStep: 'complete'
      }
    });
  } catch (error) {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: translationService.t('common.errors.validation', {}, locale),
        details: error.errors,
      });
    } else if (error instanceof Error) {
      return res.status(400).json({
        success: false,
        error: error.message,
      });
    } else {
      return res.status(500).json({
        success: false,
        error: translationService.t('common.errors.unexpected', {}, locale),
      });
    }
  }
});

// Additional authenticated endpoints for managers and HR

/**
 * @route POST /onboarding/session/:id/approve
 * @desc Manager approves completed onboarding
 * @access Private (Manager, HR Admin)
 */
router.post('/session/:id/approve',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id: sessionId } = req.params;
      
      const approveSchema = z.object({
        comments: z.string().optional(),
        approverType: z.enum(['manager', 'hr_admin']).default('manager'),
      });
      
      // Validate request body
      const validatedData = approveSchema.parse(req.body);
      
      // Get session
      const session = await onboardingService.getSession(sessionId, req.user!.userId);
      
      if (session.status !== 'completed') {
        return res.status(400).json({
          error: 'Onboarding session must be completed before approval',
        });
      }
      
      // Update session with approval
      const approvalData: any = {
        status: validatedData.approverType === 'hr_admin' ? 'approved' : 'manager_approved',
        formData: {
          ...session.formData,
          [`${validatedData.approverType}_approval`]: {
            approvedBy: req.user!.userId,
            approvedAt: new Date().toISOString(),
            comments: validatedData.comments
          }
        }
      };
      
      await onboardingService.updateProgress(sessionId, approvalData);
      
      // Send notifications
      try {
        const { notificationService } = await import('@/services/notification/notificationService');
        
        if (validatedData.approverType === 'manager') {
          // Notify HR for final approval
          await notificationService.notifyUser('hr-admin-user-id', {
            type: 'system',
            title: translationService.t('onboarding.notifications.approvedTitle', {
              employeeName: `${session.employee.user.firstName} ${session.employee.user.lastName}`
            }, locale),
            content: translationService.t('onboarding.notifications.approvedMessage', {
              employeeName: `${session.employee.user.firstName} ${session.employee.user.lastName}`
            }, locale),
            priority: 'high',
            data: {
              sessionId: session.id,
              employeeId: session.employeeId,
              action: 'hr_final_approval'
            }
          });
        } else {
          // Final HR approval - activate employee
          // TODO: Implement employee activation logic
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return res.status(200).json({
        message: translationService.t(ONBOARDING_SUCCESS_KEYS.SESSION_COMPLETED, {}, locale),
        session: {
          id: session.id,
          status: approvalData.status,
          approvedBy: req.user!.userId,
          approvedAt: new Date()
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /onboarding/session/:id/reject
 * @desc Manager rejects completed onboarding
 * @access Private (Manager, HR Admin)
 */
router.post('/session/:id/reject',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id: sessionId } = req.params;
      
      const rejectSchema = z.object({
        comments: z.string().min(1, 'Rejection reason is required'),
        rejectorType: z.enum(['manager', 'hr_admin']).default('manager'),
      });
      
      // Validate request body
      const validatedData = rejectSchema.parse(req.body);
      
      // Get session
      const session = await onboardingService.getSession(sessionId, req.user!.userId);
      
      if (!['completed', 'manager_approved'].includes(session.status)) {
        return res.status(400).json({
          error: 'Onboarding session must be completed before rejection',
        });
      }
      
      // Update session with rejection
      const rejectionData: any = {
        status: 'rejected',
        formData: {
          ...session.formData,
          rejection: {
            rejectedBy: req.user!.userId,
            rejectedAt: new Date().toISOString(),
            comments: validatedData.comments,
            rejectorType: validatedData.rejectorType
          }
        }
      };
      
      await onboardingService.updateProgress(sessionId, rejectionData);
      
      // Notify employee about rejection
      try {
        const { notificationService } = await import('@/services/notification/notificationService');
        
        // TODO: Get employee's user ID from the employee record
        await notificationService.notifyUser('employee-user-id', {
          type: 'system',
          title: translationService.t('onboarding.notifications.rejectedTitle', {
            employeeName: `${session.employee.user.firstName} ${session.employee.user.lastName}`
          }, locale),
          content: translationService.t('onboarding.notifications.rejectedMessage', {
            employeeName: `${session.employee.user.firstName} ${session.employee.user.lastName}`
          }, locale),
          priority: 'high',
          data: {
            sessionId: session.id,
            employeeId: session.employeeId,
            action: 'onboarding_rejected',
            comments: validatedData.comments
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return res.status(200).json({
        message: 'Onboarding rejected successfully',
        session: {
          id: session.id,
          status: 'rejected',
          rejectedBy: req.user!.userId,
          rejectedAt: new Date(),
          comments: validatedData.comments
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /onboarding/create-session
 * @desc Create a new onboarding session for an employee
 * @access Private (Manager, HR Admin)
 */
router.post('/create-session',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      
      const createSessionSchema = z.object({
        employeeId: z.string().uuid(),
        languagePreference: z.enum(['en', 'es'] as const).optional(),
        expirationHours: z.number().positive().optional(),
      });
      
      // Validate request body
      const validatedData = createSessionSchema.parse(req.body);
      
      // Create onboarding session
      const session = await onboardingService.createSession(
        validatedData,
        req.user!.userId
      );
      
      // Send onboarding invitation email
      try {
        const onboardingUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/onboarding?token=${session.token}`;
        const employeeName = `${session.employee.user.firstName} ${session.employee.user.lastName}`;
        
        await emailService.sendOnboardingInvitation(
          session.employee.user.email,
          employeeName,
          'Employee', // Fixed: use default position since property doesn't exist
          session.employee.user.organization.name,
          onboardingUrl,
          session.token,
          undefined, // No review notes for direct creation
          session.languagePreference
        );
        
        console.log(`📧 Onboarding invitation email sent to ${session.employee.user.email} with token: ${session.token}`);
      } catch (emailError) {
        console.error('Failed to send onboarding invitation email:', emailError);
        // Continue with the response even if email fails
      }
      
      return res.status(201).json({
        message: translationService.t(ONBOARDING_SUCCESS_KEYS.SESSION_CREATED, {}, locale),
        session: {
          id: session.id,
          employeeId: session.employeeId,
          token: session.token,
          languagePreference: session.languagePreference,
          expiresAt: session.expiresAt,
          employee: {
            firstName: session.employee.user.firstName,
            lastName: session.employee.user.lastName,
            email: session.employee.user.email,
            organizationName: session.employee.user.organization.name,
          },
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /onboarding/sessions
 * @desc List onboarding sessions with filters
 * @access Private (Manager, HR Admin)
 */
router.get('/sessions',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      
      const listSessionsSchema = z.object({
        page: z.string().transform((str) => parseInt(str, 10)).optional(),
        limit: z.string().transform((str) => parseInt(str, 10)).optional(),
        employeeId: z.string().uuid().optional(),
        status: z.enum(['in_progress', 'completed', 'expired', 'cancelled'] as const).optional(),
        organizationId: z.string().uuid().optional(),
        expired: z.string().transform((str) => str === 'true').optional(),
      });
      
      // Validate query parameters
      const validatedQuery = listSessionsSchema.parse(req.query);
      
      // For managers, restrict to their organization unless they're HR admin
      const filters = {
        ...validatedQuery,
        ...(req.user!.role !== 'hr_admin' && {
          organizationId: req.user!.organizationId,
        }),
      };
      
      // List sessions
      const result = await onboardingService.listSessions(
        filters,
        { page: validatedQuery.page, limit: validatedQuery.limit },
        req.user!.userId
      );
      
      return res.status(200).json({
        sessions: result.data.map(session => ({
          id: session.id,
          employeeId: session.employeeId,
          token: session.token,
          languagePreference: session.languagePreference,
          currentStep: session.currentStep,
          status: session.status,
          expiresAt: session.expiresAt,
          completedAt: session.completedAt,
          createdAt: session.createdAt,
          employee: {
            firstName: session.employee.user.firstName,
            lastName: session.employee.user.lastName,
            email: session.employee.user.email,
            organizationName: session.employee.user.organization.name,
          },
        })),
        pagination: result.pagination,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /onboarding/employee/:employeeId/sessions
 * @desc Get onboarding sessions for a specific employee
 * @access Private (Manager, HR Admin)
 */
router.get('/employee/:employeeId/sessions',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { employeeId } = req.params;
      
      // Get sessions for employee
      const sessions = await onboardingService.getSessionsByEmployee(
        employeeId,
        req.user!.userId
      );
      
      return res.status(200).json({
        sessions: sessions.map(session => ({
          id: session.id,
          employeeId: session.employeeId,
          token: session.token,
          languagePreference: session.languagePreference,
          currentStep: session.currentStep,
          status: session.status,
          expiresAt: session.expiresAt,
          completedAt: session.completedAt,
          createdAt: session.createdAt,
          employee: {
            firstName: session.employee.user.firstName,
            lastName: session.employee.user.lastName,
            email: session.employee.user.email,
            organizationName: session.employee.user.organization.name,
          },
        })),
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /onboarding/session/:id/extend
 * @desc Extend onboarding session expiration
 * @access Private (Manager, HR Admin)
 */
router.post('/session/:id/extend',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      const extendSessionSchema = z.object({
        additionalHours: z.number().positive(),
      });
      
      // Validate request body
      const validatedData = extendSessionSchema.parse(req.body);
      
      // Extend session
      const session = await onboardingService.extendSession(
        id,
        validatedData.additionalHours,
        req.user!.userId
      );
      
      return res.status(200).json({
        message: translationService.t(ONBOARDING_SUCCESS_KEYS.SESSION_EXTENDED, {}, locale),
        session: {
          id: session.id,
          expiresAt: session.expiresAt,
          status: session.status,
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /onboarding/session/:id/cancel
 * @desc Cancel onboarding session
 * @access Private (Manager, HR Admin)
 */
router.post('/session/:id/cancel',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      // Cancel session
      await onboardingService.cancelSession(id, req.user!.userId);
      
      return res.status(200).json({
        message: translationService.t(ONBOARDING_SUCCESS_KEYS.SESSION_CANCELLED, {}, locale),
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /onboarding/pending-reviews
 * @desc Get onboarding sessions pending manager review
 * @access Private (Manager, HR Admin)
 */
router.get('/pending-reviews',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      
      // For managers, restrict to their organization unless they're HR admin
      const filters = {
        status: 'completed' as const,
        ...(req.user!.role !== 'hr_admin' && {
          organizationId: req.user!.organizationId,
        }),
      };
      
      // Get sessions pending review
      const result = await onboardingService.listSessions(
        filters,
        { page: 1, limit: 100 }, // Get all pending reviews
        req.user!.userId
      );
      
      // Transform sessions for review interface
      const pendingReviews = result.data
        .filter(session => !session.formData?.manager_approval && !session.formData?.rejection)
        .map(session => ({
          id: session.id,
          employee: {
            firstName: session.employee.user.firstName,
            lastName: session.employee.user.lastName,
            email: session.employee.user.email,
          },
          status: 'pending_review' as const,
          submittedAt: session.completedAt || session.createdAt,
          documents: session.formData?.documents || [],
          forms: {
            i9Data: session.formData?.forms?.i9Data,
            w4Data: session.formData?.forms?.w4Data,
          },
          signatures: session.formData?.signature?.signatures || {},
          createdAt: session.createdAt,
          completedAt: session.completedAt,
        }));
      
      return res.status(200).json({
        success: true,
        data: pendingReviews,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /onboarding/session/:id/review
 * @desc Submit manager review for completed onboarding
 * @access Private (Manager, HR Admin)
 */
router.post('/session/:id/review',
  authenticate,
  requirePermission([PERMISSIONS.INITIATE_ONBOARDING, PERMISSIONS.MANAGE_ALL_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id: sessionId } = req.params;
      
      const reviewSchema = z.object({
        action: z.enum(['approve', 'reject', 'request_changes']),
        notes: z.string().optional(),
        reviewedBy: z.string(),
      });
      
      // Validate request body
      const validatedData = reviewSchema.parse(req.body);
      
      // Get session
      const session = await onboardingService.getSession(sessionId, req.user!.userId);
      
      if (session.status !== 'completed') {
        return res.status(400).json({
          success: false,
          error: 'Onboarding session must be completed before review',
        });
      }
      
      // Update session based on action
      let updateData: any;
      
      switch (validatedData.action) {
        case 'approve':
          updateData = {
            formData: {
              ...session.formData,
              manager_approval: {
                approvedBy: req.user!.userId,
                approvedAt: new Date().toISOString(),
                notes: validatedData.notes || '',
                status: 'manager_approved'
              }
            }
          };
          break;
          
        case 'reject':
          updateData = {
            status: 'rejected',
            formData: {
              ...session.formData,
              rejection: {
                rejectedBy: req.user!.userId,
                rejectedAt: new Date().toISOString(),
                notes: validatedData.notes || '',
                rejectorType: 'manager'
              }
            }
          };
          break;
          
        case 'request_changes':
          updateData = {
            status: 'requires_changes',
            formData: {
              ...session.formData,
              change_request: {
                requestedBy: req.user!.userId,
                requestedAt: new Date().toISOString(),
                notes: validatedData.notes || ''
              }
            }
          };
          break;
      }
      
      await onboardingService.updateProgress(sessionId, updateData);
      
      // Send notifications based on action
      try {
        if (validatedData.action === 'approve') {
          // Notify HR for final approval if this is a manager approval
          console.log('📧 Manager approved onboarding - notifying HR for final approval');
        } else if (validatedData.action === 'request_changes') {
          // Notify employee about requested changes
          console.log('📧 Manager requested changes - notifying employee');
        } else if (validatedData.action === 'reject') {
          // Notify employee about rejection
          console.log('📧 Manager rejected onboarding - notifying employee');
        }
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
      }
      
      return res.status(200).json({
        success: true,
        message: `Onboarding ${validatedData.action.replace('_', ' ')} submitted successfully`,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          success: false,
          error: error.message,
        });
      } else {
        return res.status(500).json({
          success: false,
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

export default router;