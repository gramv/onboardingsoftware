import { PDFDocument, PDFForm, PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown, rgb } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';
import { FormData, FormType } from '@/types/forms';

export interface OfficialFormConfig {
  formType: FormType;
  version: string;
  pdfPath: string;
  fieldMappings: Record<string, string>;
  effectiveDate: string;
  expirationDate?: string;
}

export class OfficialFormService {
  private formConfigs: Map<string, OfficialFormConfig> = new Map();

  constructor() {
    this.initializeFormConfigs();
  }

  /**
   * Initialize official form configurations
   */
  private initializeFormConfigs(): void {
    // Form I-9 (Edition Date: 01/20/25, Expires: 05/31/2027)
    this.formConfigs.set('i9-2025', {
      formType: 'i9',
      version: '01/20/25',
      pdfPath: '/forms/official/i-9-01-20-25.pdf',
      effectiveDate: '2025-01-20',
      expirationDate: '2027-05-31',
      fieldMappings: {
        // Section 1 - Employee Information and Attestation
        'lastName': 'Last Name (Family Name)',
        'firstName': 'First Name Given Name',
        'middleInitial': 'Employee Middle Initial (if any)',
        'otherLastNames': 'Employee Other Last Names Used (if any)',
        'address': 'Address Street Number and Name',
        'aptNumber': 'Apt Number (if any)',
        'city': 'City or Town',
        'state': 'State',
        'zipCode': 'ZIP Code',
        'dateOfBirth': 'Date of Birth mmddyyyy',
        'ssnNumber': 'US Social Security Number',
        'email': 'Employees E-mail Address',
        'phone': 'Telephone Number',
        
        // Citizenship Status - Checkboxes (I-9 uses checkboxes, not radio buttons)
        'citizenshipStatus.us_citizen': 'CB_1',
        'citizenshipStatus.non_citizen_national': 'CB_2', 
        'citizenshipStatus.lawful_permanent_resident': 'CB_3',
        'citizenshipStatus.alien_authorized': 'CB_4',
        
        // Additional fields for non-citizens
        'alienNumber': '3 A lawful permanent resident Enter USCIS or ANumber',
        'uscisNumber': 'USCIS ANumber',
        'i94Number': 'Form I94 Admission Number',
        'foreignPassportNumber': 'Foreign Passport Number and Country of IssuanceRow1',
        'workAuthorizationExpiration': 'Exp Date mmddyyyy',
        
        // Employee signature
        'employeeSignatureDate': 'Today\'s Date mmddyyy',
        'employeeSignature': 'Signature of Employee',
        
        // Section 2 - Employer Review and Verification
        'documentTitle1': 'Document Title 1',
        'issuingAuthority1': 'Issuing Authority 1',
        'documentNumber1': 'Document Number 0 (if any)',
        'expirationDate1': 'List A.  Document 2. Expiration Date (if any)',
        
        // List B & C Documents
        'documentTitle2': 'List B Document 1 Title',
        'issuingAuthority2': 'List B Issuing Authority 1',
        'documentNumber2': 'List B Document Number 1',
        'expirationDate2': 'List B Expiration Date 1',
        
        'documentTitle3': 'List C Document Title 1',
        'issuingAuthority3': 'List C Issuing Authority 1',
        'documentNumber3': 'List C Document Number 1',
        'expirationDate3': 'List C Expiration Date 1',
        
        // Additional information
        'additionalInfo': 'Additional Information',
        
        // First day of employment
        'firstDayOfEmployment': 'FirstDayEmployed mmddyyyy',
        
        // Employer signature and info
        'employerSignatureDate': 'S2 Todays Date mmddyyyy',
        'employerSignature': 'Signature of Employer or AR',
        'employerName': 'Last Name First Name and Title of Employer or Authorized Representative',
        'employerBusinessName': 'Employers Business or Org Name',
        'employerAddress': 'Employers Business or Org Address',
        
        // Section 3 - Reverification and Rehires  
        'rehireDate': 'Date of Rehire 0',
        'newLastName': 'Last Name 0',
        'newFirstName': 'First Name 0',
        'reverificationDocumentTitle': 'Document Title 0',
        'reverificationDocumentNumber': 'Document Number 0',
        'reverificationExpirationDate': 'Expiration Date 0',
        'reverificationSignatureDate': 'Todays Date 0'
      }
    });

    // Form W-4 (2025 version)
    this.formConfigs.set('w4-2025', {
      formType: 'w4',
      version: '2025',
      pdfPath: '/forms/official/w-4-2025.pdf',
      effectiveDate: '2025-01-01',
      fieldMappings: {
        // Step 1 - Personal Information
        'firstName': 'topmostSubform[0].Page1[0].Step1a[0].f1_01[0]',
        'middleInitial': 'topmostSubform[0].Page1[0].Step1a[0].f1_02[0]', 
        'lastName': 'topmostSubform[0].Page1[0].Step1a[0].f1_03[0]',
        'address': 'topmostSubform[0].Page1[0].Step1a[0].f1_04[0]',
        'ssnNumber': 'topmostSubform[0].Page1[0].f1_05[0]',
        
        // Filing Status - Checkboxes
        'filingStatus': {
          'single': 'topmostSubform[0].Page1[0].c1_1[0]',
          'married_filing_jointly': 'topmostSubform[0].Page1[0].c1_1[1]',
          'head_of_household': 'topmostSubform[0].Page1[0].c1_1[2]'
        },
        
        // Step 2 - Multiple Jobs or Spouse Works
        'multipleJobsSpouseWorks': 'topmostSubform[0].Page1[0].c1_2[0]',
        
        // Step 3 - Claim Dependents
        'qualifyingChildrenAmount': 'topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_06[0]',
        'otherDependentsAmount': 'topmostSubform[0].Page1[0].Step3_ReadOrder[0].f1_07[0]',
        'totalDependentAmount': 'topmostSubform[0].Page1[0].f1_09[0]',
        
        // Step 4 - Other Adjustments
        'otherIncome': 'topmostSubform[0].Page1[0].f1_10[0]',
        'deductions': 'topmostSubform[0].Page1[0].f1_11[0]',
        'extraWithholding': 'topmostSubform[0].Page1[0].f1_12[0]',
        
        // Step 5 - Signature and Date
        'signatureDate': 'topmostSubform[0].Page1[0].f1_13[0]',
        
        // Employer Information (from employer copy section)
        'employerName': 'topmostSubform[0].Page3[0].f3_01[0]',
        'employerAddress': 'topmostSubform[0].Page3[0].f3_02[0]',
        'employerCity': 'topmostSubform[0].Page3[0].f3_03[0]',
        'employerState': 'topmostSubform[0].Page3[0].f3_04[0]',
        'employerZipCode': 'topmostSubform[0].Page3[0].f3_05[0]',
        'employerEIN': 'topmostSubform[0].Page3[0].f3_06[0]',
        'firstDateOfEmployment': 'topmostSubform[0].Page3[0].f3_07[0]'
      }
    });
  }

