import express from 'express';
import { z } from 'zod';
import { FormGenerationService } from '@/services/forms/formGenerationService';
import { PDFGenerationService } from '@/services/forms/pdfGenerationService';
import { FormRepository } from '@/repositories/form.repository';
import { authenticate } from '@/middleware/auth/authMiddleware';
import { FormType, FormData, FormGenerationOptions } from '@/types/forms';
import { UserRole } from '@prisma/client';
import { Request, Response, NextFunction } from 'express';
import { translationService } from '@/utils/i18n/translationService';

const router = express.Router();
const formGenerationService = new FormGenerationService();
const pdfGenerationService = new PDFGenerationService();
const formRepository = new FormRepository();

// Helper function to get user locale
const getUserLocale = (req: Request): string => {
  return (req.user as any)?.preferredLanguage || 
         req.headers['accept-language']?.split(',')[0] || 
         'en';
};

// Helper function to send internationalized error responses
const sendError = (res: Response, key: string, locale: string, status = 500, details?: any) => {
  const response: any = {
    success: false,
    error: translationService.t(key, {}, locale)
  };
  
  if (details) {
    response.details = details;
  }
  
  res.status(status).json(response);
};

// Helper function to create role-based middleware
const requireRole = (roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const locale = getUserLocale(req);
    
    if (!req.user) {
      sendError(res, 'forms.messages.authenticationRequired', locale, 401);
      return;
    }
    
    if (!roles.includes(req.user.role)) {
      sendError(res, 'forms.messages.insufficientPermissions', locale, 403);
      return;
    }
    
    next();
  };
};

// Validation schemas
const generateFormSchema = z.object({
  employeeId: z.string().uuid(),
  formType: z.enum(['i9', 'w4', 'handbook_acknowledgment', 'policy_acknowledgment']),
  language: z.enum(['en', 'es']).default('en'),
  prefillFromOCR: z.boolean().default(false),
  ocrDocumentIds: z.array(z.string().uuid()).optional()
});

const updateFormSchema = z.object({
  data: z.record(z.any()),
  status: z.enum(['draft', 'in_progress', 'completed', 'submitted']).optional()
});

const validateFormSchema = z.object({
  data: z.record(z.any())
});

// In-memory storage for forms (for backward compatibility in tests)
const formsStorage = new Map<string, FormData>();

// Export for testing
export { formsStorage };

/**
 * POST /forms/generate
 * Generate a new form with pre-filled data
 */
router.post('/generate', authenticate, requireRole(['hr_admin', 'manager']), async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const validatedData = generateFormSchema.parse(req.body);
    
    const options: FormGenerationOptions = {
      employeeId: validatedData.employeeId,
      formType: validatedData.formType,
      language: validatedData.language,
      prefillFromOCR: validatedData.prefillFromOCR,
      ocrDocumentIds: validatedData.ocrDocumentIds
    };

    const generatedForm = await formGenerationService.generateForm(options);
    
    // Create form data record
    const formData: FormData = {
      formId: generatedForm.id,
      employeeId: generatedForm.employeeId,
      formType: generatedForm.formType,
      language: generatedForm.language,
      data: generatedForm.prefilledData,
      status: 'draft',
      version: generatedForm.template.version,
      submittedAt: undefined,
      reviewedAt: undefined,
      reviewedBy: undefined
    };

    // Store form data in database
    try {
      await formRepository.save(formData);
      
      // Also store in memory for backward compatibility with tests
      formsStorage.set(generatedForm.id, formData);
      
      res.status(201).json({
        success: true,
        data: {
          form: generatedForm,
          formData: formData
        }
      });
    } catch (dbError) {
      console.error('Database error, falling back to memory storage:', dbError);
      // Fallback to memory storage
      formsStorage.set(generatedForm.id, formData);
      
      res.status(201).json({
        success: true,
        data: {
          form: generatedForm,
          formData: formData
        }
      });
    }
  } catch (error) {
    console.error('Error generating form:', error);
    
    if (error instanceof z.ZodError) {
      sendError(res, 'forms.messages.validationError', locale, 400, error.errors);
      return;
    }

    sendError(res, 'forms.errors.generationFailed', locale, 500);
  }
});

/**
 * GET /forms/:id
 * Retrieve a form by ID
 */
router.get('/:id', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    
    // Try to get from database first
    let formData = await formRepository.findById(formId);
    
    // Fallback to memory storage if not found in database
    if (!formData) {
      formData = formsStorage.get(formId) || null;
    }

    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    // Check access permissions
    const user = req.user;
    if (user && user.role === 'employee' && formData.employeeId !== (user as any).employeeId) {
      sendError(res, 'forms.errors.accessDenied', locale, 403);
      return;
    }

    // Get form template
    const template = formGenerationService.getFormTemplate(formData.formType, formData.language);
    
    // Validate current form data
    const validation = formGenerationService.validateFormData(formData);
    
    res.json({
      success: true,
      data: {
        formData,
        template,
        validation,
        completionPercentage: formGenerationService.calculateCompletionPercentage(formData)
      }
    });
  } catch (error) {
    console.error('Error retrieving form:', error);
    sendError(res, 'forms.errors.retrievalFailed', locale, 500);
  }
});

