// Form generation types and interfaces

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'radio';
  required: boolean;
  value?: any;
  options?: string[] | { value: string; label: string }[];
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  placeholder?: string;
  helpText?: string;
  section?: string;
}

export interface FormSection {
  id: string;
  title: string;
  description?: string;
  fields: FormField[];
  order: number;
}

export interface FormTemplate {
  id: string;
  name: string;
  type: FormType;
  version: string;
  language: 'en' | 'es';
  sections: FormSection[];
  metadata: {
    title: string;
    description: string;
    instructions?: string;
    legalNotice?: string;
  };
}

export interface FormData {
  formId: string;
  employeeId: string;
  formType: FormType;
  language: 'en' | 'es';
  data: Record<string, any>;
  status: FormStatus;
  validationErrors?: Record<string, string>;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  version: string;
}

export interface GeneratedForm {
  id: string;
  employeeId: string;
  formType: FormType;
  language: 'en' | 'es';
  template: FormTemplate;
  prefilledData: Record<string, any>;
  status: FormStatus;
  pdfPath?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type FormType = 'i9' | 'w4' | 'handbook_acknowledgment' | 'policy_acknowledgment';

export type FormStatus = 'draft' | 'in_progress' | 'completed' | 'submitted' | 'approved' | 'rejected';

export interface I9FormData {
  // Employee Information (Section 1)
  lastName: string;
  firstName: string;
  middleInitial?: string;
  otherLastNames?: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  dateOfBirth: string;
  ssnNumber: string;
  email?: string;
  phone?: string;
  
  // Citizenship/Immigration Status
  citizenshipStatus: 'us_citizen' | 'non_citizen_national' | 'lawful_permanent_resident' | 'alien_authorized';
  alienNumber?: string;
  uscisNumber?: string;
  i94Number?: string;
  foreignPassportNumber?: string;
  countryOfIssuance?: string;
  workAuthorizationExpiration?: string;
  
  // Employee Attestation
  employeeSignature?: string;
  employeeSignatureDate?: string;
  
  // Preparer/Translator (if applicable)
  preparerUsed: boolean;
  preparerLastName?: string;
  preparerFirstName?: string;
  preparerAddress?: string;
  preparerSignature?: string;
  preparerSignatureDate?: string;
  
  // Section 2 - Employer Review and Verification
  documentTitle1?: string;
  issuingAuthority1?: string;
  documentNumber1?: string;
  expirationDate1?: string;
  documentTitle2?: string;
  issuingAuthority2?: string;
  documentNumber2?: string;
  expirationDate2?: string;
  documentTitle3?: string;
  issuingAuthority3?: string;
  documentNumber3?: string;
  expirationDate3?: string;
  
  employerSignature?: string;
  employerSignatureDate?: string;
  employerName: string;
  employerTitle: string;
  
  // Section 3 - Reverification and Rehires
  rehireDate?: string;
  newName?: string;
  reverificationDocumentTitle?: string;
  reverificationDocumentNumber?: string;
  reverificationExpirationDate?: string;
  reverificationSignature?: string;
  reverificationSignatureDate?: string;
}

export interface W4FormData {
  // Personal Information
  firstName: string;
  middleInitial?: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  ssnNumber: string;
  
  // Filing Status
  filingStatus: 'single' | 'married_filing_jointly' | 'married_filing_separately' | 'head_of_household';
  
  // Multiple Jobs or Spouse Works
  multipleJobsSpouseWorks: boolean;
  useEstimator: boolean;
  
  // Step 3 - Claim Dependents
  dependents: Array<{
    name: string;
    ssnOrItin: string;
    relationship: string;
    qualifyingChild: boolean;
    qualifyingRelative: boolean;
  }>;
  qualifyingChildren: number;
  otherDependents: number;
  totalDependentAmount: number;
  
  // Step 4 - Other Adjustments
  otherIncome: number;
  deductions: number;
  extraWithholding: number;
  
  // Signature
  employeeSignature?: string;
  signatureDate?: string;
  
  // Employer Information
  employerName: string;
  employerAddress: string;
  employerEIN: string;
  firstDateOfEmployment: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completionPercentage: number;
  requiredFieldsMissing: string[];
}

export interface FormGenerationOptions {
  employeeId: string;
  formType: FormType;
  language: 'en' | 'es';
  prefillFromOCR: boolean;
  ocrDocumentIds?: string[];
  templateOverrides?: Partial<FormTemplate>;
}

export interface PDFGenerationOptions {
  formData: FormData;
  template: FormTemplate;
  outputPath: string;
  includeInstructions: boolean;
  watermark?: string;
}