import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { useToast } from '../../hooks/useToast';
import { useLanguage } from '../../hooks/useLanguage';
import { onboardingService } from '../../services/onboardingService';
import {
  WelcomeStep,
  DocumentUploadStep,
  EmergencyContactStep,
  DirectDepositStep,
  HealthInsuranceStep,
  FormCompletionStep,
  ReviewStep,
  CompletionStep
} from './steps';

interface OnboardingData {
  sessionId: string;
  accessCode: string;
  employee: {
    id?: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
    organizationName: string;
  };
  language: 'en' | 'es';
  documents: any[];
  ocrData: Record<string, any>;
  forms: {
    i9Data?: any;
    w4Data?: any;
  };
  signature?: {
    signatureBase64: string;
    signedAt: string;
  };
  emergencyContact?: any;
  directDeposit?: any;
  healthInsurance?: any;
}

interface Step {
  id: string;
  title: string;
  titleEs: string;
  description: string;
  descriptionEs: string;
  icon: string;
  estimatedMinutes: number;
}

const ONBOARDING_STEPS: Step[] = [
  {
    id: 'welcome',
    title: 'Welcome',
    titleEs: 'Bienvenida',
    description: 'Get started with your onboarding',
    descriptionEs: 'Comience con su incorporación',
    icon: 'UserPlus',
    estimatedMinutes: 1
  },
  {
    id: 'documents',
    title: 'Upload Documents',
    titleEs: 'Subir Documentos',
    description: 'Provide your identification documents',
    descriptionEs: 'Proporcione sus documentos de identificación',
    icon: 'Upload',
    estimatedMinutes: 5
  },
  {
    id: 'emergency-contact',
    title: 'Emergency Contact',
    titleEs: 'Contacto de Emergencia',
    description: 'Provide emergency contact information',
    descriptionEs: 'Proporcione información de contacto de emergencia',
    icon: 'Phone',
    estimatedMinutes: 3
  },
  {
    id: 'direct-deposit',
    title: 'Direct Deposit',
    titleEs: 'Depósito Directo',
    description: 'Set up direct deposit',
    descriptionEs: 'Configure el depósito directo',
    icon: 'CreditCard',
    estimatedMinutes: 5
  },
  {
    id: 'health-insurance',
    title: 'Health Insurance',
    titleEs: 'Seguro de Salud',
    description: 'Select health insurance plan',
    descriptionEs: 'Seleccione el plan de seguro de salud',
    icon: 'Shield',
    estimatedMinutes: 8
  },
  {
    id: 'forms',
    title: 'Complete Forms',
    titleEs: 'Completar Formularios',
    description: 'Fill out I-9 and W-4 forms',
    descriptionEs: 'Complete los formularios I-9 y W-4',
    icon: 'FileText',
    estimatedMinutes: 10
  },
  {
    id: 'review',
    title: 'Review & Sign',
    titleEs: 'Revisar y Firmar',
    description: 'Review your information and sign',
    descriptionEs: 'Revise su información y firme',
    icon: 'PenTool',
    estimatedMinutes: 3
  },
  {
    id: 'complete',
    title: 'Complete',
    titleEs: 'Completar',
    description: 'Onboarding finished successfully',
    descriptionEs: 'Incorporación completada exitosamente',
    icon: 'CheckCircle',
    estimatedMinutes: 1
  }
];

