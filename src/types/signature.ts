/**
 * Types for digital signature functionality
 */

export interface DigitalSignature {
  /**
   * Base64 encoded signature data (typically a PNG image)
   */
  signatureData: string;
  
  /**
   * IP address of the signer
   */
  ipAddress: string;
  
  /**
   * User agent of the signer's browser
   */
  userAgent: string;
  
  /**
   * Optional name of the signer
   */
  signerName?: string;
}

export interface SignatureVerification {
  /**
   * Whether the signature is valid
   */
  isValid: boolean;
  
  /**
   * Timestamp when the document was signed
   */
  signedAt: Date;
  
  /**
   * IP address recorded during signing
   */
  ipAddress: string;
  
  /**
   * User agent recorded during signing
   */
  userAgent: string;
  
  /**
   * Name of the signer if provided
   */
  signerName?: string;
}

export interface SignatureAuditTrail {
  /**
   * Document ID
   */
  documentId: string;
  
  /**
   * Document name
   */
  documentName: string;
  
  /**
   * Document type
   */
  documentType: string;
  
  /**
   * Timestamp when the document was signed
   */
  signedAt: Date;
  
  /**
   * IP address recorded during signing
   */
  ipAddress: string;
  
  /**
   * User agent recorded during signing
   */
  userAgent: string;
  
  /**
   * Name of the signer if provided
   */
  signerName?: string;
  
  /**
   * Document version
   */
  version: number;
}