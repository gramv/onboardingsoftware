import fs from 'fs';
import path from 'path';
import { createWorker, PSM, OEM } from 'tesseract.js';
import { Document, DocumentType, Prisma } from '@prisma/client';
import sharp from 'sharp';
import { groqService } from '../ai/groqService';
import { PrismaClient } from '@prisma/client';
import { 
  extractionPatterns, 
  getPatternsForLanguage, 
  validationPatterns,
  confidenceWeights,
  minimumConfidenceThresholds,
  ExtractionPattern,
  detectDocumentLanguage,
  formatDateByLocale,
  getConfidenceMessage,
  OCR_TRANSLATION_KEYS,
  VALIDATION_ERROR_KEYS,
  DOCUMENT_TYPE_LABELS
} from './i18n/extractionPatterns';

// Define OCR result interface
export interface OCRResult {
  extractedData: Record<string, any>;
  confidence: number;
  fieldConfidences: Record<string, number>;
  rawText: string;
  processingStatus: 'pending' | 'completed' | 'failed';
  enhancedProcessing?: boolean;
}

export interface OCRProcessingResult {
  extractedData: Record<string, any>;
  confidence: number;
  fieldConfidences: Record<string, number>;
  rawText: string;
  processingStatus: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  enhancedProcessing?: boolean;
  language?: 'en' | 'es';
}

