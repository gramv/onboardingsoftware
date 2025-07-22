import { 
  validateFileWithMessages, 
  getTranslatedDocumentType, 
  formatFileSize,
  getSupportedMimeTypes,
  getFileSizeLimit
} from '../upload';
import { DocumentType } from '@prisma/client';
import { translationService } from '@/utils/i18n/translationService';

// Mock the translation service
jest.mock('@/utils/i18n/translationService', () => ({
  translationService: {
    t: jest.fn((key: string, params?: any, locale?: string) => {
      // Mock translations for testing
      const translations: Record<string, Record<string, string>> = {
        en: {
          'upload.errors.unsupportedFileType': `File type ${params?.mimeType} is not supported for ${params?.documentType} documents. Allowed types: ${params?.allowedTypes}`,
          'upload.errors.fileTooLarge': `File size exceeds the limit of ${params?.maxSize} for ${params?.documentType} documents`,
          'upload.documentTypes.ssn': 'Social Security Card',
          'upload.documentTypes.drivers_license': 'Driver\'s License',
          'upload.documentTypes.i9': 'Form I-9',
          'upload.documentTypes.w4': 'Form W-4',
          'upload.documentTypes.handbook': 'Employee Handbook',
          'upload.documentTypes.policy': 'Company Policy',
          'upload.documentTypes.experience_letter': 'Experience Letter',
          'upload.documentTypes.other': 'Other Document'
        },
        es: {
          'upload.errors.unsupportedFileType': `El tipo de archivo ${params?.mimeType} no es compatible con documentos de ${params?.documentType}. Tipos permitidos: ${params?.allowedTypes}`,
          'upload.errors.fileTooLarge': `El tamaño del archivo excede el límite de ${params?.maxSize} para documentos de ${params?.documentType}`,
          'upload.documentTypes.ssn': 'Tarjeta de Seguro Social',
          'upload.documentTypes.drivers_license': 'Licencia de Conducir',
          'upload.documentTypes.i9': 'Formulario I-9',
          'upload.documentTypes.w4': 'Formulario W-4',
          'upload.documentTypes.handbook': 'Manual del Empleado',
          'upload.documentTypes.policy': 'Política de la Empresa',
          'upload.documentTypes.experience_letter': 'Carta de Experiencia Laboral',
          'upload.documentTypes.other': 'Otro Documento'
        }
      };
      
      const lang = locale || 'en';
      return translations[lang]?.[key] || key;
    })
  }
}));

// Helper function to create mock files for testing
const createMockFile = (mimetype: string, size: number): Express.Multer.File => ({
  fieldname: 'file',
  originalname: 'test.pdf',
  encoding: '7bit',
  mimetype,
  size,
  destination: '/tmp',
  filename: 'test.pdf',
  path: '/tmp/test.pdf',
  buffer: Buffer.from(''),
  stream: {} as any
});