/**
 * PUT /forms/:id
 * Update form data
 */
router.put('/:id', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const validatedData = updateFormSchema.parse(req.body);
    
    // Try to get from database first
    let existingForm = await formRepository.findById(formId);
    
    // Fallback to memory storage if not found in database
    if (!existingForm) {
      existingForm = formsStorage.get(formId) || null;
    }
    
    if (!existingForm) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    // Check access permissions
    const user = req.user;
    if (user && user.role === 'employee' && existingForm.employeeId !== (user as any).employeeId) {
      sendError(res, 'forms.errors.accessDenied', locale, 403);
      return;
    }

    // Update form data
    const updatedForm: FormData = {
      ...existingForm,
      data: { ...existingForm.data, ...validatedData.data },
      status: validatedData.status || existingForm.status
    };

    // Auto-calculate dependent fields for W-4
    if (updatedForm.formType === 'w4') {
      updatedForm.data = formGenerationService.autoCalculateW4Dependents(updatedForm.data);
    }

    // Store updated form in database
    try {
      await formRepository.save(updatedForm);
      
      // Also update memory storage for backward compatibility
      formsStorage.set(formId, updatedForm);
    } catch (dbError) {
      console.error('Database error, falling back to memory storage:', dbError);
      // Fallback to memory storage
      formsStorage.set(formId, updatedForm);
    }

    // Validate updated form
    const validation = formGenerationService.validateFormData(updatedForm);

    res.json({
      success: true,
      data: {
        formData: updatedForm,
        validation,
        completionPercentage: formGenerationService.calculateCompletionPercentage(updatedForm)
      }
    });
  } catch (error) {
    console.error('Error updating form:', error);
    
    if (error instanceof z.ZodError) {
      sendError(res, 'forms.messages.validationError', locale, 400, error.errors);
      return;
    }

    sendError(res, 'forms.errors.updateFailed', locale, 500);
  }
});

/**
 * POST /forms/:id/validate
 * Validate form data without saving
 */
router.post('/:id/validate', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const validatedData = validateFormSchema.parse(req.body);
    
    const existingForm = formsStorage.get(formId);
    if (!existingForm) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    // Create temporary form data for validation
    const tempFormData: FormData = {
      ...existingForm,
      data: { ...existingForm.data, ...validatedData.data }
    };

    // Auto-calculate dependent fields for W-4
    if (tempFormData.formType === 'w4') {
      tempFormData.data = formGenerationService.autoCalculateW4Dependents(tempFormData.data);
    }

    // Validate form data
    const validation = formGenerationService.validateFormData(tempFormData);

    res.json({
      success: true,
      data: {
        validation,
        completionPercentage: formGenerationService.calculateCompletionPercentage(tempFormData),
        calculatedData: tempFormData.data
      }
    });
  } catch (error) {
    console.error('Error validating form:', error);
    
    if (error instanceof z.ZodError) {
      sendError(res, 'forms.messages.validationError', locale, 400, error.errors);
      return;
    }

    sendError(res, 'forms.errors.validationError', locale, 500);
  }
});

/**
 * POST /forms/:id/submit
 * Submit form for review
 */
router.post('/:id/submit', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const formData = formsStorage.get(formId);

    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    // Check access permissions
    const user = req.user;
    if (user && user.role === 'employee' && formData.employeeId !== (user as any).employeeId) {
      sendError(res, 'forms.errors.accessDenied', locale, 403);
      return;
    }

    // Validate form before submission
    const validation = formGenerationService.validateFormData(formData);
    
    if (!validation.isValid) {
      sendError(res, 'forms.errors.validationFailed', locale, 400, {
        errors: validation.errors,
        missingFields: validation.requiredFieldsMissing
      });
      return;
    }

    // Update form status
    const submittedForm: FormData = {
      ...formData,
      status: 'submitted',
      submittedAt: new Date()
    };

    formsStorage.set(formId, submittedForm);

    res.json({
      success: true,
      data: {
        formData: submittedForm,
        message: translationService.t('forms.messages.submitSuccess', {}, locale)
      }
    });
  } catch (error) {
    console.error('Error submitting form:', error);
    sendError(res, 'forms.errors.submitFailed', locale, 500);
  }
});

/**
 * POST /forms/:id/approve
 * Approve submitted form (HR/Manager only)
 */
router.post('/:id/approve', authenticate, requireRole(['hr_admin', 'manager']), async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const formData = formsStorage.get(formId);

    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    if (formData.status !== 'submitted') {
      sendError(res, 'forms.errors.mustBeSubmittedForApproval', locale, 400);
      return;
    }

    // Update form status
    const approvedForm: FormData = {
      ...formData,
      status: 'approved',
      reviewedAt: new Date(),
      reviewedBy: req.user?.userId || 'unknown'
    };

    formsStorage.set(formId, approvedForm);

    res.json({
      success: true,
      data: {
        formData: approvedForm,
        message: translationService.t('forms.messages.approveSuccess', {}, locale)
      }
    });
  } catch (error) {
    console.error('Error approving form:', error);
    sendError(res, 'forms.errors.approveFailed', locale, 500);
  }
});

