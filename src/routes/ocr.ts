import express from 'express';
import { authenticate } from '@/middleware/auth/authMiddleware';
import { OCRService } from '@/services/document/ocrService';
import { z } from 'zod';

const router = express.Router();
const ocrService = new OCRService();

const processOCRSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
  language: z.enum(['en', 'es']).optional()
});

/**
 * @route POST /api/ocr/process
 * @desc Process a document with OCR
 */
router.post('/process', authenticate, async (req, res) => {
  try {
    const validatedData = processOCRSchema.parse(req.body);
    
    const result = await ocrService.processDocument(
      validatedData.documentId,
      validatedData.language
    );
    
    return res.status(200).json({
      success: true,
      data: {
        ocrResult: result,
        status: 'completed'
      }
    });
  } catch (error) {
    console.error('OCR processing error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process document'
    });
  }
});

/**
 * @route GET /api/ocr/:id
 * @desc Get OCR data for a document
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate UUID format
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid document ID format'
      });
    }
    
    // Get document with OCR data
    try {
      const { DocumentRepository } = await import('@/repositories/document.repository');
      const documentRepository = new DocumentRepository();
      const document = await documentRepository.findById(id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }
      
      return res.status(200).json({
        success: true,
        data: {
          documentId: id,
          ocrData: document.ocrData,
          ocrStatus: document.ocrData ? 'completed' : 'pending'
        }
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: 'Document not found'
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Error retrieving OCR data:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve OCR data'
    });
  }
});

export default router;