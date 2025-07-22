import React from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  organizationName: string;
}

interface CompletionStepProps {
  language: 'en' | 'es';
  employee: Employee;
  onFinish: () => void;
}

export const CompletionStep: React.FC<CompletionStepProps> = ({
  language,
  employee,
  onFinish
}) => {
  const t = {
    en: {
      title: 'Onboarding Complete!',
      subtitle: 'Welcome to the team',
      message: 'Your onboarding has been completed successfully. Your manager will review your information and contact you with next steps.',
      nextSteps: 'What happens next?',
      step1: 'Manager review (typically within 24 hours)',
      step2: 'HR final approval',
      step3: 'You\'ll receive your first day instructions',
      step4: 'Welcome email with important information',
      finish: 'Finish',
      thankYou: 'Thank you for completing your onboarding!'
    },
    es: {
      title: '¡Incorporación Completa!',
      subtitle: 'Bienvenido al equipo',
      message: 'Su incorporación se ha completado exitosamente. Su gerente revisará su información y se pondrá en contacto con usted con los próximos pasos.',
      nextSteps: '¿Qué sigue?',
      step1: 'Revisión del gerente (típicamente dentro de 24 horas)',
      step2: 'Aprobación final de RRHH',
      step3: 'Recibirá las instrucciones de su primer día',
      step4: 'Email de bienvenida con información importante',
      finish: 'Finalizar',
      thankYou: '¡Gracias por completar su incorporación!'
    }
  };

  const currentT = t[language];

  return (
    <div className="max-w-3xl mx-auto text-center">
      {/* Success Header */}
      <div className="mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon name="CheckCircle" size={40} className="text-white" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          {currentT.title}
        </h1>
        <p className="text-xl text-gray-600 mb-2">
          {currentT.subtitle}, {employee.firstName}!
        </p>
        <p className="text-lg text-gray-500">
          {currentT.message}
        </p>
      </div>

      {/* Next Steps */}
      <Card className="mb-8 p-8 text-left">
        <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center flex items-center justify-center">
          <Icon name="Clock" size={24} className="mr-3 text-blue-600" />
          {currentT.nextSteps}
        </h3>
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
              1
            </div>
            <p className="text-gray-700 text-lg">{currentT.step1}</p>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
              2
            </div>
            <p className="text-gray-700 text-lg">{currentT.step2}</p>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
              3
            </div>
            <p className="text-gray-700 text-lg">{currentT.step3}</p>
          </div>
          <div className="flex items-start">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-4 mt-1">
              4
            </div>
            <p className="text-gray-700 text-lg">{currentT.step4}</p>
          </div>
        </div>
      </Card>

      {/* Thank You Message */}
      <Card className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <p className="text-lg font-medium text-blue-800">
          {currentT.thankYou}
        </p>
      </Card>

      {/* Finish Button */}
      <Button
        onClick={onFinish}
        size="lg"
        className="px-12 py-4 text-lg font-semibold"
      >
        {currentT.finish}
        <Icon name="Home" size={20} className="ml-3" />
      </Button>
    </div>
  );
}; 