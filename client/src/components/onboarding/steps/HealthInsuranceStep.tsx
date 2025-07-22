import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../../hooks/useToast';

interface HealthInsurancePlan {
  id: string;
  name: string;
  nameEs: string;
  description: string;
  descriptionEs: string;
  monthlyPremium: number;
  copay: number;
  deductible: number;
  coverage: string[];
  coverageEs: string[];
}

interface HealthInsuranceData {
  selectedPlan: string;
  dependents: number;
  totalMonthlyPremium: number;
}

interface HealthInsuranceStepProps {
  onNext: (data: HealthInsuranceData) => void;
  onBack: () => void;
  initialData?: HealthInsuranceData;
  language: 'en' | 'es';
}

export const HealthInsuranceStep: React.FC<HealthInsuranceStepProps> = ({
  onNext,
  onBack,
  initialData,
  language = 'en'
}) => {
  const { showToast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string>(initialData?.selectedPlan || '');
  const [dependents, setDependents] = useState<number>(initialData?.dependents || 0);

  const translations = {
    en: {
      title: 'Health Insurance Selection',
      subtitle: 'Choose your health insurance plan',
      selectPlan: 'Select a Plan',
      dependents: 'Number of Dependents',
      monthlyPremium: 'Monthly Premium',
      copay: 'Copay',
      deductible: 'Deductible',
      coverage: 'Coverage Includes',
      totalCost: 'Total Monthly Cost',
      employee: 'Employee',
      family: 'Family',
      back: 'Back',
      continue: 'Continue',
      success: 'Health insurance selection saved successfully',
      required: 'Please select a health insurance plan',
      decline: 'Decline Coverage',
      declineNote: 'You can decline health insurance coverage if you have coverage elsewhere'
    },
    es: {
      title: 'Selección de Seguro de Salud',
      subtitle: 'Elija su plan de seguro de salud',
      selectPlan: 'Seleccionar un Plan',
      dependents: 'Número de Dependientes',
      monthlyPremium: 'Prima Mensual',
      copay: 'Copago',
      deductible: 'Deducible',
      coverage: 'La Cobertura Incluye',
      totalCost: 'Costo Mensual Total',
      employee: 'Empleado',
      family: 'Familia',
      back: 'Atrás',
      continue: 'Continuar',
      success: 'Selección de seguro de salud guardada exitosamente',
      required: 'Por favor seleccione un plan de seguro de salud',
      decline: 'Rechazar Cobertura',
      declineNote: 'Puede rechazar la cobertura de seguro de salud si tiene cobertura en otro lugar'
    }
  };

  const t = translations[language];

  const healthPlans: HealthInsurancePlan[] = [
    {
      id: 'uhc-hra-base',
      name: 'UHC HRA Base Plan',
      nameEs: 'Plan Base UHC HRA',
      description: 'Basic health coverage with Health Reimbursement Account',
      descriptionEs: 'Cobertura básica de salud con Cuenta de Reembolso de Salud',
      monthlyPremium: 85.00,
      copay: 25.00,
      deductible: 1500,
      coverage: ['Doctor visits', 'Emergency care', 'Prescription drugs', 'Preventive care'],
      coverageEs: ['Visitas médicas', 'Atención de emergencia', 'Medicamentos recetados', 'Atención preventiva']
    },
    {
      id: 'uhc-hra-buyup',
      name: 'UHC HRA Buy Up Plan',
      nameEs: 'Plan Mejorado UHC HRA',
      description: 'Enhanced coverage with lower deductible and copays',
      descriptionEs: 'Cobertura mejorada con deducible y copagos más bajos',
      monthlyPremium: 125.00,
      copay: 15.00,
      deductible: 750,
      coverage: ['Doctor visits', 'Emergency care', 'Prescription drugs', 'Preventive care', 'Specialist visits', 'Mental health'],
      coverageEs: ['Visitas médicas', 'Atención de emergencia', 'Medicamentos recetados', 'Atención preventiva', 'Visitas a especialistas', 'Salud mental']
    },
    {
      id: 'cwi-minimal',
      name: 'CWI Minimum Essential Plan',
      nameEs: 'Plan Esencial Mínimo CWI',
      description: 'Basic coverage meeting minimum essential requirements',
      descriptionEs: 'Cobertura básica que cumple con los requisitos esenciales mínimos',
      monthlyPremium: 45.00,
      copay: 35.00,
      deductible: 2500,
      coverage: ['Emergency care', 'Preventive care', 'Basic prescription drugs'],
      coverageEs: ['Atención de emergencia', 'Atención preventiva', 'Medicamentos básicos recetados']
    }
  ];

  const calculateTotalPremium = (planId: string, dependentCount: number): number => {
    const plan = healthPlans.find(p => p.id === planId);
    if (!plan) return 0;
    
    const basePremium = plan.monthlyPremium;
    const dependentMultiplier = dependentCount > 0 ? 2.5 : 1; // Family rate is 2.5x employee rate
    return basePremium * dependentMultiplier;
  };

  const handleSubmit = () => {
    if (!selectedPlan) {
      showToast(t.required, 'error');
      return;
    }

    const totalMonthlyPremium = calculateTotalPremium(selectedPlan, dependents);
    
    showToast(t.success, 'success');
    onNext({
      selectedPlan,
      dependents,
      totalMonthlyPremium
    });
  };

  const handleDecline = () => {
    showToast(t.success, 'success');
    onNext({
      selectedPlan: 'declined',
      dependents: 0,
      totalMonthlyPremium: 0
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Icon name="Shield" size={48} className="text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
        {healthPlans.map((plan) => (
          <Card 
            key={plan.id}
            className={`cursor-pointer transition-all ${
              selectedPlan === plan.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-lg'
            }`}
            onClick={() => setSelectedPlan(plan.id)}
          >
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="radio"
                    checked={selectedPlan === plan.id}
                    onChange={() => setSelectedPlan(plan.id)}
                    className="mr-3"
                  />
                  <div>
                    <h3 className="font-semibold">{language === 'es' ? plan.nameEs : plan.name}</h3>
                    <p className="text-sm text-gray-600 font-normal">
                      {language === 'es' ? plan.descriptionEs : plan.description}
                    </p>
                  </div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.monthlyPremium}:</span>
                  <span className="font-semibold">${plan.monthlyPremium.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.copay}:</span>
                  <span className="font-semibold">${plan.copay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">{t.deductible}:</span>
                  <span className="font-semibold">${plan.deductible.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium text-gray-700 mb-2">{t.coverage}:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {(language === 'es' ? plan.coverageEs : plan.coverage).map((item, index) => (
                      <li key={index} className="flex items-center">
                        <Icon name="Check" size={12} className="text-green-500 mr-1" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedPlan && selectedPlan !== 'declined' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.dependents}
                </label>
                <select
                  value={dependents}
                  onChange={(e) => setDependents(parseInt(e.target.value))}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value={0}>{t.employee} Only</option>
                  <option value={1}>{t.employee} + 1 Dependent</option>
                  <option value={2}>{t.employee} + 2 Dependents</option>
                  <option value={3}>{t.employee} + 3+ Dependents</option>
                </select>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{t.totalCost}:</span>
                  <span className="text-xl font-bold text-green-600">
                    ${calculateTotalPremium(selectedPlan, dependents).toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {dependents > 0 ? t.family : t.employee} Coverage
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">{t.decline}</h3>
              <p className="text-sm text-gray-600">{t.declineNote}</p>
            </div>
            <Button
              variant="outline"
              onClick={handleDecline}
              className="flex items-center"
            >
              <Icon name="X" size={16} className="mr-2" />
              {t.decline}
            </Button>
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
          disabled={!selectedPlan}
          className="flex items-center"
        >
          {t.continue}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
};