export class OCRService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Process a document with OCR
   * @param documentId The ID of the document to process
   * @param language Optional language preference (auto-detected if not provided)
   * @returns OCR processing result
   */
  async processDocument(
    documentPath: string,
    documentType: DocumentType
  ): Promise<OCRProcessingResult> {
    try {
      console.log(`Processing document: ${documentPath}, type: ${documentType}`);
      
      // Convert image to base64 for Groq
      const imageBuffer = await fs.promises.readFile(documentPath);
      const imageBase64 = imageBuffer.toString('base64');
      
      // Use Groq for OCR processing
      const groqResult = await groqService.processDocumentOCR(imageBase64, documentType as any);
      
      // Fallback to Tesseract if Groq fails or has low confidence
      let finalResult = groqResult;
      if (groqResult.confidence < 0.5) {
        console.log('Groq confidence low, falling back to Tesseract');
        const processedImagePath = await this.preprocessImage(documentPath);
        const tesseractResult = await this.performOCR(processedImagePath, documentType);
        
        if (processedImagePath !== documentPath) {
          await fs.promises.unlink(processedImagePath);
        }
        
        finalResult = {
          ...tesseractResult,
          confidence: tesseractResult.confidence,
          extractedText: tesseractResult.rawText
        };
      }
      
      return {
        extractedData: finalResult,
        confidence: finalResult.confidence,
        fieldConfidences: {},
        rawText: finalResult.extractedText,
        processingStatus: 'completed'
      };
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        extractedData: {},
        confidence: 0,
        fieldConfidences: {},
        rawText: '',
        processingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Perform initial OCR for language detection
   * @param imagePath Path to the preprocessed image
   * @returns Basic OCR result for language detection
   */
  private async performInitialOCR(imagePath: string): Promise<{ text: string; confidence: number }> {
    const worker = await createWorker();
    
    try {
      // Use English for initial detection
      await worker.reinitialize('eng');
      
      // Use fast settings for initial scan
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO,
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY
      });
      
      const { data } = await worker.recognize(imagePath);
      return { text: data.text, confidence: data.confidence };
    } finally {
      await worker.terminate();
    }
  }

  /**
   * Preprocess an image for better OCR results
   * @param imagePath Path to the original image
   * @returns Path to the preprocessed image
   */
  private async preprocessImage(imagePath: string): Promise<string> {
    const tempDir = path.join(process.cwd(), 'storage', 'temp');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `preprocessed_${Date.now()}_${path.basename(imagePath)}`);
    
    // Apply image preprocessing techniques
    await sharp(imagePath)
      // Convert to grayscale
      .grayscale()
      // Increase contrast
      .normalize()
      // Sharpen the image
      .sharpen()
      // Resize if needed (maintain aspect ratio)
      .resize(2000, 2000, { fit: 'inside', withoutEnlargement: true })
      // Save as PNG for better quality
      .png({ quality: 100 })
      .toFile(outputPath);
    
    return outputPath;
  }

  /**
   * Perform OCR on an image
   * @param imagePath Path to the image
   * @param documentType Type of document
   * @param language Language preference
   * @returns OCR result
   */
  private async performOCR(imagePath: string, documentType: DocumentType, language: 'en' | 'es' = 'en'): Promise<OCRProcessingResult> {
    // Create Tesseract worker
    const worker = await createWorker();
    
    try {
      // Initialize worker with specified language
      const tesseractLang = language === 'es' ? 'spa' : 'eng';
      await worker.reinitialize(tesseractLang);
      
      // Set PSM mode to automatic page segmentation with OSD
      await worker.setParameters({
        tessedit_pageseg_mode: PSM.AUTO_OSD,
        tessedit_ocr_engine_mode: OEM.LSTM_ONLY
      });
      
      // Recognize text
      const { data } = await worker.recognize(imagePath);
      
      // Extract fields based on document type and language
      const extractedData = this.extractFields(data.text, documentType, language);
      
      // Calculate confidence scores
      const fieldConfidences = this.calculateFieldConfidence(
        extractedData, 
        data.text, 
        data.confidence,
        documentType
      );
      
      // Create OCR result
      const result: OCRProcessingResult = {
        extractedData,
        confidence: data.confidence,
        fieldConfidences,
        rawText: data.text,
        processingStatus: 'completed',
        language
      };
      
      return result;
    } finally {
      // Terminate worker
      await worker.terminate();
    }
  }

  /**
   * Extract fields from OCR text based on document type and language
   * @param text OCR text
   * @param documentType Type of document
   * @param language Language preference
   * @returns Extracted fields
   */
  private extractFields(text: string, documentType: DocumentType, language: 'en' | 'es' = 'en'): Record<string, any> {
    const patterns = getPatternsForLanguage(documentType, language);
    const extractedData: Record<string, any> = {};
    
    // Apply each extraction pattern
    for (const pattern of patterns) {
      const match = text.match(pattern.regex);
      if (match && match[1]) {
        const value = pattern.transform ? pattern.transform(match[1]) : match[1];
        extractedData[pattern.fieldName] = value;
      } else if (pattern.required) {
        // Set empty value for required fields that weren't found
        extractedData[pattern.fieldName] = '';
      }
    }
    
    return extractedData;
  }

  /**
   * Calculate confidence scores for extracted fields
   * @param extractedData Extracted field data
   * @param text Raw OCR text
   * @param overallConfidence Overall OCR confidence
   * @param documentType Type of document
   * @returns Field confidence scores
   */
  private calculateFieldConfidence(
    extractedData: Record<string, any>,
    text: string,
    overallConfidence: number,
    documentType: DocumentType
  ): Record<string, number> {
    const fieldConfidences: Record<string, number> = {};
    
    // Calculate confidence for each field
    for (const [fieldName, fieldValue] of Object.entries(extractedData)) {
      if (fieldValue) {
        const valueString = String(fieldValue);
        let fieldConfidence = overallConfidence;
        
        // Apply confidence weights
        const weight = confidenceWeights[fieldName as keyof typeof confidenceWeights] || 1.0;
        fieldConfidence = fieldConfidence * weight;
        
        // Validate against patterns
        const validationPattern = validationPatterns[fieldName as keyof typeof validationPatterns];
        if (validationPattern && validationPattern.test(valueString)) {
          fieldConfidence = Math.min(95, fieldConfidence * 1.1);
        } else if (validationPattern) {
          fieldConfidence = fieldConfidence * 0.7;
        }
        
        // Apply minimum thresholds
        const minThreshold = minimumConfidenceThresholds[fieldName as keyof typeof minimumConfidenceThresholds] || 50;
        fieldConfidence = Math.max(minThreshold, fieldConfidence);
        
        fieldConfidences[fieldName] = Math.round(Math.min(100, fieldConfidence));
      } else {
        // Field not found
        fieldConfidences[fieldName] = 0;
      }
    }
    
    return fieldConfidences;
  }

  /**
   * Check if document type supports OCR
   * @param documentType Type of document
   * @returns Whether OCR is supported
   */
  private isOCRSupportedDocumentType(documentType: DocumentType): boolean {
    return ['ssn', 'drivers_license', 'state_id', 'passport', 'work_authorization'].includes(documentType);
  }

  /**
   * Clean up temporary file
   * @param filePath Path to file
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
   * Get pending OCR documents
   * @returns List of documents pending OCR processing
   */
  async getPendingOCRDocuments(): Promise<Document[]> {
    return this.prisma.document.findMany({
      where: {
        OR: [
          { ocrData: { equals: Prisma.DbNull } },
          { ocrData: { equals: Prisma.JsonNull } }
        ]
      }
    });
  }

  /**
   * Update OCR data for a document
   * @param documentId Document ID
   * @param ocrData OCR data
   * @returns Updated document
   */
  async updateOCRData(documentId: string, ocrData: OCRProcessingResult): Promise<Document> {
    return this.prisma.document.update({
      where: { id: documentId },
      data: { ocrData: ocrData as any }
    });
  }

  /**
   * Manually correct OCR data
   * @param documentId Document ID
   * @param correctedData Corrected data
   * @returns Updated document
   */
  async correctOCRData(documentId: string, correctedData: Record<string, any>): Promise<Document> {
    // Get existing OCR data
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check if document has OCR data
    if (!document.ocrData) {
      throw new Error('Document has no OCR data to correct');
    }
    
    // Create updated OCR data
    const existingOCRData = document.ocrData as any;
    const updatedOCRData = {
      ...existingOCRData,
      extractedData: {
        ...existingOCRData.extractedData,
        ...correctedData
      },
      // Mark as manually corrected
      manuallyCorrected: true,
      correctedAt: new Date().toISOString()
    };
    
    // Update document
    return this.prisma.document.update({
      where: { id: documentId },
      data: { ocrData: updatedOCRData as any }
    });
  }

  /**
   * Retry OCR processing with enhanced preprocessing
   * @param documentId Document ID
   * @param language Language preference
   * @returns OCR result
   */
  async retryWithEnhancement(documentId: string, language: 'en' | 'es' = 'en'): Promise<OCRProcessingResult> {
    // Get the document
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });
    if (!document) {
      throw new Error('Document not found');
    }
    
    // Check if file exists
    if (!document.filePath || !fs.existsSync(document.filePath)) {
      throw new Error('Document file not found');
    }
    
    try {
      // Apply more aggressive preprocessing
      const tempDir = path.join(process.cwd(), 'storage', 'temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      
      const enhancedImagePath = path.join(tempDir, `enhanced_${Date.now()}_${path.basename(document.filePath)}`);
      
      // Apply enhanced preprocessing
      await sharp(document.filePath)
        .grayscale()
        .normalize()
        .sharpen({ sigma: 2 })
        .threshold(128)
        .resize(2500, 2500, { fit: 'inside', withoutEnlargement: true })
        .png({ quality: 100 })
        .toFile(enhancedImagePath);
      
      // Perform OCR with different settings
      const worker = await createWorker();
      
      try {
        const tesseractLang = language === 'es' ? 'spa' : 'eng';
        await worker.reinitialize(tesseractLang);
        
        // Try different PSM mode for better results
        await worker.setParameters({
          tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
          tessedit_ocr_engine_mode: OEM.LSTM_ONLY
        });
        
        const { data } = await worker.recognize(enhancedImagePath);
        
        // Extract fields
        const extractedData = this.extractFields(data.text, document.documentType, language);
        
        // Calculate confidence
        const fieldConfidences = this.calculateFieldConfidence(
          extractedData,
          data.text,
          data.confidence,
          document.documentType
        );
        
        // Create OCR result
        const result: OCRProcessingResult = {
          extractedData,
          confidence: data.confidence,
          fieldConfidences,
          rawText: data.text,
          processingStatus: 'completed',
          enhancedProcessing: true,
          language
        };
        
        // Update document
        await this.prisma.document.update({
          where: { id: documentId },
          data: { ocrData: result as any }
        });
        
        // Clean up
        this.cleanupFile(enhancedImagePath);
        
        return result;
      } finally {
        await worker.terminate();
      }
    } catch (error) {
      // Update document with failed OCR status
      const failedResult: OCRProcessingResult = {
        extractedData: {},
        confidence: 0,
        fieldConfidences: {},
        rawText: '',
        processingStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error during enhanced OCR processing'
      };
      
      await this.prisma.document.update({
        where: { id: documentId },
        data: { ocrData: failedResult as any }
      });
      throw error;
    }
  }

  /**
   * Validate extracted OCR data against expected patterns
   * @param data OCR data
   * @param language Language for error messages
   * @returns Validation result with translatable error keys
   */
  validateExtractedData(data: any, language: 'en' | 'es' = 'en'): { isValid: boolean; errors: Record<string, string> } {
    if (!data || !data.extractedData || !data.processingStatus) {
      return { isValid: false, errors: { general: VALIDATION_ERROR_KEYS.FIELD_REQUIRED } };
    }
    
    const errors: Record<string, string> = {};
    const { extractedData, processingStatus } = data;
    
    // Check processing status
    if (processingStatus !== 'completed') {
      return { 
        isValid: false, 
        errors: { general: OCR_TRANSLATION_KEYS.PROCESSING_FAILED }
      };
    }
    
    // Validate each field against its pattern with specific error messages
    for (const [fieldName, fieldValue] of Object.entries(extractedData)) {
      if (fieldValue) {
        const validationPattern = validationPatterns[fieldName as keyof typeof validationPatterns];
        if (validationPattern && !validationPattern.test(String(fieldValue))) {
          // Use specific validation error keys
          switch (fieldName) {
            case 'ssnNumber':
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_SSN_FORMAT;
              break;
            case 'licenseNumber':
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_LICENSE_FORMAT;
              break;
            case 'dateOfBirth':
            case 'expirationDate':
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_DATE_FORMAT;
              break;
            case 'state':
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_STATE_CODE;
              break;
            case 'zipCode':
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_ZIP_CODE;
              break;
            default:
              errors[fieldName] = VALIDATION_ERROR_KEYS.INVALID_FIELD_FORMAT;
          }
        }
        
        // Check field length constraints
        const valueString = String(fieldValue);
        if (fieldName === 'fullName' && valueString.length < 2) {
          errors[fieldName] = VALIDATION_ERROR_KEYS.FIELD_TOO_SHORT;
        } else if (fieldName === 'address' && valueString.length < 5) {
          errors[fieldName] = VALIDATION_ERROR_KEYS.FIELD_TOO_SHORT;
        } else if (valueString.length > 100) {
          errors[fieldName] = VALIDATION_ERROR_KEYS.FIELD_TOO_LONG;
        }
      }
    }
    
    // Enhanced date validation with proper error messages
    if ('dateOfBirth' in extractedData || 'expirationDate' in extractedData) {
      const dateFields = ['dateOfBirth', 'expirationDate'];
      for (const field of dateFields) {
        if (field in extractedData) {
          const date = extractedData[field];
          if (date && /^\d{2}\/\d{2}\/\d{4}$/.test(date)) {
            // Check if date is valid
            const [month, day, year] = date.split('/').map(Number);
            const dateObj = new Date(year, month - 1, day);
            if (
              dateObj.getFullYear() !== year ||
              dateObj.getMonth() !== month - 1 ||
              dateObj.getDate() !== day
            ) {
              errors[field] = VALIDATION_ERROR_KEYS.INVALID_DATE_FORMAT;
            }
            
            // Additional date logic validation
            if (field === 'dateOfBirth') {
              const today = new Date();
              const age = today.getFullYear() - year;
              if (age < 16 || age > 120) {
                errors[field] = VALIDATION_ERROR_KEYS.INVALID_DATE_FORMAT;
              }
            } else if (field === 'expirationDate') {
              const today = new Date();
              if (dateObj < today) {
                // Expired document - this might be a warning rather than error
                errors[field] = VALIDATION_ERROR_KEYS.INVALID_DATE_FORMAT;
              }
            }
          }
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }

  /**
   * Get confidence level message for UI display
   * @param confidence Confidence score
   * @param language Language preference
   * @returns Translatable confidence message key
   */
  getConfidenceMessage(confidence: number, language: 'en' | 'es' = 'en'): string {
    return getConfidenceMessage(confidence, language);
  }

  /**
   * Get document type label for UI display
   * @param documentType Document type
   * @param language Language preference
   * @returns Localized document type label
   */
  getDocumentTypeLabel(documentType: string, language: 'en' | 'es' = 'en'): string {
    const labels = DOCUMENT_TYPE_LABELS[documentType as keyof typeof DOCUMENT_TYPE_LABELS];
    return labels ? labels[language] : documentType;
  }

  /**
   * Process multiple documents in batch
   * @param documentIds Array of document IDs
   * @param language Language preference
   * @returns Array of OCR results
   */
  async batchProcessDocuments(documentIds: string[], language: 'en' | 'es' = 'en'): Promise<OCRProcessingResult[]> {
    const results: OCRProcessingResult[] = [];
    
    for (const documentId of documentIds) {
      try {
        const result = await this.processDocument(documentId, 'drivers_license');
        results.push(result);
      } catch (error) {
        // Continue processing other documents even if one fails
        const failedResult: OCRProcessingResult = {
          extractedData: {},
          confidence: 0,
          fieldConfidences: {},
          rawText: '',
          processingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        };
        results.push(failedResult);
      }
    }
    
    return results;
  }

  /**
   * Enable manual entry mode for a document
   * @param documentId Document ID
   * @returns Updated document
   */
  async enableManualEntry(documentId: string, manualData: Record<string, any>): Promise<OCRProcessingResult> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId }
    });
    if (!document) {
      throw new Error('Document not found');
    }

    const manualEntryData: OCRProcessingResult = {
      extractedData: manualData,
      confidence: 100,
      fieldConfidences: {},
      rawText: 'Manual entry',
      processingStatus: 'completed',
      enhancedProcessing: false
    };
    
    return manualEntryData;
  }

  /**
   * Get field templates for manual entry
   * @param documentType Document type
   * @returns Field templates
   */
  getFieldTemplates(documentType: DocumentType): Record<string, any> {
    const templates: Record<string, any> = {
      drivers_license: {
        fullName: { type: 'text', required: true, label: 'Full Name' },
        licenseNumber: { type: 'text', required: true, label: 'License Number' },
        dateOfBirth: { type: 'date', required: true, label: 'Date of Birth' },
        expirationDate: { type: 'date', required: false, label: 'Expiration Date' },
        address: { type: 'textarea', required: false, label: 'Address' },
        state: { type: 'select', required: false, label: 'State', options: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] },
        zipCode: { type: 'text', required: false, label: 'ZIP Code', pattern: '\\d{5}(-\\d{4})?' }
      },
      state_id: {
        fullName: { type: 'text', required: true, label: 'Full Name' },
        idNumber: { type: 'text', required: true, label: 'ID Number' },
        dateOfBirth: { type: 'date', required: true, label: 'Date of Birth' },
        expirationDate: { type: 'date', required: false, label: 'Expiration Date' },
        address: { type: 'textarea', required: false, label: 'Address' },
        state: { type: 'select', required: false, label: 'State', options: ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'] }
      },
      passport: {
        fullName: { type: 'text', required: true, label: 'Full Name' },
        passportNumber: { type: 'text', required: true, label: 'Passport Number' },
        dateOfBirth: { type: 'date', required: true, label: 'Date of Birth' },
        expirationDate: { type: 'date', required: false, label: 'Expiration Date' },
        nationality: { type: 'text', required: false, label: 'Nationality' },
        sex: { type: 'select', required: false, label: 'Sex', options: ['M', 'F'] }
      },
      work_authorization: {
        fullName: { type: 'text', required: true, label: 'Full Name' },
        alienNumber: { type: 'text', required: false, label: 'Alien Number' },
        cardNumber: { type: 'text', required: false, label: 'Card Number' },
        expirationDate: { type: 'date', required: false, label: 'Expiration Date' },
        countryOfBirth: { type: 'text', required: false, label: 'Country of Birth' }
      },
      ssn: {
        ssnNumber: { type: 'text', required: true, label: 'SSN Number', pattern: '\\d{9}' },
        fullName: { type: 'text', required: false, label: 'Full Name' }
      }
    };

    return templates[documentType] || {};
  }

  /**
   * Process documents in batch with detailed results
   * @param documentIds Array of document IDs
   * @returns Batch processing results
   */
  async processBatch(documentPaths: string[], documentType: DocumentType): Promise<Record<string, OCRProcessingResult & { requiresManualReview?: boolean }>> {
    const results: Record<string, OCRProcessingResult & { requiresManualReview?: boolean }> = {};
    
    for (const documentPath of documentPaths) {
      try {
        const result = await this.processDocument(documentPath, documentType);
        results[documentPath] = {
          ...result,
          requiresManualReview: result.confidence < 70 || Object.values(result.fieldConfidences).some(conf => conf < 60)
        };
      } catch (error) {
        results[documentPath] = {
          extractedData: {},
          confidence: 0,
          fieldConfidences: {},
          rawText: '',
          processingStatus: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          requiresManualReview: true
        };
      }
    }
    
    return results;
  }

  /**
   * Compare OCR results with manually entered data
   * @param ocrData OCR extracted data
   * @param manualData Manually entered data
   * @returns Comparison results
   */
  compareOCRWithManualEntry(ocrData: Record<string, any>, manualData: Record<string, any>): {
    matches: Record<string, boolean>;
    differences: Record<string, { ocr: any; manual: any }>;
    accuracy: number;
  } {
    const matches: Record<string, boolean> = {};
    const differences: Record<string, { ocr: any; manual: any }> = {};
    
    const allFields = new Set([...Object.keys(ocrData), ...Object.keys(manualData)]);
    let matchCount = 0;
    
    for (const field of allFields) {
      const ocrValue = ocrData[field];
      const manualValue = manualData[field];
      
      // Normalize values for comparison
      const normalizedOCR = this.normalizeValue(ocrValue);
      const normalizedManual = this.normalizeValue(manualValue);
      
      const isMatch = normalizedOCR === normalizedManual;
      matches[field] = isMatch;
      
      if (!isMatch) {
        differences[field] = { ocr: ocrValue, manual: manualValue };
      } else {
        matchCount++;
      }
    }
    
    const accuracy = allFields.size > 0 ? (matchCount / allFields.size) * 100 : 0;
    
    return { matches, differences, accuracy };
  }

  /**
   * Normalize value for comparison
   * @param value Value to normalize
   * @returns Normalized value
   */
  private normalizeValue(value: any): string {
    if (value == null) return '';
    
    const str = String(value).toLowerCase().trim();
    
    // Remove common OCR artifacts
    return str
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  /**
   * Advanced image preprocessing with quality assessment
   * @param imagePath Path to the original image
   * @param documentType Type of document for specialized preprocessing
   * @returns Path to the preprocessed image and quality metrics
   */
  private async advancedPreprocessImage(imagePath: string, documentType: DocumentType): Promise<{
    preprocessedPath: string;
    qualityMetrics: {
      resolution: { width: number; height: number };
      fileSize: number;
      estimatedQuality: 'low' | 'medium' | 'high';
      recommendations: string[];
    };
  }> {
    const tempDir = path.join(process.cwd(), 'storage', 'temp');
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const outputPath = path.join(tempDir, `advanced_${Date.now()}_${path.basename(imagePath)}`);
    
    // Get image metadata
    const metadata = await sharp(imagePath).metadata();
    const fileStats = fs.statSync(imagePath);
    
    // Quality assessment
    const qualityMetrics = this.assessImageQuality(metadata, fileStats.size);
    
    // Apply document-specific preprocessing
    let sharpInstance = sharp(imagePath);
    
    switch (documentType) {
      case 'drivers_license':
      case 'state_id':
        // ID cards often have security features that can interfere with OCR
        sharpInstance = sharpInstance
          .grayscale()
          .normalize()
          .sharpen({ sigma: 1.5 })
          .threshold(120); // Slightly lower threshold for ID cards
        break;
        
      case 'passport':
        // Passports have different paper quality and security features
        sharpInstance = sharpInstance
          .grayscale()
          .normalize()
          .sharpen({ sigma: 2 })
          .gamma(1.2) // Adjust gamma for passport paper
          .threshold(130);
        break;
        
      case 'ssn':
        // SSN cards are typically simpler documents
        sharpInstance = sharpInstance
          .grayscale()
          .normalize()
          .sharpen()
          .threshold(128);
        break;
        
      case 'work_authorization':
        // Work authorization documents vary widely
        sharpInstance = sharpInstance
          .grayscale()
          .normalize()
          .sharpen({ sigma: 1.8 })
          .threshold(125);
        break;
        
      default:
        // Default preprocessing
        sharpInstance = sharpInstance
          .grayscale()
          .normalize()
          .sharpen()
          .threshold(128);
    }
    
    // Apply final processing
    await sharpInstance
      .resize(2500, 2500, { fit: 'inside', withoutEnlargement: true })
      .png({ quality: 100 })
      .toFile(outputPath);
    
    return {
      preprocessedPath: outputPath,
      qualityMetrics
    };
  }

  /**
   * Assess image quality for OCR processing
   * @param metadata Image metadata
   * @param fileSize File size in bytes
   * @returns Quality assessment
   */
  private assessImageQuality(metadata: sharp.Metadata, fileSize: number): {
    resolution: { width: number; height: number };
    fileSize: number;
    estimatedQuality: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const width = metadata.width || 0;
    const height = metadata.height || 0;
    const recommendations: string[] = [];
    
    let qualityScore = 0;
    
    // Resolution assessment
    if (width >= 1500 && height >= 1000) {
      qualityScore += 3;
    } else if (width >= 1000 && height >= 700) {
      qualityScore += 2;
      recommendations.push('Higher resolution image would improve OCR accuracy');
    } else {
      qualityScore += 1;
      recommendations.push('Image resolution is too low for optimal OCR results');
    }
    
    // File size assessment (as proxy for compression quality)
    const pixelCount = width * height;
    const bytesPerPixel = fileSize / pixelCount;
    
    if (bytesPerPixel > 2) {
      qualityScore += 2;
    } else if (bytesPerPixel > 1) {
      qualityScore += 1;
      recommendations.push('Image appears to be heavily compressed');
    } else {
      recommendations.push('Image compression is too high, affecting text clarity');
    }
    
    // Format assessment
    if (metadata.format === 'png') {
      qualityScore += 1;
    } else if (metadata.format === 'jpeg' && metadata.density && metadata.density >= 150) {
      qualityScore += 1;
    } else {
      recommendations.push('PNG format or high-quality JPEG recommended for OCR');
    }
    
    const estimatedQuality: 'low' | 'medium' | 'high' = 
      qualityScore >= 5 ? 'high' : 
      qualityScore >= 3 ? 'medium' : 'low';
    
    if (estimatedQuality === 'low') {
      recommendations.push('Consider retaking the photo with better lighting and focus');
    }
    
    return {
      resolution: { width, height },
      fileSize,
      estimatedQuality,
      recommendations
    };
  }
}
