import React, { useState, useEffect, useCallback } from 'react';
import { FormData, I9FormData, FormValidationResult } from '../../../types/forms';

interface I9FormProps {
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

interface I9FormState {
  data: Partial<I9FormData>;
  validation: FormValidationResult;
  currentSection: number;
  isAutoFilled: Record<string, boolean>;
  hasChanges: boolean;
}

export const I9Form: React.FC<I9FormProps> = ({
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
  const [state, setState] = useState<I9FormState>({
    data: {},
    validation: {
      isValid: false,
      errors: {},
      warnings: {},
      completionPercentage: 0,
      requiredFieldsMissing: []
    },
    currentSection: 1,
    isAutoFilled: {},
    hasChanges: false
  });

  const t = {
    en: {
      title: 'Form I-9: Employment Eligibility Verification',
      subtitle: 'Complete Section 1 - Employee Information and Attestation',
      section1: 'Section 1: Employee Information and Attestation',
      section2: 'Section 2: Document Review (Employer Use)',
      personalInfo: 'Personal Information',
      firstName: 'First Name (Given Name)',
      lastName: 'Last Name (Family Name)',
      middleInitial: 'Middle Initial',
      otherNames: 'Other Last Names Used',
      address: 'Address (Street Number and Name)',
      city: 'City or Town',
      state: 'State',
      zipCode: 'ZIP Code',
      dateOfBirth: 'Date of Birth (mm/dd/yyyy)',
      ssnNumber: 'Social Security Number',
      email: 'Email Address (Optional)',
      phone: 'Telephone Number (Optional)',
      citizenshipStatus: 'Citizenship/Immigration Status',
      usCitizen: 'A citizen of the United States',
      nonCitizenNational: 'A noncitizen national of the United States',
      lawfulPermanentResident: 'A lawful permanent resident',
      alienAuthorized: 'An alien authorized to work',
      alienNumber: 'Alien Registration Number/USCIS Number',
      i94Number: 'Form I-94 Admission Number',
      foreignPassport: 'Foreign Passport Number',
      countryOfIssuance: 'Country of Issuance',
      workAuthExpiration: 'Work Authorization Expiration Date',
      employeeAttestation: 'Employee Attestation',
      attestationText: 'I attest, under penalty of perjury, that I am (check one of the following boxes):',
      preparerSection: 'Preparer and/or Translator Certification',
      preparerUsed: 'Did you use a preparer or translator to help complete this form?',
      yes: 'Yes',
      no: 'No',
      autoFilled: 'Auto-filled from your documents',
      manualEntry: 'Please enter manually',
      required: 'Required',
      optional: 'Optional',
      next: 'Next Section',
      back: 'Back',
      complete: 'Complete Form',
      saving: 'Saving...',
      validationError: 'Please fix the errors highlighted in red',
      fieldError: 'This field is required',
      invalidFormat: 'Invalid format',
      ssnFormat: 'Format: XXX-XX-XXXX',
      dateFormat: 'Format: MM/DD/YYYY',
      zipFormat: 'Format: XXXXX or XXXXX-XXXX'
    },
    es: {
      title: 'Formulario I-9: Verificación de Elegibilidad de Empleo',
      subtitle: 'Complete la Sección 1 - Información y Certificación del Empleado',
      section1: 'Sección 1: Información y Certificación del Empleado',
      section2: 'Sección 2: Revisión de Documentos (Uso del Empleador)',
      personalInfo: 'Información Personal',
      firstName: 'Nombre (Nombre de Pila)',
      lastName: 'Apellido (Nombre de Familia)',
      middleInitial: 'Inicial del Segundo Nombre',
      otherNames: 'Otros Apellidos Utilizados',
      address: 'Dirección (Número y Nombre de la Calle)',
      city: 'Ciudad o Pueblo',
      state: 'Estado',
      zipCode: 'Código Postal',
      dateOfBirth: 'Fecha de Nacimiento (mm/dd/aaaa)',
      ssnNumber: 'Número de Seguro Social',
      email: 'Dirección de Correo Electrónico (Opcional)',
      phone: 'Número de Teléfono (Opcional)',
      citizenshipStatus: 'Estado de Ciudadanía/Inmigración',
      usCitizen: 'Ciudadano de los Estados Unidos',
      nonCitizenNational: 'Nacional no ciudadano de los Estados Unidos',
      lawfulPermanentResident: 'Residente permanente legal',
      alienAuthorized: 'Extranjero autorizado para trabajar',
      alienNumber: 'Número de Registro de Extranjero/Número USCIS',
      i94Number: 'Número de Admisión del Formulario I-94',
      foreignPassport: 'Número de Pasaporte Extranjero',
      countryOfIssuance: 'País de Emisión',
      workAuthExpiration: 'Fecha de Vencimiento de Autorización de Trabajo',
      employeeAttestation: 'Certificación del Empleado',
      attestationText: 'Certifico, bajo pena de perjurio, que soy (marque una de las siguientes casillas):',
      preparerSection: 'Certificación del Preparador y/o Traductor',
      preparerUsed: '¿Utilizó un preparador o traductor para ayudar a completar este formulario?',
      yes: 'Sí',
      no: 'No',
      autoFilled: 'Completado automáticamente desde sus documentos',
      manualEntry: 'Por favor ingrese manualmente',
      required: 'Requerido',
      optional: 'Opcional',
      next: 'Siguiente Sección',
      back: 'Atrás',
      complete: 'Completar Formulario',
      saving: 'Guardando...',
      validationError: 'Por favor corrija los errores resaltados en rojo',
      fieldError: 'Este campo es requerido',
      invalidFormat: 'Formato inválido',
      ssnFormat: 'Formato: XXX-XX-XXXX',
      dateFormat: 'Formato: MM/DD/AAAA',
      zipFormat: 'Formato: XXXXX o XXXXX-XXXX'
    }
  };

  const currentT = t[language];

  // Enhanced auto-populate fields from OCR data with better mapping
  useEffect(() => {
    if (ocrData && Object.keys(state.data).length === 0) {
      const autoFilledData: Partial<I9FormData> = {};
      const autoFilledFields: Record<string, boolean> = {};

      // Map OCR data to I-9 fields with enhanced parsing
      const mapOCRValue = (key: string, value: any): string => {
        if (!value) return '';
        
        // Handle date formatting
        if (key.includes('date') || key.includes('birth')) {
          const dateStr = String(value).replace(/[^\d\/\-]/g, '');
          if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) return dateStr;
          if (dateStr.match(/^\d{8}$/)) return `${dateStr.slice(0,2)}/${dateStr.slice(2,4)}/${dateStr.slice(4)}`;
          if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr.replace(/-/g, '/');
        }
        
        // Handle SSN formatting
        if (key.includes('ssn') || key.includes('social')) {
          const ssnStr = String(value).replace(/\D/g, '');
          if (ssnStr.length === 9) return `${ssnStr.slice(0,3)}-${ssnStr.slice(3,5)}-${ssnStr.slice(5)}`;
          return ssnStr;
        }
        
        // Handle names - capitalize first letters
        if (key.includes('name')) {
          return String(value).replace(/\b\w/g, (l) => l.toUpperCase());
        }
        
        return String(value).trim();
      };

      // Enhanced field mapping with confidence weighting
      const ocrEntries = Object.entries(ocrData);
      const possibleMappings = {
        firstName: ['firstName', 'first_name', 'given_name', 'nombre', 'fname'],
        lastName: ['lastName', 'last_name', 'surname', 'family_name', 'apellido', 'lname'],
        address: ['address', 'street_address', 'direccion', 'street', 'addr'],
        city: ['city', 'ciudad', 'town'],
        state: ['state', 'province', 'estado', 'region'],
        zipCode: ['zipCode', 'zip_code', 'postal_code', 'zip', 'codigo_postal'],
        dateOfBirth: ['dateOfBirth', 'dob', 'date_of_birth', 'birth_date', 'fecha_nacimiento', 'birthday'],
        ssnNumber: ['ssnNumber', 'ssn', 'social_security', 'social_security_number', 'seguro_social']
      };

      Object.entries(possibleMappings).forEach(([targetField, possibleKeys]) => {
        for (const key of possibleKeys) {
          const matchedEntry = ocrEntries.find(([ocrKey, ocrValue]) => 
            ocrKey.toLowerCase().includes(key.toLowerCase()) && ocrValue
          );
          
          if (matchedEntry) {
            const [_, value] = matchedEntry;
            const mappedValue = mapOCRValue(targetField, value);
            if (mappedValue && mappedValue.trim()) {
              autoFilledData[targetField as keyof I9FormData] = mappedValue;
              autoFilledFields[targetField] = true;
              break;
            }
          }
        }
      });

      // Multi-field validation to ensure data consistency
      const validateAutoFilledData = (data: Partial<I9FormData>): Partial<I9FormData> => {
        const validated: Partial<I9FormData> = {};
        
        // Validate and format SSN
        if (data.ssnNumber) {
          const cleanSSN = data.ssnNumber.replace(/\D/g, '');
          if (cleanSSN.length === 9) {
            validated.ssnNumber = `${cleanSSN.slice(0,3)}-${cleanSSN.slice(3,5)}-${cleanSSN.slice(5)}`;
          }
        }
        
        // Validate date format
        if (data.dateOfBirth) {
          const dateStr = data.dateOfBirth.replace(/[^\d\/]/g, '');
          if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
            validated.dateOfBirth = dateStr;
          }
        }
        
        // Validate state codes
        if (data.state) {
          const stateMap: Record<string, string> = {
            'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
            'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
            'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
            'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
            'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO'
          };
          
          const stateLower = data.state.toLowerCase();
          if (stateMap[stateLower]) {
            validated.state = stateMap[stateLower];
          } else if (data.state.match(/^[A-Z]{2}$/)) {
            validated.state = data.state;
          }
        }
        
        // Copy other fields as-is
        Object.entries(data).forEach(([key, value]) => {
          if (!validated[key as keyof I9FormData]) {
            validated[key as keyof I9FormData] = value;
          }
        });
        
        return validated;
      };

      const validatedData = validateAutoFilledData(autoFilledData);

      setState(prev => ({
        ...prev,
        data: { ...prev.data, ...validatedData },
        isAutoFilled: autoFilledFields
      }));
    }
  }, [ocrData]);

