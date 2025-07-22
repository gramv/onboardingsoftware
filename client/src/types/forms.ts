export interface FormData {
  [key: string]: any;
}

export interface I9FormData extends FormData {
  firstName?: string;
  lastName?: string;
  middleInitial?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  dateOfBirth?: string;
  ssnNumber?: string;
  email?: string;
  phone?: string;
  citizenshipStatus?: string;
}

export interface W4FormData extends FormData {
  firstName?: string;
  lastName?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  ssnNumber?: string;
  filingStatus?: string;
  qualifyingChildren?: number;
  otherDependents?: number;
  totalDependentAmount?: number;
  otherIncome?: number;
  deductions?: number;
  extraWithholding?: number;
}

export type FormType = 'i9' | 'w4';

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completionPercentage: number;
  requiredFieldsMissing: string[];
} 