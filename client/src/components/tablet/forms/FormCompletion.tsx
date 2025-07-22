import React, { useState, useEffect, useCallback } from 'react';
import { I9Form } from './I9Form';
import { W4Form } from './W4Form';
import { FormReview } from './FormReview';
import { DigitalSignature } from './DigitalSignature';
import { FormSubmission } from './FormSubmission';
import { FormType, FormData, FormValidationResult } from '../../../types/forms';

interface FormCompletionProps {
  language: 'en' | 'es';
  highContrastMode: boolean;
  largeTextMode: boolean;
  voiceGuidanceEnabled: boolean;
  employeeId: string;
  ocrData?: Record<string, any>;
  onComplete: (formData: FormData[]) => void;
  onBack: () => void;
}

type FormStep = 'i9' | 'w4' | 'review' | 'signature' | 'submission';

interface FormState {
  i9Data: Partial<FormData>;
  w4Data: Partial<FormData>;
  currentStep: FormStep;
  validationResults: Record<FormType, FormValidationResult>;
  signatures: Record<string, string>;
  isSubmitting: boolean;
  submitError?: string;
}

export const FormCompletion: React.FC<FormCompletionProps> = ({
  language,
  highContrastMode,
  largeTextMode,
  voiceGuidanceEnabled,
  employeeId,
  ocrData,
  onComplete,
  onBack
}) => {
  const [state, setState] = useState<FormState>({
    i9Data: {},
    w4Data: {},
    currentStep: 'i9',
    validationResults: {} as Record<FormType, FormValidationResult>,
    signatures: {},
    isSubmitting: false
  });

  const t = {
    en: {
      title: 'Complete Required Forms',
      subtitle: 'Fill out I-9 and W-4 forms with your information',
      i9Title: 'Form I-9: Employment Eligibility Verification',
      w4Title: 'Form W-4: Employee\'s Withholding Certificate',
      reviewTitle: 'Review Your Forms',
      signatureTitle: 'Digital Signatures',
      submissionTitle: 'Submit Forms',
      next: 'Next',
      back: 'Back',
      submit: 'Submit Forms',
      saving: 'Saving...',
      submitting: 'Submitting...',
      error: 'Error',
      success: 'Success',
      formProgress: 'Form Progress',
      step: 'Step',
      of: 'of',
      required: 'Required',
      optional: 'Optional',
      validationError: 'Please fix the errors before continuing',
      autoFilled: 'Auto-filled from documents',
      manualEntry: 'Manual entry required'
    },
    es: {
      title: 'Complete los Formularios Requeridos',
      subtitle: 'Complete los formularios I-9 y W-4 con su información',
      i9Title: 'Formulario I-9: Verificación de Elegibilidad de Empleo',
      w4Title: 'Formulario W-4: Certificado de Retenciones del Empleado',
      reviewTitle: 'Revise Sus Formularios',
      signatureTitle: 'Firmas Digitales',
      submissionTitle: 'Enviar Formularios',
      next: 'Siguiente',
      back: 'Atrás',
      submit: 'Enviar Formularios',
      saving: 'Guardando...',
      submitting: 'Enviando...',
      error: 'Error',
      success: 'Éxito',
      formProgress: 'Progreso del Formulario',
      step: 'Paso',
      of: 'de',
      required: 'Requerido',
      optional: 'Opcional',
      validationError: 'Por favor corrija los errores antes de continuar',
      autoFilled: 'Completado automáticamente desde documentos',
      manualEntry: 'Entrada manual requerida'
    }
  };

  const currentT = t[language];

  // Auto-save form data periodically
  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (state.i9Data.data || state.w4Data.data) {
        saveFormData();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(saveInterval);
  }, [state.i9Data, state.w4Data]);

  const saveFormData = useCallback(async () => {
    try {
      // Save to localStorage as backup
      localStorage.setItem(`form_data_${employeeId}`, JSON.stringify({
        i9Data: state.i9Data,
        w4Data: state.w4Data,
        timestamp: new Date().toISOString()
      }));

      // TODO: Save to server
      // await formService.saveFormData(employeeId, state.i9Data, state.w4Data);
    } catch (error) {
      console.error('Failed to save form data:', error);
    }
  }, [employeeId, state.i9Data, state.w4Data]);

  const handleI9Complete = useCallback((formData: Partial<FormData>) => {
    setState(prev => ({
      ...prev,
      i9Data: formData,
      currentStep: 'w4'
    }));
  }, []);

  const handleW4Complete = useCallback((formData: Partial<FormData>) => {
    setState(prev => ({
      ...prev,
      w4Data: formData,
      currentStep: 'review'
    }));
  }, []);

  const handleReviewComplete = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'signature'
    }));
  }, []);

  const handleSignatureComplete = useCallback((signatures: Record<string, string>) => {
    setState(prev => ({
      ...prev,
      signatures,
      currentStep: 'submission'
    }));
  }, []);

  const handleFormSubmission = useCallback(async () => {
    setState(prev => ({ ...prev, isSubmitting: true, submitError: undefined }));

    try {
      const formsData: FormData[] = [];

      if (state.i9Data.data) {
        formsData.push({
          ...state.i9Data,
          employeeId,
          status: 'submitted',
          submittedAt: new Date()
        } as FormData);
      }

      if (state.w4Data.data) {
        formsData.push({
          ...state.w4Data,
          employeeId,
          status: 'submitted',
          submittedAt: new Date()
        } as FormData);
      }

      // Clear saved data
      localStorage.removeItem(`form_data_${employeeId}`);

      onComplete(formsData);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isSubmitting: false,
        submitError: error instanceof Error ? error.message : 'Unknown error occurred'
      }));
    }
  }, [employeeId, state.i9Data, state.w4Data, onComplete]);

  const handleBack = useCallback(() => {
    switch (state.currentStep) {
      case 'w4':
        setState(prev => ({ ...prev, currentStep: 'i9' }));
        break;
      case 'review':
        setState(prev => ({ ...prev, currentStep: 'w4' }));
        break;
      case 'signature':
        setState(prev => ({ ...prev, currentStep: 'review' }));
        break;
      case 'submission':
        setState(prev => ({ ...prev, currentStep: 'signature' }));
        break;
      default:
        onBack();
    }
  }, [state.currentStep, onBack]);

  const getStepNumber = (step: FormStep): number => {
    const steps: FormStep[] = ['i9', 'w4', 'review', 'signature', 'submission'];
    return steps.indexOf(step) + 1;
  };

  const renderProgressIndicator = () => (
    <div className={`mb-8 ${highContrastMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-4 shadow-sm`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
          {currentT.formProgress}
        </h3>
        <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {currentT.step} {getStepNumber(state.currentStep)} {currentT.of} 5
        </span>
      </div>
      <div className={`w-full ${highContrastMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(getStepNumber(state.currentStep) / 5) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'i9':
        return (
          <I9Form
            language={language}
            highContrastMode={highContrastMode}
            largeTextMode={largeTextMode}
            voiceGuidanceEnabled={voiceGuidanceEnabled}
            employeeId={employeeId}
            ocrData={ocrData}
            initialData={state.i9Data}
            onComplete={handleI9Complete}
            onBack={handleBack}
          />
        );

      case 'w4':
        return (
          <W4Form
            language={language}
            highContrastMode={highContrastMode}
            largeTextMode={largeTextMode}
            voiceGuidanceEnabled={voiceGuidanceEnabled}
            employeeId={employeeId}
            ocrData={ocrData}
            initialData={state.w4Data}
            onComplete={handleW4Complete}
            onBack={handleBack}
          />
        );

      case 'review':
        return (
          <FormReview
            language={language}
            highContrastMode={highContrastMode}
            largeTextMode={largeTextMode}
            i9Data={state.i9Data}
            w4Data={state.w4Data}
            onComplete={handleReviewComplete}
            onBack={handleBack}
            onEdit={(formType: FormType) => {
              setState(prev => ({ ...prev, currentStep: formType as FormStep }));
            }}
          />
        );

      case 'signature':
        return (
          <DigitalSignature
            language={language}
            highContrastMode={highContrastMode}
            largeTextMode={largeTextMode}
            forms={[
              { type: 'i9', data: state.i9Data },
              { type: 'w4', data: state.w4Data }
            ]}
            onComplete={handleSignatureComplete}
            onBack={handleBack}
          />
        );

      case 'submission':
        return (
          <FormSubmission
            language={language}
            highContrastMode={highContrastMode}
            largeTextMode={largeTextMode}
            i9Data={state.i9Data}
            w4Data={state.w4Data}
            signatures={state.signatures}
            isSubmitting={state.isSubmitting}
            error={state.submitError}
            onSubmit={handleFormSubmission}
            onBack={handleBack}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen ${highContrastMode ? 'bg-gray-900' : 'bg-gray-50'} p-4`}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className={`font-bold ${largeTextMode ? 'text-4xl' : 'text-3xl'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            {currentT.title}
          </h1>
          <p className={`${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {currentT.subtitle}
          </p>
        </div>

        {renderProgressIndicator()}
        {renderCurrentStep()}
      </div>
    </div>
  );
};