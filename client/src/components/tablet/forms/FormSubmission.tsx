import React, { useState, useEffect } from 'react';
import { FormData } from '../../../types/forms';

interface FormSubmissionProps {
  language: 'en' | 'es';
  highContrastMode: boolean;
  largeTextMode: boolean;
  i9Data: Partial<FormData>;
  w4Data: Partial<FormData>;
  signatures: Record<string, string>;
  isSubmitting: boolean;
  error?: string;
  onSubmit: () => void;
  onBack: () => void;
}

interface SubmissionState {
  showReceipt: boolean;
  submissionId: string;
  submissionTime: string;
  confirmationChecks: Record<string, boolean>;
}

export const FormSubmission: React.FC<FormSubmissionProps> = ({
  language,
  highContrastMode,
  largeTextMode,
  i9Data,
  w4Data,
  signatures,
  isSubmitting,
  error,
  onSubmit,
  onBack
}) => {
  const [state, setState] = useState<SubmissionState>({
    showReceipt: false,
    submissionId: '',
    submissionTime: '',
    confirmationChecks: {
      accuracy: false,
      completeness: false,
      authorization: false,
      penalties: false
    }
  });

  const t = {
    en: {
      title: 'Submit Your Forms',
      subtitle: 'Final review and submission of your onboarding documents',
      submissionSummary: 'Submission Summary',
      formsIncluded: 'Forms Included',
      i9Form: 'Form I-9: Employment Eligibility Verification',
      w4Form: 'Form W-4: Employee\'s Withholding Certificate',
      signaturesIncluded: 'Digital Signatures Included',
      i9Signature: 'I-9 Employee Signature',
      w4Signature: 'W-4 Employee Signature',
      confirmationRequired: 'Confirmation Required',
      confirmationInstructions: 'Please confirm the following before submitting:',
      accuracyCheck: 'I certify that all information provided is accurate and complete to the best of my knowledge.',
      completenessCheck: 'I have reviewed all forms and understand that incomplete information may delay my onboarding.',
      authorizationCheck: 'I authorize my employer to verify the information provided and process these forms.',
      penaltiesCheck: 'I understand that providing false information may result in penalties under federal law.',
      allConfirmationsRequired: 'All confirmations must be checked before submission.',
      submitForms: 'Submit Forms',
      submitting: 'Submitting Forms...',
      back: 'Back to Signatures',
      submissionComplete: 'Submission Complete!',
      submissionSuccess: 'Your forms have been successfully submitted for review.',
      submissionId: 'Submission ID',
      submittedAt: 'Submitted at',
      nextSteps: 'Next Steps',
      nextStepsText: 'Your manager and HR will review your submission. You will be notified once approved.',
      receiptTitle: 'Submission Receipt',
      downloadReceipt: 'Download Receipt',
      printReceipt: 'Print Receipt',
      continueOnboarding: 'Continue Onboarding',
      errorTitle: 'Submission Error',
      errorMessage: 'There was an error submitting your forms. Please try again.',
      retrySubmission: 'Retry Submission',
      contactSupport: 'Contact Support',
      formStatus: 'Form Status',
      signatureStatus: 'Signature Status',
      present: 'Present',
      missing: 'Missing',
      valid: 'Valid',
      invalid: 'Invalid',
      estimatedReviewTime: 'Estimated Review Time',
      reviewTime: '1-2 business days',
      importantNotice: 'Important Notice',
      noticeText: 'Keep this receipt for your records. Your employment authorization is pending review and approval of these documents.'
    },
    es: {
      title: 'Enviar Sus Formularios',
      subtitle: 'Revisión final y envío de sus documentos de incorporación',
      submissionSummary: 'Resumen del Envío',
      formsIncluded: 'Formularios Incluidos',
      i9Form: 'Formulario I-9: Verificación de Elegibilidad de Empleo',
      w4Form: 'Formulario W-4: Certificado de Retenciones del Empleado',
      signaturesIncluded: 'Firmas Digitales Incluidas',
      i9Signature: 'Firma del Empleado I-9',
      w4Signature: 'Firma del Empleado W-4',
      confirmationRequired: 'Confirmación Requerida',
      confirmationInstructions: 'Por favor confirme lo siguiente antes de enviar:',
      accuracyCheck: 'Certifico que toda la información proporcionada es precisa y completa según mi mejor conocimiento.',
      completenessCheck: 'He revisado todos los formularios y entiendo que la información incompleta puede retrasar mi incorporación.',
      authorizationCheck: 'Autorizo a mi empleador a verificar la información proporcionada y procesar estos formularios.',
      penaltiesCheck: 'Entiendo que proporcionar información falsa puede resultar en penalidades bajo la ley federal.',
      allConfirmationsRequired: 'Todas las confirmaciones deben ser marcadas antes del envío.',
      submitForms: 'Enviar Formularios',
      submitting: 'Enviando Formularios...',
      back: 'Volver a las Firmas',
      submissionComplete: '¡Envío Completo!',
      submissionSuccess: 'Sus formularios han sido enviados exitosamente para revisión.',
      submissionId: 'ID de Envío',
      submittedAt: 'Enviado en',
      nextSteps: 'Próximos Pasos',
      nextStepsText: 'Su gerente y RR.HH. revisarán su envío. Será notificado una vez aprobado.',
      receiptTitle: 'Recibo de Envío',
      downloadReceipt: 'Descargar Recibo',
      printReceipt: 'Imprimir Recibo',
      continueOnboarding: 'Continuar Incorporación',
      errorTitle: 'Error de Envío',
      errorMessage: 'Hubo un error al enviar sus formularios. Por favor intente de nuevo.',
      retrySubmission: 'Reintentar Envío',
      contactSupport: 'Contactar Soporte',
      formStatus: 'Estado del Formulario',
      signatureStatus: 'Estado de la Firma',
      present: 'Presente',
      missing: 'Faltante',
      valid: 'Válido',
      invalid: 'Inválido',
      estimatedReviewTime: 'Tiempo Estimado de Revisión',
      reviewTime: '1-2 días hábiles',
      importantNotice: 'Aviso Importante',
      noticeText: 'Guarde este recibo para sus registros. Su autorización de empleo está pendiente de revisión y aprobación de estos documentos.'
    }
  };

  const currentT = t[language];

  // Generate submission ID and timestamp when component mounts
  useEffect(() => {
    if (!state.submissionId) {
      setState(prev => ({
        ...prev,
        submissionId: `SUB-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        submissionTime: new Date().toISOString()
      }));
    }
  }, [state.submissionId]);

  const handleConfirmationChange = (key: string, checked: boolean) => {
    setState(prev => ({
      ...prev,
      confirmationChecks: {
        ...prev.confirmationChecks,
        [key]: checked
      }
    }));
  };

  const allConfirmationsChecked = Object.values(state.confirmationChecks).every(checked => checked);

  const handleSubmit = () => {
    if (allConfirmationsChecked && !isSubmitting) {
      onSubmit();
    }
  };

  const getFormStatus = (formData: Partial<FormData>) => {
    if (!formData.data) return { status: 'missing', color: 'red' };
    if (formData.status === 'completed') return { status: 'valid', color: 'green' };
    return { status: 'invalid', color: 'yellow' };
  };

  const getSignatureStatus = (signatureKey: string) => {
    if (signatures[signatureKey]) return { status: 'present', color: 'green' };
    return { status: 'missing', color: 'red' };
  };

  const renderStatusBadge = (status: string, color: string) => (
    <span className={`px-2 py-1 text-xs rounded font-medium ${
      color === 'green' 
        ? (highContrastMode ? 'bg-green-800 text-green-200' : 'bg-green-100 text-green-800')
        : color === 'yellow'
        ? (highContrastMode ? 'bg-yellow-800 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
        : (highContrastMode ? 'bg-red-800 text-red-200' : 'bg-red-100 text-red-800')
    }`}>
      {currentT[status as keyof typeof currentT] || status}
    </span>
  );

  const renderSubmissionSummary = () => (
    <div className={`mb-8 ${highContrastMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm border p-6`}>
      <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-6`}>
        {currentT.submissionSummary}
      </h3>

      {/* Forms Status */}
      <div className="mb-6">
        <h4 className={`font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-3`}>
          {currentT.formsIncluded}
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.i9Form}
            </span>
            {renderStatusBadge(getFormStatus(i9Data).status, getFormStatus(i9Data).color)}
          </div>
          <div className="flex justify-between items-center">
            <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.w4Form}
            </span>
            {renderStatusBadge(getFormStatus(w4Data).status, getFormStatus(w4Data).color)}
          </div>
        </div>
      </div>

      {/* Signatures Status */}
      <div className="mb-6">
        <h4 className={`font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-3`}>
          {currentT.signaturesIncluded}
        </h4>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.i9Signature}
            </span>
            {renderStatusBadge(getSignatureStatus('i9_signature').status, getSignatureStatus('i9_signature').color)}
          </div>
          <div className="flex justify-between items-center">
            <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {currentT.w4Signature}
            </span>
            {renderStatusBadge(getSignatureStatus('w4_signature').status, getSignatureStatus('w4_signature').color)}
          </div>
        </div>
      </div>

      {/* Submission Details */}
      <div className={`p-4 ${highContrastMode ? 'bg-gray-600' : 'bg-gray-50'} rounded-lg`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className={`font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.submissionId}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'} font-mono`}>
              {state.submissionId}
            </span>
          </div>
          <div>
            <span className={`font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.estimatedReviewTime}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {currentT.reviewTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderConfirmationChecks = () => (
    <div className={`mb-8 ${highContrastMode ? 'bg-gray-700' : 'bg-white'} rounded-lg shadow-sm border p-6`}>
      <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-4`}>
        {currentT.confirmationRequired}
      </h3>
      
      <p className={`mb-6 ${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
        {currentT.confirmationInstructions}
      </p>

      <div className="space-y-4">
        {[
          { key: 'accuracy', text: currentT.accuracyCheck },
          { key: 'completeness', text: currentT.completenessCheck },
          { key: 'authorization', text: currentT.authorizationCheck },
          { key: 'penalties', text: currentT.penaltiesCheck }
        ].map(({ key, text }) => (
          <label key={key} className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={state.confirmationChecks[key]}
              onChange={(e) => handleConfirmationChange(key, e.target.checked)}
              className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
              {text}
            </span>
          </label>
        ))}
      </div>

      {!allConfirmationsChecked && (
        <div className={`mt-4 p-3 ${highContrastMode ? 'bg-yellow-900' : 'bg-yellow-50'} border border-yellow-200 rounded-lg`}>
          <p className={`text-sm ${highContrastMode ? 'text-yellow-200' : 'text-yellow-800'}`}>
            {currentT.allConfirmationsRequired}
          </p>
        </div>
      )}
    </div>
  );

  const renderError = () => (
    <div className={`mb-8 ${highContrastMode ? 'bg-red-900' : 'bg-red-50'} border border-red-200 rounded-lg p-6`}>
      <div className="flex items-center mb-4">
        <span className="text-2xl mr-3">❌</span>
        <h3 className={`font-semibold ${largeTextMode ? 'text-xl' : 'text-lg'} ${highContrastMode ? 'text-red-200' : 'text-red-800'}`}>
          {currentT.errorTitle}
        </h3>
      </div>
      <p className={`mb-4 ${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-red-300' : 'text-red-700'}`}>
        {error || currentT.errorMessage}
      </p>
      <div className="flex space-x-4">
        <button
          type="button"
          onClick={handleSubmit}
          className={`px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors ${largeTextMode ? 'text-base' : 'text-sm'}`}
        >
          {currentT.retrySubmission}
        </button>
        <button
          type="button"
          onClick={() => {/* TODO: Implement support contact */}}
          className={`px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-50 transition-colors ${largeTextMode ? 'text-base' : 'text-sm'}`}
        >
          {currentT.contactSupport}
        </button>
      </div>
    </div>
  );

  const renderSuccessReceipt = () => (
    <div className={`${highContrastMode ? 'bg-green-900' : 'bg-green-50'} border border-green-200 rounded-lg p-6`}>
      <div className="text-center mb-6">
        <span className="text-6xl mb-4 block">✅</span>
        <h2 className={`font-bold ${largeTextMode ? 'text-2xl' : 'text-xl'} ${highContrastMode ? 'text-green-200' : 'text-green-800'} mb-2`}>
          {currentT.submissionComplete}
        </h2>
        <p className={`${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-green-300' : 'text-green-700'}`}>
          {currentT.submissionSuccess}
        </p>
      </div>

      <div className={`mb-6 p-4 ${highContrastMode ? 'bg-green-800' : 'bg-white'} rounded-lg`}>
        <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-4`}>
          {currentT.receiptTitle}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className={`font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.submissionId}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'} font-mono`}>
              {state.submissionId}
            </span>
          </div>
          <div>
            <span className={`font-medium ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.submittedAt}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {new Date(state.submissionTime).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className={`mb-6 p-4 ${highContrastMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg`}>
        <h4 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-blue-200' : 'text-blue-800'} mb-2`}>
          {currentT.nextSteps}
        </h4>
        <p className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-blue-300' : 'text-blue-700'}`}>
          {currentT.nextStepsText}
        </p>
      </div>

      <div className={`mb-6 p-4 ${highContrastMode ? 'bg-yellow-900' : 'bg-yellow-50'} border border-yellow-200 rounded-lg`}>
        <h4 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-yellow-200' : 'text-yellow-800'} mb-2`}>
          {currentT.importantNotice}
        </h4>
        <p className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
          {currentT.noticeText}
        </p>
      </div>

      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={() => window.print()}
          className={`px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-colors ${largeTextMode ? 'text-lg' : 'text-base'}`}
        >
          {currentT.printReceipt}
        </button>
        <button
          type="button"
          onClick={() => {/* TODO: Continue to next onboarding step */}}
          className={`px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ${largeTextMode ? 'text-lg' : 'text-base'}`}
        >
          {currentT.continueOnboarding}
        </button>
      </div>
    </div>
  );

  // Show success receipt if submission was successful (no error and not currently submitting)
  if (!error && !isSubmitting && state.submissionTime) {
    return (
      <div className={`${highContrastMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-lg p-6`}>
        {renderSuccessReceipt()}
      </div>
    );
  }

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

      {error && renderError()}
      {renderSubmissionSummary()}
      {renderConfirmationChecks()}

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className={`px-6 py-3 border border-gray-300 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            isSubmitting
              ? 'opacity-50 cursor-not-allowed'
              : highContrastMode 
                ? 'text-white border-gray-600 hover:bg-gray-700' 
                : 'text-gray-700 hover:bg-gray-50'
          } transition-colors`}
        >
          {currentT.back}
        </button>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allConfirmationsChecked || isSubmitting}
          className={`px-6 py-3 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            (!allConfirmationsChecked || isSubmitting)
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          } transition-colors flex items-center space-x-2`}
        >
          {isSubmitting && (
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>{isSubmitting ? currentT.submitting : currentT.submitForms}</span>
        </button>
      </div>
    </div>
  );
};