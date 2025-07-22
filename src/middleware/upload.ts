import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request, RequestHandler } from 'express';
import { DocumentType } from '@prisma/client';
import { translationService } from '@/utils/i18n/translationService';

// Static document types for runtime use
const DOCUMENT_TYPES = [
  'ssn',
  'drivers_license', 
  'i9',
  'w4',
  'handbook',
  'policy',
  'experience_letter',
  'other'
] as const;

// Supported file types for each document type
const SUPPORTED_MIME_TYPES: Partial<Record<DocumentType, string[]>> = {
  ssn: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  drivers_license: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  state_id: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  passport: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  work_authorization: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'],
  i9: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  w4: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
  handbook: ['application/pdf'],
  policy: ['application/pdf'],
  experience_letter: ['application/pdf'],
  other: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
};

// File size limits (in bytes)
const FILE_SIZE_LIMITS: Partial<Record<DocumentType, number>> = {
  ssn: 10 * 1024 * 1024, // 10MB for images/PDFs
  drivers_license: 10 * 1024 * 1024, // 10MB for images/PDFs
  state_id: 10 * 1024 * 1024, // 10MB for images/PDFs
  passport: 10 * 1024 * 1024, // 10MB for images/PDFs
  work_authorization: 10 * 1024 * 1024, // 10MB for images/PDFs
  i9: 5 * 1024 * 1024, // 5MB for forms
  w4: 5 * 1024 * 1024, // 5MB for forms
  handbook: 50 * 1024 * 1024, // 50MB for handbooks
  policy: 20 * 1024 * 1024, // 20MB for policies
  experience_letter: 5 * 1024 * 1024, // 5MB for letters
  other: 20 * 1024 * 1024 // 20MB for other documents
};

// Helper function to get user locale from request
const getUserLocale = (req: Request): string => {
  return (req as any).user?.languagePreference || 
         req.headers['accept-language']?.startsWith('es') ? 'es' : 'en';
};

// Storage configuration
const storage = multer.diskStorage({
  destination: async (req: any, file, cb) => {
    const documentType = req.body.documentType as DocumentType;
    let employeeId = req.body.employeeId || req.params.employeeId;
    const locale = getUserLocale(req as Request);
    
    // For onboarding uploads, convert sessionId to employeeId
    if (!employeeId && req.body.sessionId) {
      try {
        console.log('🔄 Converting sessionId to employeeId in storage middleware');
        const { OnboardingService } = await import('@/services/onboarding/onboardingService');
        const onboardingService = new OnboardingService();
        const session = await onboardingService.getSession(req.body.sessionId, 'onboarding-session');
        if (session) {
          employeeId = session.employeeId;
          req.body.employeeId = employeeId; // Set it for later use
          console.log('✅ Converted sessionId to employeeId:', employeeId);
        }
      } catch (error) {
        console.error('❌ Error converting sessionId to employeeId:', error);
      }
    }
    
    if (!documentType || !employeeId) {
      const errorMessage = translationService.t('upload.errors.documentTypeAndEmployeeRequired', {}, locale);
      return cb(new Error(errorMessage), '');
    }

    // Create organized directory structure: storage/documents/{documentType}/{employeeId}/
    const uploadPath = path.join(process.cwd(), 'storage', 'documents', documentType, employeeId);
    
    // Ensure directory exists
    fs.mkdirSync(uploadPath, { recursive: true });
    
    cb(null, uploadPath);
  },
  filename: (req: any, file, cb) => {
    const documentType = req.body.documentType as DocumentType;
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    
    // Generate filename: {documentType}_{timestamp}_{randomSuffix}{extension}
    const filename = `${documentType}_${timestamp}_${randomSuffix}${extension}`;
    
    cb(null, filename);
  }
});

