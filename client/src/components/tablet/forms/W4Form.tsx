import React, { useState, useEffect, useCallback } from 'react';
import { FormData, W4FormData, FormValidationResult } from '../../../types/forms';

interface W4FormProps {
  language: 'en' | 'es';
  highContrastMode: boolean;
  largeTextMode: boolean;
  voiceGuidanceEnabled: boolean;
  employeeId: string;
  ocrData?: Record<string, any>;
  initialData?: Partial<FormData>;
  onComplete: (formData: Partial<FormData>) => void;
  onBack: () => void;
}

interface W4FormState {
  data: Partial<W4FormData>;
  validation: FormValidationResult;
  currentStep: number;
  taxCalculations: {
    estimatedWithholding: number;
    dependentAmount: number;
    adjustments: number;
  };
  showCalculator: boolean;
  hasChanges: boolean;
}

export const W4Form: React.FC<W4FormProps> = ({
  language,
  highContrastMode,
  largeTextMode,
  voiceGuidanceEnabled,
  employeeId,
  ocrData,
  initialData,
  onComplete,
  onBack
}) => {
  const [state, setState] = useState<W4FormState>({
    data: {
      dependents: [],
      qualifyingChildren: 0,
      otherDependents: 0,
      totalDependentAmount: 0,
      otherIncome: 0,
      deductions: 0,
      extraWithholding: 0
    },
    validation: {
      isValid: false,
      errors: {},
      warnings: {},
      completionPercentage: 0,
      requiredFieldsMissing: []
    },
    currentStep: 1,
    taxCalculations: {
      estimatedWithholding: 0,
      dependentAmount: 0,
      adjustments: 0
    },
    showCalculator: false,
    hasChanges: false
  });

  const t = {
    en: {
      title: 'Form W-4: Employee\'s Withholding Certificate',
      subtitle: 'Complete your tax withholding information',
      step1: 'Step 1: Personal Information',
      step2: 'Step 2: Multiple Jobs or Spouse Works',
      step3: 'Step 3: Claim Dependents',
      step4: 'Step 4: Other Adjustments',
      step5: 'Step 5: Sign Here',
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      middleInitial: 'Middle Initial',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      ssnNumber: 'Social Security Number',
      filingStatus: 'Filing Status',
      single: 'Single or Married filing separately',
      marriedJointly: 'Married filing jointly',
      marriedSeparately: 'Married filing separately',
      headOfHousehold: 'Head of household',
      multipleJobs: 'Multiple Jobs or Spouse Works',
      multipleJobsHelp: 'Complete this section if you hold more than one job at a time, or if you\'re married filing jointly and your spouse also works.',
      useEstimator: 'Use the online estimator at www.irs.gov/W4App',
      dependents: 'Dependents',
      dependentsHelp: 'If your total income will be $200,000 or less ($400,000 or less if married filing jointly):',
      qualifyingChildren: 'Qualifying children under age 17',
      qualifyingChildrenAmount: 'Multiply by $2,000',
      otherDependents: 'Other dependents',
      otherDependentsAmount: 'Multiply by $500',
      totalDependentAmount: 'Total dependent amount',
      otherAdjustments: 'Other Adjustments',
      otherIncome: 'Other income (not from jobs)',
      deductions: 'Deductions',
      extraWithholding: 'Extra withholding',
      taxCalculator: 'Tax Calculator',
      showCalculator: 'Show Tax Calculator',
      hideCalculator: 'Hide Tax Calculator',
      estimatedWithholding: 'Estimated Annual Withholding',
      calculatorHelp: 'This calculator helps estimate your tax withholding based on your entries.',
      addDependent: 'Add Dependent',
      removeDependent: 'Remove',
      dependentName: 'Dependent Name',
      dependentSSN: 'SSN or ITIN',
      relationship: 'Relationship',
      qualifyingChild: 'Qualifying Child (under 17)',
      qualifyingRelative: 'Qualifying Relative',
      required: 'Required',
      optional: 'Optional',
      next: 'Next Step',
      back: 'Back',
      previous: 'Previous Step',
      complete: 'Complete Form',
      saving: 'Saving...',
      validationError: 'Please fix the errors highlighted in red',
      fieldError: 'This field is required',
      invalidFormat: 'Invalid format',
      ssnFormat: 'Format: XXX-XX-XXXX',
      zipFormat: 'Format: XXXXX or XXXXX-XXXX',
      numberFormat: 'Enter a valid number',
      helpText: 'Help & Explanations',
      filingStatusHelp: 'Choose the filing status you expect to use when you file your tax return.',
      dependentsExplanation: 'Dependents can reduce your tax liability. Enter information for all qualifying dependents.',
      witholdingExplanation: 'Additional withholding can help ensure you don\'t owe taxes at year-end.'
    },
    es: {
      title: 'Formulario W-4: Certificado de Retenciones del Empleado',
      subtitle: 'Complete su información de retención de impuestos',
      step1: 'Paso 1: Información Personal',
      step2: 'Paso 2: Múltiples Trabajos o Cónyuge Trabaja',
      step3: 'Paso 3: Reclamar Dependientes',
      step4: 'Paso 4: Otros Ajustes',
      step5: 'Paso 5: Firme Aquí',
      personalInfo: 'Información Personal',
      firstName: 'Nombre',
      lastName: 'Apellido',
      middleInitial: 'Inicial del Segundo Nombre',
      address: 'Dirección',
      city: 'Ciudad',
      state: 'Estado',
      zipCode: 'Código Postal',
      ssnNumber: 'Número de Seguro Social',
      filingStatus: 'Estado Civil para Efectos Fiscales',
      single: 'Soltero o Casado presentando por separado',
      marriedJointly: 'Casado presentando conjuntamente',
      marriedSeparately: 'Casado presentando por separado',
      headOfHousehold: 'Cabeza de familia',
      multipleJobs: 'Múltiples Trabajos o Cónyuge Trabaja',
      multipleJobsHelp: 'Complete esta sección si tiene más de un trabajo a la vez, o si está casado presentando conjuntamente y su cónyuge también trabaja.',
      useEstimator: 'Use el estimador en línea en www.irs.gov/W4App',
      dependents: 'Dependientes',
      dependentsHelp: 'Si su ingreso total será de $200,000 o menos ($400,000 o menos si está casado presentando conjuntamente):',
      qualifyingChildren: 'Hijos calificados menores de 17 años',
      qualifyingChildrenAmount: 'Multiplique por $2,000',
      otherDependents: 'Otros dependientes',
      otherDependentsAmount: 'Multiplique por $500',
      totalDependentAmount: 'Cantidad total de dependientes',
      otherAdjustments: 'Otros Ajustes',
      otherIncome: 'Otros ingresos (no de trabajos)',
      deductions: 'Deducciones',
      extraWithholding: 'Retención adicional',
      taxCalculator: 'Calculadora de Impuestos',
      showCalculator: 'Mostrar Calculadora de Impuestos',
      hideCalculator: 'Ocultar Calculadora de Impuestos',
      estimatedWithholding: 'Retención Anual Estimada',
      calculatorHelp: 'Esta calculadora ayuda a estimar su retención de impuestos basada en sus entradas.',
      addDependent: 'Agregar Dependiente',
      removeDependent: 'Eliminar',
      dependentName: 'Nombre del Dependiente',
      dependentSSN: 'SSN o ITIN',
      relationship: 'Relación',
      qualifyingChild: 'Hijo Calificado (menor de 17)',
      qualifyingRelative: 'Pariente Calificado',
      required: 'Requerido',
      optional: 'Opcional',
      next: 'Siguiente Paso',
      back: 'Atrás',
      previous: 'Paso Anterior',
      complete: 'Completar Formulario',
      saving: 'Guardando...',
      validationError: 'Por favor corrija los errores resaltados en rojo',
      fieldError: 'Este campo es requerido',
      invalidFormat: 'Formato inválido',
      ssnFormat: 'Formato: XXX-XX-XXXX',
      zipFormat: 'Formato: XXXXX o XXXXX-XXXX',
      numberFormat: 'Ingrese un número válido',
      helpText: 'Ayuda y Explicaciones',
      filingStatusHelp: 'Elija el estado civil que espera usar cuando presente su declaración de impuestos.',
      dependentsExplanation: 'Los dependientes pueden reducir su responsabilidad fiscal. Ingrese información para todos los dependientes calificados.',
      witholdingExplanation: 'La retención adicional puede ayudar a asegurar que no deba impuestos al final del año.'
    }
  };

  const currentT = t[language];

  // Enhanced auto-populate fields from OCR data
  useEffect(() => {
    if (ocrData && Object.keys(state.data).length <= 2) { // Only has default values
      const autoFilledData: Partial<W4FormData> = { ...state.data };

      // Enhanced field mapping with validation
      const mapOCRValue = (key: string, value: any): string => {
        if (!value) return '';
        
        // Handle names - capitalize properly
        if (key.includes('name')) {
          return String(value).replace(/\b\w/g, (l) => l.toUpperCase());
        }
        
        // Handle SSN formatting
        if (key.includes('ssn') || key.includes('social')) {
          const ssnStr = String(value).replace(/\D/g, '');
          if (ssnStr.length === 9) return `${ssnStr.slice(0,3)}-${ssnStr.slice(3,5)}-${ssnStr.slice(5)}`;
          return ssnStr;
        }
        
        // Handle address components
        if (key.includes('address') || key.includes('street')) {
          return String(value).replace(/\b\w/g, (l) => l.toUpperCase());
        }
        
        // Handle state codes
        if (key.includes('state')) {
          const stateMap: Record<string, string> = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
            'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
            'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
            'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO'
          };
          
          const stateLower = String(value).toLowerCase();
          return stateMap[stateLower] || String(value).toUpperCase();
        }
        
        // Handle ZIP codes
        if (key.includes('zip') || key.includes('postal')) {
          const zipStr = String(value).replace(/\D/g, '');
          if (zipStr.length === 5) return zipStr;
          if (zipStr.length === 9) return `${zipStr.slice(0,5)}-${zipStr.slice(5)}`;
          return zipStr;
        }
        
        return String(value).trim();
      };

      // Enhanced field mapping
      const ocrEntries = Object.entries(ocrData);
      const mappings = {
        firstName: ['firstName', 'first_name', 'given_name', 'nombre', 'fname'],
        lastName: ['lastName', 'last_name', 'surname', 'family_name', 'apellido', 'lname'],
        address: ['address', 'street_address', 'direccion', 'street', 'addr'],
        city: ['city', 'ciudad', 'town', 'municipio'],
        state: ['state', 'province', 'estado', 'region'],
        zipCode: ['zipCode', 'zip_code', 'postal_code', 'zip', 'codigo_postal'],
        ssnNumber: ['ssnNumber', 'ssn', 'social_security', 'social_security_number', 'seguro_social']
      };

      Object.entries(mappings).forEach(([targetField, possibleKeys]) => {
        for (const key of possibleKeys) {
          const matchedEntry = ocrEntries.find(([ocrKey, ocrValue]) => 
            ocrKey.toLowerCase().includes(key.toLowerCase()) && ocrValue
          );
          
          if (matchedEntry) {
            const [_, value] = matchedEntry;
            const mappedValue = mapOCRValue(targetField, value);
            if (mappedValue && mappedValue.trim()) {
              autoFilledData[targetField as keyof W4FormData] = mappedValue;
              break;
            }
          }
        }
      });

      setState(prev => ({
        ...prev,
        data: autoFilledData
      }));
    }
  }, [ocrData]);

  // Load initial data
  useEffect(() => {
    if (initialData?.data) {
      setState(prev => ({
        ...prev,
        data: { ...prev.data, ...(initialData.data as Partial<W4FormData>) }
      }));
    }
  }, [initialData]);

  // Calculate tax withholding estimates
  useEffect(() => {
    const dependentAmount = (state.data.qualifyingChildren || 0) * 2000 + (state.data.otherDependents || 0) * 500;
    const adjustments = (state.data.otherIncome || 0) - (state.data.deductions || 0) + (state.data.extraWithholding || 0);
    
    // Simplified withholding calculation (actual calculation is much more complex)
    const estimatedWithholding = Math.max(0, adjustments - dependentAmount);

    setState(prev => ({
      ...prev,
      data: { ...prev.data, totalDependentAmount: dependentAmount },
      taxCalculations: {
        estimatedWithholding,
        dependentAmount,
        adjustments
      }
    }));
  }, [state.data.qualifyingChildren, state.data.otherDependents, state.data.otherIncome, state.data.deductions, state.data.extraWithholding]);

  const requiredFields = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'ssnNumber', 'filingStatus'];

  const validateField = useCallback((fieldName: string, value: any): string | null => {
    if (!value && requiredFields.includes(fieldName)) {
      return currentT.fieldError;
    }

    switch (fieldName) {
      case 'ssnNumber':
        if (value && !/^\d{3}-?\d{2}-?\d{4}$/.test(value)) {
          return currentT.invalidFormat;
        }
        break;
      case 'zipCode':
        if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
          return currentT.invalidFormat;
        }
        break;
      case 'qualifyingChildren':
      case 'otherDependents':
      case 'otherIncome':
      case 'deductions':
      case 'extraWithholding':
        if (value && (isNaN(value) || value < 0)) {
          return currentT.numberFormat;
        }
        break;
    }

    return null;
  }, [currentT]);

  const handleFieldChange = useCallback((fieldName: string, value: any) => {
    setState(prev => {
      const newData = { ...prev.data, [fieldName]: value };
      const error = validateField(fieldName, value);
      const newErrors = { ...prev.validation.errors };
      
      if (error) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }

      // Calculate completion percentage
      const filledRequired = requiredFields.filter(field => newData[field as keyof W4FormData]).length;
      const completionPercentage = (filledRequired / requiredFields.length) * 100;

      return {
        ...prev,
        data: newData,
        hasChanges: true,
        validation: {
          ...prev.validation,
          errors: newErrors,
          isValid: Object.keys(newErrors).length === 0 && filledRequired === requiredFields.length,
          completionPercentage,
          requiredFieldsMissing: requiredFields.filter(field => !newData[field as keyof W4FormData])
        }
      };
    });
  }, [validateField, requiredFields]);

  const formatSSN = (value: string): string => {
    const digits = value.replace(/\D/g, '');
    if (digits.length >= 9) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5, 9)}`;
    } else if (digits.length >= 5) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 5)}-${digits.slice(5)}`;
    } else if (digits.length >= 3) {
      return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    }
    return digits;
  };

  const addDependent = useCallback(() => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        dependents: [
          ...(prev.data.dependents || []),
          {
            name: '',
            ssnOrItin: '',
            relationship: '',
            qualifyingChild: false,
            qualifyingRelative: false
          }
        ]
      }
    }));
  }, []);

  const removeDependent = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        dependents: prev.data.dependents?.filter((_, i) => i !== index) || []
      }
    }));
  }, []);

  const updateDependent = useCallback((index: number, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      data: {
        ...prev.data,
        dependents: prev.data.dependents?.map((dep, i) => 
          i === index ? { ...dep, [field]: value } : dep
        ) || []
      }
    }));
  }, []);

  const handleNext = useCallback(() => {
    if (state.currentStep < 5) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
    } else if (state.validation.isValid) {
      const formData: Partial<FormData> = {
        formId: `w4-${employeeId}-${Date.now()}`,
        employeeId,
        formType: 'w4',
        language,
        data: state.data,
        status: 'completed',
        version: '1.0'
      };
      onComplete(formData);
    }
  }, [state.currentStep, state.validation.isValid, state.data, employeeId, language, onComplete]);

  const handlePrevious = useCallback(() => {
    if (state.currentStep > 1) {
      setState(prev => ({ ...prev, currentStep: prev.currentStep - 1 }));
    } else {
      onBack();
    }
  }, [state.currentStep, onBack]);

  const renderField = (
    fieldName: keyof W4FormData,
    label: string,
    type: 'text' | 'number' | 'select' | 'radio' = 'text',
    options?: { value: string; label: string }[],
    required: boolean = true,
    placeholder?: string,
    helpText?: string
  ) => {
    const value = state.data[fieldName] || '';
    const error = state.validation.errors[fieldName];

    return (
      <div className="mb-6">
        <label className={`block font-medium mb-2 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {!required && <span className={`ml-2 text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-500'}`}>({currentT.optional})</span>}
        </label>

        {helpText && (
          <p className={`mb-3 text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-600'} italic`}>
            {helpText}
          </p>
        )}

        {type === 'text' && (
          <input
            type="text"
            value={value}
            onChange={(e) => {
              let newValue = e.target.value;
              if (fieldName === 'ssnNumber') {
                newValue = formatSSN(newValue);
              }
              handleFieldChange(fieldName, newValue);
            }}
            placeholder={placeholder}
            className={`w-full px-4 py-3 border rounded-lg ${largeTextMode ? 'text-lg' : 'text-base'} ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : highContrastMode 
                  ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-400' 
                  : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
        )}

        {type === 'number' && (
          <input
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(fieldName, parseFloat(e.target.value) || 0)}
            placeholder={placeholder}
            min="0"
            step="1"
            className={`w-full px-4 py-3 border rounded-lg ${largeTextMode ? 'text-lg' : 'text-base'} ${
              error 
                ? 'border-red-500 focus:border-red-500' 
                : highContrastMode 
                  ? 'border-gray-600 bg-gray-800 text-white focus:border-blue-400' 
                  : 'border-gray-300 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
          />
        )}

        {type === 'radio' && options && (
          <div className="space-y-3">
            {options.map((option) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="radio"
                  name={fieldName}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )}

        {error && (
          <p className={`mt-2 text-red-500 ${largeTextMode ? 'text-base' : 'text-sm'}`}>
            {error}
            {fieldName === 'ssnNumber' && ` (${currentT.ssnFormat})`}
            {fieldName === 'zipCode' && ` (${currentT.zipFormat})`}
          </p>
        )}
      </div>
    );
  };

  const renderTaxCalculator = () => (
    <div className={`mt-6 p-4 ${highContrastMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg border`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
          {currentT.taxCalculator}
        </h4>
        <button
          type="button"
          onClick={() => setState(prev => ({ ...prev, showCalculator: !prev.showCalculator }))}
          className={`text-sm ${highContrastMode ? 'text-blue-400' : 'text-blue-600'} hover:underline`}
        >
          {state.showCalculator ? currentT.hideCalculator : currentT.showCalculator}
        </button>
      </div>

      {state.showCalculator && (
        <div className="space-y-3">
          <p className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentT.calculatorHelp}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className={`block text-sm font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentT.totalDependentAmount}
              </span>
              <span className={`text-lg font-bold ${highContrastMode ? 'text-green-400' : 'text-green-600'}`}>
                ${state.taxCalculations.dependentAmount.toLocaleString()}
              </span>
            </div>
            
            <div>
              <span className={`block text-sm font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {currentT.estimatedWithholding}
              </span>
              <span className={`text-lg font-bold ${highContrastMode ? 'text-blue-400' : 'text-blue-600'}`}>
                ${state.taxCalculations.estimatedWithholding.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 1:
        return (
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              {currentT.step1}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {renderField('firstName', currentT.firstName, 'text', undefined, true)}
              {renderField('lastName', currentT.lastName, 'text', undefined, true)}
              {renderField('middleInitial', currentT.middleInitial, 'text', undefined, false)}
            </div>

            {renderField('address', currentT.address, 'text', undefined, true)}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderField('city', currentT.city, 'text', undefined, true)}
              {renderField('state', currentT.state, 'text', undefined, true)}
              {renderField('zipCode', currentT.zipCode, 'text', undefined, true)}
            </div>

            {renderField('ssnNumber', currentT.ssnNumber, 'text', undefined, true, 'XXX-XX-XXXX')}

            {renderField('filingStatus', currentT.filingStatus, 'radio', [
              { value: 'single', label: currentT.single },
              { value: 'married_filing_jointly', label: currentT.marriedJointly },
              { value: 'married_filing_separately', label: currentT.marriedSeparately },
              { value: 'head_of_household', label: currentT.headOfHousehold }
            ], true, undefined, currentT.filingStatusHelp)}
          </div>
        );

      case 2:
        return (
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              {currentT.step2}
            </h3>
            
            <p className={`mb-6 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.multipleJobsHelp}
            </p>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.data.multipleJobsSpouseWorks || false}
                  onChange={(e) => handleFieldChange('multipleJobsSpouseWorks', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentT.multipleJobs}
                </span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={state.data.useEstimator || false}
                  onChange={(e) => handleFieldChange('useEstimator', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                />
                <span className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentT.useEstimator}
                </span>
              </label>
            </div>
          </div>
        );

      case 3:
        return (
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              {currentT.step3}
            </h3>
            
            <p className={`mb-6 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.dependentsHelp}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                {renderField('qualifyingChildren', currentT.qualifyingChildren, 'number', undefined, false, '0', currentT.qualifyingChildrenAmount)}
                <p className={`text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  × $2,000 = ${((state.data.qualifyingChildren || 0) * 2000).toLocaleString()}
                </p>
              </div>

              <div>
                {renderField('otherDependents', currentT.otherDependents, 'number', undefined, false, '0', currentT.otherDependentsAmount)}
                <p className={`text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                  × $500 = ${((state.data.otherDependents || 0) * 500).toLocaleString()}
                </p>
              </div>
            </div>

            <div className={`mt-6 p-4 ${highContrastMode ? 'bg-gray-700' : 'bg-green-50'} rounded-lg`}>
              <p className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                {currentT.totalDependentAmount}: ${state.taxCalculations.dependentAmount.toLocaleString()}
              </p>
            </div>

            {/* Dependent details */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h4 className={`font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                  {currentT.dependents}
                </h4>
                <button
                  type="button"
                  onClick={addDependent}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors ${largeTextMode ? 'text-base' : 'text-sm'}`}
                >
                  {currentT.addDependent}
                </button>
              </div>

              {state.data.dependents?.map((dependent, index) => (
                <div key={index} className={`mb-6 p-4 border rounded-lg ${highContrastMode ? 'border-gray-600 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="flex justify-between items-center mb-4">
                    <h5 className={`font-medium ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                      Dependent {index + 1}
                    </h5>
                    <button
                      type="button"
                      onClick={() => removeDependent(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      {currentT.removeDependent}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder={currentT.dependentName}
                      value={dependent.name}
                      onChange={(e) => updateDependent(index, 'name', e.target.value)}
                      className={`px-3 py-2 border rounded ${highContrastMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                    />
                    <input
                      type="text"
                      placeholder={currentT.dependentSSN}
                      value={dependent.ssnOrItin}
                      onChange={(e) => updateDependent(index, 'ssnOrItin', formatSSN(e.target.value))}
                      className={`px-3 py-2 border rounded ${highContrastMode ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300'}`}
                    />
                  </div>

                  <div className="mt-4 space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dependent.qualifyingChild}
                        onChange={(e) => updateDependent(index, 'qualifyingChild', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentT.qualifyingChild}
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={dependent.qualifyingRelative}
                        onChange={(e) => updateDependent(index, 'qualifyingRelative', e.target.checked)}
                        className="mr-2 h-4 w-4 text-blue-600"
                      />
                      <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentT.qualifyingRelative}
                      </span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {renderTaxCalculator()}
          </div>
        );

      case 4:
        return (
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              {currentT.step4}
            </h3>

            <div className="space-y-6">
              {renderField('otherIncome', currentT.otherIncome, 'number', undefined, false, '0')}
              {renderField('deductions', currentT.deductions, 'number', undefined, false, '0')}
              {renderField('extraWithholding', currentT.extraWithholding, 'number', undefined, false, '0', currentT.witholdingExplanation)}
            </div>

            {renderTaxCalculator()}
          </div>
        );

      case 5:
        return (
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
              {currentT.step5}
            </h3>
            
            <div className={`p-6 ${highContrastMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg`}>
              <p className={`mb-4 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Review your information and proceed to digital signature.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Filing Status:</strong> {state.data.filingStatus}
                </div>
                <div>
                  <strong>Dependents:</strong> ${state.taxCalculations.dependentAmount.toLocaleString()}
                </div>
                <div>
                  <strong>Extra Withholding:</strong> ${(state.data.extraWithholding || 0).toLocaleString()}
                </div>
                <div>
                  <strong>Estimated Annual Withholding:</strong> ${state.taxCalculations.estimatedWithholding.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`${highContrastMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="mb-8">
        <h2 className={`font-bold ${largeTextMode ? 'text-2xl' : 'text-xl'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          {currentT.title}
        </h2>
        <p className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {currentT.subtitle}
        </p>
      </div>

      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Step {state.currentStep} of 5
          </span>
          <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {Math.round(state.validation.completionPercentage)}% Complete
          </span>
        </div>
        <div className={`w-full ${highContrastMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(state.currentStep / 5) * 100}%` }}
          />
        </div>
      </div>

      {renderCurrentStep()}

      {/* Validation errors summary */}
      {Object.keys(state.validation.errors).length > 0 && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium mb-2">{currentT.validationError}</p>
          <ul className="text-red-700 text-sm space-y-1">
            {Object.entries(state.validation.errors).map(([field, error]) => (
              <li key={field}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={handlePrevious}
          className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            highContrastMode 
              ? 'text-white border-gray-600 hover:bg-gray-700' 
              : 'text-gray-700 hover:bg-gray-50'
          } transition-colors`}
        >
          {state.currentStep === 1 ? currentT.back : currentT.previous}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={state.currentStep === 5 && !state.validation.isValid}
          className={`px-6 py-3 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            (state.currentStep === 5 && !state.validation.isValid)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors`}
        >
          {state.currentStep === 5 ? currentT.complete : currentT.next}
        </button>
      </div>
    </div>
  );
};