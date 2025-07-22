import React from 'react';
import { tablet } from '../../../styles/design-tokens';

interface Step {
  id: string;
  name: string;
  nameEs: string;
  icon: string;
  description?: string;
  descriptionEs?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
  language: 'en' | 'es';
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  highContrast?: boolean;
  largeText?: boolean;
}

const defaultSteps: Step[] = [
  {
    id: 'language',
    name: 'Language',
    nameEs: 'Idioma',
    icon: '🌐',
    description: 'Select your language',
    descriptionEs: 'Seleccione su idioma'
  },
  {
    id: 'access-code',
    name: 'Access Code',
    nameEs: 'Código de Acceso',
    icon: '🔑',
    description: 'Enter your access code',
    descriptionEs: 'Ingrese su código de acceso'
  },
  {
    id: 'documents',
    name: 'Documents',
    nameEs: 'Documentos',
    icon: '📄',
    description: 'Upload your documents',
    descriptionEs: 'Suba sus documentos'
  },
  {
    id: 'forms',
    name: 'Forms',
    nameEs: 'Formularios',
    icon: '📝',
    description: 'Complete required forms',
    descriptionEs: 'Complete los formularios requeridos'
  },
  {
    id: 'signature',
    name: 'Signature',
    nameEs: 'Firma',
    icon: '✍️',
    description: 'Digital signature',
    descriptionEs: 'Firma digital'
  },
  {
    id: 'complete',
    name: 'Complete',
    nameEs: 'Completo',
    icon: '✅',
    description: 'Onboarding complete',
    descriptionEs: 'Incorporación completa'
  }
];

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  steps = defaultSteps,
  currentStep,
  completedSteps = [],
  language = 'en',
  className = '',
  orientation = 'horizontal',
  highContrast = false,
  largeText = false
}) => {
  const getStepStatus = (stepIndex: number) => {
    if (completedSteps.includes(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepClasses = (status: string) => {
    const baseClasses = 'transition-all duration-300 ease-in-out';
    
    if (highContrast) {
      switch (status) {
        case 'completed':
          return `${baseClasses} bg-yellow-400 text-black border-yellow-600 shadow-lg scale-105`;
        case 'current':
          return `${baseClasses} bg-white text-black border-white shadow-xl scale-110 ring-4 ring-white`;
        case 'upcoming':
          return `${baseClasses} bg-gray-600 text-white border-gray-500`;
        default:
          return baseClasses;
      }
    } else {
      switch (status) {
        case 'completed':
          return `${baseClasses} bg-green-500 text-white border-green-500 shadow-lg scale-105`;
        case 'current':
          return `${baseClasses} bg-primary-500 text-white border-primary-500 shadow-xl scale-110 ring-4 ring-primary-200`;
        case 'upcoming':
          return `${baseClasses} bg-gray-100 text-gray-400 border-gray-300`;
        default:
          return baseClasses;
      }
    }
  };

  const getConnectorClasses = (stepIndex: number) => {
    const isCompleted = stepIndex < currentStep || completedSteps.includes(stepIndex);
    
    if (highContrast) {
      return `transition-all duration-500 ${
        isCompleted ? 'bg-yellow-400' : 'bg-gray-600'
      }`;
    } else {
      return `transition-all duration-500 ${
        isCompleted ? 'bg-primary-500' : 'bg-gray-200'
      }`;
    }
  };

  const getTextClasses = (status: string) => {
    if (highContrast) {
      switch (status) {
        case 'current':
          return 'text-white';
        case 'completed':
          return 'text-yellow-400';
        default:
          return 'text-gray-400';
      }
    } else {
      switch (status) {
        case 'current':
          return 'text-primary-600';
        case 'completed':
          return 'text-green-600';
        default:
          return 'text-gray-500';
      }
    }
  };

  const renderHorizontalProgress = () => (
    <div className="flex items-center justify-between w-full">
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const stepName = language === 'es' ? step.nameEs : step.name;
        const stepDescription = language === 'es' ? step.descriptionEs : step.description;
        
        return (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex items-center justify-center rounded-full border-2 font-bold
                  ${getStepClasses(status)}
                `}
                style={{
                  width: largeText ? '90px' : '80px',
                  height: largeText ? '90px' : '80px',
                  fontSize: largeText ? '32px' : '28px'
                }}
                role="img"
                aria-label={`${stepName} ${status === 'completed' ? 'completed' : status === 'current' ? 'current' : 'upcoming'}`}
              >
                {status === 'completed' ? (
                  <svg className={largeText ? 'w-10 h-10' : 'w-8 h-8'} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Step Label */}
              <div className="mt-4 text-center max-w-24">
                <p className={`font-semibold ${getTextClasses(status)} ${largeText ? 'text-base' : 'text-sm'}`}>
                  {stepName}
                </p>
                {stepDescription && status === 'current' && (
                  <p className={`${highContrast ? 'text-gray-300' : 'text-gray-500'} mt-1 ${largeText ? 'text-sm' : 'text-xs'}`}>
                    {stepDescription}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-4">
                <div 
                  className={`${largeText ? 'h-3' : 'h-2'} rounded-full ${getConnectorClasses(index)}`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const renderVerticalProgress = () => (
    <div className="flex flex-col">
      {steps.map((step, index) => {
        const status = getStepStatus(index);
        const stepName = language === 'es' ? step.nameEs : step.name;
        const stepDescription = language === 'es' ? step.descriptionEs : step.description;
        
        return (
          <React.Fragment key={step.id}>
            {/* Step Row */}
            <div className="flex items-center">
              {/* Step Circle */}
              <div
                className={`
                  flex items-center justify-center rounded-full border-2 font-bold shrink-0
                  ${getStepClasses(status)}
                `}
                style={{
                  width: largeText ? '70px' : '60px',
                  height: largeText ? '70px' : '60px',
                  fontSize: largeText ? '24px' : '20px'
                }}
                role="img"
                aria-label={`${stepName} ${status === 'completed' ? 'completed' : status === 'current' ? 'current' : 'upcoming'}`}
              >
                {status === 'completed' ? (
                  <svg className={largeText ? 'w-8 h-8' : 'w-6 h-6'} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.icon
                )}
              </div>
              
              {/* Step Content */}
              <div className="ml-6 flex-1">
                <p className={`font-semibold ${getTextClasses(status)} ${largeText ? 'text-xl' : 'text-lg'}`}>
                  {stepName}
                </p>
                {stepDescription && (
                  <p className={`mt-1 ${
                    status === 'current' 
                      ? (highContrast ? 'text-white' : 'text-gray-700') 
                      : (highContrast ? 'text-gray-300' : 'text-gray-500')
                  } ${largeText ? 'text-base' : 'text-sm'}`}>
                    {stepDescription}
                  </p>
                )}
              </div>
            </div>
            
            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex">
                <div className="w-[60px] flex justify-center">
                  <div 
                    className={`${largeText ? 'w-3' : 'w-2'} h-12 rounded-full ${getConnectorClasses(index)}`}
                    style={{ marginLeft: largeText ? '34px' : '29px' }} // Center with circle
                  />
                </div>
                <div className="flex-1" />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );

  const completionPercentage = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className={`w-full ${className}`}>
      {/* Overall Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className={`font-medium ${highContrast ? 'text-white' : 'text-gray-700'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {language === 'es' ? 'Progreso General' : 'Overall Progress'}
          </span>
          <span className={`font-medium ${highContrast ? 'text-yellow-400' : 'text-primary-600'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {completionPercentage}%
          </span>
        </div>
        <div className={`w-full ${highContrast ? 'bg-gray-600' : 'bg-gray-200'} rounded-full ${largeText ? 'h-4' : 'h-3'}`}>
          <div
            className={`${highContrast ? 'bg-yellow-400' : 'bg-primary-500'} ${largeText ? 'h-4' : 'h-3'} rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${completionPercentage}%` }}
            role="progressbar"
            aria-valuenow={completionPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Step Progress */}
      <div 
        className="w-full"
        style={{ 
          minHeight: orientation === 'horizontal' ? (largeText ? tablet.onboarding.wizard.stepIndicatorHeight * 1.2 : tablet.onboarding.wizard.stepIndicatorHeight) : 'auto'
        }}
        role="navigation"
        aria-label="Onboarding progress"
      >
        {orientation === 'horizontal' ? renderHorizontalProgress() : renderVerticalProgress()}
      </div>
    </div>
  );
};

export default ProgressIndicator;