  // Load initial data
  useEffect(() => {
    if (initialData?.data) {
      setState(prev => ({
        ...prev,
        data: initialData.data as Partial<I9FormData>
      }));
    }
  }, [initialData]);

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
      case 'dateOfBirth':
        if (value && !/^\d{2}\/\d{2}\/\d{4}$/.test(value)) {
          return currentT.invalidFormat;
        }
        break;
      case 'zipCode':
        if (value && !/^\d{5}(-\d{4})?$/.test(value)) {
          return currentT.invalidFormat;
        }
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return currentT.invalidFormat;
        }
        break;
    }

    return null;
  }, [currentT]);

  const requiredFields = [
    'firstName', 'lastName', 'address', 'city', 'state', 'zipCode',
    'dateOfBirth', 'ssnNumber', 'citizenshipStatus'
  ];

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
      const filledRequired = requiredFields.filter(field => newData[field as keyof I9FormData]).length;
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
          requiredFieldsMissing: requiredFields.filter(field => !newData[field as keyof I9FormData])
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

  const handleNext = useCallback(() => {
    if (state.validation.isValid) {
      const formData: Partial<FormData> = {
        formId: `i9-${employeeId}-${Date.now()}`,
        employeeId,
        formType: 'i9',
        language,
        data: state.data,
        status: 'completed',
        version: '1.0'
      };
      onComplete(formData);
    }
  }, [state.validation.isValid, state.data, employeeId, language, onComplete]);

  const renderField = (
    fieldName: keyof I9FormData,
    label: string,
    type: 'text' | 'select' | 'radio' | 'date' = 'text',
    options?: { value: string; label: string }[],
    required: boolean = true,
    placeholder?: string
  ) => {
    const value = state.data[fieldName] || '';
    const error = state.validation.errors[fieldName];
    const isAutoFilled = state.isAutoFilled[fieldName];

    return (
      <div className="mb-6">
        <label className={`block font-medium mb-2 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
          {!required && <span className={`ml-2 text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-500'}`}>({currentT.optional})</span>}
        </label>
        
        {isAutoFilled && (
          <div className={`mb-2 text-sm ${highContrastMode ? 'text-green-400' : 'text-green-600'} flex items-center`}>
            <span className="mr-1">✓</span>
            {currentT.autoFilled}
          </div>
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
            {fieldName === 'dateOfBirth' && ` (${currentT.dateFormat})`}
            {fieldName === 'zipCode' && ` (${currentT.zipFormat})`}
          </p>
        )}
      </div>
    );
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

      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {Math.round(state.validation.completionPercentage)}% Complete
          </span>
          <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {requiredFields.length - state.validation.requiredFieldsMissing.length} of {requiredFields.length} required fields
          </span>
        </div>
        <div className={`w-full ${highContrastMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${state.validation.completionPercentage}%` }}
          />
        </div>
      </div>

      <form className="space-y-6">
        <div>
          <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            {currentT.personalInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('firstName', currentT.firstName, 'text', undefined, true)}
            {renderField('lastName', currentT.lastName, 'text', undefined, true)}
            {renderField('middleInitial', currentT.middleInitial, 'text', undefined, false)}
            {renderField('otherLastNames', currentT.otherNames, 'text', undefined, false)}
          </div>

          {renderField('address', currentT.address, 'text', undefined, true)}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderField('city', currentT.city, 'text', undefined, true)}
            {renderField('state', currentT.state, 'text', undefined, true)}
            {renderField('zipCode', currentT.zipCode, 'text', undefined, true)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('dateOfBirth', currentT.dateOfBirth, 'text', undefined, true, 'MM/DD/YYYY')}
            {renderField('ssnNumber', currentT.ssnNumber, 'text', undefined, true, 'XXX-XX-XXXX')}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderField('email', currentT.email, 'text', undefined, false)}
            {renderField('phone', currentT.phone, 'text', undefined, false)}
          </div>
        </div>

        <div>
          <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            {currentT.citizenshipStatus}
          </h3>
          
          <p className={`mb-4 ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {currentT.attestationText}
          </p>

          {renderField('citizenshipStatus', '', 'radio', [
            { value: 'us_citizen', label: currentT.usCitizen },
            { value: 'non_citizen_national', label: currentT.nonCitizenNational },
            { value: 'lawful_permanent_resident', label: currentT.lawfulPermanentResident },
            { value: 'alien_authorized', label: currentT.alienAuthorized }
          ], true)}

          {(state.data.citizenshipStatus === 'lawful_permanent_resident' || state.data.citizenshipStatus === 'alien_authorized') && (
            <div className="mt-6 space-y-6">
              {renderField('alienNumber', currentT.alienNumber, 'text', undefined, false)}
              {renderField('i94Number', currentT.i94Number, 'text', undefined, false)}
              {renderField('foreignPassportNumber', currentT.foreignPassport, 'text', undefined, false)}
              {renderField('countryOfIssuance', currentT.countryOfIssuance, 'text', undefined, false)}
              {renderField('workAuthorizationExpiration', currentT.workAuthExpiration, 'text', undefined, false, 'MM/DD/YYYY')}
            </div>
          )}
        </div>
      </form>

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
          onClick={onBack}
          className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            highContrastMode 
              ? 'text-white border-gray-600 hover:bg-gray-700' 
              : 'text-gray-700 hover:bg-gray-50'
          } transition-colors`}
        >
          {currentT.back}
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={!state.validation.isValid}
          className={`px-6 py-3 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            state.validation.isValid
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          {currentT.complete}
        </button>
      </div>
    </div>
  );
};