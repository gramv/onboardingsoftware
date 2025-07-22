import express from 'express';
import { DocumentService, SignDocumentRequest } from '@/services/document/documentService';
import { authenticate } from '@/middleware/auth/authMiddleware';
import { uploadSingle } from '@/middleware/upload';
import { DocumentType, PrismaClient } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import { DigitalSignature } from '@/types/signature';
import { translationService } from '@/utils/i18n/translationService';

const router = express.Router();
const documentService = new DocumentService();
const prisma = new PrismaClient();


// Validation schemas
const uploadDocumentSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID'),
  documentType: z.nativeEnum(DocumentType, { errorMap: () => ({ message: 'Invalid document type' }) }),
  documentName: z.string().optional()
});

const documentIdSchema = z.object({
  id: z.string().uuid('Invalid document ID')
});

const listDocumentsSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID').optional(),
  documentType: z.nativeEnum(DocumentType).optional()
});

const onboardingUploadSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  documentType: z.nativeEnum(DocumentType, { errorMap: () => ({ message: 'Invalid document type' }) }),
  documentName: z.string().optional()
});

/**
 * POST /documents/onboarding-upload
 * Upload a document during onboarding process (no authentication required)
 */
router.post('/onboarding-upload', (req, res, next) => {
  // Use the onboarding-specific upload middleware that doesn't require auth
  const { createOnboardingUploadMiddleware } = require('@/middleware/upload');
  const uploadSingle = createOnboardingUploadMiddleware().single('document');
  
  uploadSingle(req as any, res as any, async (err: any) => {
    const locale = req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
    
    if (err) {
      console.error('Upload error:', err);
      const errorMessage = err.message.includes('File too large') 
        ? translationService.t('upload.errors.fileTooLarge', {}, locale)
        : err.message;
      
      return res.status(400).json({
        success: false,
        error: errorMessage,
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: translationService.t('upload.errors.noFileProvided', {}, locale),
      });
    }

    try {
      // Validate required fields
      const validatedData = onboardingUploadSchema.parse(req.body);
      let employeeId: string | undefined;

      // For onboarding uploads, check if we have a valid session
      let session = null;
      if (validatedData.sessionId) {
        try {
          console.log('🔄 Checking onboarding session for document upload');
          
          // Try to find the onboarding session directly in the database
          session = await prisma.onboardingSession.findUnique({
            where: { id: validatedData.sessionId }
          });
          
          if (session) {
            // For job applicant onboarding (no employee yet), we'll use sessionId as employeeId
            // This allows documents to be stored temporarily until employee is created
            employeeId = session.employeeId || session.id; // Use session.id if no employee yet
            console.log('✅ Found onboarding session, using ID:', employeeId);
          } else {
            return res.status(400).json({
              success: false,
              error: 'Invalid onboarding session',
            });
          }
        } catch (error) {
          console.error('❌ Error checking onboarding session:', error);
          return res.status(400).json({
            success: false,
            error: 'Invalid onboarding session',
          });
        }
      }

      if (!employeeId) {
        return res.status(400).json({
          success: false,
          error: 'Valid session ID required',
        });
      }

      // For onboarding uploads, we need to handle the case where no employee exists yet
      let document;
      
      // Check if this is a temporary onboarding session (no employee yet)
      const isTemporarySession = employeeId === session?.id;
      
      if (isTemporarySession) {
        // Store document info in session formData instead of creating Document record
        console.log('📄 Storing document info in onboarding session');
        
        // Create a document-like object for the response
        document = {
          id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          employeeId: employeeId,
          documentType: validatedData.documentType,
          documentName: validatedData.documentName || req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Store document info in the session's formData
        const currentFormData = (session?.formData as Record<string, any>) || {};
        const documents = (currentFormData.documents || []) as any[];
        documents.push({
          id: document.id,
          documentType: validatedData.documentType,
          documentName: document.documentName,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedAt: new Date().toISOString()
        });
        
        // Update the session with the new document info
        if (session?.id) {
          await prisma.onboardingSession.update({
            where: { id: session.id },
            data: {
              formData: {
                ...(currentFormData as object),
                documents
              } as any
            }
          });
        }
        
      } else {
        // Regular employee document upload
        document = await documentService.uploadDocument({
          employeeId: employeeId,
          documentType: validatedData.documentType,
          file: req.file,
          documentName: validatedData.documentName || req.file.originalname,
          requesterId: 'onboarding-system',
          requesterRole: 'hr_admin',
          requesterOrgId: 'system'
        });
      }

      // Process OCR immediately for onboarding documents
      let ocrResult = null;
      try {
        // Import OCR service and process document if it's an ID document
        if (validatedData.documentType === 'drivers_license' || validatedData.documentType === 'ssn') {
          const { OCRService } = await import('@/services/document/ocrService');
          const ocrService = new OCRService();
          
          // Process OCR asynchronously but wait for result
          ocrResult = await ocrService.processDocument(document.id);
          console.log('📄 OCR processing completed for document:', document.id);
        }
      } catch (ocrError) {
        console.warn('⚠️ OCR processing failed, continuing without OCR:', ocrError instanceof Error ? ocrError.message : ocrError);
        // Continue without OCR if it fails - document is still uploaded successfully
      }

      return res.status(201).json({
        message: 'Document uploaded successfully',
        data: {
          documentId: document.id,
          documentType: document.documentType,
          documentName: document.documentName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          version: document.version,
          createdAt: document.createdAt,
          ocrResult: ocrResult
        }
      });

    } catch (error) {
      console.error('Document upload error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: translationService.t('upload.errors.validation', {}, locale),
          details: error.errors
        });
      }

      return res.status(500).json({
        success: false,
        error: translationService.t('upload.errors.uploadFailed', {}, locale),
      });
    }
  });
});

