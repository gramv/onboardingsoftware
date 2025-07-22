/**
 * Example usage of the OCR Service
 * This file demonstrates how to use the OCR service for document processing
 */

import { OCRService } from '../ocrService';

// Example: Processing a document with OCR
async function processDocumentExample() {
  const ocrService = new OCRService();
  
  try {
    // Process a document (assuming document ID exists)
    const documentId = 'doc-123';
    const language = 'en'; // or 'es' for Spanish
    
    console.log('Starting OCR processing...');
    const result = await ocrService.processDocument(documentId, language);
    
    console.log('OCR Processing completed:', {
      confidence: result.confidence,
      extractedFields: Object.keys(result.extractedData),
      processingStatus: result.processingStatus
    });
    
    // Validate the extracted data
    const validation = ocrService.validateExtractedData(result);
    if (!validation.isValid) {
      console.log('Validation errors:', validation.errors);
    }
    
    return result;
  } catch (error) {
    console.error('OCR processing failed:', error);
    throw error;
  }
}

// Example: Correcting OCR data manually
async function correctOCRDataExample() {
  const ocrService = new OCRService();
  
  try {
    const documentId = 'doc-123';
    const corrections = {
      fullName: 'John Smith', // Corrected name
      dateOfBirth: '01/15/1985' // Corrected date
    };
    
    console.log('Applying OCR corrections...');
    const correctedDocument = await ocrService.correctOCRData(documentId, corrections);
    
    console.log('OCR data corrected successfully');
    return correctedDocument;
  } catch (error) {
    console.error('OCR correction failed:', error);
    throw error;
  }
}

// Example: Batch processing multiple documents
async function batchProcessExample() {
  const ocrService = new OCRService();
  
  try {
    const documentIds = ['doc-1', 'doc-2', 'doc-3'];
    const language = 'en';
    
    console.log('Starting batch OCR processing...');
    const results = await ocrService.batchProcessDocuments(documentIds, language);
    
    // Process results
    const successful = results.filter(r => r.processingStatus === 'completed');
    const failed = results.filter(r => r.processingStatus === 'failed');
    
    console.log(`Batch processing completed: ${successful.length} successful, ${failed.length} failed`);
    
    return results;
  } catch (error) {
    console.error('Batch processing failed:', error);
    throw error;
  }
}

// Example: Getting pending OCR documents
async function getPendingDocumentsExample() {
  const ocrService = new OCRService();
  
  try {
    console.log('Fetching pending OCR documents...');
    const pendingDocs = await ocrService.getPendingOCRDocuments();
    
    console.log(`Found ${pendingDocs.length} documents pending OCR processing`);
    
    // Process each pending document
    for (const doc of pendingDocs) {
      console.log(`Processing document: ${doc.id} (${doc.documentType})`);
      try {
        await ocrService.processDocument(doc.id);
        console.log(`✓ Successfully processed ${doc.id}`);
      } catch (error) {
        console.log(`✗ Failed to process ${doc.id}:`, error);
      }
    }
    
    return pendingDocs;
  } catch (error) {
    console.error('Failed to get pending documents:', error);
    throw error;
  }
}

// Example: Retry with enhanced processing
async function retryWithEnhancementExample() {
  const ocrService = new OCRService();
  
  try {
    const documentId = 'doc-123';
    const language = 'en';
    
    console.log('Retrying OCR with enhanced processing...');
    const result = await ocrService.retryWithEnhancement(documentId, language);
    
    console.log('Enhanced OCR processing completed:', {
      confidence: result.confidence,
      enhancedProcessing: result.enhancedProcessing,
      extractedFields: Object.keys(result.extractedData)
    });
    
    return result;
  } catch (error) {
    console.error('Enhanced OCR processing failed:', error);
    throw error;
  }
}

// Export examples for use in other files
export {
  processDocumentExample,
  correctOCRDataExample,
  batchProcessExample,
  getPendingDocumentsExample,
  retryWithEnhancementExample
};

// Example usage patterns for different document types
export const documentTypeExamples = {
  driversLicense: {
    expectedFields: ['fullName', 'licenseNumber', 'dateOfBirth', 'expirationDate', 'address', 'state', 'zipCode'],
    validationRules: {
      licenseNumber: 'Should be alphanumeric, minimum 5 characters',
      dateOfBirth: 'Should be in MM/DD/YYYY format',
      expirationDate: 'Should be in MM/DD/YYYY format',
      state: 'Should be 2-letter state code',
      zipCode: 'Should be 5 digits or 5+4 format'
    },
    supportedLanguages: ['en', 'es'],
    confidenceThresholds: {
      licenseNumber: 75,
      dateOfBirth: 70,
      fullName: 60
    }
  },
  ssn: {
    expectedFields: ['ssnNumber', 'fullName'],
    validationRules: {
      ssnNumber: 'Should be exactly 9 digits',
      fullName: 'Should contain first and last name'
    },
    supportedLanguages: ['en', 'es'],
    confidenceThresholds: {
      ssnNumber: 80,
      fullName: 60
    }
  }
};

// Example confidence thresholds for different use cases
export const confidenceThresholds = {
  autoApprove: 90, // Automatically approve if confidence is above this
  requireReview: 70, // Require manual review if confidence is between this and autoApprove
  reject: 50 // Reject if confidence is below this
};