/**
 * POST /forms/:id/reject
 * Reject submitted form with comments (HR/Manager only)
 */
router.post('/:id/reject', authenticate, requireRole(['hr_admin', 'manager']), async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const { comments } = req.body;
    
    const formData = formsStorage.get(formId);

    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    if (formData.status !== 'submitted') {
      sendError(res, 'forms.errors.mustBeSubmittedForRejection', locale, 400);
      return;
    }

    // Update form status
    const rejectedForm: FormData = {
      ...formData,
      status: 'rejected',
      reviewedAt: new Date(),
      reviewedBy: req.user?.userId || 'unknown',
      validationErrors: { 
        general: comments || translationService.t('forms.messages.rejectSuccess', {}, locale)
      }
    };

    formsStorage.set(formId, rejectedForm);

    res.json({
      success: true,
      data: {
        formData: rejectedForm,
        message: translationService.t('forms.messages.rejectSuccess', {}, locale)
      }
    });
  } catch (error) {
    console.error('Error rejecting form:', error);
    sendError(res, 'forms.errors.rejectFailed', locale, 500);
  }
});

/**
 * GET /forms/:id/pdf
 * Generate and download PDF version of the form
 */
router.get('/:id/pdf', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const formData = formsStorage.get(formId);

    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    // Check access permissions
    const user = req.user;
    if (user && user.role === 'employee' && formData.employeeId !== (user as any).employeeId) {
      sendError(res, 'forms.errors.accessDenied', locale, 403);
      return;
    }

    // Get form template
    const template = formGenerationService.getFormTemplate(formData.formType, formData.language);
    
    // Generate PDF
    const outputPath = `${formId}-${formData.formType}-${Date.now()}.pdf`;
    const pdfPath = await pdfGenerationService.generateFormPDF({
      formData,
      template,
      outputPath,
      includeInstructions: true,
      watermark: formData.status === 'draft' ? 'DRAFT' : undefined
    });

    // Send PDF file
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${formData.formType}-${formData.employeeId}.pdf"`);
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error generating PDF:', error);
    sendError(res, 'forms.errors.pdfGenerationFailed', locale, 500);
  }
});

/**
 * GET /forms/employee/:employeeId
 * Get all forms for a specific employee
 */
router.get('/employee/:employeeId', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const employeeId = req.params.employeeId;
    
    // Check access permissions
    const user = req.user;
    if (user && user.role === 'employee' && employeeId !== (user as any).employeeId) {
      sendError(res, 'forms.errors.accessDenied', locale, 403);
      return;
    }

    // Get forms from database first
    let employeeForms = await formRepository.findByEmployeeId(employeeId);
    
    // Fallback to memory storage if no forms found in database
    if (employeeForms.length === 0) {
      employeeForms = Array.from(formsStorage.values())
        .filter(form => form.employeeId === employeeId);
    }
    
    // Add completion percentage
    const formsWithCompletion = employeeForms.map(form => ({
      ...form,
      completionPercentage: formGenerationService.calculateCompletionPercentage(form)
    }));

    res.json({
      success: true,
      data: {
        forms: formsWithCompletion,
        count: formsWithCompletion.length
      }
    });
  } catch (error) {
    console.error('Error retrieving employee forms:', error);
    sendError(res, 'forms.errors.formRetrievalFailed', locale, 500);
  }
});

/**
 * GET /forms/templates/:formType
 * Get form template by type and language
 */
router.get('/templates/:formType', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formType = req.params.formType as FormType;
    const language = (req.query.language as 'en' | 'es') || locale as 'en' | 'es' || 'en';

    const template = formGenerationService.getFormTemplate(formType, language);

    res.json({
      success: true,
      data: {
        template
      }
    });
  } catch (error) {
    console.error('Error retrieving template:', error);
    const errorMessage = error instanceof Error ? error.message : translationService.t('forms.errors.retrievalFailed', {}, locale);
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * GET /forms/:id/suggestions/:fieldName
 * Get field suggestions for auto-completion
 */
router.get('/:id/suggestions/:fieldName', authenticate, async (req, res): Promise<void> => {
  const locale = getUserLocale(req);
  
  try {
    const formId = req.params.id;
    const fieldName = req.params.fieldName;
    const partialValue = req.query.q as string || '';

    const formData = formsStorage.get(formId);
    if (!formData) {
      sendError(res, 'forms.errors.notFound', locale, 404);
      return;
    }

    const suggestions = formGenerationService.getFieldSuggestions(
      formData.formType,
      fieldName,
      partialValue
    );

    res.json({
      success: true,
      data: {
        suggestions
      }
    });
  } catch (error) {
    console.error('Error getting suggestions:', error);
    sendError(res, 'forms.errors.suggestionsFailed', locale, 500);
  }
});

export default router;