/**
 * POST /documents/upload
 * Upload a document for an employee
 */
router.post('/upload', authenticate, (req, res, next) => {
  uploadSingle(req as any, res as any, async (err: any) => {
    if (err) {
      return res.status(400).json({
        error: {
          code: 'DOCUMENT_UPLOAD_FAILED',
          message: err.message,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    try {
      // Validate request body
      const validatedData = uploadDocumentSchema.parse(req.body);

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'No file uploaded',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      const document = await documentService.uploadDocument({
        employeeId: validatedData.employeeId,
        documentType: validatedData.documentType,
        file: req.file,
        documentName: validatedData.documentName,
        requesterId: req.user!.userId,
        requesterRole: req.user!.role,
        requesterOrgId: req.user!.organizationId
      });

      return res.status(201).json({
        message: 'Document uploaded successfully',
        data: {
          id: document.id,
          documentType: document.documentType,
          documentName: document.documentName,
          fileSize: document.fileSize,
          mimeType: document.mimeType,
          version: document.version,
          createdAt: document.createdAt
        }
      });
    } catch (error) {
      // Clean up uploaded file if processing failed
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }

      return next(error);
    }
  });
});

/**
 * GET /documents/:id
 * Get document metadata by ID
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    const document = await documentService.getDocument({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.json({
      data: {
        id: document.id,
        employeeId: document.employeeId,
        documentType: document.documentType,
        documentName: document.documentName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        isSigned: document.isSigned,
        signedAt: document.signedAt,
        version: document.version,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
        employee: {
          id: document.employee.id,
          employeeId: document.employee.employeeId,
          user: {
            firstName: document.employee.user.firstName,
            lastName: document.employee.user.lastName,
            organization: {
              name: document.employee.user.organization.name
            }
          }
        }
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents/:id/download
 * Download document file
 */
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    const fileInfo = await documentService.getDocumentFile({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    // Set appropriate headers
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileInfo.filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(fileInfo.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: {
            code: 'FILE_STREAM_ERROR',
            message: 'Error streaming file',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents/:id/view
 * View document file inline (for images/PDFs)
 */
router.get('/:id/view', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    const fileInfo = await documentService.getDocumentFile({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    // Set appropriate headers for inline viewing
    res.setHeader('Content-Type', fileInfo.mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${fileInfo.filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(fileInfo.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      if (!res.headersSent) {
        res.status(500).json({
          error: {
            code: 'FILE_STREAM_ERROR',
            message: 'Error streaming file',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown'
          }
        });
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents
 * List documents with optional filters
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const validatedQuery = listDocumentsSchema.parse(req.query);

    const documents = await documentService.listDocuments({
      employeeId: validatedQuery.employeeId,
      documentType: validatedQuery.documentType,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.json({
      data: documents.map(doc => ({
        id: doc.id,
        employeeId: doc.employeeId,
        documentType: doc.documentType,
        documentName: doc.documentName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        isSigned: doc.isSigned,
        signedAt: doc.signedAt,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        employee: {
          id: (doc as any).employee.id,
          employeeId: (doc as any).employee.employeeId,
          user: {
            firstName: (doc as any).employee.user.firstName,
            lastName: (doc as any).employee.user.lastName,
            organization: {
              name: (doc as any).employee.user.organization.name
            }
          }
        }
      })),
      count: documents.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * DELETE /documents/:id
 * Delete a document
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    await documentService.deleteDocument({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.status(204).send();
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});



/**
 * GET /documents/stats
 * Get document statistics (for HR/Managers)
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    if (req.user!.role === 'employee') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: Insufficient permissions',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    const stats = await documentService.getDocumentStats(
      req.user!.organizationId,
      req.user!.role
    );

    return res.json({
      data: stats
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /documents/storage-info
 * Get storage usage information (for HR admins only)
 */
router.get('/storage-info', authenticate, async (req, res, next) => {
  try {
    if (req.user!.role !== 'hr_admin') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Access denied: HR admin access required',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    const storageInfo = await documentService.getStorageInfo();

    return res.json({
      data: {
        totalSize: storageInfo.totalSize,
        totalSizeMB: Math.round(storageInfo.totalSize / (1024 * 1024) * 100) / 100,
        documentCount: storageInfo.documentCount,
        byType: storageInfo.byType
      }
    });
  } catch (error) {
    return next(error);
  }
});

// Signature validation schema
const signDocumentSchema = z.object({
  signature: z.object({
    signatureData: z.string().min(1, 'Signature data is required'),
    ipAddress: z.string().min(1, 'IP address is required'),
    userAgent: z.string().min(1, 'User agent is required'),
    signerName: z.string().optional()
  })
});

/**
 * POST /documents/:id/sign
 * Sign a document with digital signature
 */
router.post('/:id/sign', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);
    const { signature } = signDocumentSchema.parse(req.body);

    const document = await documentService.signDocument({
      documentId: id,
      signature,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.status(200).json({
      message: 'Document signed successfully',
      data: {
        id: document.id,
        documentType: document.documentType,
        documentName: document.documentName,
        isSigned: document.isSigned,
        signedAt: document.signedAt,
        version: document.version
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid signature data',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents/:id/verify-signature
 * Verify a document's signature
 */
router.get('/:id/verify-signature', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    const verification = await documentService.verifySignature({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.json({
      data: verification
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents/:id/audit-trail
 * Get signature audit trail for a document
 */
router.get('/:id/audit-trail', authenticate, async (req, res, next) => {
  try {
    const { id } = documentIdSchema.parse(req.params);

    const auditTrail = await documentService.getSignatureAuditTrail({
      documentId: id,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.json({
      data: auditTrail
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid document ID',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});

/**
 * GET /documents/unsigned
 * List unsigned documents for an employee
 */
router.get('/unsigned', authenticate, async (req, res, next) => {
  try {
    const validatedQuery = z.object({
      employeeId: z.string().uuid('Invalid employee ID')
    }).parse(req.query);

    const documents = await documentService.listUnsignedDocuments({
      employeeId: validatedQuery.employeeId,
      requesterId: req.user!.userId,
      requesterRole: req.user!.role,
      requesterOrgId: req.user!.organizationId
    });

    return res.json({
      data: documents.map(doc => ({
        id: doc.id,
        employeeId: doc.employeeId,
        documentType: doc.documentType,
        documentName: doc.documentName,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        version: doc.version,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt
      })),
      count: documents.length
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown'
        }
      });
    }

    return next(error);
  }
});export default router;