// Example: Using automatic language detection
async function autoLanguageDetectionExample() {
  const ocrService = new OCRService();
  
  try {
    const documentId = 'doc-123';
    
    console.log('Processing document with automatic language detection...');
    // Don't specify language - let the service detect it automatically
    const result = await ocrService.processDocument(documentId);
    
    console.log('OCR Processing completed:', {
      detectedLanguage: result.language,
      confidence: result.confidence,
      extractedFields: Object.keys(result.extractedData)
    });
    
    return result;
  } catch (error) {
    console.error('Auto-detection OCR processing failed:', error);
    throw error;
  }
}

// Example: Using enhanced validation with localized error messages
async function enhancedValidationExample() {
  const ocrService = new OCRService();
  
  try {
    const documentId = 'doc-123';
    const result = await ocrService.processDocument(documentId, 'es');
    
    // Validate with Spanish language context
    const validation = ocrService.validateExtractedData(result, 'es');
    
    if (!validation.isValid) {
      console.log('Validation failed with localized error keys:');
      Object.entries(validation.errors).forEach(([field, errorKey]) => {
        console.log(`- ${field}: ${errorKey}`);
        // These error keys can be used with your i18n system
        // to display localized error messages to users
      });
    }
    
    // Get confidence message for UI display
    const confidenceMessage = ocrService.getConfidenceMessage(result.confidence, 'es');
    console.log('Confidence message key:', confidenceMessage);
    
    // Get document type label for UI display
    const documentLabel = ocrService.getDocumentTypeLabel('drivers_license', 'es');
    console.log('Document type label:', documentLabel);
    
    return { result, validation };
  } catch (error) {
    console.error('Enhanced validation example failed:', error);
    throw error;
  }
}

// Example: Processing workflow with confidence-based decisions
async function confidenceBasedWorkflowExample() {
  const ocrService = new OCRService();
  
  try {
    const documentId = 'doc-123';
    const result = await ocrService.processDocument(documentId);
    
    // Make decisions based on confidence levels
    if (result.confidence >= confidenceThresholds.autoApprove) {
      console.log('✅ High confidence - auto-approving document');
      // Automatically approve and continue processing
      return { action: 'auto_approved', result };
      
    } else if (result.confidence >= confidenceThresholds.requireReview) {
      console.log('⚠️ Medium confidence - flagging for manual review');
      
      // Check individual field confidences
      const lowConfidenceFields = Object.entries(result.fieldConfidences)
        .filter(([_, confidence]) => confidence < 70)
        .map(([field, _]) => field);
      
      if (lowConfidenceFields.length > 0) {
        console.log('Fields requiring attention:', lowConfidenceFields);
      }
      
      return { action: 'manual_review_required', result, flaggedFields: lowConfidenceFields };
      
    } else {
      console.log('❌ Low confidence - attempting enhanced processing');
      
      // Try enhanced processing for better results
      const enhancedResult = await ocrService.retryWithEnhancement(documentId);
      
      if (enhancedResult.confidence >= confidenceThresholds.requireReview) {
        console.log('✅ Enhanced processing improved confidence');
        return { action: 'enhanced_success', result: enhancedResult };
      } else {
        console.log('❌ Enhanced processing still low confidence - manual entry required');
        return { action: 'manual_entry_required', result: enhancedResult };
      }
    }
  } catch (error) {
    console.error('Confidence-based workflow failed:', error);
    throw error;
  }
}

// Example error handling patterns
export const errorHandlingExamples = {
  async handleOCRError(error: Error, documentId: string) {
    console.error(`OCR processing failed for document ${documentId}:`, error.message);
    
    // Log error for debugging
    console.log('Error details:', {
      documentId,
      errorMessage: error.message,
      timestamp: new Date().toISOString()
    });
    
    // Determine next steps based on error type
    if (error.message.includes('Document not found')) {
      console.log('Document may have been deleted or moved');
    } else if (error.message.includes('OCR processing is disabled')) {
      console.log('OCR service is currently disabled');
    } else if (error.message.includes('Document file not found')) {
      console.log('Physical file is missing from storage');
    } else {
      console.log('Unknown OCR error, may need manual intervention');
    }
  }
};

// Export new examples
export {
  autoLanguageDetectionExample,
  enhancedValidationExample,
  confidenceBasedWorkflowExample
};

// Translation key examples for UI integration
export const translationKeyExamples = {
  // How to use OCR translation keys in your UI
  getLocalizedErrorMessage: (errorKey: string, language: 'en' | 'es') => {
    // This would integrate with your i18n system
    const translations = {
      en: {
        'validation.errors.invalidSsnFormat': 'Invalid SSN format. Please enter 9 digits.',
        'validation.errors.invalidDateFormat': 'Invalid date format. Please use MM/DD/YYYY.',
        'ocr.confidence.high_confidence': 'High confidence - data looks accurate',
        'ocr.confidence.medium_confidence': 'Medium confidence - please review',
        'ocr.confidence.low_confidence': 'Low confidence - manual verification needed'
      },
      es: {
        'validation.errors.invalidSsnFormat': 'Formato de SSN inválido. Ingrese 9 dígitos.',
        'validation.errors.invalidDateFormat': 'Formato de fecha inválido. Use MM/DD/AAAA.',
        'ocr.confidence.high_confidence': 'Alta confianza - los datos se ven precisos',
        'ocr.confidence.medium_confidence': 'Confianza media - por favor revise',
        'ocr.confidence.low_confidence': 'Baja confianza - se necesita verificación manual'
      }
    };
    
    return translations[language][errorKey] || errorKey;
  }
};