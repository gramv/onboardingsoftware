import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { FormData, FormTemplate, PDFGenerationOptions, I9FormData, W4FormData } from '@/types/forms';

export class PDFGenerationService {
  private readonly outputDir: string;

  constructor() {
    this.outputDir = path.join(process.cwd(), 'storage', 'forms');
    this.ensureOutputDirectory();
  }

  /**
   * Ensure output directory exists
   */
  private ensureOutputDirectory(): void {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate PDF from form data
   */
  async generateFormPDF(options: PDFGenerationOptions): Promise<string> {
    const { formData, template, outputPath, includeInstructions, watermark } = options;

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      // Generate HTML content
      const htmlContent = this.generateFormHTML(formData, template, includeInstructions, watermark);
      
      // Set content and wait for it to load
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
      
      // Generate PDF
      const fullOutputPath = path.join(this.outputDir, outputPath);
      await page.pdf({
        path: fullOutputPath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        }
      });

      return fullOutputPath;
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Generate HTML content for the form
   */
  private generateFormHTML(
    formData: FormData, 
    template: FormTemplate, 
    includeInstructions: boolean = true,
    watermark?: string
  ): string {
    const isI9 = formData.formType === 'i9';
    const isW4 = formData.formType === 'w4';

    let html = `
      <!DOCTYPE html>
      <html lang="${template.language}">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${template.metadata.title}</title>
        <style>
          ${this.getFormStyles(watermark)}
        </style>
      </head>
      <body>
    `;

    if (watermark) {
      html += `<div class="watermark">${watermark}</div>`;
    }

    // Form header
    html += `
      <div class="form-header">
        <h1>${template.metadata.title}</h1>
        <p class="form-description">${template.metadata.description}</p>
        ${includeInstructions ? `<p class="instructions">${template.metadata.instructions}</p>` : ''}
      </div>
    `;

    // Generate form-specific content
    if (isI9) {
      html += this.generateI9FormContent(formData.data as I9FormData, template);
    } else if (isW4) {
      html += this.generateW4FormContent(formData.data as W4FormData, template);
    } else {
      html += this.generateGenericFormContent(formData, template);
    }

    // Form footer
    html += `
      <div class="form-footer">
        <p class="legal-notice">${template.metadata.legalNotice}</p>
        <p class="generation-info">Generated on: ${new Date().toLocaleDateString()}</p>
      </div>
    `;

    html += `
      </body>
      </html>
    `;

    return html;
  }

  /**
   * Generate I-9 form specific content
   */
  private generateI9FormContent(data: I9FormData, template: FormTemplate): string {
    let html = '<div class="form-content i9-form">';

    // Section 1: Employee Information
    html += `
      <div class="form-section">
        <h2>Section 1. Employee Information and Attestation</h2>
        <p class="section-note">Employees must complete and sign Section 1 of Form I-9 no later than the first day of employment, but not before accepting a job offer.</p>
        
        <div class="form-row">
          <div class="form-field">
            <label>Last Name (Family Name)</label>
            <div class="field-value">${data.lastName || ''}</div>
          </div>
          <div class="form-field">
            <label>First Name (Given Name)</label>
            <div class="field-value">${data.firstName || ''}</div>
          </div>
          <div class="form-field">
            <label>Middle Initial</label>
            <div class="field-value">${data.middleInitial || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field full-width">
            <label>Other Last Names Used (if any)</label>
            <div class="field-value">${data.otherLastNames || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field full-width">
            <label>Address (Street Number and Name)</label>
            <div class="field-value">${data.address || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>City or Town</label>
            <div class="field-value">${data.city || ''}</div>
          </div>
          <div class="form-field">
            <label>State</label>
            <div class="field-value">${data.state || ''}</div>
          </div>
          <div class="form-field">
            <label>ZIP Code</label>
            <div class="field-value">${data.zipCode || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Date of Birth (mm/dd/yyyy)</label>
            <div class="field-value">${data.dateOfBirth || ''}</div>
          </div>
          <div class="form-field">
            <label>U.S. Social Security Number</label>
            <div class="field-value">${this.formatSSN(data.ssnNumber)}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Employee's Email Address</label>
            <div class="field-value">${data.email || ''}</div>
          </div>
          <div class="form-field">
            <label>Employee's Telephone Number</label>
            <div class="field-value">${data.phone || ''}</div>
          </div>
        </div>
      </div>
    `;

    // Citizenship Status
    html += `
      <div class="form-section">
        <h3>I am aware that federal law provides for imprisonment and/or fines for false statements or use of false documents in connection with the completion of this form.</h3>
        
        <div class="citizenship-options">
          <div class="checkbox-option ${data.citizenshipStatus === 'us_citizen' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">1. A citizen of the United States</span>
          </div>
          <div class="checkbox-option ${data.citizenshipStatus === 'non_citizen_national' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">2. A noncitizen national of the United States</span>
          </div>
          <div class="checkbox-option ${data.citizenshipStatus === 'lawful_permanent_resident' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">3. A lawful permanent resident (Alien Registration Number): A-${data.alienNumber || '_________'}</span>
          </div>
          <div class="checkbox-option ${data.citizenshipStatus === 'alien_authorized' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">4. An alien authorized to work until: ${data.workAuthorizationExpiration || '_________'}</span>
          </div>
        </div>

        ${data.uscisNumber ? `
          <div class="form-row">
            <div class="form-field">
              <label>USCIS Number</label>
              <div class="field-value">${data.uscisNumber}</div>
            </div>
          </div>
        ` : ''}

        <div class="signature-section">
          <div class="form-row">
            <div class="form-field">
              <label>Employee's Signature</label>
              <div class="signature-line">${data.employeeSignature ? '[Signed]' : ''}</div>
            </div>
            <div class="form-field">
              <label>Date (mm/dd/yyyy)</label>
              <div class="field-value">${data.employeeSignatureDate || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Section 2: Employer Review and Verification
    html += `
      <div class="form-section">
        <h2>Section 2. Employer or Authorized Representative Review and Verification</h2>
        <p class="section-note">Employers or their authorized representative must complete and sign Section 2 within 3 business days of the employee's first day of employment.</p>
        
        <div class="document-verification">
          <h4>List A OR List B AND List C</h4>
          
          <div class="document-entry">
            <div class="form-row">
              <div class="form-field">
                <label>Document Title</label>
                <div class="field-value">${data.documentTitle1 || ''}</div>
              </div>
              <div class="form-field">
                <label>Issuing Authority</label>
                <div class="field-value">${data.issuingAuthority1 || ''}</div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-field">
                <label>Document Number</label>
                <div class="field-value">${data.documentNumber1 || ''}</div>
              </div>
              <div class="form-field">
                <label>Expiration Date (if any)</label>
                <div class="field-value">${data.expirationDate1 || ''}</div>
              </div>
            </div>
          </div>

          ${data.documentTitle2 ? `
            <div class="document-entry">
              <div class="form-row">
                <div class="form-field">
                  <label>Document Title</label>
                  <div class="field-value">${data.documentTitle2}</div>
                </div>
                <div class="form-field">
                  <label>Issuing Authority</label>
                  <div class="field-value">${data.issuingAuthority2 || ''}</div>
                </div>
              </div>
              <div class="form-row">
                <div class="form-field">
                  <label>Document Number</label>
                  <div class="field-value">${data.documentNumber2 || ''}</div>
                </div>
                <div class="form-field">
                  <label>Expiration Date (if any)</label>
                  <div class="field-value">${data.expirationDate2 || ''}</div>
                </div>
              </div>
            </div>
          ` : ''}
        </div>

        <div class="signature-section">
          <div class="form-row">
            <div class="form-field">
              <label>Signature of Employer or Authorized Representative</label>
              <div class="signature-line">${data.employerSignature ? '[Signed]' : ''}</div>
            </div>
            <div class="form-field">
              <label>Date (mm/dd/yyyy)</label>
              <div class="field-value">${data.employerSignatureDate || ''}</div>
            </div>
          </div>
          <div class="form-row">
            <div class="form-field">
              <label>Name of Employer or Authorized Representative</label>
              <div class="field-value">${data.employerName || ''}</div>
            </div>
            <div class="form-field">
              <label>Title</label>
              <div class="field-value">${data.employerTitle || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    html += '</div>';
    return html;
  }

  /**
   * Generate W-4 form specific content
   */
  private generateW4FormContent(data: W4FormData, template: FormTemplate): string {
    let html = '<div class="form-content w4-form">';

    // Step 1: Personal Information
    html += `
      <div class="form-section">
        <h2>Step 1: Enter Personal Information</h2>
        
        <div class="form-row">
          <div class="form-field">
            <label>First name and middle initial</label>
            <div class="field-value">${data.firstName || ''}</div>
          </div>
          <div class="form-field">
            <label>Last name</label>
            <div class="field-value">${data.lastName || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field full-width">
            <label>Address</label>
            <div class="field-value">${data.address || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field full-width">
            <label>City or town, state, and ZIP code</label>
            <div class="field-value">${data.city || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Social security number</label>
            <div class="field-value">${this.formatSSN(data.ssnNumber)}</div>
          </div>
        </div>

        <div class="filing-status">
          <h4>Filing Status (Check one)</h4>
          <div class="checkbox-option ${data.filingStatus === 'single' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">Single or Married filing separately</span>
          </div>
          <div class="checkbox-option ${data.filingStatus === 'married_filing_jointly' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">Married filing jointly or Qualifying surviving spouse</span>
          </div>
          <div class="checkbox-option ${data.filingStatus === 'head_of_household' ? 'checked' : ''}">
            <span class="checkbox">☐</span>
            <span class="option-text">Head of household</span>
          </div>
        </div>
      </div>
    `;

    // Step 2: Multiple Jobs
    html += `
      <div class="form-section">
        <h2>Step 2: Multiple Jobs or Spouse Works</h2>
        <p class="section-note">Complete this step if you (1) hold more than one job at a time, or (2) are married filing jointly and your spouse also works.</p>
        
        <div class="checkbox-option ${data.multipleJobsSpouseWorks ? 'checked' : ''}">
          <span class="checkbox">☐</span>
          <span class="option-text">Complete this step if it applies. Otherwise, skip to Step 3.</span>
        </div>
      </div>
    `;

    // Step 3: Dependents
    html += `
      <div class="form-section">
        <h2>Step 3: Claim Dependents</h2>
        <p class="section-note">If your total income will be $200,000 or less ($400,000 or less if married filing jointly):</p>
        
        <div class="form-row">
          <div class="form-field">
            <label>Qualifying children under age 17 × $2,000</label>
            <div class="field-value">$${data.qualifyingChildren || '0'}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Other dependents × $500</label>
            <div class="field-value">$${data.otherDependents || '0'}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Total</label>
            <div class="field-value total-amount">$${data.totalDependentAmount || '0'}</div>
          </div>
        </div>
      </div>
    `;

    // Step 4: Other Adjustments
    html += `
      <div class="form-section">
        <h2>Step 4: Other Adjustments</h2>
        
        <div class="form-row">
          <div class="form-field">
            <label>4(a) Other income (not from jobs)</label>
            <div class="field-value">$${data.otherIncome || '0'}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>4(b) Deductions</label>
            <div class="field-value">$${data.deductions || '0'}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>4(c) Extra withholding</label>
            <div class="field-value">$${data.extraWithholding || '0'}</div>
          </div>
        </div>
      </div>
    `;

    // Step 5: Signature
    html += `
      <div class="form-section">
        <h2>Step 5: Sign Here</h2>
        <p class="section-note">Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.</p>
        
        <div class="signature-section">
          <div class="form-row">
            <div class="form-field">
              <label>Employee's signature</label>
              <div class="signature-line">${data.employeeSignature ? '[Signed]' : ''}</div>
            </div>
            <div class="form-field">
              <label>Date</label>
              <div class="field-value">${data.signatureDate || ''}</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Employer Information
    html += `
      <div class="form-section employer-section">
        <h2>For Employer Use Only</h2>
        
        <div class="form-row">
          <div class="form-field">
            <label>Employer's name and address</label>
            <div class="field-value">${data.employerName || ''}<br>${data.employerAddress || ''}</div>
          </div>
        </div>

        <div class="form-row">
          <div class="form-field">
            <label>Employer identification number (EIN)</label>
            <div class="field-value">${data.employerEIN || ''}</div>
          </div>
          <div class="form-field">
            <label>First date of employment</label>
            <div class="field-value">${data.firstDateOfEmployment || ''}</div>
          </div>
        </div>
      </div>
    `;

    html += '</div>';
    return html;
  }

  /**
   * Generate generic form content for other form types
   */
  private generateGenericFormContent(formData: FormData, template: FormTemplate): string {
    let html = '<div class="form-content generic-form">';

    for (const section of template.sections) {
      html += `
        <div class="form-section">
          <h2>${section.title}</h2>
          ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
      `;

      for (const field of section.fields) {
        const value = formData.data[field.name] || '';
        
        html += `
          <div class="form-field">
            <label>${field.label}${field.required ? ' *' : ''}</label>
            <div class="field-value">${this.formatFieldValue(field.type, value)}</div>
          </div>
        `;
      }

      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  /**
   * Format field value based on field type
   */
  private formatFieldValue(fieldType: string, value: any): string {
    if (!value) return '';

    switch (fieldType) {
      case 'checkbox':
        return value ? '☑' : '☐';
      case 'radio':
        return value;
      case 'date':
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      case 'number':
        return Number(value).toLocaleString();
      default:
        return String(value);
    }
  }

  /**
   * Format SSN for display
   */
  private formatSSN(ssn?: string): string {
    if (!ssn) return '';
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  }

  /**
   * Get CSS styles for the form
   */
  private getFormStyles(watermark?: string): string {
    return `
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        font-family: Arial, sans-serif;
        font-size: 12px;
        line-height: 1.4;
        color: #000;
        background: white;
        ${watermark ? 'position: relative;' : ''}
      }

      ${watermark ? `
        .watermark {
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 72px;
          color: rgba(0, 0, 0, 0.1);
          z-index: -1;
          pointer-events: none;
        }
      ` : ''}

      .form-header {
        text-align: center;
        margin-bottom: 30px;
        border-bottom: 2px solid #000;
        padding-bottom: 20px;
      }

      .form-header h1 {
        font-size: 18px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .form-description {
        font-size: 14px;
        margin-bottom: 10px;
      }

      .instructions {
        font-size: 11px;
        font-style: italic;
        color: #666;
      }

      .form-section {
        margin-bottom: 25px;
        page-break-inside: avoid;
      }

      .form-section h2 {
        font-size: 14px;
        font-weight: bold;
        margin-bottom: 15px;
        background: #f0f0f0;
        padding: 8px;
        border: 1px solid #ccc;
      }

      .form-section h3 {
        font-size: 12px;
        font-weight: bold;
        margin-bottom: 10px;
      }

      .form-section h4 {
        font-size: 11px;
        font-weight: bold;
        margin-bottom: 8px;
      }

      .section-note {
        font-size: 10px;
        color: #666;
        margin-bottom: 15px;
        font-style: italic;
      }

      .form-row {
        display: flex;
        margin-bottom: 15px;
        gap: 15px;
      }

      .form-field {
        flex: 1;
        min-width: 0;
      }

      .form-field.full-width {
        flex: 100%;
      }

      .form-field label {
        display: block;
        font-size: 10px;
        font-weight: bold;
        margin-bottom: 3px;
        color: #333;
      }

      .field-value {
        border-bottom: 1px solid #000;
        min-height: 20px;
        padding: 2px 5px;
        font-size: 11px;
      }

      .signature-line {
        border-bottom: 1px solid #000;
        min-height: 30px;
        padding: 2px 5px;
        text-align: center;
        font-style: italic;
      }

      .signature-section {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ccc;
      }

      .checkbox-option {
        display: flex;
        align-items: center;
        margin-bottom: 8px;
        font-size: 11px;
      }

      .checkbox-option.checked .checkbox {
        color: #000;
      }

      .checkbox {
        font-size: 14px;
        margin-right: 8px;
        width: 15px;
        text-align: center;
      }

      .option-text {
        flex: 1;
      }

      .citizenship-options {
        margin: 15px 0;
      }

      .filing-status {
        margin: 15px 0;
      }

      .document-verification {
        border: 1px solid #ccc;
        padding: 15px;
        margin: 15px 0;
      }

      .document-entry {
        margin-bottom: 15px;
        padding-bottom: 15px;
        border-bottom: 1px solid #eee;
      }

      .document-entry:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }

      .total-amount {
        font-weight: bold;
        background: #f9f9f9;
      }

      .employer-section {
        background: #f9f9f9;
        padding: 15px;
        border: 1px solid #ccc;
      }

      .form-footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #ccc;
        font-size: 10px;
        color: #666;
      }

      .legal-notice {
        margin-bottom: 10px;
        font-style: italic;
      }

      .generation-info {
        text-align: right;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
        }
        
        .form-section {
          page-break-inside: avoid;
        }
      }
    `;
  }
}