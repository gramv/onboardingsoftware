import React, { useState, useEffect } from 'react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { tablet } from '../../../styles/design-tokens';
import { onboardingService } from '../../../services/onboardingService';

interface AccessCodeEntryProps {
  onCodeSubmit: (code: string) => void;
  onCodeValidated: (isValid: boolean, employeeData?: any) => void;
  language: 'en' | 'es';
  className?: string;
  maxLength?: number;
  highContrast?: boolean;
  largeText?: boolean;
}

const keypadNumbers = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9],
  ['clear', 0, 'backspace']
];

const translations = {
  en: {
    title: 'Enter Your Token',
    subtitle: 'Please enter the token provided by your manager',
    submit: 'Submit',
    clear: 'Clear',
    backspace: 'Delete',
    validating: 'Validating...',
    invalid: 'Invalid token. Please try again.',
    help: 'Need help? Contact your manager.'
  },
  es: {
    title: 'Ingrese Su Token',
    subtitle: 'Por favor ingrese el token proporcionado por su gerente',
    submit: 'Enviar',
    clear: 'Limpiar',
    backspace: 'Borrar',
    validating: 'Validando...',
    invalid: 'Token inválido. Por favor intente de nuevo.',
    help: '¿Necesita ayuda? Contacte a su gerente.'
  }
};

