#!/usr/bin/env node

/**
 * Setup Script for Official Government Forms
 * 
 * This script downloads the latest official I-9 and W-4 forms
 * from government websites and validates the PDF field mappings.
 * 
 * Run this script to ensure compliance with latest 2025 forms.
 */

import { FormGenerationService } from '../services/forms/formGenerationService';
import { OfficialFormService } from '../services/forms/officialFormService';

async function main() {
  console.log('🏛️  Official Government Forms Setup');
  console.log('=====================================');
  console.log('');

  const formService = new FormGenerationService();
  const officialFormService = new OfficialFormService();

  try {
    // Step 1: Download official forms
    console.log('📥 Step 1: Downloading official forms from government websites...');
    await formService.setupOfficialForms();
    console.log('');

    // Step 2: Validate form mappings
    console.log('🔍 Step 2: Validating form field mappings...');
    const validation = await formService.validateOfficialForms();
    
    console.log('');
    console.log('📋 Validation Results:');
    console.log(`   I-9 Form: ${validation.i9 ? '✅ Valid' : '❌ Issues Found'}`);
    console.log(`   W-4 Form: ${validation.w4 ? '✅ Valid' : '❌ Issues Found'}`);
    
    if (!validation.i9) {
      console.log('   I-9 Issues:', validation.details.i9.missingFields);
    }
    
    if (!validation.w4) {
      console.log('   W-4 Issues:', validation.details.w4.missingFields);
    }

    console.log('');
    console.log('📅 Available Form Versions:');
    validation.details.availableVersions.forEach((version: any) => {
      const status = version.isValid ? '✅ Current' : '⚠️  Expired';
      console.log(`   ${version.formType.toUpperCase()}: ${version.version} - ${status}`);
    });

    // Step 3: Environment check
    console.log('');
    console.log('⚙️  Step 3: Environment Configuration');
    const currentMode = process.env.FORM_GENERATION_MODE || 'legacy';
    console.log(`   Current Mode: ${currentMode}`);
    
    if (currentMode !== 'official') {
      console.log('');
      console.log('⚠️  IMPORTANT: Set FORM_GENERATION_MODE=official in your .env file');
      console.log('   to use the official 2025 compliant forms in production.');
    }

    // Step 4: Summary
    console.log('');
    console.log('📊 Setup Summary:');
    if (validation.i9 && validation.w4) {
      console.log('✅ All official forms are ready and validated');
      console.log('✅ Your application is now 2025 government form compliant');
      
      if (currentMode === 'official') {
        console.log('✅ Official form generation is ENABLED');
      } else {
        console.log('⚠️  Official form generation is DISABLED (legacy mode)');
      }
    } else {
      console.log('❌ Some forms have validation issues');
      console.log('   Please check the field mappings or contact support');
    }

    console.log('');
    console.log('🎉 Setup complete!');
    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('❌ Setup failed:', error.message);
    console.error('');
    console.error('Possible solutions:');
    console.error('1. Check your internet connection');
    console.error('2. Ensure storage/forms/official directory is writable');
    console.error('3. Verify government websites are accessible');
    console.error('4. Check firewall/proxy settings');
    
    process.exit(1);
  }
}

// Handle script execution
if (require.main === module) {
  main().catch(console.error);
}

export { main as setupOfficialForms };