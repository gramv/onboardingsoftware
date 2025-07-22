import { OCRService, OCRResult } from '../ocrService';
import { DocumentRepository } from '@/repositories/document.repository';
import { DocumentType } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Mock dependencies
jest.mock('@/repositories/document.repository');
jest.mock('tesseract.js');
jest.mock('sharp');
jest.mock('fs');

describe('OCRService Integration Tests', () => {
  let ocrService: OCRService;
  let mockDocumentRepository: jest.Mocked<DocumentRepository>;

  const createMockDocument = (documentType: DocumentType, filePath: string = '/path/to/document.jpg') => ({
    id: 'doc-123',
    employeeId: 'emp-123',
    documentType,
    documentName: `Test ${documentType}`,
    filePath,
    fileSize: 1024,
    mimeType: 'image/jpeg',
    isSigned: false,
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  beforeEach(() => {
    jest.clearAllMocks();

    mockDocumentRepository = {
      findById: jest.fn(),
      updateOCRData: jest.fn(),
      findPendingOCR: jest.fn(),
    } as unknown as jest.Mocked<DocumentRepository>;

    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);

    ocrService = new OCRService();
    (ocrService as any).documentRepository = mockDocumentRepository;
  });

  describe('Document Type Support', () => {
    const supportedTypes: DocumentType[] = [
      'drivers_license',
      'state_id',
      'passport',
      'work_authorization',
      'ssn'
    ];

    test.each(supportedTypes)('should support OCR processing for %s', async (documentType) => {
      const mockDocument = createMockDocument(documentType);
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      // Mock the private methods
      (ocrService as any).preprocessImage = jest.fn().mockResolvedValue('/path/to/preprocessed.png');
      (ocrService as any).performOCR = jest.fn().mockResolvedValue({
        extractedData: { fullName: 'John Doe' },
        confidence: 85,
        fieldConfidences: { fullName: 85 },
        rawText: 'John Doe',
        processingStatus: 'completed'
      });
      (ocrService as any).cleanupFile = jest.fn();

      await expect(ocrService.processDocument('doc-123')).resolves.toBeDefined();
      expect(mockDocumentRepository.findById).toHaveBeenCalledWith('doc-123');
    });

    const unsupportedTypes: DocumentType[] = ['i9', 'w4', 'handbook', 'policy', 'experience_letter', 'other'];

    test.each(unsupportedTypes)('should reject OCR processing for %s', async (documentType) => {
      const mockDocument = createMockDocument(documentType);
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      await expect(ocrService.processDocument('doc-123'))
        .rejects.toThrow('OCR is not supported for document type');
    });
  });

  describe('Field Extraction Validation', () => {
    describe('Driver\'s License Fields', () => {
      const expectedFields = ['fullName', 'licenseNumber', 'dateOfBirth', 'expirationDate', 'address', 'state', 'zipCode'];

      it('should extract all expected fields from driver\'s license', () => {
        const sampleText = `
          NAME: JOHN DOE
          LICENSE: X12345678
          DOB: 01/15/1980
          EXP: 05/20/2025
          ADDRESS: 123 Main St, Anytown, CA
          STATE: CA
          ZIP: 90210
        `;

        const result = (ocrService as any).extractFields(sampleText, 'drivers_license', 'en');

        expectedFields.forEach(field => {
          if (['fullName', 'licenseNumber', 'dateOfBirth'].includes(field)) {
            expect(result).toHaveProperty(field);
            expect(result[field]).toBeTruthy();
          }
        });
      });

      it('should validate extracted driver\'s license data', () => {
        const validData = {
          extractedData: {
            fullName: 'JOHN DOE',
            licenseNumber: 'X12345678',
            dateOfBirth: '01/15/1980',
            expirationDate: '05/20/2025',
            state: 'CA',
            zipCode: '90210'
          },
          processingStatus: 'completed'
        };

        const validation = ocrService.validateExtractedData(validData);
        expect(validation.isValid).toBe(true);
        expect(Object.keys(validation.errors)).toHaveLength(0);
      });
    });

    describe('SSN Card Fields', () => {
      it('should extract SSN number and name', () => {
        const sampleText = `
          SOCIAL SECURITY
          123-45-6789
          JOHN DOE
        `;

        const result = (ocrService as any).extractFields(sampleText, 'ssn', 'en');

        expect(result).toHaveProperty('ssnNumber');
        expect(result.ssnNumber).toBe('123456789'); // Should remove dashes
      });

      it('should validate SSN format', () => {
        const validSSN = {
          extractedData: { ssnNumber: '123456789' },
          processingStatus: 'completed'
        };

        const invalidSSN = {
          extractedData: { ssnNumber: '123-45-6789' }, // Should not have dashes
          processingStatus: 'completed'
        };

        expect(ocrService.validateExtractedData(validSSN).isValid).toBe(true);
        expect(ocrService.validateExtractedData(invalidSSN).isValid).toBe(false);
      });
    });

    describe('Passport Fields', () => {
      it('should extract passport-specific fields', () => {
        const sampleText = `
          PASSPORT
          NAME: JOHN DOE
          PASSPORT NO: A12345678
          DATE OF BIRTH: 01/15/1980
          DATE OF EXPIRY: 01/15/2030
          NATIONALITY: USA
          SEX: M
        `;

        const result = (ocrService as any).extractFields(sampleText, 'passport', 'en');

        expect(result).toHaveProperty('fullName');
        expect(result).toHaveProperty('passportNumber');
        expect(result).toHaveProperty('dateOfBirth');
        expect(result).toHaveProperty('nationality');
        expect(result).toHaveProperty('sex');
      });
    });
  });

  describe('Image Quality Validation', () => {
    it('should assess image quality correctly', () => {
      const highQualityMetadata = {
        width: 2000,
        height: 1500,
        format: 'png' as const,
        density: 300
      };

      const lowQualityMetadata = {
        width: 800,
        height: 600,
        format: 'jpeg' as const,
        density: 72
      };

      const highQualityAssessment = (ocrService as any).assessImageQuality(highQualityMetadata, 500000);
      const lowQualityAssessment = (ocrService as any).assessImageQuality(lowQualityMetadata, 50000);

      expect(highQualityAssessment.estimatedQuality).toBe('high');
      expect(lowQualityAssessment.estimatedQuality).toBe('low');
      expect(lowQualityAssessment.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Confidence Scoring', () => {
    it('should calculate field confidence correctly', () => {
      const extractedData = {
        fullName: 'JOHN DOE',
        licenseNumber: 'X12345678',
        dateOfBirth: '01/15/1980'
      };

      const fieldConfidences = (ocrService as any).calculateFieldConfidence(
        extractedData,
        'NAME: JOHN DOE LICENSE: X12345678 DOB: 01/15/1980',
        85,
        'drivers_license'
      );

      expect(fieldConfidences).toHaveProperty('fullName');
      expect(fieldConfidences).toHaveProperty('licenseNumber');
      expect(fieldConfidences).toHaveProperty('dateOfBirth');

      // License number should have higher confidence due to weight
      expect(fieldConfidences.licenseNumber).toBeGreaterThanOrEqual(fieldConfidences.fullName);
    });

    it('should apply minimum confidence thresholds', () => {
      const extractedData = { ssnNumber: '123456789' };

      const fieldConfidences = (ocrService as any).calculateFieldConfidence(
        extractedData,
        '123456789',
        50, // Low overall confidence
        'ssn'
      );

      // SSN should still meet minimum threshold of 80
      expect(fieldConfidences.ssnNumber).toBeGreaterThanOrEqual(80);
    });
  });

  describe('Error Handling', () => {
    it('should handle OCR processing failures gracefully', async () => {
      const mockDocument = createMockDocument('drivers_license');
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);

      (ocrService as any).preprocessImage = jest.fn().mockRejectedValue(new Error('Image processing failed'));

      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('Image processing failed');

      // Should update document with failed status
      expect(mockDocumentRepository.updateOCRData).toHaveBeenCalledWith('doc-123', expect.objectContaining({
        processingStatus: 'failed',
        errorMessage: 'Image processing failed'
      }));
    });

    it('should handle missing document files', async () => {
      const mockDocument = createMockDocument('drivers_license');
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      (fs.existsSync as jest.Mock).mockReturnValue(false);

      await expect(ocrService.processDocument('doc-123')).rejects.toThrow('Document file not found');
    });
  });

  describe('Manual Fallback Workflows', () => {
    it('should enable manual entry mode', async () => {
      const mockDocument = createMockDocument('drivers_license');
      mockDocumentRepository.findById.mockResolvedValue(mockDocument as any);
      mockDocumentRepository.updateOCRData.mockResolvedValue(mockDocument as any);

      const result = await ocrService.enableManualEntry('doc-123');

      expect(mockDocumentRepository.updateOCRData).toHaveBeenCalledWith('doc-123', expect.objectContaining({
        manualEntryEnabled: true,
        requiresManualReview: true,
        processingStatus: 'pending'
      }));
    });

    it('should provide field templates for manual entry', () => {
      const driversLicenseTemplate = ocrService.getFieldTemplates('drivers_license');

      expect(driversLicenseTemplate).toHaveProperty('fullName');
      expect(driversLicenseTemplate).toHaveProperty('licenseNumber');
      expect(driversLicenseTemplate.fullName).toHaveProperty('type', 'text');
      expect(driversLicenseTemplate.fullName).toHaveProperty('required', true);
      expect(driversLicenseTemplate.state).toHaveProperty('type', 'select');
      expect(driversLicenseTemplate.state.options).toContain('CA');
    });

    it('should compare OCR results with manual entry', () => {
      const ocrData = {
        fullName: 'JOHN DOE',
        licenseNumber: 'X12345678',
        dateOfBirth: '01/15/1980'
      };

      const manualData = {
        fullName: 'John Doe', // Different case
        licenseNumber: 'X12345678',
        dateOfBirth: '01/15/1985' // Different date
      };

      const comparison = ocrService.compareOCRWithManualEntry(ocrData, manualData);

      expect(comparison.matches.fullName).toBe(true); // Should normalize case
      expect(comparison.matches.licenseNumber).toBe(true);
      expect(comparison.matches.dateOfBirth).toBe(false);
      expect(comparison.differences).toHaveProperty('dateOfBirth');
      expect(comparison.accuracy).toBeLessThan(100);
    });
  });

  describe('Batch Processing', () => {
    it('should process multiple documents in batch', async () => {
      const documentIds = ['doc-1', 'doc-2', 'doc-3'];

      // Mock successful processing for all documents
      jest.spyOn(ocrService, 'processDocument').mockResolvedValue({
        extractedData: { fullName: 'John Doe' },
        confidence: 85,
        fieldConfidences: { fullName: 85 },
        rawText: 'John Doe',
        processingStatus: 'completed'
      });

      const results = await ocrService.processBatch(documentIds);

      expect(Object.keys(results)).toHaveLength(3);
      expect(results['doc-1'].processingStatus).toBe('completed');
      expect(results['doc-1']).toHaveProperty('requiresManualReview');
    });

    it('should handle partial failures in batch processing', async () => {
      const documentIds = ['doc-1', 'doc-2'];

      jest.spyOn(ocrService, 'processDocument')
        .mockResolvedValueOnce({
          extractedData: { fullName: 'John Doe' },
          confidence: 85,
          fieldConfidences: { fullName: 85 },
          rawText: 'John Doe',
          processingStatus: 'completed'
        })
        .mockRejectedValueOnce(new Error('Processing failed'));

      const results = await ocrService.processBatch(documentIds);

      expect(results['doc-1'].processingStatus).toBe('completed');
      expect(results['doc-2'].processingStatus).toBe('failed');
      expect(results['doc-2'].requiresManualReview).toBe(true);
    });
  });

  describe('Language Detection and Processing', () => {
    it('should detect document language correctly', () => {
      const englishText = 'NAME: JOHN DOE LICENSE: X12345678 DATE OF BIRTH: 01/15/1980';
      const spanishText = 'NOMBRE: JUAN PEREZ LICENCIA: X12345678 FECHA DE NACIMIENTO: 15/01/1980';

      const { detectDocumentLanguage } = require('../i18n/extractionPatterns');

      expect(detectDocumentLanguage(englishText)).toBe('en');
      expect(detectDocumentLanguage(spanishText)).toBe('es');
    });

    it('should use language-specific extraction patterns', () => {
      const spanishText = 'NOMBRE: JUAN PEREZ LICENCIA: X12345678 FECHA DE NACIMIENTO: 15/01/1980';

      const result = (ocrService as any).extractFields(spanishText, 'drivers_license', 'es');

      expect(result).toHaveProperty('fullName');
      expect(result).toHaveProperty('licenseNumber');
    });
  });
});