export const AccessCodeEntry: React.FC<AccessCodeEntryProps> = ({
  onCodeSubmit,
  onCodeValidated,
  language = 'en',
  className = '',
  maxLength = 6,
  highContrast = false,
  largeText = false
}) => {
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const t = translations[language];

  // Auto-submit when code reaches max length
  useEffect(() => {
    if (code.length === maxLength) {
      handleSubmit();
    }
  }, [code, maxLength]);

  const handleNumberPress = (num: number) => {
    if (code.length < maxLength) {
      setCode(prev => prev + num.toString());
      setError('');
      
      // Haptic feedback for touch devices
      if ('vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const handleClear = () => {
    setCode('');
    setError('');
  };

  const handleBackspace = () => {
    setCode(prev => prev.slice(0, -1));
    setError('');
  };

  const handleSubmit = async () => {
    if (code.length !== maxLength) return;

    setIsValidating(true);
    setError('');

    try {
      // Call the real backend API to validate token
      onCodeSubmit(code);
      
      const result = await onboardingService.validateToken(code);
      
      if (result.success && result.data?.session && result.data?.employee) {
        // Store session data for later use
        sessionStorage.setItem('onboardingSession', JSON.stringify(result.data.session));
        
        onCodeValidated(true, result.data.employee);
      } else {
        setError(t.invalid);
        setShake(true);
        setCode('');
        setTimeout(() => setShake(false), 500);
        onCodeValidated(false);
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError(t.invalid);
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 500);
      onCodeValidated(false);
    } finally {
      setIsValidating(false);
    }
  };

  const renderCodeDisplay = () => {
    const digits = Array(maxLength).fill('').map((_, index) => {
      const hasDigit = index < code.length;
      const isActive = index === code.length;
      
      let borderColor, bgColor, textColor;
      
      if (highContrast) {
        if (hasDigit) {
          borderColor = 'border-yellow-400';
          bgColor = 'bg-gray-800';
          textColor = 'text-white';
        } else if (isActive) {
          borderColor = 'border-white';
          bgColor = 'bg-gray-900';
          textColor = 'text-white';
        } else {
          borderColor = 'border-gray-600';
          bgColor = 'bg-gray-800';
          textColor = 'text-gray-400';
        }
      } else {
        if (hasDigit) {
          borderColor = 'border-primary-500';
          bgColor = 'bg-primary-50';
          textColor = 'text-primary-900';
        } else if (isActive) {
          borderColor = 'border-primary-300';
          bgColor = 'bg-white';
          textColor = 'text-primary-900';
        } else {
          borderColor = 'border-gray-300';
          bgColor = 'bg-gray-50';
          textColor = 'text-gray-900';
        }
      }
      
      return (
        <div
          key={index}
          className={`
            flex items-center justify-center border-2 rounded-xl transition-all duration-200
            ${borderColor} ${bgColor} ${textColor}
            ${shake ? 'animate-pulse' : ''}
          `}
          style={{
            width: largeText ? tablet.onboarding.accessCode.digitSize * 1.2 : tablet.onboarding.accessCode.digitSize,
            height: largeText ? tablet.onboarding.accessCode.digitSize * 1.2 : tablet.onboarding.accessCode.digitSize,
            fontSize: largeText ? '40px' : '32px',
            fontWeight: '600'
          }}
        >
          {hasDigit ? '●' : ''}
          {isActive && !hasDigit && (
            <div className={`${highContrast ? 'bg-white' : 'bg-primary-500'} animate-pulse rounded ${largeText ? 'w-1.5 h-10' : 'w-1 h-8'}`} />
          )}
        </div>
      );
    });

    return (
      <div 
        className={`flex justify-center mb-8 ${shake ? 'animate-bounce' : ''}`}
        style={{ gap: largeText ? tablet.onboarding.accessCode.digitSpacing * 1.5 : tablet.onboarding.accessCode.digitSpacing }}
      >
        {digits}
      </div>
    );
  };

  const renderKeypad = () => {
    return (
      <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
        {keypadNumbers.flat().map((key, index) => {
          if (key === 'clear') {
            return (
              <Button
                key={index}
                variant={highContrast ? "primary" : "outline"}
                onClick={handleClear}
                disabled={isValidating}
                className={`font-semibold ${highContrast ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                style={{ 
                  height: largeText ? tablet.onboarding.accessCode.keypadButton * 1.2 : tablet.onboarding.accessCode.keypadButton 
                }}
              >
                {largeText ? t.clear : t.clear.substring(0, 2)}
              </Button>
            );
          }
          
          if (key === 'backspace') {
            return (
              <Button
                key={index}
                variant={highContrast ? "primary" : "outline"}
                onClick={handleBackspace}
                disabled={isValidating || code.length === 0}
                className={`font-semibold ${highContrast ? 'text-white' : 'text-gray-600 hover:text-gray-800'}`}
                style={{ 
                  height: largeText ? tablet.onboarding.accessCode.keypadButton * 1.2 : tablet.onboarding.accessCode.keypadButton 
                }}
                aria-label="Delete last digit"
              >
                <svg className={largeText ? "w-8 h-8" : "w-6 h-6"} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </Button>
            );
          }

          return (
            <Button
              key={index}
              variant={highContrast ? "primary" : "outline"}
              onClick={() => handleNumberPress(Number(key))}
              disabled={isValidating || code.length >= maxLength}
              className={`${largeText ? 'text-3xl' : 'text-2xl'} font-bold ${highContrast ? 'text-white' : 'text-gray-800 hover:text-primary-600 hover:border-primary-300'} active:scale-95 transition-transform`}
              style={{ 
                height: largeText ? tablet.onboarding.accessCode.keypadButton * 1.2 : tablet.onboarding.accessCode.keypadButton 
              }}
              aria-label={`Number ${key}`}
            >
              {key}
            </Button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`w-full max-w-2xl mx-auto p-6 ${className}`}>
      <Card className={`p-8 ${highContrast ? 'bg-black border-gray-700 text-white' : ''}`}>
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className={`font-bold mb-4 ${highContrast ? 'text-white' : 'text-gray-900'} ${largeText ? 'text-4xl' : 'text-3xl'}`}>
            {t.title}
          </h1>
          <p className={`${highContrast ? 'text-gray-300' : 'text-gray-600'} ${largeText ? 'text-xl' : 'text-lg'}`}>
            {t.subtitle}
          </p>
        </div>

        {/* Code Display */}
        {renderCodeDisplay()}

        {/* Error Message */}
        {error && (
          <div className="text-center mb-6">
            <p className={`font-medium ${highContrast ? 'text-yellow-400' : 'text-red-600'} ${largeText ? 'text-xl' : 'text-lg'}`}>
              {error}
            </p>
          </div>
        )}

        {/* Loading State */}
        {isValidating && (
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3">
              <div className={`${largeText ? 'w-8 h-8' : 'w-6 h-6'} border-2 ${highContrast ? 'border-white border-t-transparent' : 'border-primary-600 border-t-transparent'} rounded-full animate-spin`} />
              <p className={`font-medium ${highContrast ? 'text-white' : 'text-primary-600'} ${largeText ? 'text-xl' : 'text-lg'}`}>
                {t.validating}
              </p>
            </div>
          </div>
        )}

        {/* Keypad */}
        {renderKeypad()}

        {/* Help Text */}
        <div className="text-center mt-8">
          <p className={`${highContrast ? 'text-gray-400' : 'text-gray-500'} ${largeText ? 'text-base' : 'text-sm'}`}>
            {t.help}
          </p>
        </div>

      </Card>
    </div>
  );
};

export default AccessCodeEntry;
