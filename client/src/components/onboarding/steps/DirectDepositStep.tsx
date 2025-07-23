import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  organizationName: string;
}

interface DirectDepositStepProps {
  sessionId: string;
  language: 'en' | 'es';
  employee: Employee;
  onDepositCompleted: (depositData: any) => void;
  onBack: () => void;
  deviceType?: 'tablet' | 'mobile' | 'desktop';
}

export const DirectDepositStep: React.FC<DirectDepositStepProps> = ({
  sessionId,
  language,
  employee,
  onDepositCompleted,
  onBack,
  deviceType = 'desktop'
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'check' | 'direct_deposit'>('direct_deposit');
  const [formData, setFormData] = useState({
    bankName: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    accountHolderName: '',
    email: employee.email || ''
  });

  const t = {
    en: {
      title: 'Payment Method Setup',
      subtitle: 'Choose how you would like to receive your paycheck',
      paymentMethod: 'Payment Method',
      directDeposit: 'Direct Deposit (Recommended)',
      paperCheck: 'Paper Check',
      directDepositDesc: 'Funds deposited directly to your bank account',
      paperCheckDesc: 'Physical check mailed or picked up',
      bankingInfo: 'Banking Information',
      bankName: 'Bank Name',
      routingNumber: 'Routing Number',
      accountNumber: 'Account Number',
      confirmAccountNumber: 'Confirm Account Number',
      accountType: 'Account Type',
      accountTypes: {
        checking: 'Checking',
        savings: 'Savings'
      },
      accountHolderName: 'Account Holder Name',
      email: 'Email Address',
      emailDesc: 'For direct deposit notifications',
      requirements: 'Requirements',
      requirementsList: [
        'Must provide voided check or bank letter',
        'Account holder name must match payroll name',
        'All information must be accurate and legible'
      ],
      continue: 'Continue to Health Insurance',
      back: 'Back',
      validation: {
        bankNameRequired: 'Bank name is required',
        routingNumberRequired: 'Routing number is required',
        routingNumberInvalid: 'Routing number must be 9 digits',
        accountNumberRequired: 'Account number is required',
        accountNumberMismatch: 'Account numbers do not match',
        accountHolderRequired: 'Account holder name is required',
        emailRequired: 'Email address is required',
        emailInvalid: 'Please enter a valid email address'
      }
    },
    es: {
      title: 'Configuración del Método de Pago',
      subtitle: 'Elija cómo le gustaría recibir su cheque de pago',
      paymentMethod: 'Método de Pago',
      directDeposit: 'Depósito Directo (Recomendado)',
      paperCheck: 'Cheque en Papel',
      directDepositDesc: 'Fondos depositados directamente en su cuenta bancaria',
      paperCheckDesc: 'Cheque físico enviado por correo o recogido',
      bankingInfo: 'Información Bancaria',
      bankName: 'Nombre del Banco',
      routingNumber: 'Número de Ruta',
      accountNumber: 'Número de Cuenta',
      confirmAccountNumber: 'Confirmar Número de Cuenta',
      accountType: 'Tipo de Cuenta',
      accountTypes: {
        checking: 'Corriente',
        savings: 'Ahorros'
      },
      accountHolderName: 'Nombre del Titular de la Cuenta',
      email: 'Dirección de Correo Electrónico',
      emailDesc: 'Para notificaciones de depósito directo',
      requirements: 'Requisitos',
      requirementsList: [
        'Debe proporcionar cheque anulado o carta bancaria',
        'El nombre del titular de la cuenta debe coincidir con el nombre de nómina',
        'Toda la información debe ser precisa y legible'
      ],
      continue: 'Continuar al Seguro de Salud',
      back: 'Atrás',
      validation: {
        bankNameRequired: 'El nombre del banco es requerido',
        routingNumberRequired: 'El número de ruta es requerido',
        routingNumberInvalid: 'El número de ruta debe tener 9 dígitos',
        accountNumberRequired: 'El número de cuenta es requerido',
        accountNumberMismatch: 'Los números de cuenta no coinciden',
        accountHolderRequired: 'El nombre del titular de la cuenta es requerido',
        emailRequired: 'La dirección de correo electrónico es requerida',
        emailInvalid: 'Por favor ingrese una dirección de correo electrónico válida'
      }
    }
  };

  const currentT = t[language];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (paymentMethod === 'direct_deposit') {
      if (!formData.bankName.trim()) {
        newErrors.bankName = currentT.validation.bankNameRequired;
      }
      if (!formData.routingNumber.trim()) {
        newErrors.routingNumber = currentT.validation.routingNumberRequired;
      } else if (!/^\d{9}$/.test(formData.routingNumber)) {
        newErrors.routingNumber = currentT.validation.routingNumberInvalid;
      }
      if (!formData.accountNumber.trim()) {
        newErrors.accountNumber = currentT.validation.accountNumberRequired;
      }
      if (formData.accountNumber !== confirmAccountNumber) {
        newErrors.confirmAccountNumber = currentT.validation.accountNumberMismatch;
      }
      if (!formData.accountHolderName.trim()) {
        newErrors.accountHolderName = currentT.validation.accountHolderRequired;
      }
    }
    
    if (!formData.email.trim()) {
      newErrors.email = currentT.validation.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = currentT.validation.emailInvalid;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onDepositCompleted({
        paymentMethod,
        ...(paymentMethod === 'direct_deposit' ? formData : { email: formData.email })
      });
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentT.paymentMethod}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'direct_deposit'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => setPaymentMethod('direct_deposit')}
          >
            <div className="flex items-center mb-2">
              <Icon name="CreditCard" size={24} className="text-blue-600 mr-3" />
              <h4 className="font-semibold">{currentT.directDeposit}</h4>
            </div>
            <p className="text-sm text-gray-600">{currentT.directDepositDesc}</p>
          </div>
          
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
              paymentMethod === 'check'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => setPaymentMethod('check')}
          >
            <div className="flex items-center mb-2">
              <Icon name="FileText" size={24} className="text-green-600 mr-3" />
              <h4 className="font-semibold">{currentT.paperCheck}</h4>
            </div>
            <p className="text-sm text-gray-600">{currentT.paperCheckDesc}</p>
          </div>
        </div>
      </Card>

      {paymentMethod === 'direct_deposit' && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentT.bankingInfo}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.bankName} *
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.bankName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={currentT.bankName}
              />
              {errors.bankName && (
                <p className="text-red-500 text-sm mt-1">{errors.bankName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.routingNumber} *
              </label>
              <input
                type="text"
                value={formData.routingNumber}
                onChange={(e) => updateField('routingNumber', e.target.value.replace(/\D/g, '').slice(0, 9))}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.routingNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="123456789"
                maxLength={9}
              />
              {errors.routingNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.routingNumber}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.accountType} *
              </label>
              <select
                value={formData.accountType}
                onChange={(e) => updateField('accountType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(currentT.accountTypes).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.accountNumber} *
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => updateField('accountNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={currentT.accountNumber}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.accountNumber}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.confirmAccountNumber} *
              </label>
              <input
                type="text"
                value={confirmAccountNumber}
                onChange={(e) => {
                  setConfirmAccountNumber(e.target.value);
                  if (errors.confirmAccountNumber) {
                    setErrors(prev => ({ ...prev, confirmAccountNumber: '' }));
                  }
                }}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.confirmAccountNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={currentT.confirmAccountNumber}
              />
              {errors.confirmAccountNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmAccountNumber}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.accountHolderName} *
              </label>
              <input
                type="text"
                value={formData.accountHolderName}
                onChange={(e) => updateField('accountHolderName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.accountHolderName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={`${employee.firstName} ${employee.lastName}`}
              />
              {errors.accountHolderName && (
                <p className="text-red-500 text-sm mt-1">{errors.accountHolderName}</p>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {currentT.email} *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="your.email@example.com"
          />
          <p className="text-sm text-gray-500 mt-1">{currentT.emailDesc}</p>
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
      </Card>

      {paymentMethod === 'direct_deposit' && (
        <Card className="p-6 mb-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-start">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600 mr-3 mt-1" />
            <div>
              <h4 className="font-semibold text-yellow-800 mb-2">{currentT.requirements}</h4>
              <ul className="text-sm text-yellow-700 space-y-1">
                {currentT.requirementsList.map((req, index) => (
                  <li key={index} className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {currentT.back}
        </Button>
        <Button onClick={handleSubmit}>
          {currentT.continue}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
