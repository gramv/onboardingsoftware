// Field extraction patterns for different document types and languages
export interface ExtractionPattern {
  fieldName: string;
  regex: RegExp;
  transform?: (value: string) => any;
  required?: boolean;
  language?: 'en' | 'es';
}

// Translation keys for OCR processing messages
export const OCR_TRANSLATION_KEYS = {
  // Processing status messages
  PROCESSING_STARTED: 'ocr.status.processingStarted',
  PROCESSING_COMPLETE: 'ocr.status.processingComplete',
  PROCESSING_FAILED: 'ocr.errors.processingFailed',
  MANUAL_REVIEW_REQUIRED: 'ocr.status.manualReviewRequired',
  
  // Field validation errors
  MISSING_REQUIRED_FIELD: 'ocr.errors.missingRequiredField',
  INVALID_FIELD_FORMAT: 'ocr.errors.invalidFieldFormat',
  LOW_CONFIDENCE_EXTRACTION: 'ocr.warnings.lowConfidence',
  
  // Document type specific messages
  SSN_CARD_DETECTED: 'ocr.documentTypes.ssnCardDetected',
  DRIVERS_LICENSE_DETECTED: 'ocr.documentTypes.driversLicenseDetected',
  UNSUPPORTED_DOCUMENT: 'ocr.errors.unsupportedDocument',
  
  // Field labels for UI display
  FIELD_LABELS: {
    ssnNumber: 'ocr.fields.ssnNumber',
    licenseNumber: 'ocr.fields.licenseNumber',
    fullName: 'ocr.fields.fullName',
    dateOfBirth: 'ocr.fields.dateOfBirth',
    expirationDate: 'ocr.fields.expirationDate',
    address: 'ocr.fields.address',
    state: 'ocr.fields.state',
    zipCode: 'ocr.fields.zipCode'
  }
};

// Validation error message keys
export const VALIDATION_ERROR_KEYS = {
  INVALID_SSN_FORMAT: 'validation.errors.invalidSsnFormat',
  INVALID_LICENSE_FORMAT: 'validation.errors.invalidLicenseFormat',
  INVALID_DATE_FORMAT: 'validation.errors.invalidDateFormat',
  INVALID_STATE_CODE: 'validation.errors.invalidStateCode',
  INVALID_ZIP_CODE: 'validation.errors.invalidZipCode',
  INVALID_FIELD_FORMAT: 'validation.errors.invalidFieldFormat',
  FIELD_REQUIRED: 'validation.errors.fieldRequired',
  FIELD_TOO_SHORT: 'validation.errors.fieldTooShort',
  FIELD_TOO_LONG: 'validation.errors.fieldTooLong'
};

// Document type labels for different languages
export const DOCUMENT_TYPE_LABELS = {
  drivers_license: {
    en: "Driver's License",
    es: "Licencia de Conducir"
  },
  state_id: {
    en: "State ID Card",
    es: "Tarjeta de Identificación Estatal"
  },
  passport: {
    en: "Passport",
    es: "Pasaporte"
  },
  work_authorization: {
    en: "Work Authorization Document",
    es: "Documento de Autorización de Trabajo"
  },
  ssn: {
    en: "Social Security Card",
    es: "Tarjeta de Seguro Social"
  },
  i9: {
    en: "Form I-9",
    es: "Formulario I-9"
  },
  w4: {
    en: "Form W-4",
    es: "Formulario W-4"
  }
};

// Language detection function
export function detectDocumentLanguage(text: string): 'en' | 'es' {
  const spanishKeywords = [
    'nombre', 'licencia', 'fecha', 'nacimiento', 'direccion', 'vence', 
    'seguro social', 'numero', 'estado', 'domicilio', 'apellidos',
    'expedicion', 'valida hasta', 'codigo postal'
  ];
  
  const englishKeywords = [
    'name', 'license', 'date', 'birth', 'address', 'expires', 
    'social security', 'number', 'state', 'residence', 'issued',
    'valid until', 'zip code', 'driver', 'identification'
  ];

  let spanishScore = 0;
  let englishScore = 0;
  const normalizedText = text.toLowerCase();

  spanishKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = normalizedText.match(regex);
    spanishScore += matches ? matches.length : 0;
  });

  englishKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = normalizedText.match(regex);
    englishScore += matches ? matches.length : 0;
  });

  return spanishScore > englishScore ? 'es' : 'en';
}

// Locale-aware date formatting
export function formatDateByLocale(dateStr: string, locale: 'en' | 'es'): string {
  const parts = dateStr.split(/[-/]/);
  if (parts.length !== 3) return dateStr;

  // Handle 2-digit years
  if (parts[2].length === 2) {
    const year = parseInt(parts[2]);
    parts[2] = (year > 50 ? '19' : '20') + parts[2];
  }

  // Both locales use MM/DD/YYYY for consistency in the system
  // but we could differentiate if needed: Spanish often uses DD/MM/YYYY
  return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
}

// Get confidence message key based on confidence level
export function getConfidenceMessage(confidence: number, locale: 'en' | 'es'): string {
  const messageKey = confidence >= 80 ? 'HIGH_CONFIDENCE' : 
                    confidence >= 60 ? 'MEDIUM_CONFIDENCE' : 
                    'LOW_CONFIDENCE';
  return `ocr.confidence.${messageKey.toLowerCase()}`;
}

// English patterns for driver's license
const driversLicenseEnglishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:name|nam|full\s*name)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'licenseNumber',
    regex: /(?:license|lic|dl|driver|id)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'dateOfBirth',
    regex: /(?:dob|birth|born|date\s*of\s*birth)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    required: true,
    language: 'en'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:exp|expires|expiration|valid\s*until)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    language: 'en'
  },
  {
    fieldName: 'address',
    regex: /(?:address|addr|residence)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim(),
    language: 'en'
  },
  {
    fieldName: 'state',
    regex: /(?:state|st)[:.\s]*([a-z]{2})/i,
    transform: (value) => value.toUpperCase(),
    language: 'en'
  },
  {
    fieldName: 'zipCode',
    regex: /(?:zip|postal)[:.\s]*(\d{5}(?:-\d{4})?)/i,
    language: 'en'
  }
];

// Enhanced Spanish patterns for driver's license with regional variations
const driversLicenseSpanishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:nombre|nom|apellidos?|nombre\s*completo)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'licenseNumber',
    regex: /(?:licencia|lic|número|num|no\.?|identificación)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'dateOfBirth',
    regex: /(?:nacimiento|nac|fecha\s*de\s*nacimiento|f\.\s*nac|born)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => formatDateByLocale(value, 'es'),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:vence|vencimiento|expira|válida?\s*hasta|exp|caducidad)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => formatDateByLocale(value, 'es'),
    language: 'es'
  },
  {
    fieldName: 'address',
    regex: /(?:dirección|dir|domicilio|residencia|address)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim(),
    language: 'es'
  },
  {
    fieldName: 'state',
    regex: /(?:estado|est|provincia|prov)[:.\s]*([a-z]{2,})/i,
    transform: (value) => value.toUpperCase(),
    language: 'es'
  },
  {
    fieldName: 'zipCode',
    regex: /(?:código\s*postal|cp|zip)[:.\s]*(\d{5}(?:-\d{4})?)/i,
    language: 'es'
  }
];

// English patterns for SSN card
const ssnEnglishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'ssnNumber',
    regex: /(\d{3}[-\s]?\d{2}[-\s]?\d{4})/,
    transform: (value) => value.replace(/[-\s]/g, ''),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'fullName',
    regex: /(?:name|nam)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    language: 'en'
  },
  {
    fieldName: 'socialSecurity',
    regex: /social\s*security/i,
    transform: () => true,
    language: 'en'
  }
];

// Spanish patterns for SSN card
const ssnSpanishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'ssnNumber',
    regex: /(\d{3}[-\s]?\d{2}[-\s]?\d{4})/,
    transform: (value) => value.replace(/[-\s]/g, ''),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'fullName',
    regex: /(?:nombre|nom)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    language: 'es'
  },
  {
    fieldName: 'socialSecurity',
    regex: /seguro\s*social/i,
    transform: () => true,
    language: 'es'
  }
];

// State ID patterns (English)
const stateIdEnglishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:name|nam|full\s*name)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'idNumber',
    regex: /(?:id|identification|card)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'dateOfBirth',
    regex: /(?:dob|birth|born|date\s*of\s*birth)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    required: true,
    language: 'en'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:exp|expires|expiration|valid\s*until)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    language: 'en'
  },
  {
    fieldName: 'address',
    regex: /(?:address|addr|residence)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim(),
    language: 'en'
  },
  {
    fieldName: 'state',
    regex: /(?:state|st)[:.\s]*([a-z]{2})/i,
    transform: (value) => value.toUpperCase(),
    language: 'en'
  }
];

// State ID patterns (Spanish)
const stateIdSpanishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:nombre|nom|apellidos?|nombre\s*completo)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'idNumber',
    regex: /(?:identificación|id|número|num|no\.?)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'dateOfBirth',
    regex: /(?:nacimiento|nac|fecha\s*de\s*nacimiento|f\.\s*nac)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => formatDateByLocale(value, 'es'),
    required: true,
    language: 'es'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:vence|vencimiento|expira|válida?\s*hasta|exp|caducidad)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => formatDateByLocale(value, 'es'),
    language: 'es'
  },
  {
    fieldName: 'address',
    regex: /(?:dirección|dir|domicilio|residencia)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim(),
    language: 'es'
  },
  {
    fieldName: 'state',
    regex: /(?:estado|est|provincia|prov)[:.\s]*([a-z]{2,})/i,
    transform: (value) => value.toUpperCase(),
    language: 'es'
  }
];

