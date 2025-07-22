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

interface WelcomeStepProps {
  employee: Employee;
  language: 'en' | 'es';
  onLanguageChange: (language: 'en' | 'es') => void;
  onContinue: () => void;
  estimatedTime: number;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({
  employee,
  language,
  onLanguageChange,
  onContinue,
  estimatedTime
}) => {
  const t = {
    en: {
      welcome: 'Welcome to your onboarding!',
      greeting: 'Hello',
      position: 'Position',
      department: 'Department',
      estimatedTime: 'Estimated completion time',
      minutes: 'minutes',
      whatToExpect: 'What to expect',
      step1: 'Upload your identification documents',
      step2: 'Complete I-9 and W-4 government forms',
      step3: 'Review and digitally sign your information',
      step4: 'Receive confirmation and next steps',
      requirements: 'Requirements',
      req1: 'Valid driver\'s license or state ID',
      req2: 'Social Security card',
      req3: 'About 15-20 minutes of your time',
      req4: 'A quiet space to complete forms',
      getStarted: 'Get Started',
      important: 'Important',
      govCompliance: 'This onboarding process follows all federal employment verification requirements (I-9) and tax withholding regulations (W-4).',
      dataProtection: 'Your personal information is encrypted and protected according to industry standards.'
    },
    es: {
      welcome: '¡Bienvenido a su incorporación!',
      greeting: 'Hola',
      position: 'Posición',
      department: 'Departamento',
      estimatedTime: 'Tiempo estimado de finalización',
      minutes: 'minutos',
      whatToExpect: 'Qué esperar',
      step1: 'Suba sus documentos de identificación',
      step2: 'Complete los formularios gubernamentales I-9 y W-4',
      step3: 'Revise y firme digitalmente su información',
      step4: 'Reciba confirmación y próximos pasos',
      requirements: 'Requisitos',
      req1: 'Licencia de conducir válida o identificación estatal',
      req2: 'Tarjeta de Seguro Social',
      req3: 'Aproximadamente 15-20 minutos de su tiempo',
      req4: 'Un espacio tranquilo para completar formularios',
      getStarted: 'Comenzar',
      important: 'Importante',
      govCompliance: 'Este proceso de incorporación sigue todos los requisitos federales de verificación de empleo (I-9) y regulaciones de retención de impuestos (W-4).',
      dataProtection: 'Su información personal está encriptada y protegida según los estándares de la industria.'
    }
  };

  const currentT = t[language];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="UserPlus" size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {currentT.welcome}
        </h1>
        <p className="text-xl text-gray-600">
          {currentT.greeting} {employee.firstName} {employee.lastName}
        </p>
      </div>

      {/* Employee Info Card */}
      <Card className="mb-8 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-500">{currentT.position}</label>
            <p className="text-lg font-semibold text-gray-900">{employee.position}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">{currentT.department}</label>
            <p className="text-lg font-semibold text-gray-900">{employee.department}</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center text-gray-600">
            <Icon name="Clock" size={16} className="mr-2" />
            <span className="text-sm">
              {currentT.estimatedTime}: {estimatedTime} {currentT.minutes}
            </span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* What to Expect */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="List" size={20} className="mr-2 text-blue-600" />
            {currentT.whatToExpect}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                1
              </div>
              <p className="text-gray-700">{currentT.step1}</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                2
              </div>
              <p className="text-gray-700">{currentT.step2}</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                3
              </div>
              <p className="text-gray-700">{currentT.step3}</p>
            </div>
            <div className="flex items-start">
              <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium mr-3 mt-0.5">
                4
              </div>
              <p className="text-gray-700">{currentT.step4}</p>
            </div>
          </div>
        </Card>

        {/* Requirements */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Icon name="CheckSquare" size={20} className="mr-2 text-green-600" />
            {currentT.requirements}
          </h3>
          <div className="space-y-3">
            <div className="flex items-start">
              <Icon name="Check" size={16} className="text-green-600 mr-3 mt-1" />
              <p className="text-gray-700">{currentT.req1}</p>
            </div>
            <div className="flex items-start">
              <Icon name="Check" size={16} className="text-green-600 mr-3 mt-1" />
              <p className="text-gray-700">{currentT.req2}</p>
            </div>
            <div className="flex items-start">
              <Icon name="Check" size={16} className="text-green-600 mr-3 mt-1" />
              <p className="text-gray-700">{currentT.req3}</p>
            </div>
            <div className="flex items-start">
              <Icon name="Check" size={16} className="text-green-600 mr-3 mt-1" />
              <p className="text-gray-700">{currentT.req4}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Important Information */}
      <Card className="mb-8 p-6 bg-amber-50 border-amber-200">
        <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
          <Icon name="AlertTriangle" size={20} className="mr-2" />
          {currentT.important}
        </h3>
        <div className="space-y-2 text-amber-700">
          <p className="text-sm">{currentT.govCompliance}</p>
          <p className="text-sm">{currentT.dataProtection}</p>
        </div>
      </Card>

      {/* Language Selection */}
      <Card className="mb-8 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                     <Icon name="Settings" size={20} className="mr-2 text-blue-600" />
           Language / Idioma
         </h3>
         <div className="flex space-x-4">
           <Button
             variant={language === 'en' ? 'primary' : 'outline'}
             onClick={() => onLanguageChange('en')}
             className="flex-1"
           >
             <Icon name="User" size={16} className="mr-2" />
             English
           </Button>
           <Button
             variant={language === 'es' ? 'primary' : 'outline'}
             onClick={() => onLanguageChange('es')}
             className="flex-1"
           >
             <Icon name="User" size={16} className="mr-2" />
             Español
           </Button>
         </div>
       </Card>

       {/* Start Button */}
       <div className="text-center">
         <Button
           onClick={onContinue}
           size="lg"
           className="px-12 py-4 text-lg font-semibold"
         >
           <Icon name="Plus" size={20} className="mr-2" />
           {currentT.getStarted}
        </Button>
      </div>
    </div>
  );
}; 