import request from 'supertest';
import express from 'express';
import { DocumentService, SignDocumentRequest } from '@/services/document/documentService';
import documentRoutes from '../documents';
import { authenticate } from '@/middleware/auth/authMiddleware';
import { DocumentType, UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { DigitalSignature, SignatureVerification, SignatureAuditTrail } from '@/types/signature';

// Mock the DocumentService
jest.mock('@/services/document/documentService');
jest.mock('@/middleware/auth/authMiddleware');
jest.mock('fs');

const MockedDocumentService = DocumentService as jest.MockedClass<typeof DocumentService>;
const mockedAuthMiddleware = authenticate as jest.MockedFunction<typeof authenticate>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('Document Routes', () => {
  let app: express.Application;
  let mockDocumentService: jest.Mocked<DocumentService>;

  const mockUser = {
    userId: 'user-1',
    role: UserRole.hr_admin,
    organizationId: 'org-1',
    firstName: 'John',
    lastName: 'Doe'
  };

  const mockDocument = {
    id: 'doc-1',
    employeeId: 'employee-1',
    documentType: DocumentType.ssn,
    documentName: 'SSN Card',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    isSigned: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: {
      id: 'employee-1',
      employeeId: 'EMP001',
      user: {
        firstName: 'Jane',
        lastName: 'Smith',
        organization: {
          name: 'Test Motel'
        }
      }
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    app = express();
    app.use(express.json());
    
    // Mock auth middleware to add user to request
    mockedAuthMiddleware.mockImplementation(async (req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });
    
    app.use('/documents', documentRoutes);
    
    mockDocumentService = new MockedDocumentService() as jest.Mocked<DocumentService>;
    // Add missing signature methods to the mock
    mockDocumentService.signDocument = jest.fn();
    mockDocumentService.verifySignature = jest.fn();
    mockDocumentService.getSignatureAuditTrail = jest.fn();
    mockDocumentService.listUnsignedDocuments = jest.fn();
    
    (DocumentService as any).mockImplementation(() => mockDocumentService);
  });

  describe('POST /documents/upload', () => {
    it('should upload document successfully', async () => {
      mockDocumentService.uploadDocument.mockResolvedValue(mockDocument as any);

      const response = await request(app)
        .post('/documents/upload')
        .field('employeeId', 'employee-1')
        .field('documentType', 'ssn')
        .field('documentName', 'SSN Card')
        .attach('file', Buffer.from('test file content'), 'ssn-card.jpg')
        .expect(201);

      expect(response.body).toEqual({
        message: 'Document uploaded successfully',
        data: {
          id: 'doc-1',
          documentType: 'ssn',
          documentName: 'SSN Card',
          fileSize: 1024,
          mimeType: 'image/jpeg',
          version: 1,
          createdAt: mockDocument.createdAt.toISOString()
        }
      });
    });

    it('should return 400 if no file uploaded', async () => {
      const response = await request(app)
        .post('/documents/upload')
        .field('employeeId', 'employee-1')
        .field('documentType', 'ssn')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
      expect(response.body.error.message).toBe('No file uploaded');
    });

    it('should return 400 for invalid employee ID', async () => {
      const response = await request(app)
        .post('/documents/upload')
        .field('employeeId', 'invalid-id')
        .field('documentType', 'ssn')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 for invalid document type', async () => {
      const response = await request(app)
        .post('/documents/upload')
        .field('employeeId', 'employee-1')
        .field('documentType', 'invalid-type')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockDocumentService.uploadDocument.mockRejectedValue(new Error('Service error'));

      const response = await request(app)
        .post('/documents/upload')
        .field('employeeId', 'employee-1')
        .field('documentType', 'ssn')
        .attach('file', Buffer.from('test'), 'test.jpg')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /documents/:id', () => {
    it('should get document metadata successfully', async () => {
      mockDocumentService.getDocument.mockResolvedValue(mockDocument as any);

      const response = await request(app)
        .get('/documents/doc-1')
        .expect(200);

      expect(response.body.data).toEqual({
        id: 'doc-1',
        employeeId: 'employee-1',
        documentType: 'ssn',
        documentName: 'SSN Card',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        isSigned: false,
        signedAt: null,
        version: 1,
        createdAt: mockDocument.createdAt.toISOString(),
        updatedAt: mockDocument.updatedAt.toISOString(),
        employee: {
          id: 'employee-1',
          employeeId: 'EMP001',
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            organization: {
              name: 'Test Motel'
            }
          }
        }
      });
    });

    it('should return 400 for invalid document ID', async () => {
      const response = await request(app)
        .get('/documents/invalid-id')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should handle service errors', async () => {
      mockDocumentService.getDocument.mockRejectedValue(new Error('Document not found'));

      const response = await request(app)
        .get('/documents/doc-1')
        .expect(500);

      expect(response.body.error).toBeDefined();
    });
  });

  describe('GET /documents/:id/download', () => {
    it('should download document file successfully', async () => {
      const mockFileInfo = {
        filePath: '/path/to/file.jpg',
        mimeType: 'image/jpeg',
        filename: 'SSN Card.jpg'
      };
      
      mockDocumentService.getDocumentFile.mockResolvedValue(mockFileInfo);
      
      // Mock file stream
      const mockReadStream = {
        pipe: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            // Don't trigger error for successful test
          }
        })
      };
      mockedFs.createReadStream.mockReturnValue(mockReadStream as any);

      const response = await request(app)
        .get('/documents/doc-1/download');

      expect(mockDocumentService.getDocumentFile).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
      
      expect(mockedFs.createReadStream).toHaveBeenCalledWith('/path/to/file.jpg');
      expect(mockReadStream.pipe).toHaveBeenCalled();
    });

    it('should return 400 for invalid document ID', async () => {
      const response = await request(app)
        .get('/documents/invalid-id/download')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /documents/:id/view', () => {
    it('should view document file inline successfully', async () => {
      const mockFileInfo = {
        filePath: '/path/to/file.jpg',
        mimeType: 'image/jpeg',
        filename: 'SSN Card.jpg'
      };
      
      mockDocumentService.getDocumentFile.mockResolvedValue(mockFileInfo);
      
      // Mock file stream
      const mockReadStream = {
        pipe: jest.fn(),
        on: jest.fn()
      };
      mockedFs.createReadStream.mockReturnValue(mockReadStream as any);

      const response = await request(app)
        .get('/documents/doc-1/view');

      expect(mockDocumentService.getDocumentFile).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
    });
  });

  describe('GET /documents', () => {
    it('should list documents successfully', async () => {
      mockDocumentService.listDocuments.mockResolvedValue([mockDocument] as any);

      const response = await request(app)
        .get('/documents')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
      expect(response.body.data[0]).toEqual({
        id: 'doc-1',
        employeeId: 'employee-1',
        documentType: 'ssn',
        documentName: 'SSN Card',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        isSigned: false,
        signedAt: null,
        version: 1,
        createdAt: mockDocument.createdAt.toISOString(),
        updatedAt: mockDocument.updatedAt.toISOString(),
        employee: {
          id: 'employee-1',
          employeeId: 'EMP001',
          user: {
            firstName: 'Jane',
            lastName: 'Smith',
            organization: {
              name: 'Test Motel'
            }
          }
        }
      });
    });

    it('should list documents with filters', async () => {
      mockDocumentService.listDocuments.mockResolvedValue([mockDocument] as any);

      const response = await request(app)
        .get('/documents')
        .query({
          employeeId: 'employee-1',
          documentType: 'ssn'
        })
        .expect(200);

      expect(mockDocumentService.listDocuments).toHaveBeenCalledWith({
        employeeId: 'employee-1',
        documentType: 'ssn',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
    });

    it('should return 400 for invalid query parameters', async () => {
      const response = await request(app)
        .get('/documents')
        .query({
          employeeId: 'invalid-id'
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /documents/:id', () => {
    it('should delete document successfully', async () => {
      mockDocumentService.deleteDocument.mockResolvedValue();

      const response = await request(app)
        .delete('/documents/doc-1')
        .expect(204);

      expect(mockDocumentService.deleteDocument).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
    });

    it('should return 400 for invalid document ID', async () => {
      const response = await request(app)
        .delete('/documents/invalid-id')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });



  describe('GET /documents/stats', () => {
    it('should get document statistics for HR admin', async () => {
      const mockStats = {
        total: 100,
        signed: 80,
        unsigned: 20,
        withOCR: 50,
        signedPercentage: 80
      };
      
      mockDocumentService.getDocumentStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/documents/stats')
        .expect(200);

      expect(response.body.data).toEqual(mockStats);
    });

    it('should return 403 for employee role', async () => {
      // Mock employee user
      mockedAuthMiddleware.mockImplementation(async (req: any, res: any, next: any) => {
        req.user = { ...mockUser, role: UserRole.employee };
        next();
      });

      const response = await request(app)
        .get('/documents/stats')
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });

  describe('GET /documents/storage-info', () => {
    it('should get storage info for HR admin', async () => {
      const mockStorageInfo = {
        totalSize: 1024000,
        totalSizeMB: 1.02,
        documentCount: 50,
        byType: {
          ssn: 10,
          drivers_license: 10,
          i9: 15,
          w4: 15
        }
      };
      
      mockDocumentService.getStorageInfo.mockResolvedValue({
        totalSize: 1024000,
        documentCount: 50,
        byType: mockStorageInfo.byType as any
      });

      const response = await request(app)
        .get('/documents/storage-info')
        .expect(200);

      expect(response.body.data.totalSize).toBe(1024000);
      expect(response.body.data.totalSizeMB).toBe(1.02);
      expect(response.body.data.documentCount).toBe(50);
    });

    it('should return 403 for non-HR admin', async () => {
      // Mock manager user
      mockedAuthMiddleware.mockImplementation(async (req: any, res: any, next: any) => {
        req.user = { ...mockUser, role: UserRole.manager };
        next();
      });

      const response = await request(app)
        .get('/documents/storage-info')
        .expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });
  });
  describe('POST /documents/:id/sign', () => {
    it('should sign document successfully', async () => {
      const signedDocument = {
        ...mockDocument,
        isSigned: true,
        signedAt: new Date()
      };
      
      mockDocumentService.signDocument.mockResolvedValue(signedDocument as any);

      const response = await request(app)
        .post('/documents/doc-1/sign')
        .send({
          signature: {
            signatureData: 'base64-signature-data',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
            signerName: 'John Doe'
          }
        })
        .expect(200);

      expect(mockDocumentService.signDocument).toHaveBeenCalledWith({
        documentId: 'doc-1',
        signature: {
          signatureData: 'base64-signature-data',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          signerName: 'John Doe'
        },
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
      
      expect(response.body.message).toBe('Document signed successfully');
      expect(response.body.data.isSigned).toBe(true);
    });

    it('should return 400 for invalid signature data', async () => {
      const response = await request(app)
        .post('/documents/doc-1/sign')
        .send({
          signature: {
            // Missing required signatureData
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0'
          }
        })
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /documents/:id/verify-signature', () => {
    it('should verify signature successfully', async () => {
      const verification = {
        isValid: true,
        signedAt: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe'
      };
      
      mockDocumentService.verifySignature.mockResolvedValue(verification);

      const response = await request(app)
        .get('/documents/doc-1/verify-signature')
        .expect(200);

      expect(mockDocumentService.verifySignature).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
      
      expect(response.body.data).toEqual({
        isValid: true,
        signedAt: verification.signedAt.toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe'
      });
    });
  });

  describe('GET /documents/:id/audit-trail', () => {
    it('should get audit trail successfully', async () => {
      const auditTrail = {
        documentId: 'doc-1',
        documentName: 'SSN Card',
        documentType: 'ssn',
        signedAt: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe',
        version: 1
      };
      
      mockDocumentService.getSignatureAuditTrail.mockResolvedValue(auditTrail);

      const response = await request(app)
        .get('/documents/doc-1/audit-trail')
        .expect(200);

      expect(mockDocumentService.getSignatureAuditTrail).toHaveBeenCalledWith({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
      
      expect(response.body.data).toEqual({
        documentId: 'doc-1',
        documentName: 'SSN Card',
        documentType: 'ssn',
        signedAt: auditTrail.signedAt.toISOString(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe',
        version: 1
      });
    });
  });

  describe('GET /documents/unsigned', () => {
    it('should list unsigned documents for employee', async () => {
      mockDocumentService.listUnsignedDocuments.mockResolvedValue([mockDocument] as any);

      const response = await request(app)
        .get('/documents/unsigned')
        .query({ employeeId: 'employee-1' })
        .expect(200);

      expect(mockDocumentService.listUnsignedDocuments).toHaveBeenCalledWith({
        employeeId: 'employee-1',
        requesterId: 'user-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });
      
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('should return 400 for missing employee ID', async () => {
      const response = await request(app)
        .get('/documents/unsigned')
        .expect(400);

      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