// File filter function
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const documentType = req.body.documentType as DocumentType;
  const locale = getUserLocale(req as Request);
  
  if (!documentType) {
    const errorMessage = translationService.t('upload.errors.documentTypeRequired', {}, locale);
    return cb(new Error(errorMessage));
  }

  if (!DOCUMENT_TYPES.includes(documentType as any)) {
    const translatedDocType = translationService.t(`upload.documentTypes.${documentType}`, {}, locale) || documentType;
    const errorMessage = translationService.t('upload.errors.invalidDocumentType', { documentType: translatedDocType }, locale);
    return cb(new Error(errorMessage));
  }

  const allowedMimeTypes = SUPPORTED_MIME_TYPES[documentType];
  
  if (!allowedMimeTypes || !allowedMimeTypes.includes(file.mimetype)) {
    const translatedDocType = translationService.t(`upload.documentTypes.${documentType}`, {}, locale) || documentType;
    const errorMessage = translationService.t('upload.errors.unsupportedFileType', {
      mimeType: file.mimetype,
      documentType: translatedDocType,
      allowedTypes: allowedMimeTypes ? allowedMimeTypes.join(', ') : ''
    }, locale);
    return cb(new Error(errorMessage));
  }

  cb(null, true);
};

// Create multer upload middleware
export const createUploadMiddleware = (documentType?: DocumentType) => {
  return multer({
    storage,
    fileFilter,
    limits: {
      fileSize: documentType && FILE_SIZE_LIMITS[documentType] 
        ? FILE_SIZE_LIMITS[documentType] 
        : Math.max(...Object.values(FILE_SIZE_LIMITS)),
      files: 1 // Only allow single file upload
    }
  });
};

