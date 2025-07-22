import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { DigitalSignature } from '../../tablet/forms/DigitalSignature';

interface Employee {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  organizationName: string;
}

interface ReviewStepProps {
  sessionId: string;
  language: 'en' | 'es';
  employee: Employee;
  documents: any[];
  forms: any;
  onSigned: (signature: any) => void;
  onBack: () => void;
  deviceType?: 'tablet' | 'mobile' | 'desktop';
}

export const ReviewStep: React.FC<ReviewStepProps> = ({
  sessionId,
  language,
  employee,
  documents,
  forms,
  onSigned,
  onBack,
  deviceType = 'desktop'
}) => {
  const [currentView, setCurrentView] = useState<'review' | 'signature'>('review');

  const t = {
    en: {
      title: 'Review & Sign Documents',
      subtitle: 'Review your information and sign the required documents',
      documentsReview: 'Documents Review',
      formsReview: 'Forms Review',
      documentsUploaded: 'Documents Uploaded',
      formsCompleted: 'Forms Completed',
      noDocuments: 'No documents uploaded',
      noForms: 'No forms completed',
      proceedToSignature: 'Proceed to Signature',
      reviewSummary: 'Review Summary',
      personalInfo: 'Personal Information',
      name: 'Name',
      email: 'Email',
      position: 'Position',
      department: 'Department',
      organization: 'Organization',
      back: 'Back'
    },
    es: {
      title: 'Revisar y Firmar Documentos',
      subtitle: 'Revise su información y firme los documentos requeridos',
      documentsReview: 'Revisión de Documentos',
      formsReview: 'Revisión de Formularios',
      documentsUploaded: 'Documentos Subidos',
      formsCompleted: 'Formularios Completados',
      noDocuments: 'No se subieron documentos',
      noForms: 'No se completaron formularios',
      proceedToSignature: 'Proceder a Firma',
      reviewSummary: 'Resumen de Revisión',
      personalInfo: 'Información Personal',
      name: 'Nombre',
      email: 'Correo Electrónico',
      position: 'Posición',
      department: 'Departamento',
      organization: 'Organización',
      back: 'Atrás'
    }
  };

  const currentT = t[language];

  const handleSignatureComplete = (signatures: Record<string, string>) => {
    onSigned({
      signatures,
      signedAt: new Date().toISOString(),
      sessionId
    });
  };

  const handleProceedToSignature = () => {
    setCurrentView('signature');
  };

  const handleBackToReview = () => {
    setCurrentView('review');
  };

  // Prepare forms data for signature component
  const formsForSignature = [];
  if (forms?.i9Data) {
    formsForSignature.push({ type: 'i9' as const, data: forms.i9Data });
  }
  if (forms?.w4Data) {
    formsForSignature.push({ type: 'w4' as const, data: forms.w4Data });
  }

  if (currentView === 'signature') {
    return (
      <DigitalSignature
        language={language}
        highContrastMode={false}
        largeTextMode={deviceType === 'tablet'}
        forms={formsForSignature}
        onComplete={handleSignatureComplete}
        onBack={handleBackToReview}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      {/* Personal Information Summary */}
      <Card className="mb-6 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="User" size={24} className="text-blue-600 mr-3" />
          {currentT.personalInfo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <span className="text-sm font-medium text-gray-500">{currentT.name}:</span>
            <p className="text-gray-900">{employee.firstName} {employee.lastName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">{currentT.email}:</span>
            <p className="text-gray-900">{employee.email}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">{currentT.position}:</span>
            <p className="text-gray-900">{employee.position}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-500">{currentT.department}:</span>
            <p className="text-gray-900">{employee.department}</p>
          </div>
          <div className="md:col-span-2">
            <span className="text-sm font-medium text-gray-500">{currentT.organization}:</span>
            <p className="text-gray-900">{employee.organizationName}</p>
          </div>
        </div>
      </Card>

      {/* Documents Review */}
      <Card className="mb-6 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="FileText" size={24} className="text-green-600 mr-3" />
          {currentT.documentsReview}
        </h3>
        {documents && documents.length > 0 ? (
          <div className="space-y-3">
            {documents.map((doc, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                  <span className="font-medium">{doc.documentType || `Document ${index + 1}`}</span>
                </div>
                <span className="text-sm text-gray-500">{doc.status || 'Uploaded'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">{currentT.noDocuments}</p>
        )}
      </Card>

      {/* Forms Review */}
      <Card className="mb-8 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Icon name="FileCheck" size={24} className="text-purple-600 mr-3" />
          {currentT.formsReview}
        </h3>
        {formsForSignature.length > 0 ? (
          <div className="space-y-3">
            {formsForSignature.map((form, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                  <span className="font-medium">
                    {form.type === 'i9' ? 'Form I-9: Employment Eligibility Verification' : 'Form W-4: Employee\'s Withholding Certificate'}
                  </span>
                </div>
                <span className="text-sm text-gray-500">Completed</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 italic">{currentT.noForms}</p>
        )}
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <Icon name="ChevronLeft" size={16} className="mr-2" />
          {currentT.back}
        </Button>
        <Button 
          onClick={handleProceedToSignature}
          disabled={formsForSignature.length === 0}
          className={formsForSignature.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}
        >
          {currentT.proceedToSignature}
          <Icon name="Edit" size={16} className="ml-2" />
        </Button>
      </div>
    </div>
  );
}; 