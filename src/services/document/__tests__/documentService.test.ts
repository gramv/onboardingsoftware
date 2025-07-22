import { DocumentService } from '../documentService';
import { DocumentRepository } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { DocumentType, UserRole } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Mock the repositories
jest.mock('@/repositories/document.repository');
jest.mock('@/repositories/employee.repository');
jest.mock('fs');

const MockedDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>;
const MockedEmployeeRepository = EmployeeRepository as jest.MockedClass<typeof EmployeeRepository>;
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('DocumentService', () => {
  let documentService: DocumentService;
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
    documentType: DocumentType.ssn,
    documentName: 'SSN Card',
    filePath: '/path/to/file.jpg',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    isSigned: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    employee: mockEmployee
  };

  const mockFile: Express.Multer.File = {
    fieldname: 'file',
    originalname: 'ssn-card.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024,
    destination: '/uploads',
    filename: 'ssn_123456789_987654321.jpg',
    path: '/uploads/ssn_123456789_987654321.jpg',
    buffer: Buffer.from('test'),
    stream: {} as any
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockDocumentRepository = new MockedDocumentRepository() as jest.Mocked<DocumentRepository>;
    mockEmployeeRepository = new MockedEmployeeRepository() as jest.Mocked<EmployeeRepository>;
    
    documentService = new DocumentService();
    (documentService as any).documentRepository = mockDocumentRepository;
    (documentService as any).employeeRepository = mockEmployeeRepository;
  });

  describe('uploadDocument', () => {
    it('should upload document successfully for HR admin', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockResolvedValue(mockDocument as any);

      const result = await documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        file: mockFile,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockEmployeeRepository.findById).toHaveBeenCalledWith('employee-1');
      expect(mockDocumentRepository.create).toHaveBeenCalledWith({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        documentName: 'ssn-card.jpg',
        filePath: '/uploads/ssn_123456789_987654321.jpg',
        fileSize: 1024,
        mimeType: 'image/jpeg',
        ocrData: { processingStatus: 'pending' }
      });
      expect(result).toEqual(mockDocument);
    });

    it('should upload document successfully for manager in same organization', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockResolvedValue(mockDocument as any);

      const result = await documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.w4,
        file: mockFile,
        requesterId: 'manager-1',
        requesterRole: UserRole.manager,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual(mockDocument);
    });

    it('should allow employee to upload their own documents', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockResolvedValue(mockDocument as any);

      const result = await documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.handbook,
        file: mockFile,
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual(mockDocument);
    });

    it('should throw error if employee not found', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(null);

      await expect(documentService.uploadDocument({
        employeeId: 'nonexistent',
        documentType: DocumentType.ssn,
        file: mockFile,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Employee not found');
    });

    it('should throw error if manager tries to access employee from different organization', async () => {
      const employeeFromDifferentOrg = {
        ...mockEmployee,
        user: {
          ...mockEmployee.user,
          organizationId: 'org-2'
        }
      };
      mockEmployeeRepository.findById.mockResolvedValue(employeeFromDifferentOrg as any);

      await expect(documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        file: mockFile,
        requesterId: 'manager-1',
        requesterRole: UserRole.manager,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Access denied: You do not have permission to upload documents for this employee');
    });

    it('should throw error if employee tries to upload for another employee', async () => {
      const otherEmployee = {
        ...mockEmployee,
        userId: 'user-2'
      };
      mockEmployeeRepository.findById.mockResolvedValue(otherEmployee as any);

      await expect(documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        file: mockFile,
        requesterId: 'user-1',
        requesterRole: UserRole.employee,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Access denied: You do not have permission to upload documents for this employee');
    });

    it('should clean up file if database creation fails', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockRejectedValue(new Error('Database error'));
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockImplementation(() => {});

      await expect(documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        file: mockFile,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Database error');

      expect(mockedFs.unlinkSync).toHaveBeenCalledWith('/uploads/ssn_123456789_987654321.jpg');
    });

    it('should set OCR data for SSN and drivers license documents', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockResolvedValue(mockDocument as any);

      await documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.drivers_license,
        file: mockFile,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ocrData: { processingStatus: 'pending' }
        })
      );
    });

    it('should not set OCR data for non-OCR document types', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.create.mockResolvedValue(mockDocument as any);

      await documentService.uploadDocument({
        employeeId: 'employee-1',
        documentType: DocumentType.handbook,
        file: mockFile,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ocrData: undefined
        })
      );
    });
  });

  describe('getDocument', () => {
    it('should get document successfully with proper access', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      const result = await documentService.getDocument({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-1');
      expect(result).toEqual(mockDocument);
    });

    it('should throw error if document not found', async () => {
      mockDocumentRepository.findById.mockResolvedValue(null);

      await expect(documentService.getDocument({
        documentId: 'nonexistent',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document not found');
    });

    it('should throw error if access denied', async () => {
      const documentFromDifferentOrg = {
        ...mockDocument,
        employee: {
          ...mockEmployee,
          user: {
            ...mockEmployee.user,
            organizationId: 'org-2'
          }
        }
      };
      mockDocumentRepository.findById.mockResolvedValue(documentFromDifferentOrg as any);

      await expect(documentService.getDocument({
        documentId: 'doc-1',
        requesterId: 'manager-1',
        requesterRole: UserRole.manager,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Access denied: You do not have permission to access this document');
    });
  });

  describe('getDocumentFile', () => {
    it('should return file info for valid document', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockedFs.existsSync.mockReturnValue(true);

      const result = await documentService.getDocumentFile({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(result).toEqual({
        filePath: '/path/to/file.jpg',
        mimeType: 'image/jpeg',
        filename: 'SSN Card'
      });
    });

    it('should throw error if document has no file path', async () => {
      const documentWithoutFile = { ...mockDocument, filePath: null };
      mockDocumentRepository.findById.mockResolvedValue(documentWithoutFile as any);

      await expect(documentService.getDocumentFile({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document file not found');
    });

    it('should throw error if file does not exist on disk', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockedFs.existsSync.mockReturnValue(false);

      await expect(documentService.getDocumentFile({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      })).rejects.toThrow('Document file not found on disk');
    });
  });

  describe('listDocuments', () => {
    it('should list documents for specific employee', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.findByEmployee.mockResolvedValue([mockDocument] as any);

      const result = await documentService.listDocuments({
        employeeId: 'employee-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockEmployeeRepository.findById).toHaveBeenCalledWith('employee-1');
      expect(mockDocumentRepository.findByEmployee).toHaveBeenCalledWith('employee-1');
      expect(result).toEqual([mockDocument]);
    });

    it('should list documents by type for specific employee', async () => {
      mockEmployeeRepository.findById.mockResolvedValue(mockEmployee as any);
      mockDocumentRepository.findByEmployeeAndType.mockResolvedValue(mockDocument as any);

      const result = await documentService.listDocuments({
        employeeId: 'employee-1',
        documentType: DocumentType.ssn,
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.findByEmployeeAndType).toHaveBeenCalledWith('employee-1', DocumentType.ssn);
      expect(result).toEqual([mockDocument]);
    });

    it('should list all documents for HR admin', async () => {
      const mockPaginatedResponse = {
        data: [mockDocument],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      mockDocumentRepository.list.mockResolvedValue(mockPaginatedResponse as any);

      const result = await documentService.listDocuments({
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.list).toHaveBeenCalledWith({
        organizationId: undefined,
        documentType: undefined
      });
      expect(result).toEqual([mockDocument]);
    });

    it('should list documents filtered by organization for manager', async () => {
      const mockPaginatedResponse = {
        data: [mockDocument],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1
      };
      mockDocumentRepository.list.mockResolvedValue(mockPaginatedResponse as any);

      const result = await documentService.listDocuments({
        requesterId: 'manager-1',
        requesterRole: UserRole.manager,
        requesterOrgId: 'org-1'
      });

      expect(mockDocumentRepository.list).toHaveBeenCalledWith({
        organizationId: 'org-1',
        documentType: undefined
      });
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document and file successfully', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockedFs.existsSync.mockReturnValue(true);
      mockedFs.unlinkSync.mockImplementation(() => {});
      mockDocumentRepository.delete.mockResolvedValue(mockDocument as any);

      await documentService.deleteDocument({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockedFs.unlinkSync).toHaveBeenCalledWith('/path/to/file.jpg');
      expect(mockDocumentRepository.delete).toHaveBeenCalledWith('doc-1');
    });

    it('should delete document even if file does not exist', async () => {
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockedFs.existsSync.mockReturnValue(false);
      mockDocumentRepository.delete.mockResolvedValue(mockDocument as any);

      await documentService.deleteDocument({
        documentId: 'doc-1',
        requesterId: 'hr-1',
        requesterRole: UserRole.hr_admin,
        requesterOrgId: 'org-1'
      });

      expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
      expect(mockDocumentRepository.delete).toHaveBeenCalledWith('doc-1');
    });
  });

  describe('getDocumentStats', () => {
    it('should return stats for HR admin', async () => {
      const mockStats = {
        total: 100,
        signed: 80,
        unsigned: 20,
        withOCR: 50,
        signedPercentage: 80
      };
      mockDocumentRepository.getOrganizationStats.mockResolvedValue(mockStats);

      const result = await documentService.getDocumentStats('org-1', UserRole.hr_admin);

      expect(mockDocumentRepository.getOrganizationStats).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(mockStats);
    });

    it('should return stats for manager', async () => {
      const mockStats = {
        total: 50,
        signed: 40,
        unsigned: 10,
        withOCR: 25,
        signedPercentage: 80
      };
      mockDocumentRepository.getOrganizationStats.mockResolvedValue(mockStats);

      const result = await documentService.getDocumentStats('org-1', UserRole.manager);

      expect(result).toEqual(mockStats);
    });

    it('should throw error for employee role', async () => {
      await expect(documentService.getDocumentStats('org-1', UserRole.employee))
        .rejects.toThrow('Access denied: Insufficient permissions to view document statistics');
    });
  });
});