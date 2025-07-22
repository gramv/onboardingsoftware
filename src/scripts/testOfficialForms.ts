#!/usr/bin/env node

/**
 * Test Official Forms Generation
 * 
 * This script generates sample W-4 and I-9 forms with test data
 * to demonstrate the official 2025 form generation capability.
 */

import { FormGenerationService } from '../services/forms/formGenerationService';
import { FormData, I9FormData, W4FormData } from '../types/forms';
import path from 'path';
import fs from 'fs/promises';

async function generateSampleI9(): Promise<void> {
  console.log('📋 Generating Sample I-9 Form...');
  
  const sampleI9Data: Partial<I9FormData> = {
    // Employee Information (Section 1)
    lastName: 'Johnson',
    firstName: 'Alice',
    middleInitial: 'M',
    otherLastNames: '',
    address: '123 Main Street',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90210',
    dateOfBirth: '01/15/1990',
    ssnNumber: '123456789',
    email: 'alice.johnson@email.com',
    phone: '5551234567',
    
    // Citizenship Status
    citizenshipStatus: 'us_citizen',
    
    // Employee Attestation
    employeeSignatureDate: '01/20/2025',
    
    // Section 2 - Document Verification
    documentTitle1: 'Driver\'s License',
    issuingAuthority1: 'California DMV',
    documentNumber1: 'D1234567',
    expirationDate1: '01/15/2030',
    
    // Employment Information
    firstDayOfEmployment: '01/22/2025',
    employerSignatureDate: '01/22/2025',
    employerName: 'John Manager, HR Director',
    employerBusinessName: 'Downtown Motel',
    employerAddress: '456 Main St, Los Angeles, CA 90211'
  };

  const formData: FormData = {
    formId: 'test-i9-001',
    employeeId: 'EMP001',
    formType: 'i9',
    language: 'en',
    data: sampleI9Data,
    status: 'completed',
    version: '01/20/25'
  };

  const formService = new FormGenerationService();
  const outputPath = path.join(process.cwd(), 'storage', 'test-forms', 'sample-i9-alice-johnson.pdf');
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  try {
    await formService.generateFormDocument(formData, outputPath);
    console.log(`✅ I-9 Form generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ I-9 Generation failed:`, error.message);
  }
}

async function generateSampleW4(): Promise<void> {
  console.log('📋 Generating Sample W-4 Form...');
  
  const sampleW4Data: Partial<W4FormData> = {
    // Personal Information
    firstName: 'Carlos',
    middleInitial: 'R',
    lastName: 'Martinez',
    address: '789 Worker Ave, Airport City, CA 90212',
    ssnNumber: '987654321',
    
    // Filing Status
    filingStatus: 'single',
    
    // Multiple Jobs or Spouse Works
    multipleJobsSpouseWorks: false,
    
    // Dependents
    qualifyingChildren: 0,
    otherDependents: 0,
    totalDependentAmount: 0,
    
    // Other Adjustments
    otherIncome: 0,
    deductions: 0,
    extraWithholding: 0,
    
    // Signature
    signatureDate: '01/20/2025',
    
    // Employer Information
    employerName: 'Airport Motel',
    employerAddress: '789 Airport Way',
    employerCity: 'Airport City',
    employerState: 'CA',
    employerZipCode: '90212',
    employerEIN: '12-3456789',
    firstDateOfEmployment: '01/22/2025'
  };

  const formData: FormData = {
    formId: 'test-w4-001',
    employeeId: 'EMP002',
    formType: 'w4',
    language: 'en',
    data: sampleW4Data,
    status: 'completed',
    version: '2025'
  };

  const formService = new FormGenerationService();
  const outputPath = path.join(process.cwd(), 'storage', 'test-forms', 'sample-w4-carlos-martinez.pdf');
  
  // Ensure output directory exists
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  
  try {
    await formService.generateFormDocument(formData, outputPath);
    console.log(`✅ W-4 Form generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ W-4 Generation failed:`, error.message);
  }
}

async function generateSpanishI9(): Promise<void> {
  console.log('📋 Generating Spanish I-9 Form...');
  
  const sampleI9DataES: Partial<I9FormData> = {
    lastName: 'Rodriguez',
    firstName: 'Maria',
    middleInitial: 'C',
    address: '321 Spanish Ave',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90213',
    dateOfBirth: '03/10/1985',
    ssnNumber: '555443333',
    email: 'maria.rodriguez@email.com',
    phone: '5559876543',
    citizenshipStatus: 'us_citizen',
    employeeSignatureDate: '01/20/2025',
    documentTitle1: 'Licencia de Conducir',
    issuingAuthority1: 'DMV de California',
    documentNumber1: 'D9876543',
    expirationDate1: '03/10/2030',
    firstDayOfEmployment: '01/22/2025',
    employerSignatureDate: '01/22/2025',
    employerName: 'Manager Rodriguez, Director de RRHH',
    employerBusinessName: 'Motel del Aeropuerto',
    employerAddress: '789 Airport Way, Airport City, CA 90212'
  };

  const formData: FormData = {
    formId: 'test-i9-es-001',
    employeeId: 'EMP002',
    formType: 'i9',
    language: 'es',
    data: sampleI9DataES,
    status: 'completed',
    version: '01/20/25'
  };

  const formService = new FormGenerationService();
  const outputPath = path.join(process.cwd(), 'storage', 'test-forms', 'sample-i9-maria-rodriguez-spanish.pdf');
  
  try {
    await formService.generateFormDocument(formData, outputPath);
    console.log(`✅ Spanish I-9 Form generated: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Spanish I-9 Generation failed:`, error.message);
  }
}

async function main() {
  console.log('🏛️  Official Forms Test Generation');
  console.log('==================================');
  console.log('');
  
  // Set environment to use official forms
  process.env.FORM_GENERATION_MODE = 'official';
  
  try {
    // Generate sample forms
    await generateSampleI9();
    console.log('');
    
    await generateSampleW4();
    console.log('');
    
    await generateSpanishI9();
    console.log('');
    
    console.log('🎉 All test forms generated successfully!');
    console.log('');
    console.log('📁 Generated Files:');
    console.log('   • storage/test-forms/sample-i9-alice-johnson.pdf');
    console.log('   • storage/test-forms/sample-w4-carlos-martinez.pdf');  
    console.log('   • storage/test-forms/sample-i9-maria-rodriguez-spanish.pdf');
    console.log('');
    console.log('💡 These are official 2025 government forms filled with sample data.');
    console.log('   Review the PDFs to see the actual field mapping results.');
    
  } catch (error) {
    console.error('❌ Test generation failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as testOfficialForms };