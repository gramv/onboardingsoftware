import request from 'supertest';
import express from 'express';
import { OCRService } from '@/services/document/ocrService';
import { authenticate } from '@/middleware/auth/authMiddleware';
import ocrRoutes from '../ocr';
import { errorHandler } from '@/middleware/errorHandler';

// Mock dependencies
jest.mock('@/services/document/ocrService');
jest.mock('@/middleware/auth/authMiddleware');

describe('OCR Routes', () => {
  let app: express.Application;
  let mockOCRService: jest.Mocked<OCRService>;
  
  // Mock user for authentication
  const mockUser = {
    userId: 'user-123',
    role: 'hr_admin',
    organizationId: 'org-123'
  };
  
  // Mock document
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
    updatedAt: new Date(),
    ocrData: {
      extractedData: {
        fullName: 'John Doe',
        licenseNumber: 'X12345678',
        dateOfBirth: '01/15/1980'
      },
      confidence: 85.5,
      fieldConfidences: {
        fullName: 90,
        licenseNumber: 85,
        dateOfBirth: 80
      },
      rawText: 'NAME: JOHN DOE\nLICENSE: X12345678\nDOB: 01/15/1980',
      processingStatus: 'completed',
      requiresManualReview: false
    },
    signedAt: null,
    signatureData: null,
    employee: {
      id: 'emp-123',
      employeeId: 'EMP001',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        organization: {
          name: 'Test Motel'
        }
      }
    }
  };
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock authentication middleware
    (authenticate as jest.Mock).mockImplementation((req, res, next) => {
      req.user = mockUser;
      next();
    });
    
    // Create OCR service mock
    mockOCRService = {
      processDocument: jest.fn(),
      retryWithEnhancement: jest.fn(),
      correctOCRData: jest.fn(),
      enableManualEntry: jest.fn(),
      getFieldTemplates: jest.fn(),
      processBatch: jest.fn(),
      compareOCRWithManualEntry: jest.fn(),
      documentRepository: {
        findById: jest.fn()
      }
    } as unknown as jest.Mocked<OCRService>;
    
    // Assign mock to the OCRService constructor
    (OCRService as jest.Mock).mockImplementation(() => mockOCRService);
    
    // Create Express app with routes
    app = express();
    app.use(express.json());
    app.use('/ocr', ocrRoutes);
    app.use(errorHandler);
  });
  
  describe('POST /ocr/process', () => {
    it('should process a document with OCR', async () => {
      // Mock OCR service response
      mockOCRService.processDocument.mockResolvedValueOnce({
        extractedData: {
          fullName: 'John Doe',
          licenseNumber: 'X12345678',
          dateOfBirth: '01/15/1980'
        },
        confidence: 85.5,
        fieldConfidences: {
          fullName: 90,
          licenseNumber: 85,
          dateOfBirth: 80
        },
        rawText: 'NAME: JOHN DOE\nLICENSE: X12345678\nDOB: 01/15/1980',
        processingStatus: 'completed',
        requiresManualReview: false
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/process')
        .send({ documentId: 'doc-123' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.processDocument).toHaveBeenCalledWith('doc-123');
      expect(response.body).toHaveProperty('data.extractedData.fullName', 'John Doe');
      expect(response.body).toHaveProperty('data.confidence', 85.5);
      expect(response.body).toHaveProperty('data.processingStatus', 'completed');
    });
    
    it('should return validation error for invalid document ID', async () => {
      // Make request with invalid document ID
      const response = await request(app)
        .post('/ocr/process')
        .send({ documentId: 'invalid-id' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
      expect(mockOCRService.processDocument).not.toHaveBeenCalled();
    });
    
    it('should handle OCR processing errors', async () => {
      // Mock OCR service to throw error
      mockOCRService.processDocument.mockRejectedValueOnce(
        new Error('OCR processing is disabled')
      );
      
      // Make request
      const response = await request(app)
        .post('/ocr/process')
        .send({ documentId: 'doc-123' });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error.code', 'OCR_DISABLED');
    });
  });
  
  describe('GET /ocr/result/:id', () => {
    it('should get OCR result for a document', async () => {
      // Mock document repository response
      (mockOCRService.documentRepository.findById as jest.Mock).mockResolvedValueOnce(mockDocument);
      
      // Make request
      const response = await request(app)
        .get('/ocr/result/doc-123');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.documentRepository.findById).toHaveBeenCalledWith('doc-123');
      expect(response.body).toHaveProperty('data.extractedData.fullName', 'John Doe');
      expect(response.body).toHaveProperty('data.confidence', 85.5);
    });
    
    it('should return 404 if document not found', async () => {
      // Mock document repository to return null
      (mockOCRService.documentRepository.findById as jest.Mock).mockResolvedValueOnce(null);
      
      // Make request
      const response = await request(app)
        .get('/ocr/result/doc-123');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error.code', 'DOCUMENT_NOT_FOUND');
    });
    
    it('should return 404 if document has no OCR data', async () => {
      // Mock document repository to return document without OCR data
      (mockOCRService.documentRepository.findById as jest.Mock).mockResolvedValueOnce({
        ...mockDocument,
        ocrData: null
      });
      
      // Make request
      const response = await request(app)
        .get('/ocr/result/doc-123');
      
      // Assertions
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error.code', 'OCR_DATA_NOT_FOUND');
    });
  });
  
  describe('POST /ocr/correct', () => {
    it('should correct OCR data', async () => {
      // Mock OCR service response
      mockOCRService.correctOCRData.mockResolvedValueOnce({
        ...mockDocument,
        ocrData: {
          ...mockDocument.ocrData,
          extractedData: {
            fullName: 'Jane Doe', // Corrected data
            licenseNumber: 'X12345678',
            dateOfBirth: '01/15/1980'
          },
          manuallyCorrectd: true
        }
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/correct')
        .send({
          documentId: 'doc-123',
          correctedData: {
            fullName: 'Jane Doe'
          }
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.correctOCRData).toHaveBeenCalledWith(
        'doc-123',
        { fullName: 'Jane Doe' }
      );
      expect(response.body).toHaveProperty('data.extractedData.fullName', 'Jane Doe');
      expect(response.body).toHaveProperty('data.manuallyCorrectd', true);
    });
    
    it('should return validation error for invalid request', async () => {
      // Make request with missing data
      const response = await request(app)
        .post('/ocr/correct')
        .send({
          documentId: 'doc-123'
          // Missing correctedData
        });
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
      expect(mockOCRService.correctOCRData).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /ocr/retry', () => {
    it('should retry OCR processing with enhanced settings', async () => {
      // Mock OCR service response
      mockOCRService.retryWithEnhancement.mockResolvedValueOnce({
        extractedData: {
          fullName: 'John Doe',
          licenseNumber: 'X12345678',
          dateOfBirth: '01/15/1980'
        },
        confidence: 92.5, // Higher confidence with enhanced processing
        fieldConfidences: {
          fullName: 95,
          licenseNumber: 90,
          dateOfBirth: 85
        },
        rawText: 'NAME: JOHN DOE\nLICENSE: X12345678\nDOB: 01/15/1980',
        processingStatus: 'completed',
        enhancedProcessing: true
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/retry')
        .send({ documentId: 'doc-123' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.retryWithEnhancement).toHaveBeenCalledWith('doc-123');
      expect(response.body).toHaveProperty('data.confidence', 92.5);
      expect(response.body).toHaveProperty('data.enhancedProcessing', true);
    });
  });
  
  describe('POST /ocr/manual-entry', () => {
    it('should enable manual entry mode', async () => {
      // Mock OCR service response
      mockOCRService.enableManualEntry.mockResolvedValueOnce({
        ...mockDocument,
        ocrData: {
          ...mockDocument.ocrData,
          manualEntryEnabled: true,
          processingStatus: 'failed',
          errorMessage: 'OCR processing failed, manual entry enabled'
        }
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/manual-entry')
        .send({ documentId: 'doc-123' });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.enableManualEntry).toHaveBeenCalledWith('doc-123');
      expect(response.body).toHaveProperty('data.manualEntryEnabled', true);
    });
  });
  
  describe('GET /ocr/field-templates/:documentType', () => {
    it('should get field templates for a document type', async () => {
      // Mock OCR service response
      mockOCRService.getFieldTemplates.mockReturnValueOnce({
        fullName: {
          label: 'Full Name',
          required: true,
          type: 'text'
        },
        licenseNumber: {
          label: 'License Number',
          required: true,
          type: 'text'
        }
      });
      
      // Make request
      const response = await request(app)
        .get('/ocr/field-templates/drivers_license');
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.getFieldTemplates).toHaveBeenCalledWith('drivers_license');
      expect(response.body).toHaveProperty('data.templates.fullName.label', 'Full Name');
      expect(response.body).toHaveProperty('data.templates.licenseNumber.required', true);
    });
    
    it('should return validation error for invalid document type', async () => {
      // Make request with invalid document type
      const response = await request(app)
        .get('/ocr/field-templates/invalid_type');
      
      // Assertions
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error.code', 'VALIDATION_ERROR');
      expect(mockOCRService.getFieldTemplates).not.toHaveBeenCalled();
    });
  });
  
  describe('POST /ocr/batch', () => {
    it('should process multiple documents in batch', async () => {
      // Mock OCR service response
      mockOCRService.processBatch.mockResolvedValueOnce({
        'doc-123': {
          extractedData: { fullName: 'John Doe' },
          confidence: 85.5,
          fieldConfidences: {},
          rawText: '',
          processingStatus: 'completed',
          requiresManualReview: false
        },
        'doc-456': {
          extractedData: { fullName: 'Jane Smith' },
          confidence: 75.5,
          fieldConfidences: {},
          rawText: '',
          processingStatus: 'completed',
          requiresManualReview: true
        }
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/batch')
        .send({ documentIds: ['doc-123', 'doc-456'] });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.processBatch).toHaveBeenCalledWith(['doc-123', 'doc-456']);
      expect(response.body).toHaveProperty('data.summary.total', 2);
      expect(response.body).toHaveProperty('data.summary.completed', 2);
      expect(response.body).toHaveProperty('data.summary.requiresManualReview', 1);
    });
  });
  
  describe('POST /ocr/compare', () => {
    it('should compare OCR and manual data', async () => {
      // Mock OCR service response
      mockOCRService.compareOCRWithManualEntry.mockReturnValueOnce({
        matches: {
          fullName: true,
          licenseNumber: false
        },
        recommendations: {
          licenseNumber: 'X12345678'
        },
        confidenceLevel: 'medium'
      });
      
      // Make request
      const response = await request(app)
        .post('/ocr/compare')
        .send({
          ocrData: {
            fullName: 'John Doe',
            licenseNumber: 'X12345678'
          },
          manualData: {
            fullName: 'John Doe',
            licenseNumber: 'X87654321'
          }
        });
      
      // Assertions
      expect(response.status).toBe(200);
      expect(mockOCRService.compareOCRWithManualEntry).toHaveBeenCalledWith(
        { fullName: 'John Doe', licenseNumber: 'X12345678' },
        { fullName: 'John Doe', licenseNumber: 'X87654321' }
      );
      expect(response.body).toHaveProperty('data.confidenceLevel', 'medium');
      expect(response.body).toHaveProperty('data.matches.fullName', true);
      expect(response.body).toHaveProperty('data.matches.licenseNumber', false);
    });
  });
});