  /**
   * Get the latest form configuration for a form type
   */
  getLatestFormConfig(formType: FormType): OfficialFormConfig | null {
    const configs = Array.from(this.formConfigs.values())
      .filter(config => config.formType === formType)
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime());
    
    return configs[0] || null;
  }

  /**
   * Check if a form version is still valid
   */
  isFormVersionValid(formKey: string): boolean {
    const config = this.formConfigs.get(formKey);
    if (!config) return false;
    
    const now = new Date();
    const effectiveDate = new Date(config.effectiveDate);
    const expirationDate = config.expirationDate ? new Date(config.expirationDate) : null;
    
    return now >= effectiveDate && (!expirationDate || now <= expirationDate);
  }

  /**
   * Fill official PDF form with data
   */
  async fillOfficialForm(formData: FormData, outputPath: string): Promise<void> {
    const config = this.getLatestFormConfig(formData.formType);
    if (!config) {
      throw new Error(`No official form configuration found for ${formData.formType}`);
    }

    // Check if form version is still valid
    if (!this.isFormVersionValid(`${formData.formType}-2025`)) {
      console.warn(`Form ${formData.formType} may be using an outdated version`);
    }

    try {
      // Load the official PDF
      const pdfPath = path.join(process.cwd(), 'storage', config.pdfPath);
      const existingPdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();

      // Fill form fields
      await this.fillFormFields(form, formData.data, config.fieldMappings);

      // Add compliance watermark
      await this.addComplianceWatermark(pdfDoc, config);

      // Save filled form
      const pdfBytes = await pdfDoc.save();
      await fs.writeFile(outputPath, pdfBytes);

    } catch (error) {
      console.error('Error filling official form:', error);
      throw new Error(`Failed to fill official ${formData.formType} form: ${error.message}`);
    }
  }

  /**
   * Fill form fields using field mappings
   */
  private async fillFormFields(
    form: PDFForm, 
    data: Record<string, any>, 
    fieldMappings: Record<string, any>
  ): Promise<void> {
    for (const [dataField, pdfFieldPath] of Object.entries(fieldMappings)) {
      const value = data[dataField];
      if (value === undefined || value === null || value === '') continue;

      try {
        // Handle radio button groups
        if (typeof pdfFieldPath === 'object') {
          const selectedValue = value as string;
          const radioFieldPath = pdfFieldPath[selectedValue];
          if (radioFieldPath) {
            const field = form.getCheckBox(radioFieldPath);
            field.check();
          }
        } 
        // Handle regular text fields
        else if (typeof pdfFieldPath === 'string') {
          try {
            const field = form.getTextField(pdfFieldPath);
            field.setText(String(value));
          } catch (error) {
            // Try as dropdown if text field fails
            try {
              const dropdownField = form.getDropdown(pdfFieldPath);
              dropdownField.select(String(value));
            } catch (dropdownError) {
              // Try as checkbox if dropdown fails
              try {
                const checkboxField = form.getCheckBox(pdfFieldPath);
                if (value === true || value === 'true' || value === 'on') {
                  checkboxField.check();
                }
              } catch (checkboxError) {
                console.warn(`Could not fill field ${dataField} -> ${pdfFieldPath}:`, error.message);
              }
            }
          }
        }
      } catch (error) {
        console.warn(`Error filling field ${dataField}:`, error.message);
      }
    }
  }

  /**
   * Add compliance watermark to the PDF
   */
  private async addComplianceWatermark(pdfDoc: PDFDocument, config: OfficialFormConfig): Promise<void> {
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    
    const { width, height } = firstPage.getSize();
    
    // Add version info at bottom of first page
    firstPage.drawText(
      `Official ${config.formType.toUpperCase()} Form - Version: ${config.version} - Generated: ${new Date().toLocaleDateString()}`,
      {
        x: 50,
        y: 20,
        size: 8,
        color: rgb(0.5, 0.5, 0.5)
      }
    );
  }

  /**
   * Download official forms from government websites
   */
  async downloadOfficialForms(): Promise<void> {
    const formUrls = {
      'i9': 'https://www.uscis.gov/sites/default/files/document/forms/i-9.pdf',
      'w4': 'https://www.irs.gov/pub/irs-pdf/fw4.pdf'
    };

    const storageDir = path.join(process.cwd(), 'storage', 'forms', 'official');
    
    // Ensure directory exists
    await fs.mkdir(storageDir, { recursive: true });

    for (const [formType, url] of Object.entries(formUrls)) {
      try {
        console.log(`Downloading official ${formType.toUpperCase()} form...`);
        
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const buffer = await response.arrayBuffer();
        const filename = formType === 'i9' ? 'i-9-01-20-25.pdf' : 'w-4-2025.pdf';
        const filepath = path.join(storageDir, filename);
        
        await fs.writeFile(filepath, Buffer.from(buffer));
        console.log(`✅ Downloaded ${formType.toUpperCase()} form to ${filepath}`);
        
      } catch (error) {
        console.error(`❌ Failed to download ${formType.toUpperCase()} form:`, error);
      }
    }
  }

  /**
   * Validate that all required PDF field mappings exist
   */
  async validateFormMappings(formType: FormType): Promise<{ valid: boolean; missingFields: string[] }> {
    const config = this.getLatestFormConfig(formType);
    if (!config) {
      return { valid: false, missingFields: ['No configuration found'] };
    }

    try {
      const pdfPath = path.join(process.cwd(), 'storage', config.pdfPath);
      const existingPdfBytes = await fs.readFile(pdfPath);
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const form = pdfDoc.getForm();
      
      const missingFields: string[] = [];
      const formFields = form.getFields();
      const formFieldNames = formFields.map(field => field.getName());
      
      for (const [dataField, pdfFieldPath] of Object.entries(config.fieldMappings)) {
        if (typeof pdfFieldPath === 'string') {
          if (!formFieldNames.includes(pdfFieldPath)) {
            missingFields.push(`${dataField} -> ${pdfFieldPath}`);
          }
        } else if (typeof pdfFieldPath === 'object') {
          for (const [key, path] of Object.entries(pdfFieldPath)) {
            if (!formFieldNames.includes(path as string)) {
              missingFields.push(`${dataField}.${key} -> ${path}`);
            }
          }
        }
      }
      
      return { valid: missingFields.length === 0, missingFields };
      
    } catch (error) {
      return { valid: false, missingFields: [`Error loading PDF: ${error.message}`] };
    }
  }

  /**
   * Get all available form versions
   */
  getAvailableFormVersions(): Array<{ formType: FormType; version: string; isValid: boolean }> {
    return Array.from(this.formConfigs.entries()).map(([key, config]) => ({
      formType: config.formType,
      version: config.version,
      isValid: this.isFormVersionValid(key)
    }));
  }
}