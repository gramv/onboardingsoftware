import fs from 'fs';
import path from 'path';
import { DocumentRepository, CreateDocumentData, SignDocumentData } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { Document, DocumentType, UserRole, Prisma } from '@prisma/client';
import { ensureStorageDirectories } from '@/middleware/upload';
import { DigitalSignature, SignatureVerification, SignatureAuditTrail } from '@/types/signature';

// Type for document with employee relations
type DocumentWithEmployee = Prisma.DocumentGetPayload<{
  include: {
    employee: {
      include: {
        user: {
          include: {
            organization: true;
          };
        };
      };
    };
  };
}>;

export interface UploadDocumentRequest {
  employeeId: string;
  documentType: DocumentType;
  file: Express.Multer.File;
  documentName?: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
}

export interface DocumentAccessRequest {
  documentId: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
}

export interface ListDocumentsRequest {
  employeeId?: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
  documentType?: DocumentType;
}

export interface SignDocumentRequest extends DocumentAccessRequest {
  signature: DigitalSignature;
}

export class DocumentService {
  private documentRepository: DocumentRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.employeeRepository = new EmployeeRepository();
    
    // Ensure storage directories exist on service initialization
    ensureStorageDirectories();
  }
  
  /**
   * Sign a document with digital signature
   * @param request The sign document request
   * @returns The signed document
   */
  async signDocument(request: SignDocumentRequest): Promise<Document> {
    const { documentId, signature, requesterId, requesterRole, requesterOrgId } = request;
    
    // Get the document with employee information
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check if document is already signed
    if (document.isSigned) {
      throw new Error('Document is already signed');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to sign this document');
    }
    
    // Create signature data with timestamp and audit information
    const signatureData: SignDocumentData = {
      signatureData: signature.signatureData,
      signedAt: new Date(),
      ipAddress: signature.ipAddress,
      userAgent: signature.userAgent,
      signerName: signature.signerName || 'Unknown'
    };
    
    // Sign the document
    return await this.documentRepository.signDocument(documentId, signatureData);
  }
  
  /**
   * Verify a document's signature
   * @param request The verify signature request
   * @returns The signature verification result
   */
  async verifySignature(request: DocumentAccessRequest): Promise<SignatureVerification> {
    const { documentId, requesterId, requesterRole, requesterOrgId } = request;
    
    // Get the document with employee information
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to verify this document');
    }
    
    // Check if document is signed
    if (!document.isSigned || !document.signatureData) {
      throw new Error('Document is not signed');
    }
    
    try {
      // Parse the signature data from JSON
      const signatureAudit = JSON.parse(document.signatureData);
      
      return {
        isValid: true,
        signedAt: document.signedAt!,
        ipAddress: signatureAudit.ipAddress,
        userAgent: signatureAudit.userAgent,
        signerName: signatureAudit.signerName
      };
    } catch (error) {
      // If we can't parse the signature data, it's invalid
      return {
        isValid: false,
        signedAt: document.signedAt!,
        ipAddress: 'unknown',
        userAgent: 'unknown'
      };
    }
  }
  
  /**
   * Get signature audit trail for a document
   * @param request The verify signature request
   * @returns The signature audit trail
   */
  async getSignatureAuditTrail(request: DocumentAccessRequest): Promise<SignatureAuditTrail> {
    const { documentId, requesterId, requesterRole, requesterOrgId } = request;
    
    // Get the document with employee information
    const document = await this.documentRepository.findById(documentId);
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check access permissions
    if (!this.canAccessDocument(document, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to access this document');
    }
    
    // Check if document is signed
    if (!document.isSigned || !document.signatureData) {
      throw new Error('Document is not signed');
    }
    
    try {
      // Parse the signature data from JSON
      const signatureAudit = JSON.parse(document.signatureData);
      
      return {
        documentId: document.id,
        documentName: document.documentName || '',
        documentType: document.documentType,
        signedAt: document.signedAt!,
        ipAddress: signatureAudit.ipAddress,
        userAgent: signatureAudit.userAgent,
        signerName: signatureAudit.signerName,
        version: document.version
      };
    } catch (error) {
      throw new Error('Invalid signature data');
    }
  }
  
  /**
   * List all documents that need to be signed by an employee
   * @param request The list unsigned documents request
   * @returns Array of unsigned documents
   */
  async listUnsignedDocuments(request: { employeeId: string; requesterId: string; requesterRole: UserRole; requesterOrgId: string }): Promise<Document[]> {
    const { employeeId, requesterId, requesterRole, requesterOrgId } = request;
    
    // Verify employee exists
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    // Check access permissions
    if (!this.canAccessEmployee(employee, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to view documents for this employee');
    }
    
    // Get unsigned documents
    return await this.documentRepository.findUnsignedByEmployee(employeeId);
  }
  
  /**
   * Check if requester can access a document
   * @private
   */
  private canAccessDocument(
    document: any, // Document with employee relations
    requesterId: string,
    requesterRole: UserRole,
    requesterOrgId: string
  ): boolean {
    if (!document.employee) {
      return false;
    }
    
    return this.canAccessEmployee(document.employee, requesterId, requesterRole, requesterOrgId);
  }

  /**
   * Upload a document for an employee
   */
  async uploadDocument(request: UploadDocumentRequest): Promise<Document> {
    const { employeeId, documentType, file, documentName, requesterId, requesterRole, requesterOrgId } = request;

    // Verify employee exists and requester has access
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Check access permissions
    if (!this.canAccessEmployee(employee, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to upload documents for this employee');
    }

    // Create document record
    const documentData: CreateDocumentData = {
      employeeId,
      documentType,
      documentName: documentName || file.originalname,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      ocrData: documentType === 'ssn' || documentType === 'drivers_license' 
        ? { processingStatus: 'pending' } 
        : undefined
    };

    try {
      const document = await this.documentRepository.create(documentData);
      return document;
    } catch (error) {
      // If database creation fails, clean up the uploaded file
      this.cleanupFile(file.path);
      throw error;
    }
  }

  /**
   * Get a document by ID with access control
   */
  async getDocument(request: DocumentAccessRequest): Promise<DocumentWithEmployee> {
    const { documentId, requesterId, requesterRole, requesterOrgId } = request;

    const document = await this.documentRepository.findById(documentId) as DocumentWithEmployee;
    if (!document) {
      throw new Error('Document not found');
    }

    // Check access permissions
    if (!document.employee || !this.canAccessEmployee(document.employee, requesterId, requesterRole, requesterOrgId)) {
      throw new Error('Access denied: You do not have permission to access this document');
    }

    return document;
  }

  /**
   * Get document file stream for serving
   */
  async getDocumentFile(request: DocumentAccessRequest): Promise<{ filePath: string; mimeType: string; filename: string }> {
    const document = await this.getDocument(request);

    if (!document.filePath) {
      throw new Error('Document file not found');
    }

    // Check if file exists on disk
    if (!fs.existsSync(document.filePath)) {
      throw new Error('Document file not found on disk');
    }

    return {
      filePath: document.filePath,
      mimeType: document.mimeType || 'application/octet-stream',
      filename: document.documentName || path.basename(document.filePath)
    };
  }

  /**
   * List documents for an employee
   */
  async listDocuments(request: ListDocumentsRequest): Promise<Document[]> {
    const { employeeId, requesterId, requesterRole, requesterOrgId, documentType } = request;

    if (employeeId) {
      // Verify employee exists and requester has access
      const employee = await this.employeeRepository.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      if (!this.canAccessEmployee(employee, requesterId, requesterRole, requesterOrgId)) {
        throw new Error('Access denied: You do not have permission to view documents for this employee');
      }

      if (documentType) {
        const document = await this.documentRepository.findByEmployeeAndType(employeeId, documentType);
        return document ? [document] : [];
      } else {
        return await this.documentRepository.findByEmployee(employeeId);
      }
    } else {
      // List documents based on requester's role and organization
      const filters = {
        organizationId: requesterRole === 'hr_admin' ? undefined : requesterOrgId,
        documentType
      };

      const result = await this.documentRepository.list(filters);
      return result.data;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(request: DocumentAccessRequest): Promise<void> {
    const document = await this.getDocument(request);

    // Delete file from disk
    if (document.filePath && fs.existsSync(document.filePath)) {
      this.cleanupFile(document.filePath);
    }

    // Delete from database
    await this.documentRepository.delete(document.id);
  }

  /**
   * Check if requester can access employee's documents
   */
  private canAccessEmployee(
    employee: any, // Employee with user and organization relations
    requesterId: string,
    requesterRole: UserRole,
    requesterOrgId: string
  ): boolean {
    // HR admins can access all employees
    if (requesterRole === 'hr_admin') {
      return true;
    }

    // Managers can access employees in their organization
    if (requesterRole === 'manager') {
      return employee.user.organizationId === requesterOrgId;
    }

    // Employees can only access their own documents
    if (requesterRole === 'employee') {
      return employee.userId === requesterId;
    }

    return false;
  }

  /**
   * Clean up uploaded file
   */
  private cleanupFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  /**
   * Get document statistics for an organization
   */
  async getDocumentStats(organizationId: string, requesterRole: UserRole): Promise<any> {
    if (requesterRole !== 'hr_admin' && requesterRole !== 'manager') {
      throw new Error('Access denied: Insufficient permissions to view document statistics');
    }

    return await this.documentRepository.getOrganizationStats(organizationId);
  }

  /**
   * Get storage usage information
   */
  async getStorageInfo(): Promise<{ totalSize: number; documentCount: number; byType: Record<DocumentType, number> }> {
    const storagePath = path.join(process.cwd(), 'storage', 'documents');
    
    let totalSize = 0;
    let documentCount = 0;
    const byType: Record<DocumentType, number> = {} as Record<DocumentType, number>;

    // Initialize counters
    Object.values(DocumentType).forEach(type => {
      byType[type] = 0;
    });

    // Calculate storage usage
    const calculateDirectorySize = (dirPath: string): void => {
      if (!fs.existsSync(dirPath)) return;

      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
          documentCount++;
          
          // Determine document type from path
          const pathParts = itemPath.split(path.sep);
          const typeIndex = pathParts.findIndex(part => part === 'documents') + 1;
          if (typeIndex > 0 && typeIndex < pathParts.length) {
            const docType = pathParts[typeIndex] as DocumentType;
            if (Object.values(DocumentType).includes(docType)) {
              byType[docType]++;
            }
          }
        }
      }
    };

    calculateDirectorySize(storagePath);

    return {
      totalSize,
      documentCount,
      byType
    };
  }
}  // Signature-related methods have been moved to SignatureService