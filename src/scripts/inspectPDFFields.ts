#!/usr/bin/env node

/**
 * PDF Form Field Inspector
 * 
 * This script inspects the downloaded official PDFs to discover
 * the actual field names and structure for accurate mapping.
 */

import { PDFDocument, PDFForm } from 'pdf-lib';
import fs from 'fs/promises';
import path from 'path';

async function inspectPDFFields(pdfPath: string, formName: string): Promise<void> {
  try {
    console.log(`\n📋 Inspecting ${formName} PDF Fields:`);
    console.log('='.repeat(50));

    const pdfBytes = await fs.readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    
    try {
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      console.log(`Found ${fields.length} form fields:`);
      console.log('');
      
      fields.forEach((field, index) => {
        const fieldName = field.getName();
        const fieldType = field.constructor.name;
        console.log(`${index + 1}. "${fieldName}" (${fieldType})`);
      });
      
      // Try to get text fields specifically
      const textFields = fields.filter(field => field.constructor.name === 'PDFTextField');
      const checkBoxes = fields.filter(field => field.constructor.name === 'PDFCheckBox');
      const radioGroups = fields.filter(field => field.constructor.name === 'PDFRadioGroup');
      
      console.log('');
      console.log(`📝 Text Fields: ${textFields.length}`);
      console.log(`☑️  Checkboxes: ${checkBoxes.length}`);
      console.log(`🔘 Radio Groups: ${radioGroups.length}`);
      
    } catch (formError) {
      console.log('❌ This PDF does not contain fillable form fields or uses unsupported format (XFA)');
      console.log('   XFA forms require Adobe Reader and cannot be filled programmatically with pdf-lib');
    }
    
  } catch (error) {
    console.error(`❌ Error inspecting ${formName}:`, error.message);
  }
}

async function main() {
  console.log('🔍 PDF Form Field Inspector');
  console.log('===========================');
  
  const formsDir = path.join(process.cwd(), 'storage', 'forms', 'official');
  
  const forms = [
    { file: 'i-9-01-20-25.pdf', name: 'I-9 Form' },
    { file: 'w-4-2025.pdf', name: 'W-4 Form' }
  ];
  
  for (const form of forms) {
    const pdfPath = path.join(formsDir, form.file);
    
    try {
      await fs.access(pdfPath);
      await inspectPDFFields(pdfPath, form.name);
    } catch (error) {
      console.log(`\n❌ ${form.name} not found at ${pdfPath}`);
      console.log('   Run "npm run forms:setup" first to download the forms');
    }
  }
  
  console.log('\n💡 Note: If forms show "no fillable fields" or XFA errors,');
  console.log('   the official PDFs may use Adobe XFA format which requires');
  console.log('   alternative approaches like PDF generation from templates.');
}

if (require.main === module) {
  main().catch(console.error);
}

export { main as inspectPDFFields };