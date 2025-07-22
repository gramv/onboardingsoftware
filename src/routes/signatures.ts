import express from 'express';
import { SignatureService } from '@/services/document/signatureService';
import { authenticate } from '@/middleware/auth/authMiddleware';
import { z } from 'zod';

const router = express.Router();
const signatureService = new SignatureService();

// Schema for signature data
const signatureSchema = z.object({
  signatureData: z.string().min(1, 'Signature data is required'),
  ipAddress: z.string().min(1, 'IP address is required'),
  userAgent: z.string().min(1, 'User agent is required'),
  signerName: z.string().optional()
});

// Schema for document ID
const documentIdSchema = z.object({
  documentId: z.string().uuid('Invalid document ID')
});

// Schema for employee ID
const employeeIdSchema = z.object({
  employeeId: z.string().uuid('Invalid employee ID')
});

/**
 * @route POST /signatures/sign/:documentId
 * @desc Sign a document with digital signature
 * @access Private
 */
router.post(
  '/sign/:documentId',
  authenticate,
  async (req, res, next) => {
    try {
      const { documentId } = documentIdSchema.parse(req.params);
      
      // Validate signature data
      let signature;
      try {
        signature = signatureSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid signature data',
              details: error.errors,
              timestamp: new Date().toISOString()
            }
          });
        }
        throw error;
      }
      
      const { userId: requesterId, role: requesterRole, organizationId: requesterOrgId } = req.user!;

      const signedDocument = await signatureService.signDocument({
        documentId,
        signature,
        requesterId,
        requesterRole,
        requesterOrgId
      });

      return res.status(200).json({
        success: true,
        data: {
          documentId: signedDocument.id,
          isSigned: signedDocument.isSigned,
          signedAt: signedDocument.signedAt
        }
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @route GET /signatures/verify/:documentId
 * @desc Verify a document's signature
 * @access Private
 */
router.get(
  '/verify/:documentId',
  authenticate,
  async (req, res, next) => {
    try {
      const { documentId } = documentIdSchema.parse(req.params);
      const { userId: requesterId, role: requesterRole, organizationId: requesterOrgId } = req.user!;

      const verification = await signatureService.verifySignature({
        documentId,
        requesterId,
        requesterRole,
        requesterOrgId
      });

      return res.status(200).json({
        success: true,
        data: verification
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @route GET /signatures/audit/:documentId
 * @desc Get signature audit trail for a document
 * @access Private
 */
router.get(
  '/audit/:documentId',
  authenticate,
  async (req, res, next) => {
    try {
      const { documentId } = documentIdSchema.parse(req.params);
      const { userId: requesterId, role: requesterRole, organizationId: requesterOrgId } = req.user!;

      const auditTrail = await signatureService.getSignatureAuditTrail({
        documentId,
        requesterId,
        requesterRole,
        requesterOrgId
      });

      return res.status(200).json({
        success: true,
        data: auditTrail
      });
    } catch (error) {
      return next(error);
    }
  }
);

/**
 * @route GET /signatures/unsigned/:employeeId
 * @desc List all documents that need to be signed by an employee
 * @access Private
 */
router.get(
  '/unsigned/:employeeId',
  authenticate,
  async (req, res, next) => {
    try {
      const { employeeId } = employeeIdSchema.parse(req.params);
      const { userId: requesterId, role: requesterRole, organizationId: requesterOrgId } = req.user!;

      const unsignedDocuments = await signatureService.listUnsignedDocuments({
        employeeId,
        requesterId,
        requesterRole,
        requesterOrgId
      });

      return res.status(200).json({
        success: true,
        data: unsignedDocuments
      });
    } catch (error) {
      return next(error);
    }
  }
);

export default router;