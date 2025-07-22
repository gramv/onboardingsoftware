import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import LanguageSelection from './LanguageSelection';
import AccessCodeEntry from './AccessCodeEntry';
import EnhancedProgressIndicator from './EnhancedProgressIndicator';
import DocumentCapture from '../documents/DocumentCapture';
import { FormCompletion } from '../forms/FormCompletion';
import { DigitalSignature } from '../forms/DigitalSignature';
import { tablet, features } from '../../../styles/design-tokens';
import { onboardingService } from '../../../services/onboardingService';
import { useDeviceDetection, shouldUseTabletUI } from '../../../utils/deviceDetection';

// Define step types for better type safety
export type OnboardingStep = 
  | 'language'
  | 'access-code'
  | 'documents'
  | 'forms'
  | 'signature'
  | 'complete';

// Define step configuration
export const ONBOARDING_STEPS: {
  id: OnboardingStep;
  name: string;
  nameEs: string;
  icon: string;
  description?: string;
  descriptionEs?: string;
}[] = [
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

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];
  language: 'en' | 'es';
  accessCode: string;
  employeeData: any;
  sessionId: string;
  lastActivity: Date;
  highContrastMode: boolean;
  largeTextMode: boolean;
  voiceGuidanceEnabled: boolean;
}

interface OnboardingWizardProps {
  onComplete?: (data: OnboardingState) => void;
  onStepChange?: (step: number, data: Partial<OnboardingState>) => void;
  initialData?: Partial<OnboardingState>;
  autoSave?: boolean;
  className?: string;
}

