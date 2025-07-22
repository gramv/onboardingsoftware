import request from 'supertest';
import express from 'express';
import { DocumentType, UserRole } from '@prisma/client';

// Create a mock implementation of the SignatureService
const mockSignDocument = jest.fn();
const mockVerifySignature = jest.fn();
const mockGetSignatureAuditTrail = jest.fn();
const mockListUnsignedDocuments = jest.fn();

// Mock the signature service
jest.mock('@/services/document/signatureService', () => {
  return {
    SignatureService: jest.fn().mockImplementation(() => ({
      signDocument: mockSignDocument,
      verifySignature: mockVerifySignature,
      getSignatureAuditTrail: mockGetSignatureAuditTrail,
      listUnsignedDocuments: mockListUnsignedDocuments
    }))
  };
});

// Import after mocking
import signatureRoutes from '../signatures';

// Mock the auth middleware
jest.mock('@/middleware/auth/authMiddleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      userId: 'user-1',
      role: UserRole.employee,
      organizationId: 'org-1',
      email: 'john.doe@example.com',
      languagePreference: 'en'
    };
    next();
  }
}));

describe('Signature Routes', () => {
  let app: express.Application;

  const mockSignedDocument = {
    id: 'doc-1',
    employeeId: 'employee-1',
    documentType: DocumentType.handbook,
    documentName: 'Employee Handbook',
    isSigned: true,
    signedAt: new Date(),
    version: 1
  };

  const mockSignature = {
    signatureData: 'base64-signature-data',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    signerName: 'John Doe'
  };

  const mockVerification = {
    isValid: true,
    signedAt: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    signerName: 'John Doe'
  };

  const mockAuditTrail = {
    documentId: 'doc-1',
    documentName: 'Employee Handbook',
    documentType: DocumentType.handbook,
    signedAt: new Date(),
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    signerName: 'John Doe',
    version: 1
  };

  const mockUnsignedDocuments = [
    {
      id: 'doc-2',
      employeeId: 'employee-1',
      documentType: DocumentType.handbook,
      documentName: 'Employee Handbook',
      isSigned: false,
      version: 1
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    app.use('/signatures', signatureRoutes);
    app.use((err: any, req: any, res: any, next: any) => {
      res.status(500).json({ error: err.message });
    });
  });

  describe('POST /signatures/sign/:documentId', () => {
    it('should sign a document successfully', async () => {
      mockSignDocument.mockResolvedValue(mockSignedDocument);

      const response = await request(app)
        .post('/signatures/sign/doc-1')
        .send(mockSignature);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        documentId: 'doc-1',
        isSigned: true,
        signedAt: expect.any(String)
      });
      expect(mockSignDocument).toHaveBeenCalledWith({
        documentId: 'doc-1',
        signature: mockSignature,
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });
    });

    it('should return 400 for invalid signature data', async () => {
      const response = await request(app)
        .post('/signatures/sign/doc-1')
        .send({
          // Missing required fields
          signerName: 'John Doe'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /signatures/verify/:documentId', () => {
    it('should verify a signature successfully', async () => {
      mockVerifySignature.mockResolvedValue(mockVerification);

      const response = await request(app)
        .get('/signatures/verify/doc-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        isValid: true,
        signedAt: expect.any(String),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe'
      });
      expect(mockVerifySignature).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });
    });
  });

  describe('GET /signatures/audit/:documentId', () => {
    it('should get audit trail successfully', async () => {
      mockGetSignatureAuditTrail.mockResolvedValue(mockAuditTrail);

      const response = await request(app)
        .get('/signatures/audit/doc-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({
        documentId: 'doc-1',
        documentName: 'Employee Handbook',
        documentType: DocumentType.handbook,
        signedAt: expect.any(String),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe',
        version: 1
      });
    });
  });

  describe('GET /signatures/unsigned/:employeeId', () => {
    it('should list unsigned documents successfully', async () => {
      mockListUnsignedDocuments.mockResolvedValue(mockUnsignedDocuments);

      const response = await request(app)
        .get('/signatures/unsigned/employee-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([
        {
          id: 'doc-2',
          employeeId: 'employee-1',
          documentType: DocumentType.handbook,
          documentName: 'Employee Handbook',
          isSigned: false,
          version: 1
        }
      ]);
    });
  });
});