// Passport patterns (English)
const passportEnglishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:name|surname|given\s*names?)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'passportNumber',
    regex: /(?:passport|no|number)[\s#.:]*([a-z0-9]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'dateOfBirth',
    regex: /(?:date\s*of\s*birth|dob|birth)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    required: true,
    language: 'en'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:date\s*of\s*expiry|expiry|expires?)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    language: 'en'
  },
  {
    fieldName: 'nationality',
    regex: /(?:nationality|country)[:.\s]*([a-z\s]+)/i,
    transform: (value) => value.trim().toUpperCase(),
    language: 'en'
  },
  {
    fieldName: 'sex',
    regex: /(?:sex|gender)[:.\s]*([mf])/i,
    transform: (value) => value.toUpperCase(),
    language: 'en'
  }
];

// Work Authorization patterns (English)
const workAuthEnglishPatterns: ExtractionPattern[] = [
  {
    fieldName: 'fullName',
    regex: /(?:name|employee\s*name)[:.\s]*(.*?)(?:\n|$)/i,
    transform: (value) => value.trim().toUpperCase(),
    required: true,
    language: 'en'
  },
  {
    fieldName: 'alienNumber',
    regex: /(?:alien|a-number|a#|uscis)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    language: 'en'
  },
  {
    fieldName: 'cardNumber',
    regex: /(?:card|receipt|case)[\s#.:]*([a-z0-9-]+)/i,
    transform: (value) => value.replace(/[-\s]/g, '').toUpperCase(),
    language: 'en'
  },
  {
    fieldName: 'expirationDate',
    regex: /(?:card\s*expires|valid\s*until|expires?)[:.\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    transform: (value) => {
      const parts = value.split(/[-/]/);
      if (parts.length === 3) {
        if (parts[2].length === 2) {
          const year = parseInt(parts[2]);
          parts[2] = (year > 50 ? '19' : '20') + parts[2];
        }
        return `${parts[0].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[2]}`;
      }
      return value;
    },
    language: 'en'
  },
  {
    fieldName: 'countryOfBirth',
    regex: /(?:country\s*of\s*birth|birth\s*country)[:.\s]*([a-z\s]+)/i,
    transform: (value) => value.trim().toUpperCase(),
    language: 'en'
  }
];

// Combined patterns by document type
export const extractionPatterns: Record<string, ExtractionPattern[]> = {
  drivers_license: [...driversLicenseEnglishPatterns, ...driversLicenseSpanishPatterns],
  state_id: [...stateIdEnglishPatterns, ...stateIdSpanishPatterns],
  passport: [...passportEnglishPatterns],
  work_authorization: [...workAuthEnglishPatterns],
  ssn: [...ssnEnglishPatterns, ...ssnSpanishPatterns]
};

// Get patterns for specific language
export function getPatternsForLanguage(
  documentType: string, 
  language: 'en' | 'es' = 'en'
): ExtractionPattern[] {
  const patterns = extractionPatterns[documentType] || [];
  return patterns.filter(pattern => !pattern.language || pattern.language === language);
}

// Validation patterns for extracted data
export const validationPatterns = {
  ssnNumber: /^\d{9}$/,
  licenseNumber: /^[A-Z0-9]{5,}$/,
  idNumber: /^[A-Z0-9]{5,}$/,
  passportNumber: /^[A-Z0-9]{6,}$/,
  alienNumber: /^[A-Z0-9]{8,}$/,
  cardNumber: /^[A-Z0-9]{10,}$/,
  dateOfBirth: /^\d{2}\/\d{2}\/\d{4}$/,
  expirationDate: /^\d{2}\/\d{2}\/\d{4}$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  state: /^[A-Z]{2,}$/,
  nationality: /^[A-Z\s]{2,}$/,
  countryOfBirth: /^[A-Z\s]{2,}$/,
  sex: /^[MF]$/
};

// Field confidence scoring weights
export const confidenceWeights = {
  ssnNumber: 1.2,
  licenseNumber: 1.1,
  dateOfBirth: 1.1,
  expirationDate: 1.0,
  fullName: 0.9,
  address: 0.8,
  state: 1.0,
  zipCode: 1.0
};

// Minimum confidence thresholds by field
export const minimumConfidenceThresholds = {
  ssnNumber: 80,
  licenseNumber: 75,
  dateOfBirth: 70,
  expirationDate: 65,
  fullName: 60,
  address: 50,
  state: 70,
  zipCode: 75
};