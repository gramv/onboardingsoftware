import { SignatureService } from '../signatureService';
import { DocumentRepository } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { DocumentType, UserRole } from '@prisma/client';
import { DigitalSignature } from '@/types/signature';

// Mock the repositories
jest.mock('@/repositories/document.repository');
jest.mock('@/repositories/employee.repository');

const MockedDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>;
const MockedEmployeeRepository = EmployeeRepository as jest.MockedClass<typeof EmployeeRepository>;

describe('SignatureService', () => {
  let signatureService: SignatureService;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;
  let mockEmployeeRepository: jest.Mocked<EmployeeRepository>;

  const mockEmployee = {
    id: 'employee-1',
    userId: 'user-1',
    employeeId: 'EMP001',
    user: {
      id: 'user-1',
      organizationId: 'org-1',
      firstName: 'John',
      lastName: 'Doe',
      organization: {
        id: 'org-1',
        name: 'Test Motel'
      }
    }
  };

  const mockDocument = {
    id: 'doc-1',
    employeeId: 'employee-1',
    documentType: DocumentType.handbook,
    documentName: 'Employee Handbook',
    filePath: '/path/to/handbook.pdf',
    fileSize: 1024,
    mimeType: 'application/pdf',
    isSigned: false,
    signedAt: null,
    signatureData: null,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: mockEmployee
  };

  const mockSignedDocument = {
    ...mockDocument,
    isSigned: true,
    signedAt: new Date(),
    signatureData: JSON.stringify({
      signatureData: 'base64-signature-data',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0',
      signerName: 'John Doe',
      timestamp: new Date().toISOString()
    })
  };

  const mockSignature: DigitalSignature = {
    signatureData: 'base64-signature-data',
    ipAddress: '192.168.1.1',
    userAgent: 'Mozilla/5.0',
    signerName: 'John Doe'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDocumentRepository = new MockedDocumentRepository() as jest.Mocked<DocumentRepository>;
    mockEmployeeRepository = new MockedEmployeeRepository() as jest.Mocked<EmployeeRepository>;
    
    signatureService = new SignatureService();
    (signatureService as any).documentRepository = mockDocumentRepository;
    (signatureService as any).employeeRepository = mockEmployeeRepository;
  });

  describe('signDocument', () => {
    it('should sign document successfully', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockDocumentRepository.signDocument.mockResolvedValue(mockSignedDocument as any);

      const result = await signatureService.signDocument({
        documentId: 'doc-1',
        signature: mockSignature,
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-1');
      expect(mockDocumentRepository.signDocument).toHaveBeenCalledWith(
        'doc-1',
        expect.objectContaining({
          signatureData: 'base64-signature-data',
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          signerName: 'John Doe'
        })
      );

      expect(result).toEqual(mockSignedDocument);
    });

    it('should throw error if document is already signed', async () => {
      mockDocumentRepository.findById.mockResolvedValue({
        ...mockDocument,
        isSigned: true
      } as any);

      await expect(signatureService.signDocument({
        documentId: 'doc-1',
        signature: mockSignature,
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document is already signed');
    });
  });

  describe('verifySignature', () => {
    it('should verify signature successfully', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockSignedDocument as any);

      const result = await signatureService.verifySignature({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual({
        isValid: true,
        signedAt: mockSignedDocument.signedAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe'
      });
    });

    it('should throw error if document is not signed', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      await expect(signatureService.verifySignature({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document is not signed');
    });

    it('should return invalid signature if signature data is corrupted', async () => {
      mockDocumentRepository.findById.mockResolvedValue({
        ...mockDocument,
        isSigned: true,
        signedAt: new Date(),
        signatureData: 'invalid-json'
      } as any);

      const result = await signatureService.verifySignature({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual({
        isValid: false,
        signedAt: expect.any(Date),
        ipAddress: 'unknown',
        userAgent: 'unknown'
      });
    });
  });

  describe('getSignatureAuditTrail', () => {
    it('should return audit trail for signed document', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockSignedDocument as any);

      const result = await signatureService.getSignatureAuditTrail({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual({
        documentId: 'doc-1',
        documentName: 'Employee Handbook',
        documentType: DocumentType.handbook,
        signedAt: mockSignedDocument.signedAt,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        signerName: 'John Doe',
        version: 1
      });
    });

    it('should throw error if document is not signed', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      await expect(signatureService.getSignatureAuditTrail({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document is not signed');
    });

    it('should throw error if signature data is corrupted', async () => {
      mockDocumentRepository.findById.mockResolvedValue({
        ...mockDocument,
        isSigned: true,
        signedAt: new Date(),
        signatureData: 'invalid-json'
      } as any);

      await expect(signatureService.getSignatureAuditTrail({
        documentId: 'doc-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Invalid signature data');
    });
  });

  describe('listUnsignedDocuments', () => {
    it('should list unsigned documents for employee', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.findUnsignedByEmployee.mockResolvedValue([mockDocument] as any);

      const result = await signatureService.listUnsignedDocuments({
        employeeId: 'employee-1',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(mockEmployeeRepository.findById).toHaveBeenCalledWith('employee-1');
      expect(mockDocumentRepository.findUnsignedByEmployee).toHaveBeenCalledWith('employee-1');
      expect(result).toEqual([mockDocument]);
    });

    it('should throw error if employee not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null);

      await expect(signatureService.listUnsignedDocuments({
        employeeId: 'nonexistent',
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Employee not found');
    });

    it('should throw error if access denied', async () => {
      const employeeFromDifferentOrg = {
        ...mockEmployee,
        user: {
          ...mockEmployee.user,
          organizationId: 'org-2'
        }
      };
      mockEmployeeRepository.findById.mockResolvedValue(employeeFromDifferentOrg as any);

      await expect(signatureService.listUnsignedDocuments({
        employeeId: 'employee-1',
        requesterId: 'user-2',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Access denied');
    });
  });
});