describe('Upload Middleware Internationalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getTranslatedDocumentType', () => {
    it('should return English document type names', () => {
      const result = getTranslatedDocumentType('ssn', 'en');
      expect(result).toBe('Social Security Card');
      expect(translationService.t).toHaveBeenCalledWith('upload.documentTypes.ssn', {}, 'en');
    });

    it('should return Spanish document type names', () => {
      const result = getTranslatedDocumentType('ssn', 'es');
      expect(result).toBe('Tarjeta de Seguro Social');
      expect(translationService.t).toHaveBeenCalledWith('upload.documentTypes.ssn', {}, 'es');
    });

    it('should default to English when no locale provided', () => {
      const result = getTranslatedDocumentType('handbook');
      expect(result).toBe('Employee Handbook');
      expect(translationService.t).toHaveBeenCalledWith('upload.documentTypes.handbook', {}, 'en');
    });

    it('should handle all document types', () => {
      const documentTypes: DocumentType[] = [
        'ssn', 'drivers_license', 'i9', 'w4', 'handbook', 
        'policy', 'experience_letter', 'other'
      ];

      documentTypes.forEach(docType => {
        const result = getTranslatedDocumentType(docType, 'en');
        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
      });
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB'); // 1.5 KB
    });

    it('should handle large file sizes', () => {
      const result = formatFileSize(50 * 1024 * 1024); // 50MB
      expect(result).toBe('50 MB');
    });
  });

  describe('validateFileWithMessages', () => {

    describe('file type validation', () => {
      it('should validate supported file types', () => {
        const pdfFile = createMockFile('application/pdf', 1024);
        const result = validateFileWithMessages(pdfFile, 'handbook', 'en');
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject unsupported file types with English error', () => {
        const txtFile = createMockFile('text/plain', 1024);
        const result = validateFileWithMessages(txtFile, 'handbook', 'en');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('text/plain');
        expect(result.error).toContain('Employee Handbook');
        expect(translationService.t).toHaveBeenCalledWith(
          'upload.errors.unsupportedFileType',
          expect.objectContaining({
            mimeType: 'text/plain',
            documentType: 'Employee Handbook'
          }),
          'en'
        );
      });

      it('should reject unsupported file types with Spanish error', () => {
        const txtFile = createMockFile('text/plain', 1024);
        const result = validateFileWithMessages(txtFile, 'handbook', 'es');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('text/plain');
        expect(result.error).toContain('Manual del Empleado');
        expect(translationService.t).toHaveBeenCalledWith(
          'upload.errors.unsupportedFileType',
          expect.objectContaining({
            mimeType: 'text/plain',
            documentType: 'Manual del Empleado'
          }),
          'es'
        );
      });
    });

    describe('file size validation', () => {
      it('should validate files within size limits', () => {
        const smallFile = createMockFile('application/pdf', 1024); // 1KB
        const result = validateFileWithMessages(smallFile, 'handbook', 'en');
        
        expect(result.isValid).toBe(true);
        expect(result.error).toBeUndefined();
      });

      it('should reject files exceeding size limits with English error', () => {
        const largeFile = createMockFile('application/pdf', 100 * 1024 * 1024); // 100MB (exceeds 50MB limit for handbook)
        const result = validateFileWithMessages(largeFile, 'handbook', 'en');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('50 MB');
        expect(result.error).toContain('Employee Handbook');
        expect(translationService.t).toHaveBeenCalledWith(
          'upload.errors.fileTooLarge',
          expect.objectContaining({
            maxSize: '50 MB',
            documentType: 'Employee Handbook'
          }),
          'en'
        );
      });

      it('should reject files exceeding size limits with Spanish error', () => {
        const largeFile = createMockFile('application/pdf', 100 * 1024 * 1024); // 100MB
        const result = validateFileWithMessages(largeFile, 'handbook', 'es');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('50 MB');
        expect(result.error).toContain('Manual del Empleado');
        expect(translationService.t).toHaveBeenCalledWith(
          'upload.errors.fileTooLarge',
          expect.objectContaining({
            maxSize: '50 MB',
            documentType: 'Manual del Empleado'
          }),
          'es'
        );
      });
    });

    describe('document type specific validation', () => {
      it('should validate SSN documents correctly', () => {
        const imageFile = createMockFile('image/jpeg', 1024);
        const result = validateFileWithMessages(imageFile, 'ssn', 'en');
        
        expect(result.isValid).toBe(true);
      });

      it('should validate I-9 forms correctly', () => {
        const pdfFile = createMockFile('application/pdf', 1024);
        const result = validateFileWithMessages(pdfFile, 'i9', 'en');
        
        expect(result.isValid).toBe(true);
      });

      it('should reject inappropriate file types for specific documents', () => {
        const docFile = createMockFile('application/msword', 1024);
        const result = validateFileWithMessages(docFile, 'i9', 'en');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Form I-9');
      });
    });
  });

  describe('helper functions', () => {
    it('should return correct supported mime types', () => {
      const ssnTypes = getSupportedMimeTypes('ssn');
      expect(ssnTypes).toContain('image/jpeg');
      expect(ssnTypes).toContain('application/pdf');
      
      const handbookTypes = getSupportedMimeTypes('handbook');
      expect(handbookTypes).toEqual(['application/pdf']);
    });

    it('should return correct file size limits', () => {
      expect(getFileSizeLimit('ssn')).toBe(10 * 1024 * 1024); // 10MB
      expect(getFileSizeLimit('handbook')).toBe(50 * 1024 * 1024); // 50MB
      expect(getFileSizeLimit('i9')).toBe(5 * 1024 * 1024); // 5MB
    });
  });

  describe('edge cases', () => {
    it('should handle missing translation gracefully', () => {
      // Mock translation service to return undefined
      (translationService.t as jest.Mock).mockReturnValueOnce(undefined);
      
      const result = getTranslatedDocumentType('ssn', 'en');
      expect(result).toBe('ssn'); // Should fallback to original value
    });

    it('should handle zero file size', () => {
      const emptyFile = createMockFile('application/pdf', 0);
      const result = validateFileWithMessages(emptyFile, 'handbook', 'en');
      
      expect(result.isValid).toBe(true); // Zero size should be valid
    });
  });
});