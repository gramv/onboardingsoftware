import React, { useState, useCallback } from 'react';
import { FormData, FormType, I9FormData, W4FormData } from '../../../types/forms';

interface FormReviewProps {
  language: 'en' | 'es';
  highContrastMode: boolean;
  largeTextMode: boolean;
  i9Data: Partial<FormData>;
  w4Data: Partial<FormData>;
  onComplete: () => void;
  onBack: () => void;
  onEdit: (formType: FormType) => void;
}

interface ReviewState {
  expandedSections: Record<string, boolean>;
  changeTracking: Record<string, {
    original: any;
    modified: any;
    timestamp: string;
  }>;
}

export const FormReview: React.FC<FormReviewProps> = ({
  language,
  highContrastMode,
  largeTextMode,
  i9Data,
  w4Data,
  onComplete,
  onBack,
  onEdit
}) => {
  const [state, setState] = useState<ReviewState>({
    expandedSections: {
      i9_personal: true,
      i9_citizenship: true,
      w4_personal: true,
      w4_filing: true,
      w4_dependents: true,
      w4_adjustments: true
    },
    changeTracking: {}
  });

  const t = {
    en: {
      title: 'Review Your Forms',
      subtitle: 'Please review all information before proceeding to signatures',
      i9Form: 'Form I-9: Employment Eligibility Verification',
      w4Form: 'Form W-4: Employee\'s Withholding Certificate',
      personalInformation: 'Personal Information',
      citizenshipStatus: 'Citizenship/Immigration Status',
      filingInformation: 'Filing Information',
      dependents: 'Dependents',
      adjustments: 'Other Adjustments',
      edit: 'Edit',
      expand: 'Expand',
      collapse: 'Collapse',
      complete: 'Proceed to Signatures',
      back: 'Back',
      noData: 'No data entered',
      autoFilled: 'Auto-filled from documents',
      manualEntry: 'Manually entered',
      modified: 'Modified',
      original: 'Original',
      changeHistory: 'Change History',
      lastModified: 'Last modified',
      completionStatus: 'Completion Status',
      complete_status: 'Complete',
      incomplete_status: 'Incomplete',
      missingFields: 'Missing required fields',
      validationIssues: 'Validation issues found',
      allGood: 'All information looks good',
      // Field labels
      firstName: 'First Name',
      lastName: 'Last Name',
      middleInitial: 'Middle Initial',
      address: 'Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      dateOfBirth: 'Date of Birth',
      ssnNumber: 'Social Security Number',
      email: 'Email',
      phone: 'Phone',
      filingStatus: 'Filing Status',
      qualifyingChildren: 'Qualifying Children',
      otherDependents: 'Other Dependents',
      totalDependentAmount: 'Total Dependent Amount',
      otherIncome: 'Other Income',
      deductions: 'Deductions',
      extraWithholding: 'Extra Withholding',
      // Values
      us_citizen: 'U.S. Citizen',
      non_citizen_national: 'Non-citizen National',
      lawful_permanent_resident: 'Lawful Permanent Resident',
      alien_authorized: 'Alien Authorized to Work',
      single: 'Single',
      married_filing_jointly: 'Married Filing Jointly',
      married_filing_separately: 'Married Filing Separately',
      head_of_household: 'Head of Household'
    },
    es: {
      title: 'Revise Sus Formularios',
      subtitle: 'Por favor revise toda la información antes de proceder a las firmas',
      i9Form: 'Formulario I-9: Verificación de Elegibilidad de Empleo',
      w4Form: 'Formulario W-4: Certificado de Retenciones del Empleado',
      personalInformation: 'Información Personal',
      citizenshipStatus: 'Estado de Ciudadanía/Inmigración',
      filingInformation: 'Información de Declaración',
      dependents: 'Dependientes',
      adjustments: 'Otros Ajustes',
      edit: 'Editar',
      expand: 'Expandir',
      collapse: 'Contraer',
      complete: 'Proceder a las Firmas',
      back: 'Atrás',
      noData: 'No se ingresaron datos',
      autoFilled: 'Completado automáticamente desde documentos',
      manualEntry: 'Ingresado manualmente',
      modified: 'Modificado',
      original: 'Original',
      changeHistory: 'Historial de Cambios',
      lastModified: 'Última modificación',
      completionStatus: 'Estado de Finalización',
      complete_status: 'Completo',
      incomplete_status: 'Incompleto',
      missingFields: 'Campos requeridos faltantes',
      validationIssues: 'Problemas de validación encontrados',
      allGood: 'Toda la información se ve bien',
      // Field labels
      firstName: 'Nombre',
      lastName: 'Apellido',
      middleInitial: 'Inicial del Segundo Nombre',
      address: 'Dirección',
      city: 'Ciudad',
      state: 'Estado',
      zipCode: 'Código Postal',
      dateOfBirth: 'Fecha de Nacimiento',
      ssnNumber: 'Número de Seguro Social',
      email: 'Correo Electrónico',
      phone: 'Teléfono',
      filingStatus: 'Estado Civil',
      qualifyingChildren: 'Hijos Calificados',
      otherDependents: 'Otros Dependientes',
      totalDependentAmount: 'Cantidad Total de Dependientes',
      otherIncome: 'Otros Ingresos',
      deductions: 'Deducciones',
      extraWithholding: 'Retención Adicional',
      // Values
      us_citizen: 'Ciudadano de EE.UU.',
      non_citizen_national: 'Nacional No Ciudadano',
      lawful_permanent_resident: 'Residente Permanente Legal',
      alien_authorized: 'Extranjero Autorizado para Trabajar',
      single: 'Soltero',
      married_filing_jointly: 'Casado Declarando Conjuntamente',
      married_filing_separately: 'Casado Declarando por Separado',
      head_of_household: 'Cabeza de Familia'
    }
  };

  const currentT = t[language];

  const toggleSection = useCallback((sectionId: string) => {
    setState(prev => ({
      ...prev,
      expandedSections: {
        ...prev.expandedSections,
        [sectionId]: !prev.expandedSections[sectionId]
      }
    }));
  }, []);

  const formatValue = useCallback((key: string, value: any): string => {
    if (value === null || value === undefined || value === '') {
      return currentT.noData;
    }

    // Handle special formatting
    switch (key) {
      case 'ssnNumber':
        return value.toString().replace(/(\d{3})(\d{2})(\d{4})/, '$1-$2-$3');
      case 'dateOfBirth':
        return value;
      case 'citizenshipStatus':
        return currentT[value as keyof typeof currentT] || value;
      case 'filingStatus':
        return currentT[value as keyof typeof currentT] || value;
      case 'qualifyingChildren':
      case 'otherDependents':
        return value.toString();
      case 'totalDependentAmount':
      case 'otherIncome':
      case 'deductions':
      case 'extraWithholding':
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  }, [currentT]);

  const getFieldLabel = useCallback((key: string): string => {
    return currentT[key as keyof typeof currentT] || key;
  }, [currentT]);

  const renderField = useCallback((key: string, value: any, isAutoFilled: boolean = false) => {
    const formattedValue = formatValue(key, value);
    const isEmpty = value === null || value === undefined || value === '';

    return (
      <div className="flex justify-between items-start py-2 border-b border-gray-200 last:border-b-0">
        <div className="flex-1">
          <span className={`font-medium ${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
            {getFieldLabel(key)}
          </span>
          {isAutoFilled && (
            <span className={`ml-2 text-xs px-2 py-1 rounded ${highContrastMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
              {currentT.autoFilled}
            </span>
          )}
        </div>
        <div className="flex-1 text-right">
          <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${
            isEmpty 
              ? (highContrastMode ? 'text-red-400' : 'text-red-600')
              : (highContrastMode ? 'text-gray-300' : 'text-gray-700')
          }`}>
            {formattedValue}
          </span>
        </div>
      </div>
    );
  }, [formatValue, getFieldLabel, largeTextMode, highContrastMode, currentT]);

  const renderSection = useCallback((
    sectionId: string,
    title: string,
    data: Record<string, any>,
    fields: string[],
    formType: FormType,
    autoFilledFields: Record<string, boolean> = {}
  ) => {
    const isExpanded = state.expandedSections[sectionId];
    const hasData = fields.some(field => data[field] !== null && data[field] !== undefined && data[field] !== '');
    const missingRequired = fields.filter(field => {
      const value = data[field];
      return (value === null || value === undefined || value === '') && 
             ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'ssnNumber', 'citizenshipStatus', 'filingStatus'].includes(field);
    });

    return (
      <div key={sectionId} className={`mb-6 ${highContrastMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm border`}>
        <div 
          className={`flex justify-between items-center p-4 cursor-pointer ${highContrastMode ? 'hover:bg-gray-600' : 'hover:bg-gray-50'}`}
          onClick={() => toggleSection(sectionId)}
        >
          <div className="flex items-center">
            <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h3>
            {missingRequired.length > 0 && (
              <span className={`ml-3 px-2 py-1 text-xs rounded ${highContrastMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800'}`}>
                {missingRequired.length} missing
              </span>
            )}
            {hasData && missingRequired.length === 0 && (
              <span className={`ml-3 px-2 py-1 text-xs rounded ${highContrastMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800'}`}>
                ✓ Complete
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(formType);
              }}
              className={`px-3 py-1 text-sm border rounded ${
                highContrastMode 
                  ? 'border-gray-500 text-gray-300 hover:bg-gray-600' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              } transition-colors`}
            >
              {currentT.edit}
            </button>
            <span className={`text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {isExpanded ? '▼' : '▶'}
            </span>
          </div>
        </div>

        {isExpanded && (
          <div className="px-4 pb-4">
            {hasData ? (
              <div className="space-y-1">
                {fields.map(field => {
                  const value = data[field];
                  if (value === null || value === undefined || value === '') return null;
                  return renderField(field, value, autoFilledFields[field]);
                })}
              </div>
            ) : (
              <p className={`text-center py-4 ${highContrastMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {currentT.noData}
              </p>
            )}

            {missingRequired.length > 0 && (
              <div className={`mt-4 p-3 ${highContrastMode ? 'bg-red-900' : 'bg-red-50'} rounded border`}>
                <p className={`font-medium text-sm ${highContrastMode ? 'text-red-200' : 'text-red-800'} mb-2`}>
                  {currentT.missingFields}:
                </p>
                <ul className={`text-sm ${highContrastMode ? 'text-red-300' : 'text-red-700'} space-y-1`}>
                  {missingRequired.map(field => (
                    <li key={field}>• {getFieldLabel(field)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }, [state.expandedSections, toggleSection, onEdit, renderField, getFieldLabel, largeTextMode, highContrastMode, currentT]);

  const renderFormSummary = useCallback((formType: FormType, formData: Partial<FormData>, formTitle: string) => {
    if (!formData.data) {
      return (
        <div className={`mb-8 ${highContrastMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm border p-6`}>
          <h2 className={`font-bold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-4`}>
            {formTitle}
          </h2>
          <p className={`text-center ${highContrastMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {currentT.noData}
          </p>
        </div>
      );
    }

    const data = formData.data as I9FormData | W4FormData;

    if (formType === 'i9') {
      const i9Data = data as I9FormData;
      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`font-bold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {formTitle}
            </h2>
            <div className={`px-3 py-1 rounded text-sm ${
              formData.status === 'completed' 
                ? (highContrastMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
                : (highContrastMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
            }`}>
              {formData.status === 'completed' ? currentT.complete_status : currentT.incomplete_status}
            </div>
          </div>

          {renderSection(
            'i9_personal',
            currentT.personalInformation,
            i9Data,
            ['firstName', 'lastName', 'middleInitial', 'address', 'city', 'state', 'zipCode', 'dateOfBirth', 'ssnNumber', 'email', 'phone'],
            'i9'
          )}

          {renderSection(
            'i9_citizenship',
            currentT.citizenshipStatus,
            i9Data,
            ['citizenshipStatus', 'alienNumber', 'i94Number', 'foreignPassportNumber', 'countryOfIssuance', 'workAuthorizationExpiration'],
            'i9'
          )}
        </div>
      );
    } else {
      const w4Data = data as W4FormData;
      return (
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className={`font-bold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {formTitle}
            </h2>
            <div className={`px-3 py-1 rounded text-sm ${
              formData.status === 'completed' 
                ? (highContrastMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
                : (highContrastMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
            }`}>
              {formData.status === 'completed' ? currentT.complete_status : currentT.incomplete_status}
            </div>
          </div>

          {renderSection(
            'w4_personal',
            currentT.personalInformation,
            w4Data,
            ['firstName', 'lastName', 'middleInitial', 'address', 'city', 'state', 'zipCode', 'ssnNumber'],
            'w4'
          )}

          {renderSection(
            'w4_filing',
            currentT.filingInformation,
            w4Data,
            ['filingStatus', 'multipleJobsSpouseWorks', 'useEstimator'],
            'w4'
          )}

          {renderSection(
            'w4_dependents',
            currentT.dependents,
            w4Data,
            ['qualifyingChildren', 'otherDependents', 'totalDependentAmount'],
            'w4'
          )}

          {renderSection(
            'w4_adjustments',
            currentT.adjustments,
            w4Data,
            ['otherIncome', 'deductions', 'extraWithholding'],
            'w4'
          )}
        </div>
      );
    }
  }, [renderSection, largeTextMode, highContrastMode, currentT]);

  const getOverallStatus = useCallback(() => {
    const i9Complete = i9Data.status === 'completed';
    const w4Complete = w4Data.status === 'completed';
    
    if (i9Complete && w4Complete) {
      return { status: 'complete', message: currentT.allGood, color: 'green' };
    } else {
      const missing = [];
      if (!i9Complete) missing.push('I-9');
      if (!w4Complete) missing.push('W-4');
      return { 
        status: 'incomplete', 
        message: `${currentT.missingFields}: ${missing.join(', ')}`, 
        color: 'yellow' 
      };
    }
  }, [i9Data.status, w4Data.status, currentT]);

  const overallStatus = getOverallStatus();

  return (
    <div className={`${highContrastMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
      <div className="mb-8">
        <h1 className={`font-bold ${largeTextMode ? 'text-2xl' : 'text-xl'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-2`}>
          {currentT.title}
        </h1>
        <p className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {currentT.subtitle}
        </p>
      </div>

      {/* Overall status */}
      <div className={`mb-8 p-4 rounded-lg border ${
        overallStatus.color === 'green' 
          ? (highContrastMode ? 'bg-green-900 border-green-700' : 'bg-green-50 border-green-200')
          : (highContrastMode ? 'bg-yellow-900 border-yellow-700' : 'bg-yellow-50 border-yellow-200')
      }`}>
        <div className="flex items-center">
          <span className={`text-2xl mr-3 ${
            overallStatus.color === 'green' ? '✅' : '⚠️'
          }`}>
            {overallStatus.color === 'green' ? '✅' : '⚠️'}
          </span>
          <div>
            <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${
              overallStatus.color === 'green' 
                ? (highContrastMode ? 'text-green-200' : 'text-green-800')
                : (highContrastMode ? 'text-yellow-200' : 'text-yellow-800')
            }`}>
              {currentT.completionStatus}
            </h3>
            <p className={`${largeTextMode ? 'text-base' : 'text-sm'} ${
              overallStatus.color === 'green' 
                ? (highContrastMode ? 'text-green-300' : 'text-green-700')
                : (highContrastMode ? 'text-yellow-300' : 'text-yellow-700')
            }`}>
              {overallStatus.message}
            </p>
          </div>
        </div>
      </div>

      {/* Form reviews */}
      {renderFormSummary('i9', i9Data, currentT.i9Form)}
      {renderFormSummary('w4', w4Data, currentT.w4Form)}

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
          onClick={onComplete}
          disabled={overallStatus.status !== 'complete'}
          className={`px-6 py-3 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            overallStatus.status === 'complete'
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