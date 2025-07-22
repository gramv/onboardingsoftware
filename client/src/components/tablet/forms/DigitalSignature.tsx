import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FormData } from '../../../types/forms';

interface DigitalSignatureProps {
  language: 'en' | 'es';
  highContrastMode: boolean;
  largeTextMode: boolean;
  forms: Array<{ type: 'i9' | 'w4'; data: Partial<FormData> }>;
  onComplete: (signatures: Record<string, string>) => void;
  onBack: () => void;
}

interface SignatureState {
  signatures: Record<string, string>;
  currentForm: number;
  isDrawing: boolean;
  lastPoint: { x: number; y: number } | null;
  signatureMetadata: Record<string, {
    timestamp: string;
    ipAddress: string;
    pressure: number[];
    duration: number;
    points: number;
  }>;
}

export const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  language,
  highContrastMode,
  largeTextMode,
  forms,
  onComplete,
  onBack
}) => {
  const canvasRefs = useRef<Record<string, HTMLCanvasElement | null>>({});
  const [state, setState] = useState<SignatureState>({
    signatures: {},
    currentForm: 0,
    isDrawing: false,
    lastPoint: null,
    signatureMetadata: {}
  });

  const t = {
    en: {
      title: 'Digital Signatures Required',
      subtitle: 'Please sign each form to complete your onboarding',
      i9Signature: 'I-9 Form Employee Signature',
      w4Signature: 'W-4 Form Employee Signature',
      signHere: 'Sign Here',
      clear: 'Clear',
      next: 'Next Form',
      complete: 'Complete Signatures',
      back: 'Back',
      signatureRequired: 'Signature is required',
      signatureInstructions: 'Use your finger or stylus to sign in the box below',
      legalNotice: 'By signing this form, you certify that the information provided is true and accurate.',
      attestation: 'Employee Attestation',
      i9Attestation: 'I attest, under penalty of perjury, that I am authorized to work in the United States and that the information I have provided is true and complete.',
      w4Attestation: 'Under penalties of perjury, I declare that this certificate, to the best of my knowledge and belief, is true, correct, and complete.',
      signatureMetadata: 'Signature Details',
      timestamp: 'Signed at',
      duration: 'Signature duration',
      points: 'Data points captured',
      pressure: 'Average pressure',
      seconds: 'seconds',
      pressureSupport: 'Pressure sensitivity supported',
      noPressureSupport: 'Basic touch input detected'
    },
    es: {
      title: 'Firmas Digitales Requeridas',
      subtitle: 'Por favor firme cada formulario para completar su incorporación',
      i9Signature: 'Firma del Empleado Formulario I-9',
      w4Signature: 'Firma del Empleado Formulario W-4',
      signHere: 'Firme Aquí',
      clear: 'Limpiar',
      next: 'Siguiente Formulario',
      complete: 'Completar Firmas',
      back: 'Atrás',
      signatureRequired: 'Se requiere firma',
      signatureInstructions: 'Use su dedo o lápiz óptico para firmar en el cuadro de abajo',
      legalNotice: 'Al firmar este formulario, certifica que la información proporcionada es verdadera y precisa.',
      attestation: 'Certificación del Empleado',
      i9Attestation: 'Certifico, bajo pena de perjurio, que estoy autorizado para trabajar en los Estados Unidos y que la información que he proporcionado es verdadera y completa.',
      w4Attestation: 'Bajo pena de perjurio, declaro que este certificado, según mi mejor conocimiento y creencia, es verdadero, correcto y completo.',
      signatureMetadata: 'Detalles de la Firma',
      timestamp: 'Firmado en',
      duration: 'Duración de la firma',
      points: 'Puntos de datos capturados',
      pressure: 'Presión promedio',
      seconds: 'segundos',
      pressureSupport: 'Sensibilidad de presión soportada',
      noPressureSupport: 'Entrada táctil básica detectada'
    }
  };

  const currentT = t[language];
  const currentForm = forms[state.currentForm];
  const formKey = `${currentForm?.type}_signature`;

  // Initialize canvas when component mounts or form changes
  useEffect(() => {
    const canvas = canvasRefs.current[formKey];
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Set canvas size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
        
        // Set drawing styles
        ctx.strokeStyle = highContrastMode ? '#ffffff' : '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Restore signature if it exists
        if (state.signatures[formKey]) {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, 0, 0);
          };
          img.src = state.signatures[formKey];
        }
      }
    }
  }, [state.currentForm, formKey, highContrastMode]);

  const getEventPoint = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRefs.current[formKey];
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number, pressure = 0.5;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      const touch = e.touches[0];
      clientX = touch.clientX;
      clientY = touch.clientY;
      
      // Try to get pressure from touch event
      if ('force' in touch && touch.force > 0) {
        pressure = touch.force;
      } else if ('webkitForce' in touch && (touch as any).webkitForce > 0) {
        pressure = (touch as any).webkitForce;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
      
      // Try to get pressure from pointer event
      if ('pressure' in e && (e as any).pressure > 0) {
        pressure = (e as any).pressure;
      }
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
      pressure
    };
  }, [formKey]);

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    const point = getEventPoint(e);
    if (!point) return;

    setState(prev => ({
      ...prev,
      isDrawing: true,
      lastPoint: { x: point.x, y: point.y },
      signatureMetadata: {
        ...prev.signatureMetadata,
        [formKey]: {
          timestamp: new Date().toISOString(),
          ipAddress: 'client-side', // Would be set server-side in real implementation
          pressure: [point.pressure],
          duration: 0,
          points: 1
        }
      }
    }));
  }, [getEventPoint, formKey]);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!state.isDrawing) return;

    const point = getEventPoint(e);
    if (!point || !state.lastPoint) return;

    const canvas = canvasRefs.current[formKey];
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    // Draw line with pressure-sensitive width
    const pressureWidth = Math.max(1, point.pressure * 4);
    ctx.lineWidth = pressureWidth;
    
    ctx.beginPath();
    ctx.moveTo(state.lastPoint.x, state.lastPoint.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();

    setState(prev => ({
      ...prev,
      lastPoint: { x: point.x, y: point.y },
      signatureMetadata: {
        ...prev.signatureMetadata,
        [formKey]: {
          ...prev.signatureMetadata[formKey],
          pressure: [...(prev.signatureMetadata[formKey]?.pressure || []), point.pressure],
          points: (prev.signatureMetadata[formKey]?.points || 0) + 1
        }
      }
    }));
  }, [state.isDrawing, state.lastPoint, getEventPoint, formKey]);

  const stopDrawing = useCallback(() => {
    if (!state.isDrawing) return;

    const canvas = canvasRefs.current[formKey];
    if (canvas) {
      // Save signature as base64
      const signatureData = canvas.toDataURL('image/png');
      
      setState(prev => {
        const startTime = new Date(prev.signatureMetadata[formKey]?.timestamp || new Date().toISOString()).getTime();
        const duration = (Date.now() - startTime) / 1000;
        
        return {
          ...prev,
          isDrawing: false,
          lastPoint: null,
          signatures: {
            ...prev.signatures,
            [formKey]: signatureData
          },
          signatureMetadata: {
            ...prev.signatureMetadata,
            [formKey]: {
              ...prev.signatureMetadata[formKey],
              duration
            }
          }
        };
      });
    }
  }, [state.isDrawing, formKey]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRefs.current[formKey];
    const ctx = canvas?.getContext('2d');
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setState(prev => ({
        ...prev,
        signatures: {
          ...prev.signatures,
          [formKey]: ''
        },
        signatureMetadata: {
          ...prev.signatureMetadata,
          [formKey]: {
            timestamp: '',
            ipAddress: '',
            pressure: [],
            duration: 0,
            points: 0
          }
        }
      }));
    }
  }, [formKey]);

  const handleNext = useCallback(() => {
    if (state.currentForm < forms.length - 1) {
      setState(prev => ({ ...prev, currentForm: prev.currentForm + 1 }));
    } else {
      // All forms signed, complete the process
      onComplete(state.signatures);
    }
  }, [state.currentForm, forms.length, state.signatures, onComplete]);

  const handleBack = useCallback(() => {
    if (state.currentForm > 0) {
      setState(prev => ({ ...prev, currentForm: prev.currentForm - 1 }));
    } else {
      onBack();
    }
  }, [state.currentForm, onBack]);

  const getAttestationText = (formType: 'i9' | 'w4'): string => {
    return formType === 'i9' ? currentT.i9Attestation : currentT.w4Attestation;
  };

  const getSignatureTitle = (formType: 'i9' | 'w4'): string => {
    return formType === 'i9' ? currentT.i9Signature : currentT.w4Signature;
  };

  const renderSignatureMetadata = () => {
    const metadata = state.signatureMetadata[formKey];
    if (!metadata || !state.signatures[formKey]) return null;

    const avgPressure = metadata.pressure.length > 0 
      ? metadata.pressure.reduce((a, b) => a + b, 0) / metadata.pressure.length 
      : 0;

    const hasPressureSupport = metadata.pressure.some(p => p !== 0.5);

    return (
      <div className={`mt-4 p-3 ${highContrastMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg text-sm`}>
        <h4 className={`font-medium mb-2 ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
          {currentT.signatureMetadata}
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className={`${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.timestamp}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {new Date(metadata.timestamp).toLocaleString()}
            </span>
          </div>
          <div>
            <span className={`${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.duration}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {metadata.duration.toFixed(1)} {currentT.seconds}
            </span>
          </div>
          <div>
            <span className={`${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.points}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {metadata.points}
            </span>
          </div>
          <div>
            <span className={`${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
              {currentT.pressure}:
            </span>
            <br />
            <span className={`${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
              {avgPressure.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="mt-2">
          <span className={`text-xs ${hasPressureSupport ? 'text-green-600' : 'text-yellow-600'}`}>
            {hasPressureSupport ? currentT.pressureSupport : currentT.noPressureSupport}
          </span>
        </div>
      </div>
    );
  };

  if (!currentForm) return null;

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
            Form {state.currentForm + 1} of {forms.length}
          </span>
          <span className={`text-sm ${highContrastMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {getSignatureTitle(currentForm.type)}
          </span>
        </div>
        <div className={`w-full ${highContrastMode ? 'bg-gray-700' : 'bg-gray-200'} rounded-full h-2`}>
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${((state.currentForm + 1) / forms.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Form attestation */}
      <div className={`mb-6 p-4 ${highContrastMode ? 'bg-gray-700' : 'bg-blue-50'} rounded-lg border`}>
        <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'} mb-3`}>
          {currentT.attestation}
        </h3>
        <p className={`${largeTextMode ? 'text-base' : 'text-sm'} ${highContrastMode ? 'text-gray-300' : 'text-gray-700'} mb-4`}>
          {getAttestationText(currentForm.type)}
        </p>
        <p className={`text-xs ${highContrastMode ? 'text-gray-400' : 'text-gray-600'} italic`}>
          {currentT.legalNotice}
        </p>
      </div>

      {/* Signature area */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className={`font-semibold ${largeTextMode ? 'text-lg' : 'text-base'} ${highContrastMode ? 'text-white' : 'text-gray-900'}`}>
            {getSignatureTitle(currentForm.type)}
          </h3>
          <button
            type="button"
            onClick={clearSignature}
            className={`px-3 py-1 text-sm border rounded ${
              highContrastMode 
                ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            } transition-colors`}
          >
            {currentT.clear}
          </button>
        </div>

        <p className={`mb-3 text-sm ${highContrastMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {currentT.signatureInstructions}
        </p>

        <div className={`relative border-2 border-dashed ${
          state.signatures[formKey] 
            ? 'border-green-500' 
            : highContrastMode 
              ? 'border-gray-600' 
              : 'border-gray-300'
        } rounded-lg`}>
          <canvas
            ref={(el) => { canvasRefs.current[formKey] = el; }}
            className={`w-full h-48 cursor-crosshair ${highContrastMode ? 'bg-gray-900' : 'bg-white'} rounded-lg`}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ touchAction: 'none' }}
          />
          
          {!state.signatures[formKey] && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <span className={`text-lg ${highContrastMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {currentT.signHere}
              </span>
            </div>
          )}
        </div>

        {renderSignatureMetadata()}
      </div>

      {/* Validation */}
      {!state.signatures[formKey] && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm font-medium">
            {currentT.signatureRequired}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={handleBack}
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
          disabled={!state.signatures[formKey]}
          className={`px-6 py-3 rounded-lg font-medium ${largeTextMode ? 'text-lg' : 'text-base'} ${
            state.signatures[formKey]
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          } transition-colors`}
        >
          {state.currentForm === forms.length - 1 ? currentT.complete : currentT.next}
        </button>
      </div>
    </div>
  );
};