export const OnboardingFlow: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentLanguage, changeLanguage, initializeLanguage, t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);
  const [sessionValid, setSessionValid] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize onboarding session from URL parameters
  useEffect(() => {
    const initializeSession = async () => {
      const accessCode = searchParams.get('code');
      const token = searchParams.get('token');
      const langParam = searchParams.get('lang') as 'en' | 'es';

      // Initialize language from localStorage
      initializeLanguage();

      // Handle URL language parameter
      if (langParam && ['en', 'es'].includes(langParam)) {
        changeLanguage(langParam);
      }

      // Check for either access code or token
      const authParam = accessCode || token;
      if (!authParam) {
        showToast('No access code or token provided. Please check your invitation link.', 'error');
        // Don't redirect to root - stay on onboarding page and show error
        setError('Invalid or missing onboarding link. Please contact your manager for a new link.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        // Use validateToken for both access codes and tokens
        const result = await onboardingService.validateToken(authParam);

        if (result.success && result.data && result.data.session && result.data.employee) {
          setOnboardingData({
            sessionId: result.data.session.id,
            accessCode: result.data.session.token || authParam,
            employee: {
              firstName: result.data.employee.firstName || result.data.employee.name?.split(' ')[0] || '',
              lastName: result.data.employee.lastName || result.data.employee.name?.split(' ').slice(1).join(' ') || '',
              email: result.data.employee.email || '',
              position: result.data.employee.position || '',
              department: result.data.employee.department || '',
              organizationName: result.data.employee.organizationName || ''
            },
            language: (result.data.session.languagePreference as 'en' | 'es') || currentLanguage,
            documents: [],
            ocrData: {},
            forms: {},
            emergencyContact: {},
            directDeposit: {},
            healthInsurance: {},
          });

          // Set language from session if available, otherwise keep current language
          const sessionLanguage = (result.data.session.languagePreference as 'en' | 'es') || currentLanguage;
          if (sessionLanguage !== currentLanguage) {
            changeLanguage(sessionLanguage);
          }

          setSessionValid(true);

          // Determine current step based on session progress
          const sessionStep = result.data.session.currentStep;
          if (sessionStep === 'documents' || sessionStep === 'document-upload') {
            setCurrentStep(1);
          } else if (sessionStep === 'emergency-contact') {
            setCurrentStep(2);
          } else if (sessionStep === 'direct-deposit') {
            setCurrentStep(3);
          } else if (sessionStep === 'health-insurance') {
            setCurrentStep(4);
          } else if (sessionStep === 'forms' || sessionStep === 'form-completion') {
            setCurrentStep(5);
          } else if (sessionStep === 'review' || sessionStep === 'signature') {
            setCurrentStep(6);
          } else if (sessionStep === 'complete' || sessionStep === 'completed') {
            setCurrentStep(7);
          }

        } else {
          showToast('Invalid or expired access code. Please contact your manager.', 'error');
          setError('Invalid or expired onboarding link. Please contact your manager for a new link.');
          setSessionValid(false);
        }
      } catch (error) {
        console.error('Error initializing onboarding session:', error);
        showToast('Failed to initialize onboarding session. Please try again.', 'error');
        setError('Failed to initialize onboarding session. Please contact your manager.');
        setSessionValid(false);
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [searchParams, navigate, showToast]);

  // Update language persistence when language changes
  useEffect(() => {
    // Update onboarding data with new language
    if (onboardingData) {
      updateOnboardingData({ language: currentLanguage });

      // Optionally update the session on the backend
      if (onboardingData.accessCode) {
        onboardingService.updateProgress(onboardingData.accessCode, {
          languagePreference: currentLanguage
        }).catch(error => {
          console.warn('Failed to update language preference on server:', error);
        });
      }
    }
  }, [currentLanguage, onboardingData?.accessCode]);

  const updateOnboardingData = (updates: Partial<OnboardingData>) => {
    setOnboardingData(prev => prev ? { ...prev, ...updates } : null);
  };

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  const getTotalEstimatedTime = () => {
    return ONBOARDING_STEPS.reduce((total, step) => total + step.estimatedMinutes, 0);
  };

  // Translation functions using proper i18n integration
  const tLabel = (key: string) => t(`onboarding.labels.${key}`);
  const tCommon = (key: string) => t(`common.${key}`);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{tCommon('loading')}</h2>
          <p className="text-gray-600">Please wait while we prepare your onboarding experience.</p>
        </Card>
      </div>
    );
  }

  if (!sessionValid || !onboardingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 text-center">
          <Icon name="AlertCircle" size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Session Invalid</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Your onboarding session is invalid or has expired. Please contact your manager for a new invitation.'}
          </p>
          <Button onClick={() => window.location.href = '/jobs'} variant="primary">
            View Job Openings
          </Button>
        </Card>
      </div>
    );
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <WelcomeStep
            employee={onboardingData.employee}
            language={currentLanguage}
            onLanguageChange={changeLanguage}
            onContinue={nextStep}
            estimatedTime={getTotalEstimatedTime()}
          />
        );
      case 1:
        return (
          <DocumentUploadStep
            sessionId={onboardingData.sessionId}
            language={currentLanguage}
            onDocumentsUploaded={(documents: any[], ocrData: any) => {
              updateOnboardingData({ documents, ocrData });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 2:
        return (
          <EmergencyContactStep 
            language={currentLanguage} 
            onNext={(data) => { 
              updateOnboardingData({ emergencyContact: data }); 
              nextStep(); 
            }}
            onBack={previousStep}
            initialData={onboardingData.emergencyContact}
          />
        );
      case 3:
        return (
          <DirectDepositStep 
            language={currentLanguage} 
            onNext={(data) => { 
              updateOnboardingData({ directDeposit: data }); 
              nextStep(); 
            }}
            onBack={previousStep}
            initialData={onboardingData.directDeposit}
          />
        );
      case 4:
        return (
          <HealthInsuranceStep 
            language={currentLanguage} 
            onNext={(data) => { 
              updateOnboardingData({ healthInsurance: data }); 
              nextStep(); 
            }}
            onBack={previousStep}
            initialData={onboardingData.healthInsurance}
          />
        );
      case 5:
        return (
          <FormCompletionStep
            sessionId={onboardingData.sessionId}
            language={currentLanguage}
            employee={{
              ...onboardingData.employee,
              id: onboardingData.employee.id || onboardingData.sessionId
            }}
            ocrData={onboardingData.ocrData}
            onFormsCompleted={(forms: any) => {
              updateOnboardingData({ forms });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 6:
        return (
          <ReviewStep
            sessionId={onboardingData.sessionId}
            language={currentLanguage}
            employee={onboardingData.employee}
            documents={onboardingData.documents}
            forms={onboardingData.forms}
            onSigned={(signature: any) => {
              updateOnboardingData({ signature });
              nextStep();
            }}
            onBack={previousStep}
          />
        );
      case 7:
        return (
          <CompletionStep
            language={currentLanguage}
            employee={onboardingData.employee}
            onFinish={() => navigate('/')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Icon name="Building" size={20} className="text-white" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Employee Onboarding</h1>
                <p className="text-sm text-gray-500">{onboardingData.employee.organizationName}</p>
              </div>
            </div>

            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentLanguage === 'en'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('es')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${currentLanguage === 'es'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                ES
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>
                {tLabel('currentStep')} {currentStep + 1} of {ONBOARDING_STEPS.length}
              </span>
              <span>
                Estimated time: {getTotalEstimatedTime()} minutes
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentStep) / (ONBOARDING_STEPS.length - 1)) * 100}%`
                }}
              />
            </div>
          </div>

          {/* Step Indicators */}
          <div className="hidden sm:flex justify-between">
            {ONBOARDING_STEPS.map((step, index) => {
              const status = getStepStatus(index);
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-200 ${status === 'completed'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : status === 'current'
                          ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                          : 'bg-gray-100 text-gray-400 border-2 border-gray-300'
                      }`}
                  >
                    {status === 'completed' ? (
                      <Icon name="Check" size={16} />
                    ) : (
                      <Icon name={step.icon as any} size={16} />
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium text-center ${status === 'current' ? 'text-blue-700' : 'text-gray-500'
                    }`}>
                    {currentLanguage === 'es' ? step.titleEs : step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderCurrentStep()}
      </div>
    </div>
  );
};          