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

interface HealthInsuranceStepProps {
  sessionId: string;
  language: 'en' | 'es';
  employee: Employee;
  onInsuranceCompleted: (insuranceData: any) => void;
  onBack: () => void;
  deviceType?: 'tablet' | 'mobile' | 'desktop';
}

export const HealthInsuranceStep: React.FC<HealthInsuranceStepProps> = ({
  sessionId,
  language,
  employee,
  onInsuranceCompleted,
  onBack,
  deviceType = 'desktop'
}) => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  const [copayAmount, setCopayAmount] = useState('');

  const t = {
    en: {
      title: 'Health Insurance Selection',
      subtitle: 'Choose your health insurance coverage options',
      healthPlans: 'Health Insurance Plans',
      dentalVision: 'Additional Coverage',
      selectPlans: 'Select the plans you would like to enroll in:',
      copayInfo: 'Copay per Pay Period',
      copayDesc: 'Amount deducted from each paycheck for selected coverage',
      plans: {
        uhc_hra_base: 'UHC HRA Base Plan',
        uhc_hra_buyup: 'UHC HRA Buy Up Plan',
        cwi_minimum_essential: 'CWI Minimum Essential Plan',
        cwi_minimum_indemnity: 'CWI Minimum Indemnity Plan',
        uhc_dental: 'UHC Dental',
        uhc_vision: 'UHC Vision'
      },
      planDescriptions: {
        uhc_hra_base: 'Basic health coverage with Health Reimbursement Account',
        uhc_hra_buyup: 'Enhanced health coverage with higher HRA contribution',
        cwi_minimum_essential: 'Minimum essential coverage as required by law',
        cwi_minimum_indemnity: 'Basic indemnity coverage for essential services',
        uhc_dental: 'Comprehensive dental coverage including preventive care',
        uhc_vision: 'Vision coverage including eye exams and glasses'
      },
      noInsurance: 'Decline Health Insurance',
      noInsuranceDesc: 'I decline health insurance coverage at this time',
      waiver: 'Insurance Waiver',
      waiverText: 'By declining health insurance, I understand that I will not have coverage through this employer and I am responsible for obtaining my own health insurance coverage.',
      continue: 'Continue to Forms',
      back: 'Back',
      validation: {
        planRequired: 'Please select at least one plan or decline coverage',
        copayRequired: 'Please enter the copay amount per pay period'
      }
    },
    es: {
      title: 'Selección de Seguro de Salud',
      subtitle: 'Elija sus opciones de cobertura de seguro de salud',
      healthPlans: 'Planes de Seguro de Salud',
      dentalVision: 'Cobertura Adicional',
      selectPlans: 'Seleccione los planes en los que le gustaría inscribirse:',
      copayInfo: 'Copago por Período de Pago',
      copayDesc: 'Cantidad deducida de cada cheque de pago por la cobertura seleccionada',
      plans: {
        uhc_hra_base: 'Plan Base UHC HRA',
        uhc_hra_buyup: 'Plan Mejorado UHC HRA',
        cwi_minimum_essential: 'Plan Esencial Mínimo CWI',
        cwi_minimum_indemnity: 'Plan de Indemnización Mínima CWI',
        uhc_dental: 'Dental UHC',
        uhc_vision: 'Visión UHC'
      },
      planDescriptions: {
        uhc_hra_base: 'Cobertura básica de salud con Cuenta de Reembolso de Salud',
        uhc_hra_buyup: 'Cobertura de salud mejorada con mayor contribución HRA',
        cwi_minimum_essential: 'Cobertura esencial mínima según lo requerido por la ley',
        cwi_minimum_indemnity: 'Cobertura básica de indemnización para servicios esenciales',
        uhc_dental: 'Cobertura dental integral incluyendo atención preventiva',
        uhc_vision: 'Cobertura de visión incluyendo exámenes oculares y anteojos'
      },
      noInsurance: 'Rechazar Seguro de Salud',
      noInsuranceDesc: 'Rechazo la cobertura de seguro de salud en este momento',
      waiver: 'Renuncia de Seguro',
      waiverText: 'Al rechazar el seguro de salud, entiendo que no tendré cobertura a través de este empleador y soy responsable de obtener mi propia cobertura de seguro de salud.',
      continue: 'Continuar a Formularios',
      back: 'Atrás',
      validation: {
        planRequired: 'Por favor seleccione al menos un plan o rechace la cobertura',
        copayRequired: 'Por favor ingrese el monto del copago por período de pago'
      }
    }
  };

  const currentT = t[language];
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [declineInsurance, setDeclineInsurance] = useState(false);

  const healthPlans = [
    'uhc_hra_base',
    'uhc_hra_buyup',
    'cwi_minimum_essential',
    'cwi_minimum_indemnity'
  ];

  const additionalPlans = [
    'uhc_dental',
    'uhc_vision'
  ];

  const togglePlan = (planId: string) => {
    if (declineInsurance) {
      setDeclineInsurance(false);
    }
    
    setSelectedPlans(prev => 
      prev.includes(planId)
        ? prev.filter(id => id !== planId)
        : [...prev, planId]
    );
    
    if (errors.planRequired) {
      setErrors(prev => ({ ...prev, planRequired: '' }));
    }
  };

  const handleDeclineInsurance = () => {
    setDeclineInsurance(!declineInsurance);
    if (!declineInsurance) {
      setSelectedPlans([]);
    }
    if (errors.planRequired) {
      setErrors(prev => ({ ...prev, planRequired: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!declineInsurance && selectedPlans.length === 0) {
      newErrors.planRequired = currentT.validation.planRequired;
    }
    
    if (selectedPlans.length > 0 && !copayAmount.trim()) {
      newErrors.copayRequired = currentT.validation.copayRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onInsuranceCompleted({
        selectedPlans: declineInsurance ? [] : selectedPlans,
        copayAmount: selectedPlans.length > 0 ? copayAmount : '0',
        declinedInsurance: declineInsurance
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentT.healthPlans}</h3>
        <p className="text-gray-600 mb-6">{currentT.selectPlans}</p>
        
        <div className="space-y-4">
          {healthPlans.map(planId => (
            <div
              key={planId}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlans.includes(planId)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => togglePlan(planId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Icon name="Shield" size={20} className="text-blue-600 mr-3" />
                    <h4 className="font-semibold">{currentT.plans[planId as keyof typeof currentT.plans]}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{currentT.planDescriptions[planId as keyof typeof currentT.planDescriptions]}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlans.includes(planId)
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300'
                }`}>
                  {selectedPlans.includes(planId) && (
                    <Icon name="Check" size={14} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 mb-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentT.dentalVision}</h3>
        
        <div className="space-y-4">
          {additionalPlans.map(planId => (
            <div
              key={planId}
              className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedPlans.includes(planId)
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => togglePlan(planId)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    <Icon name="Heart" size={20} className="text-green-600 mr-3" />
                    <h4 className="font-semibold">{currentT.plans[planId as keyof typeof currentT.plans]}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{currentT.planDescriptions[planId as keyof typeof currentT.planDescriptions]}</p>
                </div>
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                  selectedPlans.includes(planId)
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {selectedPlans.includes(planId) && (
                    <Icon name="Check" size={14} className="text-white" />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selectedPlans.length > 0 && (
        <Card className="p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{currentT.copayInfo}</h3>
          <p className="text-gray-600 mb-4">{currentT.copayDesc}</p>
          
          <div className="max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount per Pay Period *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                value={copayAmount}
                onChange={(e) => {
                  setCopayAmount(e.target.value);
                  if (errors.copayRequired) {
                    setErrors(prev => ({ ...prev, copayRequired: '' }));
                  }
                }}
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.copayRequired ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
            {errors.copayRequired && (
              <p className="text-red-500 text-sm mt-1">{errors.copayRequired}</p>
            )}
          </div>
        </Card>
      )}

      <Card className="p-6 mb-6 border-orange-200">
        <div
          className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
            declineInsurance
              ? 'border-orange-500 bg-orange-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={handleDeclineInsurance}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <Icon name="X" size={20} className="text-orange-600 mr-3" />
                <h4 className="font-semibold">{currentT.noInsurance}</h4>
              </div>
              <p className="text-sm text-gray-600 mb-3">{currentT.noInsuranceDesc}</p>
              {declineInsurance && (
                <div className="bg-orange-100 p-3 rounded-md">
                  <h5 className="font-medium text-orange-800 mb-1">{currentT.waiver}</h5>
                  <p className="text-sm text-orange-700">{currentT.waiverText}</p>
                </div>
              )}
            </div>
            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
              declineInsurance
                ? 'border-orange-500 bg-orange-500'
                : 'border-gray-300'
            }`}>
              {declineInsurance && (
                <Icon name="Check" size={14} className="text-white" />
              )}
            </div>
          </div>
        </div>
      </Card>

      {errors.planRequired && (
        <Card className="mb-6 p-4 bg-red-50 border-red-200">
          <div className="flex items-center">
            <Icon name="AlertTriangle" size={20} className="text-red-600 mr-3" />
            <p className="text-red-800">{errors.planRequired}</p>
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
