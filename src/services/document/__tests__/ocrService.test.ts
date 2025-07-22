import fs from 'fs';
import path from 'path';
import { OCRService, OCRResult } from '../ocrService';
import { DocumentRepository } from '@/repositories/document.repository';
import { config } from '@/config/environment';

// Mock dependencies
jest.mock('@/repositories/document.repository');
jest.mock('tesseract.js');
jest.mock('sharp');
jest.mock('fs');
jest.mock('path');

// Mock config
jest.mock('@/config/environment', () => ({
  config: {
    ocr: {
      enabled: true
    }
  }
}));

describe('OCRService', () => {
  let ocrService: OCRService;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;
  
  const mockDocument = {
    id: 'doc-123',
    employeeId: 'emp-123',
    documentType: 'drivers_license' as const,
    documentName: 'Driver License',
    filePath: '/path/to/license.jpg',
    fileSize: 1024,
    mimeType: 'image/jpeg',
    isSigned: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const mockOCRResult: OCRResult = {
    extractedData: {
      fullName: 'John Doe',
      licenseNumber: 'X12345678',
      dateOfBirth: '01/15/1980',
      expirationDate: '05/20/2025',
      address: '123 Main St, Anytown, USA'
    },
    confidence: 85.5,
    fieldConfidences: {
      fullName: 90,
      licenseNumber: 85,
      dateOfBirth: 80,
      expirationDate: 75,
      address: 70
    },
    rawText: 'NAME: JOHN DOE\nLICENSE: X12345678\nDOB: 01/15/1980\nEXP: 05/20/2025\nADDRESS: 123 Main St, Anytown, USA',
    processingStatus: 'completed'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup document repository mock
    mockDocumentRepository = {
      findById: jest.fn().mockResolvedValue(mockDocument),
      updateOCRData: jest.fn().mockResolvedValue({ ...mockDocument, ocrData: mockOCRResult }),
      findPendingOCR: jest.fn().mockResolvedValue([mockDocument]),
    } as unknown as jest.Mocked<DocumentRepository>;
    
    // Mock fs.existsSync to return true for document paths
    (fs.existsSync as jest.Mock).mockImplementation((path) => {
      return path === mockDocument.filePath || path.includes('temp');
    });
    
    // Mock path.join to return predictable paths
    (path.join as jest.Mock).mockImplementation((...args) => {
      return args.join('/');
    });
    
    // Mock fs.mkdirSync
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    
    // Create service instance
    ocrService = new OCRService();
    
    // Replace the private repository with our mock
    (ocrService as any).documentRepository = mockDocumentRepository;
    
    // Mock the private methods that interact with external dependencies
    (ocrService as any).preprocessImage = jest.fn().mockResolvedValue('/path/to/preprocessed.png');
    (ocrService as any).performOCR = jest.fn().mockResolvedValue(mockOCRResult);
    (ocrService as any).cleanupFile = jest.fn();
  });

  describe('processDocument', () => {
    it('should process a document with OCR', async () => {
      const result = await ocrService.processDocument('doc-123');
      
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-123');
      expect((ocrService as any).preprocessImage).toHaveBeenCalledWith(mockDocument.filePath);
      expect((ocrService as any).performOCR).toHaveBeenCalledWith(
        '/path/to/preprocessed.png',
        mockDocument.documentType,
        'en'
      );
      expect(mockDocumentRepository.updateOCRData).toHaveBeenCalledWith('doc-123', mockOCRResult);
      expect(result).toEqual(mockOCRResult);
    });
    
    it('should throw an error if OCR is disabled', async () => {
      // Temporarily modify config
      const originalConfig = { ...config.ocr };
      config.ocr.enabled = false;
      
      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('OCR processing is disabled');
      
      // Restore config
      config.ocr.enabled = originalConfig.enabled;
    });
    
    it('should throw an error if document is not found', async () => {
      mockDocumentRepository.findById.mockResolvedValueOnce(null);
      
      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('Document not found');
    });
    
    it('should throw an error if document type is not supported', async () => {
      mockDocumentRepository.findById.mockResolvedValueOnce({
        ...mockDocument,
        documentType: 'w4' as any
      });
      
      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('OCR is not supported for document type');
    });
    
    it('should throw an error if document file is not found', async () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);
      
      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('Document file not found');
    });
    
    it('should handle OCR processing errors', async () => {
      const error = new Error('OCR processing failed');
      (ocrService as any).performOCR.mockRejectedValueOnce(error);
      
      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('OCR processing failed');
      
      expect(mockDocumentRepository.updateOCRData).toHaveBeenCalledWith('doc-123', expect.objectContaining({
        processingStatus: 'failed',
        errorMessage: 'OCR processing failed'
      }));
    });
  });

  describe('extractFields', () => {
    it('should extract fields from driver\'s license text', () => {
      const text = 'NAME: JOHN DOE\nLICENSE: X12345678\nDOB: 01/15/1980\nEXP: 05/20/2025\nADDRESS: 123 Main St, Anytown, USA';
      
      const result = (ocrService as any).extractFields(text, 'drivers_license', 'en');
      
      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('licenseNumber');
      expect(result).toHaveProperty('dateOfBirth');
    });
    
    it('should extract fields from SSN card text', () => {
      const text = 'SOCIAL SECURITY\n123-45-6789\nJANE DOE';
      
      const result = (ocrService as any).extractFields(text, 'ssn', 'en');
      
      expect(result).toHaveProperty('ssnNumber');
    });
  });

  describe('validateExtractedData', () => {
    it('should validate correct data', () => {
      const result = ocrService.validateExtractedData({
        extractedData: {
          ssnNumber: '123456789',
          dateOfBirth: '01/15/1980'
        },
        processingStatus: 'completed'
      });
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
    
    it('should detect invalid processing status', () => {
      const result = ocrService.validateExtractedData({
        extractedData: {
          ssnNumber: '123456789'
        },
        processingStatus: 'failed'
      });
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveProperty('general');
    });
  });

  describe('correctOCRData', () => {
    it('should update OCR data with corrections', async () => {
      mockDocumentRepository.findById.mockResolvedValueOnce({
        ...mockDocument,
        ocrData: mockOCRResult
      });
      
      const corrections = {
        fullName: 'Jane Doe',
        dateOfBirth: '02/20/1985'
      };
      
      await ocrService.correctOCRData('doc-123', corrections);
      
      expect(mockDocumentRepository.updateOCRData).toHaveBeenCalledWith('doc-123', expect.objectContaining({
        extractedData: expect.objectContaining(corrections),
        manuallyCorrected: true
      }));
    });
    
    it('should throw an error if document has no OCR data', async () => {
      mockDocumentRepository.findById.mockResolvedValueOnce({
        ...mockDocument,
        ocrData: null
      });
      
      await expect(ocrService.correctOCRData('doc-123', {})).rejects.toThrow('Document has no OCR data to correct');
    });
  });

  describe('getPendingOCRDocuments', () => {
    it('should return documents pending OCR processing', async () => {
      const result = await ocrService.getPendingOCRDocuments();
      
      expect(mockDocumentRepository.findPendingOCR).toHaveBeenCalled();
      expect(result).toEqual([mockDocument]);
    });
  });

  describe('batchProcessDocuments', () => {
    it('should process multiple documents', async () => {
      const documentIds = ['doc-1', 'doc-2'];
      
      // Mock processDocument method
      const processDocumentSpy = jest.spyOn(ocrService, 'processDocument')
        .mockResolvedValue(mockOCRResult);
      
      const results = await ocrService.batchProcessDocuments(documentIds);
      
      expect(processDocumentSpy).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0]).toEqual(mockOCRResult);
      expect(results[1]).toEqual(mockOCRResult);
    });
    
    it('should handle errors in batch processing', async () => {
      const documentIds = ['doc-1', 'doc-2'];
      
      // Mock processDocument to fail for first document
      const processDocumentSpy = jest.spyOn(ocrService, 'processDocument')
        .mockRejectedValueOnce(new Error('Processing failed'))
        .mockResolvedValueOnce(mockOCRResult);
      
      const results = await ocrService.batchProcessDocuments(documentIds);
      
      expect(processDocumentSpy).toHaveBeenCalledTimes(2);
      expect(results).toHaveLength(2);
      expect(results[0].processingStatus).toBe('failed');
      expect(results[1]).toEqual(mockOCRResult);
    });
  });
});