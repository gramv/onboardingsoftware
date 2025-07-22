import { DocumentRepository, SignDocumentData } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { Document, UserRole } from '@prisma/client';
import { DigitalSignature, SignatureVerification, SignatureAuditTrail } from '@/types/signature';

export interface SignDocumentRequest {
  documentId: string;
  signature: DigitalSignature;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
}

export interface VerifySignatureRequest {
  documentId: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
}

export interface ListUnsignedDocumentsRequest {
  employeeId: string;
  requesterId: string;
  requesterRole: UserRole;
  requesterOrgId: string;
}

export class SignatureService {
  private documentRepository: DocumentRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.employeeRepository = new EmployeeRepository();
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
  async verifySignature(request: VerifySignatureRequest): Promise<SignatureVerification> {
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
  async getSignatureAuditTrail(request: VerifySignatureRequest): Promise<SignatureAuditTrail> {
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
  async listUnsignedDocuments(request: ListUnsignedDocumentsRequest): Promise<Document[]> {
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
   * Check if requester can access employee's documents
   * @private
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
}