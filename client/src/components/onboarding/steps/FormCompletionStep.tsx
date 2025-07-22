import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { I9Form } from '../../tablet/forms/I9Form';
import { W4Form } from '../../tablet/forms/W4Form';
import { FormData } from '../../../types/forms';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  organizationName: string;
}

interface FormCompletionStepProps {
  sessionId: string;
  language: 'en' | 'es';
  employee: Employee;
  ocrData: any;
  onFormsCompleted: (forms: any) => void;
  onBack: () => void;
  deviceType?: 'tablet' | 'mobile' | 'desktop';
}

export const FormCompletionStep: React.FC<FormCompletionStepProps> = ({
  sessionId,
  language,
  employee,
  ocrData,
  onFormsCompleted,
  onBack,
  deviceType = 'desktop'
}) => {
  const [currentForm, setCurrentForm] = useState<'selection' | 'i9' | 'w4'>('selection');
  const [completedForms, setCompletedForms] = useState<{
    i9Data?: Partial<FormData>;
    w4Data?: Partial<FormData>;
  }>({});

  const t = {
    en: {
      title: 'Complete Required Forms',
      subtitle: 'Complete I-9 and W-4 forms using information from your uploaded documents',
      i9Title: 'Form I-9: Employment Eligibility Verification',
      i9Description: 'Required for all employees to verify work authorization',
      w4Title: 'Form W-4: Employee\'s Withholding Certificate', 
      w4Description: 'Determines federal income tax withholding from your paycheck',
      startI9: 'Start I-9 Form',
      startW4: 'Start W-4 Form',
      completed: 'Completed',
      inProgress: 'In Progress',
      notStarted: 'Not Started',
      continueToNext: 'Continue to Review',
      autoFillNotice: 'Forms will be auto-filled with data from your uploaded documents',
      bothFormsRequired: 'Both forms must be completed before proceeding',
      back: 'Back'
    },
    es: {
      title: 'Completar Formularios Requeridos',
      subtitle: 'Complete los formularios I-9 y W-4 usando información de sus documentos subidos',
      i9Title: 'Formulario I-9: Verificación de Elegibilidad de Empleo',
      i9Description: 'Requerido para todos los empleados para verificar autorización de trabajo',
      w4Title: 'Formulario W-4: Certificado de Retenciones del Empleado',
      w4Description: 'Determina la retención de impuestos federales de su cheque de pago',
      startI9: 'Comenzar Formulario I-9',
      startW4: 'Comenzar Formulario W-4', 
      completed: 'Completado',
      inProgress: 'En Progreso',
      notStarted: 'No Iniciado',
      continueToNext: 'Continuar a Revisión',
      autoFillNotice: 'Los formularios se completarán automáticamente con datos de sus documentos subidos',
      bothFormsRequired: 'Ambos formularios deben completarse antes de continuar',
      back: 'Atrás'
    }
  };

  const currentT = t[language];

  const handleI9Complete = (formData: Partial<FormData>) => {
    setCompletedForms(prev => ({ ...prev, i9Data: formData }));
    setCurrentForm('selection');
  };

  const handleW4Complete = (formData: Partial<FormData>) => {
    setCompletedForms(prev => ({ ...prev, w4Data: formData }));
    setCurrentForm('selection');
  };

  const handleContinue = () => {
    if (completedForms.i9Data && completedForms.w4Data) {
      onFormsCompleted(completedForms);
    }
  };

  const handleBackToSelection = () => {
    setCurrentForm('selection');
  };

  const isTabletOptimized = deviceType === 'tablet';
  const allFormsCompleted = completedForms.i9Data && completedForms.w4Data;

  // Extract relevant OCR data for forms
  const formOcrData = ocrData ? {
    firstName: ocrData.fullName?.split(' ')[0] || '',
    lastName: ocrData.fullName?.split(' ').slice(1).join(' ') || '',
    dateOfBirth: ocrData.dateOfBirth || '',
    ssnNumber: ocrData.ssnNumber || '',
    // Additional fields can be mapped as needed
  } : {};

  if (currentForm === 'i9') {
    return (
      <I9Form
        language={language}
        highContrastMode={false}
        largeTextMode={isTabletOptimized}
        voiceGuidanceEnabled={false}
        employeeId={employee.id}
        ocrData={formOcrData}
        onComplete={handleI9Complete}
        onBack={handleBackToSelection}
      />
    );
  }

  if (currentForm === 'w4') {
    return (
      <W4Form
        language={language}
        highContrastMode={false}
        largeTextMode={isTabletOptimized}
        voiceGuidanceEnabled={false}
        employeeId={employee.id}
        ocrData={formOcrData}
        onComplete={handleW4Complete}
        onBack={handleBackToSelection}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      {Object.keys(formOcrData).length > 0 && (
        <Card className="mb-6 p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center">
            <Icon name="Info" size={20} className="text-blue-600 mr-3" />
            <p className="text-blue-800">{currentT.autoFillNotice}</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* I-9 Form Card */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <Icon name="FileText" size={32} className="text-blue-600" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              completedForms.i9Data
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {completedForms.i9Data ? currentT.completed : currentT.notStarted}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {currentT.i9Title}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentT.i9Description}
          </p>
          
          <Button 
            onClick={() => setCurrentForm('i9')}
            className="w-full"
            variant={completedForms.i9Data ? 'outline' : 'primary'}
          >
            <Icon name="FileText" size={16} className="mr-2" />
            {completedForms.i9Data ? 'Review I-9' : currentT.startI9}
          </Button>
        </Card>

        {/* W-4 Form Card */}
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between mb-4">
            <Icon name="Calculator" size={32} className="text-green-600" />
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              completedForms.w4Data
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {completedForms.w4Data ? currentT.completed : currentT.notStarted}
            </div>
          </div>
          
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {currentT.w4Title}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentT.w4Description}
          </p>
          
          <Button 
            onClick={() => setCurrentForm('w4')}
            className="w-full"
            variant={completedForms.w4Data ? 'outline' : 'primary'}
          >
            <Icon name="Calculator" size={16} className="mr-2" />
            {completedForms.w4Data ? 'Review W-4' : currentT.startW4}
          </Button>
        </Card>
      </div>

      {!allFormsCompleted && (
        <Card className="mb-8 p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <Icon name="AlertTriangle" size={20} className="text-yellow-600 mr-3" />
            <p className="text-yellow-800">{currentT.bothFormsRequired}</p>
          </div>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {currentT.back}
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!allFormsCompleted}
          className={!allFormsCompleted ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {currentT.continueToNext}
          <Icon name="ChevronRight" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}; 