// Special storage configuration for onboarding uploads
const onboardingStorage = multer.diskStorage({
  destination: async (req: any, file, cb) => {
    try {
      // Create a temporary directory for onboarding uploads
      const tempPath = path.join(process.cwd(), 'storage', 'documents', 'temp');
      fs.mkdirSync(tempPath, { recursive: true });
      cb(null, tempPath);
    } catch (error) {
      console.error('Error creating onboarding upload directory:', error);
      cb(error as Error, '');
    }
  },
  filename: (req: any, file, cb) => {
    // Generate unique filename with timestamp and random string
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `onboarding_${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Special file filter for onboarding that allows common document types
const onboardingFileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow common image and PDF types for onboarding documents
  const allowedMimeTypes = [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const locale = getUserLocale(req as Request);
    const errorMessage = translationService.t('upload.errors.invalidFileType', {}, locale);
    cb(new Error(errorMessage));
  }
};

// Create a special upload middleware for onboarding that doesn't require authentication
export const createOnboardingUploadMiddleware = () => {
  return multer({
    storage: onboardingStorage, // Use special storage for onboarding
    fileFilter: onboardingFileFilter, // Use special filter that doesn't check documentType
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB for onboarding documents
      files: 1
    }
  });
};

// Default upload middleware for single file
export const uploadSingle = createUploadMiddleware().single('file') as any;

// Enhanced upload with document type validation
export const uploadDocument = (documentType: DocumentType) => {
  return createUploadMiddleware(documentType).single('file') as any;
};

// Validation helper functions
export const validateFileType = (file: Express.Multer.File, documentType: DocumentType): boolean => {
  const mimeTypes = SUPPORTED_MIME_TYPES[documentType];
  return mimeTypes ? mimeTypes.includes(file.mimetype) : false;
};

export const validateFileSize = (file: Express.Multer.File, documentType: DocumentType): boolean => {
  const sizeLimit = FILE_SIZE_LIMITS[documentType];
  return sizeLimit ? file.size <= sizeLimit : false;
};

export const getSupportedMimeTypes = (documentType: DocumentType): string[] => {
  return SUPPORTED_MIME_TYPES[documentType] || [];
};

export const getFileSizeLimit = (documentType: DocumentType): number => {
  return FILE_SIZE_LIMITS[documentType] || 10 * 1024 * 1024; // Default to 10MB
};

// Helper to get translated document type name
export const getTranslatedDocumentType = (documentType: DocumentType, locale: string = 'en'): string => {
  return translationService.t(`upload.documentTypes.${documentType}`, {}, locale) || documentType;
};

// Helper to get localized upload instructions for document types
export const getDocumentUploadInstructions = (documentType: DocumentType, locale: string = 'en'): string => {
  const instructionKey = `upload.instructions.${documentType}Requirements`;
  return translationService.t(instructionKey, {}, locale) || '';
};

// Helper to get supported file formats in a user-friendly way
export const getFormattedSupportedTypes = (documentType: DocumentType, locale: string = 'en'): string => {
  const mimeTypes = getSupportedMimeTypes(documentType);
  const extensions = mimeTypes.map(mime => getFileExtension(mime)).filter(ext => ext);
  
  if (locale === 'es') {
    return extensions.length > 1 
      ? `${extensions.slice(0, -1).join(', ')} y ${extensions.slice(-1)}`
      : extensions[0] || '';
  } else {
    return extensions.length > 1 
      ? `${extensions.slice(0, -1).join(', ')} and ${extensions.slice(-1)}`
      : extensions[0] || '';
  }
};

// Helper to format file size for display
export const formatFileSize = (bytes: number, locale: string = 'en'): string => {
  const sizeUnits = {
    en: ['Bytes', 'KB', 'MB', 'GB'],
    es: ['Bytes', 'KB', 'MB', 'GB'] // These units are commonly used in Spanish as well
  };
  
  if (bytes === 0) {
    return locale === 'es' ? '0 Bytes' : '0 Bytes';
  }
  
  const units = sizeUnits[locale as keyof typeof sizeUnits] || sizeUnits.en;
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const size = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
  
  // Use locale-specific number formatting
  const formattedSize = new Intl.NumberFormat(locale === 'es' ? 'es-ES' : 'en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(size);
  
  return `${formattedSize} ${units[i]}`;
};

// Enhanced validation with internationalized error messages
export const validateFileWithMessages = (
  file: Express.Multer.File, 
  documentType: DocumentType, 
  locale: string = 'en'
): { isValid: boolean; error?: string } => {
  // Check file type
  if (!validateFileType(file, documentType)) {
    const translatedDocType = getTranslatedDocumentType(documentType, locale);
    const allowedTypes = getSupportedMimeTypes(documentType).join(', ');
    return {
      isValid: false,
      error: translationService.t('upload.errors.unsupportedFileType', {
        mimeType: file.mimetype,
        documentType: translatedDocType,
        allowedTypes
      }, locale)
    };
  }

  // Check file size
  if (!validateFileSize(file, documentType)) {
    const translatedDocType = getTranslatedDocumentType(documentType, locale);
    const maxSize = formatFileSize(getFileSizeLimit(documentType), locale);
    return {
      isValid: false,
      error: translationService.t('upload.errors.fileTooLarge', {
        maxSize,
        documentType: translatedDocType
      }, locale)
    };
  }

  return { isValid: true };
};

// Helper to get file extension from mime type
export const getFileExtension = (mimeType: string): string => {
  const extensions: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'application/pdf': '.pdf',
    'text/plain': '.txt',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx'
  };
  
  return extensions[mimeType] || '';
};

// Helper to ensure storage directories exist
export const ensureStorageDirectories = (locale: string = 'en') => {
  const baseStoragePath = path.join(process.cwd(), 'storage', 'documents');
  
  // Create base directories for each document type
  DOCUMENT_TYPES.forEach(docType => {
    try {
      const typePath = path.join(baseStoragePath, docType);
      fs.mkdirSync(typePath, { recursive: true });
    } catch (error) {
      // Log error with translated message but don't throw - allow application to continue
      const translatedDocType = getTranslatedDocumentType(docType as DocumentType, locale);
      const errorMessage = translationService.t('upload.errors.directoryCreationFailed', {}, locale);
      console.warn(`${errorMessage} for ${translatedDocType}:`, error);
    }
  });
};