const STORAGE_KEY = 'onboarding_session';
const AUTO_SAVE_INTERVAL = 15000; // 15 seconds
const SESSION_WARNING_TIME = 25 * 60 * 1000; // 25 minutes
const SESSION_TIMEOUT_TIME = 30 * 60 * 1000; // 30 minutes
const SESSION_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 hours

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  onComplete,
  onStepChange,
  initialData,
  autoSave = true,
  className = ''
}) => {
  const [state, setState] = useState<OnboardingState>({
    currentStep: 0,
    completedSteps: [],
    language: 'en',
    accessCode: '',
    employeeData: null,
    sessionId: crypto.randomUUID?.() || Date.now().toString(),
    lastActivity: new Date(),
    highContrastMode: false,
    largeTextMode: false,
    voiceGuidanceEnabled: false,
    ...initialData
  });

  const [isTabletMode, setIsTabletMode] = useState(false);
  const [sessionWarning, setSessionWarning] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [showTimeEstimates, setShowTimeEstimates] = useState(false);
  const [showAccessibilityMenu, setShowAccessibilityMenu] = useState(false);

  // Use proper device detection
  const deviceInfo = useDeviceDetection();
  
  // Update tablet mode based on device detection
  useEffect(() => {
    setIsTabletMode(shouldUseTabletUI());
  }, [deviceInfo]);

  // Auto-save functionality
  useEffect(() => {
    if (!autoSave) return;

    const saveSession = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          ...state,
          lastActivity: new Date()
        }));
      } catch (error) {
        console.warn('Failed to save onboarding session:', error);
      }
    };

    const interval = setInterval(saveSession, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [state, autoSave]);

  // Load saved session on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && !initialData?.currentStep) {
        const savedState = JSON.parse(saved);
        const lastActivity = new Date(savedState.lastActivity);
        const timeDiff = Date.now() - lastActivity.getTime();
        
        // Show resume dialog if session is less than 24 hours old
        if (timeDiff < SESSION_EXPIRY_TIME) {
          setShowResumeDialog(true);
        }
      }
    } catch (error) {
      console.warn('Failed to load saved session:', error);
    }
  }, [initialData]);

  // Session timeout warning and handling
  useEffect(() => {
    const checkSessionTimeout = () => {
      const now = Date.now();
      const lastActivity = state.lastActivity.getTime();
      const timeDiff = now - lastActivity;
      
      // Warn if inactive for 25 minutes
      if (timeDiff > SESSION_WARNING_TIME && !sessionWarning) {
        setSessionWarning(true);
        speakText(state.language === 'es' 
          ? 'Su sesión está a punto de expirar debido a inactividad.' 
          : 'Your session is about to expire due to inactivity.');
      }
      
      // Timeout if inactive for 30 minutes
      if (timeDiff > SESSION_TIMEOUT_TIME) {
        setSessionTimeout(true);
        speakText(state.language === 'es' 
          ? 'Su sesión ha expirado. Por favor comience de nuevo.' 
          : 'Your session has timed out. Please start again.');
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [state.lastActivity, sessionWarning, state.language]);

  // Activity tracking
  const trackActivity = useCallback(() => {
    setState(prev => ({ ...prev, lastActivity: new Date() }));
    setSessionWarning(false);
    setSessionTimeout(false);
  }, []);

  useEffect(() => {
    // Track user activity
    const events = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    
    const handleActivity = () => trackActivity();
    
    events.forEach(event => {
      window.addEventListener(event, handleActivity);
    });
    
    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [trackActivity]);

  // Fullscreen handling
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.warn('Fullscreen API not supported:', error);
    }
  };

  // Voice guidance
  const speakText = (text: string) => {
    if (!state.voiceGuidanceEnabled || !audioEnabled) return;
    
    try {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = state.language === 'es' ? 'es-ES' : 'en-US';
      utterance.rate = 0.9; // Slightly slower for clarity
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Speech synthesis not supported:', error);
    }
  };

  // Enable audio on first user interaction
  const enableAudio = () => {
    setAudioEnabled(true);
  };

  useEffect(() => {
    const handleUserInteraction = () => enableAudio();
    
    window.addEventListener('click', handleUserInteraction, { once: true });
    window.addEventListener('touchstart', handleUserInteraction, { once: true });
    
    return () => {
      window.removeEventListener('click', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const updateState = (updates: Partial<OnboardingState>) => {
    const newState = { 
      ...state, 
      ...updates, 
      lastActivity: new Date() 
    };
    setState(newState);
    onStepChange?.(newState.currentStep, newState);
  };

  const markStepCompleted = (stepIndex: number) => {
    const newCompletedSteps = [...state.completedSteps];
    if (!newCompletedSteps.includes(stepIndex)) {
      newCompletedSteps.push(stepIndex);
      updateState({ completedSteps: newCompletedSteps });
    }
  };

  const nextStep = () => {
    markStepCompleted(state.currentStep);
    const nextStepIndex = state.currentStep + 1;
    updateState({ currentStep: nextStepIndex });
    
    // Announce step change with voice guidance
    if (state.voiceGuidanceEnabled) {
      const nextStepInfo = ONBOARDING_STEPS[nextStepIndex];
      if (nextStepInfo) {
        const stepName = state.language === 'es' ? nextStepInfo.nameEs : nextStepInfo.name;
        const stepDesc = state.language === 'es' ? nextStepInfo.descriptionEs : nextStepInfo.description;
        speakText(`${stepName}. ${stepDesc || ''}`);
      }
    }
  };

  const previousStep = () => {
    if (state.currentStep > 0) {
      const prevStepIndex = state.currentStep - 1;
      updateState({ currentStep: prevStepIndex });
      
      // Announce step change with voice guidance
      if (state.voiceGuidanceEnabled) {
        const prevStepInfo = ONBOARDING_STEPS[prevStepIndex];
        if (prevStepInfo) {
          const stepName = state.language === 'es' ? prevStepInfo.nameEs : prevStepInfo.name;
          speakText(stepName);
        }
      }
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Only allow navigation to completed steps or the next step
    if (stepIndex <= state.currentStep || stepIndex === state.currentStep + 1 || state.completedSteps.includes(stepIndex)) {
      updateState({ currentStep: stepIndex });
    }
  };

  const handleLanguageSelect = (language: 'en' | 'es') => {
    updateState({ language });
    
    // Announce language selection with voice guidance
    if (language === 'en') {
      speakText('English selected. Welcome to the employee onboarding system.');
    } else {
      speakText('Español seleccionado. Bienvenido al sistema de incorporación de empleados.');
    }
    
    setTimeout(nextStep, 500); // Small delay for better UX
  };

  const handleAccessCodeSubmit = (code: string) => {
    updateState({ accessCode: code });
  };

  const handleAccessCodeValidated = async (isValid: boolean, employeeData?: any) => {
    if (isValid && employeeData) {
      updateState({ employeeData });
      
      // Store session data for API integration
      sessionStorage.setItem('onboardingSession', JSON.stringify({
        id: state.sessionId,
        accessCode: state.accessCode,
        employeeData,
        language: state.language
      }));
      
      // Announce successful validation with voice guidance
      speakText(state.language === 'es' 
        ? 'Código válido. Bienvenido ' + (employeeData.name || '') 
        : 'Valid code. Welcome ' + (employeeData.name || ''));
      
      setTimeout(nextStep, 1000);
    }
  };

  const resumeSession = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const savedState = JSON.parse(saved);
        setState({
          ...savedState,
          lastActivity: new Date()
        });
        
        // Announce session resumption with voice guidance
        speakText(state.language === 'es' 
          ? 'Sesión restaurada. Continuando desde donde lo dejó.' 
          : 'Session restored. Continuing from where you left off.');
      }
    } catch (error) {
      console.warn('Failed to resume session:', error);
    }
    setShowResumeDialog(false);
  };

  const startNewSession = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowResumeDialog(false);
    
    // Announce new session with voice guidance
    speakText(state.language === 'es' 
      ? 'Iniciando nueva sesión de incorporación.' 
      : 'Starting new onboarding session.');
  };

  const extendSession = () => {
    updateState({ lastActivity: new Date() });
    setSessionWarning(false);
    
    // Announce session extension with voice guidance
    speakText(state.language === 'es' 
      ? 'Sesión extendida. Puede continuar.' 
      : 'Session extended. You may continue.');
  };

  const toggleAccessibilityFeature = (feature: 'highContrastMode' | 'largeTextMode' | 'voiceGuidanceEnabled') => {
    const newValue = !state[feature];
    updateState({ [feature]: newValue });
    
    // Announce accessibility change
    if (feature === 'highContrastMode') {
      speakText(state.language === 'es' 
        ? `Modo de alto contraste ${newValue ? 'activado' : 'desactivado'}.` 
        : `High contrast mode ${newValue ? 'enabled' : 'disabled'}.`);
    } else if (feature === 'largeTextMode') {
      speakText(state.language === 'es' 
        ? `Texto grande ${newValue ? 'activado' : 'desactivado'}.` 
        : `Large text ${newValue ? 'enabled' : 'disabled'}.`);
    } else if (feature === 'voiceGuidanceEnabled') {
      speakText(state.language === 'es' 
        ? `Guía por voz ${newValue ? 'activada' : 'desactivada'}.` 
        : `Voice guidance ${newValue ? 'enabled' : 'disabled'}.`);
    }
  };

  const toggleTimeEstimates = () => {
    setShowTimeEstimates(!showTimeEstimates);
  };

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 0:
        return (
          <LanguageSelection
            onLanguageSelect={handleLanguageSelect}
            selectedLanguage={state.language}
            highContrast={state.highContrastMode}
            largeText={state.largeTextMode}
          />
        );
      
      case 1:
        return (
          <AccessCodeEntry
            onCodeSubmit={handleAccessCodeSubmit}
            onCodeValidated={handleAccessCodeValidated}
            language={state.language}
            highContrast={state.highContrastMode}
            largeText={state.largeTextMode}
          />
        );
      
      case 2:
        return (
          <DocumentCapture
            onDocumentsChange={(documents) => {
              // Extract OCR data for form auto-fill
              const ocrData = documents.reduce((acc: any, doc: any) => {
                if (doc.ocrData?.extractedFields) {
                  return { ...acc, ...doc.ocrData.extractedFields };
                }
                return acc;
              }, {});
              
              updateState({ 
                employeeData: { 
                  ...state.employeeData, 
                  documents,
                  ocrData // Pass OCR data for form auto-fill
                } 
              });
            }}
            onContinue={nextStep}
            onBack={previousStep}
            language={state.language}
            highContrast={state.highContrastMode}
            largeText={state.largeTextMode}
            maxDocuments={5}
            allowedTypes={['drivers_license', 'ssn_card', 'passport', 'birth_certificate', 'other']}
          />
        );
      
      case 3:
        return (
          <FormCompletion
            language={state.language}
            highContrastMode={state.highContrastMode}
            largeTextMode={state.largeTextMode}
            voiceGuidanceEnabled={false}
            employeeId={state.employeeData?.id || ''}
            ocrData={state.employeeData?.documents?.reduce((acc: any, doc: any) => {
              return { ...acc, ...doc.ocrData?.extractedFields };
            }, {})}
            onComplete={async (formData) => {
              // Submit forms to backend
              const sessionData = sessionStorage.getItem('onboardingSession');
              const session = sessionData ? JSON.parse(sessionData) : null;
              
              if (session) {
                try {
                  const result = await onboardingService.submitForms(session.id, formData, state.language);
                  
                  if (result.success) {
                    updateState({ 
                      employeeData: { 
                        ...state.employeeData, 
                        formSubmission: result,
                        formData
                      } 
                    });
                    nextStep();
                  } else {
                    console.error('Form submission failed');
                  }
                } catch (error) {
                  console.error('Error submitting forms:', error);
                }
              } else {
                nextStep();
              }
            }}
            onBack={previousStep}
          />
        );
      
      case 4:
        return (
          <DigitalSignature
            language={state.language}
            highContrast={state.highContrastMode}
            largeText={state.largeTextMode}
            employeeData={state.employeeData}
            documentsToSign={state.employeeData?.documents || []}
            onComplete={async (signatureData) => {
              // Submit signature to backend
              const sessionData = sessionStorage.getItem('onboardingSession');
              const session = sessionData ? JSON.parse(sessionData) : null;
              
              if (session) {
                try {
                  const result = await onboardingService.submitSignature(session.id, {
                    signatureBase64: signatureData.signatureBase64,
                    documentIds: signatureData.documentIds
                  });
                  
                  if (result.success) {
                    updateState({ 
                      employeeData: { 
                        ...state.employeeData, 
                        signature: signatureData 
                      } 
                    });
                    nextStep();
                  } else {
                    console.error('Signature submission failed');
                  }
                } catch (error) {
                  console.error('Error submitting signature:', error);
                }
              } else {
                nextStep();
              }
            }}
            onBack={previousStep}
          />
        );
      
      case 5:
        return (
          <div className="text-center p-8">
            <div className="text-6xl mb-6 animate-bounce">🎉</div>
            <h2 className={`font-bold ${state.highContrastMode ? 'text-yellow-400' : 'text-green-600'} mb-4 ${state.largeTextMode ? 'text-4xl' : 'text-3xl'}`}>
              {state.language === 'es' ? '¡Incorporación Completa!' : 'Onboarding Complete!'}
            </h2>
            <p className={`${state.highContrastMode ? 'text-gray-300' : 'text-gray-600'} mb-8 ${state.largeTextMode ? 'text-xl' : 'text-base'}`}>
              {state.language === 'es' 
                ? 'Bienvenido al equipo. Su proceso de incorporación se ha completado exitosamente.' 
                : 'Welcome to the team! Your onboarding process has been completed successfully.'
              }
            </p>
            {state.employeeData && (
              <div className={`${state.highContrastMode ? 'bg-yellow-100 border-yellow-400' : 'bg-green-50 border-green-200'} border rounded-lg p-4 mb-6`}>
                <p className={`${state.highContrastMode ? 'text-black' : 'text-green-800'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  <strong>
                    {state.language === 'es' ? 'Empleado:' : 'Employee:'} 
                  </strong> {state.employeeData.name}
                </p>
                <p className={`${state.highContrastMode ? 'text-black' : 'text-green-800'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  <strong>
                    {state.language === 'es' ? 'Posición:' : 'Position:'} 
                  </strong> {state.employeeData.position}
                </p>
                <p className={`${state.highContrastMode ? 'text-black' : 'text-green-800'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  <strong>
                    {state.language === 'es' ? 'Departamento:' : 'Department:'} 
                  </strong> {state.employeeData.department}
                </p>
                <p className={`${state.highContrastMode ? 'text-black' : 'text-green-800'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  <strong>
                    {state.language === 'es' ? 'Fecha de inicio:' : 'Start Date:'} 
                  </strong> {new Date(state.employeeData.startDate).toLocaleDateString()}
                </p>
              </div>
            )}
            <Button 
              onClick={async () => {
                // Complete onboarding session in backend
                const sessionData = sessionStorage.getItem('onboardingSession');
                const session = sessionData ? JSON.parse(sessionData) : null;
                
                if (session) {
                  try {
                    const result = await onboardingService.completeOnboarding(session.id);
                    
                    if (result.success) {
                      speakText(state.language === 'es' 
                        ? '¡Felicidades! Ha completado el proceso de incorporación.' 
                        : 'Congratulations! You have completed the onboarding process.');
                      
                      // Clear session storage
                      sessionStorage.removeItem('onboardingSession');
                      
                      onComplete?.(state);
                    } else {
                      console.error('Failed to complete onboarding:', result.message);
                    }
                  } catch (error) {
                    console.error('Error completing onboarding:', error);
                  }
                } else {
                  onComplete?.(state);
                }
              }}
              size="lg"
              className="px-8 animate-pulse"
            >
              {state.language === 'es' ? 'Finalizar' : 'Finish'}
            </Button>
          </div>
        );
      
      default:
        return null;
    }
  };

  // Render wizard for all devices - responsive design handles different screen sizes
  // Removed tablet-only restriction to make onboarding accessible on all devices

  // Apply high contrast mode
  const highContrastClasses = state.highContrastMode 
    ? 'bg-black text-white' 
    : 'bg-gray-50 text-gray-900';

  // Apply large text mode
  const textSizeClasses = state.largeTextMode 
    ? 'text-lg' 
    : 'text-base';

  return (
    <div 
      className={`min-h-screen ${highContrastClasses} ${textSizeClasses} ${className}`}
      onClick={trackActivity}
      onKeyDown={trackActivity}
      onTouchStart={trackActivity}
    >
      {/* Resume Session Dialog */}
      {showResumeDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card 
            className={`max-w-md p-6 ${state.highContrastMode ? 'bg-black text-white border-white' : ''}`}
          >
            <h3 className={`font-bold mb-4 ${state.largeTextMode ? 'text-xl' : 'text-lg'}`}>
              Resume Previous Session?
            </h3>
            <p className={`mb-6 ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
              We found a previous onboarding session. Would you like to continue where you left off?
            </p>
            <div className="flex gap-3">
              <Button 
                variant={state.highContrastMode ? 'primary' : 'outline'} 
                onClick={startNewSession} 
                className="flex-1"
                size={state.largeTextMode ? 'lg' : 'md'}
              >
                Start New
              </Button>
              <Button 
                onClick={resumeSession} 
                className="flex-1"
                size={state.largeTextMode ? 'lg' : 'md'}
              >
                Resume
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Session Warning */}
      {sessionWarning && !sessionTimeout && (
        <div className="fixed top-4 right-4 z-40 animate-pulse">
          <Card 
            className={`p-4 ${
              state.highContrastMode 
                ? 'bg-yellow-300 border-yellow-600' 
                : 'border-l-4 border-yellow-500 bg-yellow-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${state.highContrastMode ? 'text-black' : 'text-yellow-800'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                  {state.language === 'es' ? 'Advertencia de tiempo de sesión' : 'Session Timeout Warning'}
                </p>
                <p className={`${state.highContrastMode ? 'text-black' : 'text-yellow-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                  {state.language === 'es' 
                    ? 'Su sesión expirará pronto debido a inactividad.' 
                    : 'Your session will expire soon due to inactivity.'}
                </p>
              </div>
              <Button 
                size={state.largeTextMode ? 'md' : 'sm'} 
                onClick={extendSession}
                variant={state.highContrastMode ? 'primary' : 'default'}
              >
                {state.language === 'es' ? 'Extender' : 'Extend'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Session Timeout */}
      {sessionTimeout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card 
            className={`max-w-md p-6 ${state.highContrastMode ? 'bg-black text-white border-white' : ''}`}
          >
            <div className="text-4xl mb-4 text-center">⏰</div>
            <h3 className={`font-bold mb-4 text-center ${state.largeTextMode ? 'text-xl' : 'text-lg'}`}>
              {state.language === 'es' ? 'Sesión Expirada' : 'Session Expired'}
            </h3>
            <p className={`mb-6 text-center ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
              {state.language === 'es' 
                ? 'Su sesión ha expirado debido a inactividad. Por favor comience de nuevo.' 
                : 'Your session has expired due to inactivity. Please start again.'}
            </p>
            <div className="flex justify-center">
              <Button 
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  window.location.reload();
                }}
                size={state.largeTextMode ? 'lg' : 'md'}
              >
                {state.language === 'es' ? 'Comenzar de Nuevo' : 'Start Again'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Accessibility Menu */}
      <div className="fixed top-4 left-4 z-40">
        <div className="relative">
          {/* Main Accessibility Button */}
          <button
            onClick={() => setShowAccessibilityMenu(!showAccessibilityMenu)}
            className={`p-3 rounded-full ${
              state.highContrastMode 
                ? 'bg-white text-black' 
                : 'bg-primary-600 text-white'
            } shadow-lg`}
            aria-label="Accessibility options"
            title="Accessibility options"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>

          {/* Accessibility Menu */}
          {showAccessibilityMenu && (
            <div 
              className={`absolute top-full left-0 mt-2 p-3 rounded-lg shadow-xl ${
                state.highContrastMode 
                  ? 'bg-gray-900 border border-white' 
                  : 'bg-white border border-gray-200'
              }`}
              style={{ width: '280px' }}
            >
              <h3 className={`font-semibold mb-3 ${state.highContrastMode ? 'text-white' : 'text-gray-900'} ${state.largeTextMode ? 'text-lg' : 'text-base'}`}>
                {state.language === 'es' ? 'Opciones de Accesibilidad' : 'Accessibility Options'}
              </h3>
              
              <div className="space-y-3">
                {/* High Contrast Toggle */}
                <div className="flex items-center justify-between">
                  <span className={`${state.highContrastMode ? 'text-white' : 'text-gray-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                    {state.language === 'es' ? 'Alto Contraste' : 'High Contrast'}
                  </span>
                  <button
                    onClick={() => toggleAccessibilityFeature('highContrastMode')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      state.highContrastMode 
                        ? 'bg-yellow-400' 
                        : 'bg-gray-300'
                    }`}
                    aria-pressed={state.highContrastMode}
                    aria-label={state.highContrastMode ? 'Disable high contrast' : 'Enable high contrast'}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                        state.highContrastMode 
                          ? 'bg-black transform translate-x-6' 
                          : 'bg-white'
                      }`} 
                    />
                  </button>
                </div>
                
                {/* Large Text Toggle */}
                <div className="flex items-center justify-between">
                  <span className={`${state.highContrastMode ? 'text-white' : 'text-gray-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                    {state.language === 'es' ? 'Texto Grande' : 'Large Text'}
                  </span>
                  <button
                    onClick={() => toggleAccessibilityFeature('largeTextMode')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      state.largeTextMode 
                        ? (state.highContrastMode ? 'bg-yellow-400' : 'bg-primary-600')
                        : 'bg-gray-300'
                    }`}
                    aria-pressed={state.largeTextMode}
                    aria-label={state.largeTextMode ? 'Disable large text' : 'Enable large text'}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                        state.largeTextMode 
                          ? (state.highContrastMode ? 'bg-black transform translate-x-6' : 'bg-white transform translate-x-6')
                          : 'bg-white'
                      }`} 
                    />
                  </button>
                </div>
                
                {/* Voice Guidance Toggle */}
                <div className="flex items-center justify-between">
                  <span className={`${state.highContrastMode ? 'text-white' : 'text-gray-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                    {state.language === 'es' ? 'Guía por Voz' : 'Voice Guidance'}
                  </span>
                  <button
                    onClick={() => toggleAccessibilityFeature('voiceGuidanceEnabled')}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      state.voiceGuidanceEnabled 
                        ? (state.highContrastMode ? 'bg-yellow-400' : 'bg-primary-600')
                        : 'bg-gray-300'
                    }`}
                    aria-pressed={state.voiceGuidanceEnabled}
                    aria-label={state.voiceGuidanceEnabled ? 'Disable voice guidance' : 'Enable voice guidance'}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                        state.voiceGuidanceEnabled 
                          ? (state.highContrastMode ? 'bg-black transform translate-x-6' : 'bg-white transform translate-x-6')
                          : 'bg-white'
                      }`} 
                    />
                  </button>
                </div>
                
                {/* Time Estimates Toggle */}
                <div className="flex items-center justify-between">
                  <span className={`${state.highContrastMode ? 'text-white' : 'text-gray-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                    {state.language === 'es' ? 'Mostrar Tiempos' : 'Show Time Estimates'}
                  </span>
                  <button
                    onClick={toggleTimeEstimates}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      showTimeEstimates 
                        ? (state.highContrastMode ? 'bg-yellow-400' : 'bg-primary-600')
                        : 'bg-gray-300'
                    }`}
                    aria-pressed={showTimeEstimates}
                    aria-label={showTimeEstimates ? 'Hide time estimates' : 'Show time estimates'}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                        showTimeEstimates 
                          ? (state.highContrastMode ? 'bg-black transform translate-x-6' : 'bg-white transform translate-x-6')
                          : 'bg-white'
                      }`} 
                    />
                  </button>
                </div>
                
                {/* Fullscreen Toggle */}
                <div className="flex items-center justify-between">
                  <span className={`${state.highContrastMode ? 'text-white' : 'text-gray-700'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
                    {state.language === 'es' ? 'Pantalla Completa' : 'Fullscreen'}
                  </span>
                  <button
                    onClick={toggleFullscreen}
                    className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      isFullscreen 
                        ? (state.highContrastMode ? 'bg-yellow-400' : 'bg-primary-600')
                        : 'bg-gray-300'
                    }`}
                    aria-pressed={isFullscreen}
                    aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                  >
                    <span 
                      className={`block w-4 h-4 rounded-full transition-transform duration-300 ${
                        isFullscreen 
                          ? (state.highContrastMode ? 'bg-black transform translate-x-6' : 'bg-white transform translate-x-6')
                          : 'bg-white'
                      }`} 
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto p-6">
        {/* Progress Indicator */}
        <div className="mb-8">
          <EnhancedProgressIndicator
            steps={ONBOARDING_STEPS}
            currentStep={state.currentStep}
            completedSteps={state.completedSteps}
            language={state.language}
            highContrast={state.highContrastMode}
            largeText={state.largeTextMode}
            onStepClick={handleStepClick}
            showTimeEstimates={showTimeEstimates}
            animateTransitions={true}
            voiceGuidance={state.voiceGuidanceEnabled}
          />
        </div>

        {/* Step Content */}
        <div className="flex justify-center">
          <div 
            className="w-full"
            style={{ maxWidth: tablet.onboarding.wizard.maxWidth }}
          >
            {renderCurrentStep()}
          </div>
        </div>

        {/* Navigation */}
        {state.currentStep > 0 && state.currentStep < 5 && (
          <div className="flex justify-between mt-8 px-6">
            <Button
              variant={state.highContrastMode ? 'primary' : 'outline'}
              onClick={previousStep}
              disabled={state.currentStep === 0}
              size={state.largeTextMode ? 'lg' : 'md'}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {state.language === 'es' ? 'Anterior' : 'Previous'}
            </Button>
            
            <div className={`flex items-center ${state.highContrastMode ? 'text-white' : 'text-gray-500'} ${state.largeTextMode ? 'text-base' : 'text-sm'}`}>
              {state.language === 'es' ? 'Paso' : 'Step'} {state.currentStep + 1} of 6
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingWizard;