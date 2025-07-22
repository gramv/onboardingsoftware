import { 
  FormTemplate, 
  FormData, 
  FormType, 
  FormValidationResult, 
  FormGenerationOptions,
  GeneratedForm,
  I9FormData,
  W4FormData
} from '@/types/forms';
import { I9_TEMPLATE_EN, I9_TEMPLATE_ES } from './templates/i9Template';
import { W4_TEMPLATE_EN, W4_TEMPLATE_ES } from './templates/w4Template';
import { OfficialFormService } from './officialFormService';
import { DocumentRepository } from '@/repositories/document.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { OCRResult } from '@/services/document/ocrService';
import { Employee } from '@prisma/client';

export class FormGenerationService {
  private documentRepository: DocumentRepository;
  private employeeRepository: EmployeeRepository;
  private officialFormService: OfficialFormService;

  constructor() {
    this.documentRepository = new DocumentRepository();
    this.employeeRepository = new EmployeeRepository();
    this.officialFormService = new OfficialFormService();
  }

  /**
   * Get form template by type and language
   */
  getFormTemplate(formType: FormType, language: 'en' | 'es' = 'en'): FormTemplate {
    switch (formType) {
      case 'i9':
        return language === 'es' ? I9_TEMPLATE_ES : I9_TEMPLATE_EN;
      case 'w4':
        return language === 'es' ? W4_TEMPLATE_ES : W4_TEMPLATE_EN;
      default:
        throw new Error(`Unsupported form type: ${formType}`);
    }
  }

  /**
   * Generate a form with pre-filled data from OCR and employee information
   */
  async generateForm(options: FormGenerationOptions): Promise<GeneratedForm> {
    const { employeeId, formType, language, prefillFromOCR, ocrDocumentIds } = options;

    // Get employee information
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new Error('Employee not found');
    }

    // Get form template
    const template = this.getFormTemplate(formType, language);

    // Prepare pre-filled data
    let prefilledData: Record<string, any> = {};

    // Fill from employee data
    prefilledData = this.prefillFromEmployeeData(employee, formType);

    // Fill from OCR data if requested
    if (prefillFromOCR && ocrDocumentIds && ocrDocumentIds.length > 0) {
      const ocrData = await this.getOCRDataFromDocuments(ocrDocumentIds);
      prefilledData = { ...prefilledData, ...this.prefillFromOCRData(ocrData, formType) };
    }

    // Create generated form
    const generatedForm: GeneratedForm = {
      id: `${formType}-${employeeId}-${Date.now()}`,
      employeeId,
      formType,
      language,
      template,
      prefilledData,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return generatedForm;
  }

  /**
   * Validate form data against template requirements
   */
  validateFormData(formData: FormData): FormValidationResult {
    const template = this.getFormTemplate(formData.formType, formData.language);
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    const requiredFieldsMissing: string[] = [];
    
    let totalFields = 0;
    let completedFields = 0;

    // Validate each section and field
    for (const section of template.sections) {
      for (const field of section.fields) {
        totalFields++;
        const fieldValue = formData.data[field.name];

        // Check required fields
        if (field.required && (!fieldValue || fieldValue === '')) {
          errors[field.name] = `${field.label} is required`;
          requiredFieldsMissing.push(field.name);
        } else if (fieldValue && fieldValue !== '') {
          completedFields++;

          // Validate field format
          if (field.validation) {
            const validation = field.validation;
            const value = String(fieldValue);

            // Pattern validation
            if (validation.pattern && !new RegExp(validation.pattern).test(value)) {
              errors[field.name] = `${field.label} format is invalid`;
            }

            // Length validation
            if (validation.minLength && value.length < validation.minLength) {
              errors[field.name] = `${field.label} must be at least ${validation.minLength} characters`;
            }
            if (validation.maxLength && value.length > validation.maxLength) {
              errors[field.name] = `${field.label} must be no more than ${validation.maxLength} characters`;
            }

            // Number validation
            if (field.type === 'number') {
              const numValue = Number(fieldValue);
              if (isNaN(numValue)) {
                errors[field.name] = `${field.label} must be a valid number`;
              } else {
                if (validation.min !== undefined && numValue < validation.min) {
                  errors[field.name] = `${field.label} must be at least ${validation.min}`;
                }
                if (validation.max !== undefined && numValue > validation.max) {
                  errors[field.name] = `${field.label} must be no more than ${validation.max}`;
                }
              }
            }

            // Date validation
            if (field.type === 'date') {
              const dateValue = new Date(fieldValue);
              if (isNaN(dateValue.getTime())) {
                errors[field.name] = `${field.label} must be a valid date`;
              }
            }
          }

          // Form-specific validations
          this.validateFormSpecificRules(formData, field.name, fieldValue, errors, warnings);
        }
      }
    }

    const completionPercentage = totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      completionPercentage,
      requiredFieldsMissing
    };
  }

  /**
   * Apply form-specific validation rules
   */
  private validateFormSpecificRules(
    formData: FormData, 
    fieldName: string, 
    fieldValue: any, 
    errors: Record<string, string>, 
    warnings: Record<string, string>
  ): void {
    if (formData.formType === 'i9') {
      this.validateI9SpecificRules(formData.data, fieldName, fieldValue, errors, warnings);
    } else if (formData.formType === 'w4') {
      this.validateW4SpecificRules(formData.data, fieldName, fieldValue, errors, warnings);
    }
  }

  /**
   * I-9 specific validation rules
   */
  private validateI9SpecificRules(
    data: Record<string, any>, 
    fieldName: string, 
    fieldValue: any, 
    errors: Record<string, string>, 
    warnings: Record<string, string>
  ): void {
    // Citizenship status dependent validations
    if (fieldName === 'citizenshipStatus') {
      if (fieldValue === 'lawful_permanent_resident' && !data.alienNumber) {
        warnings.alienNumber = 'Alien Registration Number is required for lawful permanent residents';
      }
      if (fieldValue === 'alien_authorized' && !data.workAuthorizationExpiration) {
        warnings.workAuthorizationExpiration = 'Work authorization expiration date is required';
      }
    }

    // SSN validation
    if (fieldName === 'ssnNumber') {
      const ssn = String(fieldValue).replace(/\D/g, '');
      if (ssn.length !== 9) {
        errors[fieldName] = 'Social Security Number must be 9 digits';
      } else if (ssn === '000000000' || ssn === '123456789') {
        errors[fieldName] = 'Please enter a valid Social Security Number';
      }
    }

    // Date of birth validation
    if (fieldName === 'dateOfBirth') {
      const dob = new Date(fieldValue);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      
      if (age < 16) {
        errors[fieldName] = 'Employee must be at least 16 years old';
      } else if (age > 120) {
        errors[fieldName] = 'Please verify the date of birth';
      }
    }

    // Work authorization expiration validation
    if (fieldName === 'workAuthorizationExpiration' && fieldValue) {
      const expDate = new Date(fieldValue);
      const today = new Date();
      
      if (expDate < today) {
        warnings[fieldName] = 'Work authorization appears to be expired';
      } else if (expDate < new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)) {
        warnings[fieldName] = 'Work authorization expires within 30 days';
      }
    }
  }

  /**
   * W-4 specific validation rules
   */
  private validateW4SpecificRules(
    data: Record<string, any>, 
    fieldName: string, 
    fieldValue: any, 
    errors: Record<string, string>, 
    warnings: Record<string, string>
  ): void {
    // SSN validation
    if (fieldName === 'ssnNumber') {
      const ssn = String(fieldValue).replace(/\D/g, '');
      if (ssn.length !== 9) {
        errors[fieldName] = 'Social Security Number must be 9 digits';
      } else if (ssn === '000000000' || ssn === '123456789') {
        errors[fieldName] = 'Please enter a valid Social Security Number';
      }
    }

    // Dependent amount calculations
    if (fieldName === 'totalDependentAmount') {
      const qualifyingChildren = Number(data.qualifyingChildren) || 0;
      const otherDependents = Number(data.otherDependents) || 0;
      const expectedTotal = qualifyingChildren + otherDependents;
      
      if (Number(fieldValue) !== expectedTotal) {
        warnings[fieldName] = 'Total dependent amount should equal the sum of qualifying children and other dependents';
      }
    }

    // Income validation
    if (fieldName === 'otherIncome' && Number(fieldValue) > 100000) {
      warnings[fieldName] = 'High other income amount - please verify';
    }

    // Extra withholding validation
    if (fieldName === 'extraWithholding' && Number(fieldValue) > 1000) {
      warnings[fieldName] = 'High extra withholding amount - please verify';
    }
  }

  /**
   * Pre-fill form data from employee information
   */
  private prefillFromEmployeeData(employee: Employee & { user?: any; organization?: any }, formType: FormType): Record<string, any> {
    const data: Record<string, any> = {};

    if (formType === 'i9') {
      // Basic personal information
      if (employee.user) {
        data.firstName = employee.user.firstName;
        data.lastName = employee.user.lastName;
        data.email = employee.user.email;
        data.phone = employee.user.phone;
      }
      
      if (employee.dateOfBirth) {
        data.dateOfBirth = employee.dateOfBirth.toISOString().split('T')[0];
      }

      // Address information
      if (employee.address) {
        const address = employee.address as any;
        data.address = address.street;
        data.city = address.city;
        data.state = address.state;
        data.zipCode = address.zipCode;
      }

      // Employment information
      data.employerName = employee.organization?.name || '';
      data.employerTitle = 'HR Representative';
      data.firstDateOfEmployment = employee.hireDate?.toISOString().split('T')[0];

    } else if (formType === 'w4') {
      // Basic personal information
      if (employee.user) {
        data.firstName = employee.user.firstName;
        data.lastName = employee.user.lastName;
      }

      // Address information
      if (employee.address) {
        const address = employee.address as any;
        data.address = address.street;
        data.city = `${address.city}, ${address.state} ${address.zipCode}`;
      }

      // Employment information
      data.employerName = employee.organization?.name || '';
      data.employerEIN = '00-0000000'; // This should come from organization settings
      data.firstDateOfEmployment = employee.hireDate?.toISOString().split('T')[0];
    }

    return data;
  }

  /**
   * Pre-fill form data from OCR extracted data
   */
  private prefillFromOCRData(ocrResults: OCRResult[], formType: FormType): Record<string, any> {
    const data: Record<string, any> = {};

    for (const ocrResult of ocrResults) {
      if (ocrResult.processingStatus !== 'completed') continue;

      const extractedData = ocrResult.extractedData;

      // Map OCR data to form fields
      if (extractedData.fullName) {
        const nameParts = extractedData.fullName.split(' ');
        if (nameParts.length >= 2) {
          data.firstName = nameParts[0];
          data.lastName = nameParts[nameParts.length - 1];
          if (nameParts.length > 2) {
            data.middleInitial = nameParts[1].charAt(0);
          }
        }
      }

      if (extractedData.dateOfBirth) {
        data.dateOfBirth = this.formatDateForForm(extractedData.dateOfBirth);
      }

      if (extractedData.ssnNumber) {
        data.ssnNumber = extractedData.ssnNumber.replace(/\D/g, '');
      }

      if (extractedData.address) {
        data.address = extractedData.address;
      }

      if (extractedData.city) {
        data.city = extractedData.city;
      }

      if (extractedData.state) {
        data.state = extractedData.state;
      }

      if (extractedData.zipCode) {
        data.zipCode = extractedData.zipCode;
      }

      // Driver's license specific data for I-9
      if (formType === 'i9') {
        if (extractedData.licenseNumber) {
          data.documentTitle1 = 'Driver\'s License';
          data.documentNumber1 = extractedData.licenseNumber;
          data.issuingAuthority1 = extractedData.state ? `${extractedData.state} DMV` : 'State DMV';
        }

        if (extractedData.expirationDate) {
          data.expirationDate1 = this.formatDateForForm(extractedData.expirationDate);
        }
      }
    }

    return data;
  }

  /**
   * Get OCR data from multiple documents
   */
  private async getOCRDataFromDocuments(documentIds: string[]): Promise<OCRResult[]> {
    const ocrResults: OCRResult[] = [];

    for (const documentId of documentIds) {
      try {
        const document = await this.documentRepository.findById(documentId);
        if (document && document.ocrData) {
          ocrResults.push(document.ocrData as unknown as OCRResult);
        }
      } catch (error) {
        console.error(`Error getting OCR data for document ${documentId}:`, error);
      }
    }

    return ocrResults;
  }

  /**
   * Format date for form display
   */
  private formatDateForForm(dateString: string): string {
    try {
      // Handle various date formats from OCR
      let date: Date;
      
      if (dateString.includes('/')) {
        // MM/DD/YYYY or MM/DD/YY format
        const parts = dateString.split('/');
        if (parts.length === 3) {
          let year = parseInt(parts[2]);
          if (year < 100) {
            year += year < 50 ? 2000 : 1900; // Assume 00-49 is 2000s, 50-99 is 1900s
          }
          date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        return dateString; // Return original if can't parse
      }

      // Return in YYYY-MM-DD format for HTML date inputs
      return date.toISOString().split('T')[0];
    } catch (error) {
      return dateString; // Return original if error
    }
  }

  /**
   * Calculate form completion percentage
   */
  calculateCompletionPercentage(formData: FormData): number {
    const template = this.getFormTemplate(formData.formType, formData.language);
    let totalFields = 0;
    let completedFields = 0;

    for (const section of template.sections) {
      for (const field of section.fields) {
        totalFields++;
        const fieldValue = formData.data[field.name];
        if (fieldValue && fieldValue !== '') {
          completedFields++;
        }
      }
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  /**
   * Get required fields that are missing
   */
  getMissingRequiredFields(formData: FormData): string[] {
    const template = this.getFormTemplate(formData.formType, formData.language);
    const missingFields: string[] = [];

    for (const section of template.sections) {
      for (const field of section.fields) {
        if (field.required) {
          const fieldValue = formData.data[field.name];
          if (!fieldValue || fieldValue === '') {
            missingFields.push(field.name);
          }
        }
      }
    }

    return missingFields;
  }

  /**
   * Auto-populate dependent calculations for W-4
   */
  autoCalculateW4Dependents(formData: Partial<W4FormData>): Partial<W4FormData> {
    const result = { ...formData };

    // Calculate total dependent amount
    const qualifyingChildren = Number(result.qualifyingChildren) || 0;
    const otherDependents = Number(result.otherDependents) || 0;
    result.totalDependentAmount = qualifyingChildren + otherDependents;

    return result;
  }

  /**
   * Get form field suggestions based on partial input
   */
  getFieldSuggestions(formType: FormType, fieldName: string, partialValue: string): string[] {
    const suggestions: string[] = [];

    // State suggestions
    if (fieldName === 'state' && partialValue) {
      const states = [
        'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
        'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
        'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
        'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
        'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
      ];
      
      const upperPartial = partialValue.toUpperCase();
      suggestions.push(...states.filter(state => state.startsWith(upperPartial)));
    }

    // City suggestions (could be enhanced with a city database)
    if (fieldName === 'city' && partialValue.length >= 2) {
      // This could be enhanced with a real city database
      const commonCities = [
        'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
        'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'
      ];
      
      const lowerPartial = partialValue.toLowerCase();
      suggestions.push(...commonCities.filter(city => 
        city.toLowerCase().startsWith(lowerPartial)
      ));
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Generate official PDF form (2025 compliant)
   */
  async generateOfficialPDF(formData: FormData, outputPath: string): Promise<void> {
    try {
      // Use official form service for PDF generation
      await this.officialFormService.fillOfficialForm(formData, outputPath);
      console.log(`✅ Generated official ${formData.formType} PDF: ${outputPath}`);
    } catch (error) {
      console.error(`❌ Failed to generate official PDF:`, error);
      throw error;
    }
  }

  /**
   * Check if official forms are available and up to date
   */
  async validateOfficialForms(): Promise<{ i9: boolean; w4: boolean; details: any }> {
    const i9Validation = await this.officialFormService.validateFormMappings('i9');
    const w4Validation = await this.officialFormService.validateFormMappings('w4');
    
    return {
      i9: i9Validation.valid,
      w4: w4Validation.valid,
      details: {
        i9: i9Validation,
        w4: w4Validation,
        availableVersions: this.officialFormService.getAvailableFormVersions()
      }
    };
  }

  /**
   * Download and setup official forms
   */
  async setupOfficialForms(): Promise<void> {
    console.log('🔄 Setting up official government forms...');
    await this.officialFormService.downloadOfficialForms();
    
    // Validate the downloaded forms
    const validation = await this.validateOfficialForms();
    
    if (validation.i9 && validation.w4) {
      console.log('✅ Official forms setup complete and validated');
    } else {
      console.warn('⚠️ Some official forms may have validation issues:', validation.details);
    }
  }

  /**
   * Get form generation mode preference (legacy template vs official PDF)
   */
  getGenerationMode(): 'legacy' | 'official' {
    // Check environment variable or configuration
    return process.env.FORM_GENERATION_MODE === 'official' ? 'official' : 'legacy';
  }

  /**
   * Generate form using appropriate method based on configuration
   */
  async generateFormDocument(formData: FormData, outputPath: string): Promise<void> {
    const mode = this.getGenerationMode();
    
    if (mode === 'official') {
      // Use official PDF forms (2025 compliant)
      await this.generateOfficialPDF(formData, outputPath);
    } else {
      // Use legacy template system (for development/testing)
      console.log(`ℹ️ Using legacy template for ${formData.formType} (set FORM_GENERATION_MODE=official for compliance)`);
      // Keep existing template-based generation as fallback
      throw new Error('Legacy PDF generation not implemented in this update. Use official mode.');
    }
  }
}