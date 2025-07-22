import { FormGenerationService } from '../formGenerationService';
import { FormType, FormData, I9FormData, W4FormData } from '@/types/forms';
import { DocumentRepository } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';

// Mock the repositories
jest.mock('@/repositories/document.repository');
jest.mock('@/repositories/employee.repository');

const mockDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>;
const mockEmployeeRepository = EmployeeRepository as jest.MockedClass<typeof EmployeeRepository>;

describe('FormGenerationService', () => {
  let service: FormGenerationService;
  let mockEmployee: any;
  let mockDocument: any;

  beforeEach(() => {
    service = new FormGenerationService();
    
    mockEmployee = {
      id: 'emp-1',
      userId: 'user-1',
      employeeId: 'EMP001',
      dateOfBirth: new Date('1990-01-15'),
      hireDate: new Date('2024-01-01'),
      user: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '5551234567'
      },
      address: {
        street: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345'
      },
      organization: {
        name: 'Test Motel'
      }
    };

    mockDocument = {
      id: 'doc-1',
      ocrData: {
        processingStatus: 'completed',
        extractedData: {
          fullName: 'John Doe',
          dateOfBirth: '01/15/1990',
          ssnNumber: '123456789',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          licenseNumber: 'D1234567'
        }
      }
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('getFormTemplate', () => {
    it('should return I-9 template in English', () => {
      const template = service.getFormTemplate('i9', 'en');
      
      expect(template.type).toBe('i9');
      expect(template.language).toBe('en');
      expect(template.sections).toHaveLength(3);
      expect(template.metadata.title).toContain('Employment Eligibility Verification');
    });

    it('should return I-9 template in Spanish', () => {
      const template = service.getFormTemplate('i9', 'es');
      
      expect(template.type).toBe('i9');
      expect(template.language).toBe('es');
      expect(template.sections).toHaveLength(3);
      expect(template.metadata.title).toContain('Verificación de Elegibilidad de Empleo');
    });

    it('should return W-4 template in English', () => {
      const template = service.getFormTemplate('w4', 'en');
      
      expect(template.type).toBe('w4');
      expect(template.language).toBe('en');
      expect(template.sections).toHaveLength(5);
      expect(template.metadata.title).toContain('Withholding Certificate');
    });

    it('should throw error for unsupported form type', () => {
      expect(() => {
        service.getFormTemplate('unsupported' as FormType, 'en');
      }).toThrow('Unsupported form type: unsupported');
    });
  });

  describe('generateForm', () => {
    beforeEach(() => {
      mockEmployeeRepository.prototype.findById.mockResolvedValue(mockEmployee);
      mockDocumentRepository.prototype.findById.mockResolvedValue(mockDocument);
    });

    it('should generate I-9 form with employee data', async () => {
      const options = {
        employeeId: 'emp-1',
        formType: 'i9' as FormType,
        language: 'en' as const,
        prefillFromOCR: false
      };

      const result = await service.generateForm(options);

      expect(result.employeeId).toBe('emp-1');
      expect(result.formType).toBe('i9');
      expect(result.language).toBe('en');
      expect(result.prefilledData.firstName).toBe('John');
      expect(result.prefilledData.lastName).toBe('Doe');
      expect(result.prefilledData.dateOfBirth).toBe('1990-01-15');
      expect(result.status).toBe('draft');
    });

    it('should generate form with OCR data when requested', async () => {
      const options = {
        employeeId: 'emp-1',
        formType: 'i9' as FormType,
        language: 'en' as const,
        prefillFromOCR: true,
        ocrDocumentIds: ['doc-1']
      };

      const result = await service.generateForm(options);

      expect(result.prefilledData.firstName).toBe('John');
      expect(result.prefilledData.lastName).toBe('Doe');
      expect(result.prefilledData.ssnNumber).toBe('123456789');
      expect(result.prefilledData.documentTitle1).toBe('Driver\'s License');
      expect(result.prefilledData.documentNumber1).toBe('D1234567');
    });

    it('should throw error when employee not found', async () => {
      mockEmployeeRepository.prototype.findById.mockResolvedValue(null);

      const options = {
        employeeId: 'nonexistent',
        formType: 'i9' as FormType,
        language: 'en' as const,
        prefillFromOCR: false
      };

      await expect(service.generateForm(options)).rejects.toThrow('Employee not found');
    });
  });

  describe('validateFormData', () => {
    it('should validate complete I-9 form data', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          dateOfBirth: '1990-01-15',
          ssnNumber: '123456789',
          citizenshipStatus: 'us_citizen'
        }
      };

      const result = service.validateFormData(formData);

      expect(result.isValid).toBe(true);
      expect(Object.keys(result.errors)).toHaveLength(0);
      expect(result.completionPercentage).toBeGreaterThan(50);
    });

    it('should identify missing required fields', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John'
          // Missing required fields
        }
      };

      const result = service.validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.requiredFieldsMissing).toContain('lastName');
      expect(result.requiredFieldsMissing).toContain('address');
      expect(result.requiredFieldsMissing).toContain('city');
      expect(result.completionPercentage).toBeLessThan(50);
    });

    it('should validate SSN format', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          dateOfBirth: '1990-01-15',
          ssnNumber: '12345', // Invalid SSN
          citizenshipStatus: 'us_citizen'
        }
      };

      const result = service.validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.ssnNumber).toContain('Social Security Number must be 9 digits');
    });

    it('should validate date of birth age requirements', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          dateOfBirth: '2020-01-15', // Too young
          ssnNumber: '123456789',
          citizenshipStatus: 'us_citizen'
        }
      };

      const result = service.validateFormData(formData);

      expect(result.isValid).toBe(false);
      expect(result.errors.dateOfBirth).toContain('Employee must be at least 16 years old');
    });

    it('should validate W-4 dependent calculations', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'w4',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          ssnNumber: '123456789',
          filingStatus: 'single',
          qualifyingChildren: 4000, // 2 children × $2000
          otherDependents: 1000, // 2 dependents × $500
          totalDependentAmount: 4000 // Should be 5000
        }
      };

      const result = service.validateFormData(formData);

      expect(result.warnings.totalDependentAmount).toContain('Total dependent amount should equal the sum');
    });
  });

  describe('autoCalculateW4Dependents', () => {
    it('should calculate total dependent amount correctly', () => {
      const formData: Partial<W4FormData> = {
        qualifyingChildren: 4000, // 2 × $2000
        otherDependents: 1500 // 3 × $500
      };

      const result = service.autoCalculateW4Dependents(formData);

      expect(result.totalDependentAmount).toBe(5500);
    });

    it('should handle missing values', () => {
      const formData: Partial<W4FormData> = {
        qualifyingChildren: 2000
        // otherDependents missing
      };

      const result = service.autoCalculateW4Dependents(formData);

      expect(result.totalDependentAmount).toBe(2000);
    });
  });

  describe('calculateCompletionPercentage', () => {
    it('should calculate completion percentage correctly', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St'
          // Partial completion
        }
      };

      const percentage = service.calculateCompletionPercentage(formData);

      expect(percentage).toBeGreaterThan(0);
      expect(percentage).toBeLessThan(100);
    });
  });

  describe('getMissingRequiredFields', () => {
    it('should identify all missing required fields', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John'
          // Most fields missing
        }
      };

      const missingFields = service.getMissingRequiredFields(formData);

      expect(missingFields).toContain('lastName');
      expect(missingFields).toContain('address');
      expect(missingFields).toContain('city');
      expect(missingFields).toContain('state');
      expect(missingFields).toContain('zipCode');
      expect(missingFields).toContain('dateOfBirth');
      expect(missingFields).toContain('ssnNumber');
      expect(missingFields).toContain('citizenshipStatus');
    });

    it('should return empty array when all required fields are present', () => {
      const formData: FormData = {
        formId: 'form-1',
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        status: 'draft',
        version: '1.0',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          dateOfBirth: '1990-01-15',
          ssnNumber: '123456789',
          citizenshipStatus: 'us_citizen'
        }
      };

      const missingFields = service.getMissingRequiredFields(formData);

      expect(missingFields).toHaveLength(0);
    });
  });

  describe('getFieldSuggestions', () => {
    it('should provide state suggestions', () => {
      const suggestions = service.getFieldSuggestions('i9', 'state', 'C');

      expect(suggestions).toContain('CA');
      expect(suggestions).toContain('CO');
      expect(suggestions).toContain('CT');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should provide city suggestions', () => {
      const suggestions = service.getFieldSuggestions('i9', 'city', 'New');

      expect(suggestions).toContain('New York');
      expect(suggestions.length).toBeLessThanOrEqual(5);
    });

    it('should return empty array for unsupported fields', () => {
      const suggestions = service.getFieldSuggestions('i9', 'unsupportedField', 'test');

      expect(suggestions).toHaveLength(0);
    });
  });
});