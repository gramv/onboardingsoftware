import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../../hooks/useToast';

interface DirectDepositData {
  accountType: 'checking' | 'savings';
  routingNumber: string;
  accountNumber: string;
  bankName: string;
  confirmAccountNumber?: string;
}

interface DirectDepositStepProps {
  onNext: (data: DirectDepositData) => void;
  onBack: () => void;
  initialData?: DirectDepositData;
  language: 'en' | 'es';
}

export const DirectDepositStep: React.FC<DirectDepositStepProps> = ({
  onNext,
  onBack,
  initialData,
  language = 'en'
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<DirectDepositData>({
    accountType: initialData?.accountType || 'checking',
    routingNumber: initialData?.routingNumber || '',
    accountNumber: initialData?.accountNumber || '',
    bankName: initialData?.bankName || '',
    confirmAccountNumber: initialData?.confirmAccountNumber || ''
  });

  const [errors, setErrors] = useState<Partial<DirectDepositData & { invalidRouting?: string }>>({});

  const translations = {
    en: {
      title: 'Direct Deposit Setup',
      subtitle: 'Set up direct deposit for your paycheck',
      accountType: 'Account Type',
      checking: 'Checking',
      savings: 'Savings',
      bankName: 'Bank Name',
      bankNamePlaceholder: 'Enter your bank name',
      routingNumber: 'Routing Number',
      routingNumberPlaceholder: 'Enter 9-digit routing number',
      accountNumber: 'Account Number',
      accountNumberPlaceholder: 'Enter your account number',
      confirmAccountNumber: 'Confirm Account Number',
      confirmAccountNumberPlaceholder: 'Re-enter your account number',
      required: 'This field is required',
      invalidRouting: 'Routing number must be 9 digits',
      accountMismatch: 'Account numbers do not match',
      back: 'Back',
      continue: 'Continue',
      success: 'Direct deposit information saved successfully',
      securityNote: 'Your banking information is encrypted and secure'
    },
    es: {
      title: 'Configuración de Depósito Directo',
      subtitle: 'Configure el depósito directo para su cheque de pago',
      accountType: 'Tipo de Cuenta',
      checking: 'Corriente',
      savings: 'Ahorros',
      bankName: 'Nombre del Banco',
      bankNamePlaceholder: 'Ingrese el nombre de su banco',
      routingNumber: 'Número de Ruta',
      routingNumberPlaceholder: 'Ingrese el número de ruta de 9 dígitos',
      accountNumber: 'Número de Cuenta',
      accountNumberPlaceholder: 'Ingrese su número de cuenta',
      confirmAccountNumber: 'Confirmar Número de Cuenta',
      confirmAccountNumberPlaceholder: 'Vuelva a ingresar su número de cuenta',
      required: 'Este campo es obligatorio',
      invalidRouting: 'El número de ruta debe tener 9 dígitos',
      accountMismatch: 'Los números de cuenta no coinciden',
      back: 'Atrás',
      continue: 'Continuar',
      success: 'Información de depósito directo guardada exitosamente',
      securityNote: 'Su información bancaria está encriptada y segura'
    }
  };

  const t = translations[language];

  const validateForm = (): boolean => {
    const newErrors: Partial<DirectDepositData & { invalidRouting?: string }> = {};

    if (!formData.bankName.trim()) {
      newErrors.bankName = t.required;
    }

    if (!formData.routingNumber.trim()) {
      newErrors.routingNumber = t.required;
    } else if (!/^\d{9}$/.test(formData.routingNumber)) {
      newErrors.invalidRouting = t.invalidRouting;
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = t.required;
    }

    if (!formData.confirmAccountNumber?.trim()) {
      newErrors.confirmAccountNumber = t.required;
    } else if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = t.accountMismatch;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      showToast(t.success, 'success');
      const { confirmAccountNumber, ...submitData } = formData;
      onNext(submitData as DirectDepositData);
    }
  };

  const handleInputChange = (field: keyof DirectDepositData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field] || errors.invalidRouting) {
      setErrors(prev => ({ ...prev, [field]: undefined, invalidRouting: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Icon name="CreditCard" size={48} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="CreditCard" size={20} className="mr-2 text-green-600" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.accountType} *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="checking"
                  checked={formData.accountType === 'checking'}
                  onChange={(e) => handleInputChange('accountType', e.target.value as 'checking' | 'savings')}
                  className="mr-2"
                />
                {t.checking}
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="savings"
                  checked={formData.accountType === 'savings'}
                  onChange={(e) => handleInputChange('accountType', e.target.value as 'checking' | 'savings')}
                  className="mr-2"
                />
                {t.savings}
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.bankName} *
            </label>
            <Input
              value={formData.bankName}
              onChange={(e) => handleInputChange('bankName', e.target.value)}
              placeholder={t.bankNamePlaceholder}
              className={errors.bankName ? 'border-red-500' : ''}
            />
            {errors.bankName && (
              <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.routingNumber} *
            </label>
            <Input
              value={formData.routingNumber}
              onChange={(e) => handleInputChange('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder={t.routingNumberPlaceholder}
              className={errors.routingNumber || errors.invalidRouting ? 'border-red-500' : ''}
              maxLength={9}
            />
            {(errors.routingNumber || errors.invalidRouting) && (
              <p className="mt-1 text-sm text-red-600">{errors.routingNumber || errors.invalidRouting}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.accountNumber} *
            </label>
            <Input
              value={formData.accountNumber}
              onChange={(e) => handleInputChange('accountNumber', e.target.value)}
              placeholder={t.accountNumberPlaceholder}
              className={errors.accountNumber ? 'border-red-500' : ''}
              type="password"
            />
            {errors.accountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.confirmAccountNumber} *
            </label>
            <Input
              value={formData.confirmAccountNumber}
              onChange={(e) => handleInputChange('confirmAccountNumber', e.target.value)}
              placeholder={t.confirmAccountNumberPlaceholder}
              className={errors.confirmAccountNumber ? 'border-red-500' : ''}
              type="password"
            />
            {errors.confirmAccountNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmAccountNumber}</p>
            )}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Icon name="Shield" size={16} className="text-blue-600 mr-2" />
              <p className="text-sm text-blue-800">{t.securityNote}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center"
        >
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {t.back}
        </Button>
        
        <Button
          onClick={handleSubmit}
          className="flex items-center"
        >
          {t.continue}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
