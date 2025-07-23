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

interface EmergencyContactStepProps {
  sessionId: string;
  language: 'en' | 'es';
  employee: Employee;
  onContactCompleted: (contactData: any) => void;
  onBack: () => void;
  deviceType?: 'tablet' | 'mobile' | 'desktop';
}

export const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({
  sessionId,
  language,
  employee,
  onContactCompleted,
  onBack,
  deviceType = 'desktop'
}) => {
  const [formData, setFormData] = useState({
    primaryContactName: '',
    primaryContactPhone: '',
    primaryContactRelationship: '',
    secondaryContactName: '',
    secondaryContactPhone: '',
    secondaryContactRelationship: ''
  });

  const t = {
    en: {
      title: 'Emergency Contact Information',
      subtitle: 'Provide emergency contact details for workplace safety',
      primaryContact: 'Primary Emergency Contact',
      secondaryContact: 'Secondary Emergency Contact (Optional)',
      contactName: 'Full Name',
      contactPhone: 'Phone Number',
      relationship: 'Relationship',
      relationshipOptions: {
        spouse: 'Spouse',
        parent: 'Parent',
        sibling: 'Sibling',
        child: 'Child',
        friend: 'Friend',
        other: 'Other'
      },
      required: 'Required',
      optional: 'Optional',
      continue: 'Continue to Direct Deposit',
      back: 'Back',
      validation: {
        nameRequired: 'Contact name is required',
        phoneRequired: 'Phone number is required',
        relationshipRequired: 'Relationship is required'
      }
    },
    es: {
      title: 'Información de Contacto de Emergencia',
      subtitle: 'Proporcione detalles de contacto de emergencia para la seguridad en el lugar de trabajo',
      primaryContact: 'Contacto de Emergencia Primario',
      secondaryContact: 'Contacto de Emergencia Secundario (Opcional)',
      contactName: 'Nombre Completo',
      contactPhone: 'Número de Teléfono',
      relationship: 'Relación',
      relationshipOptions: {
        spouse: 'Cónyuge',
        parent: 'Padre/Madre',
        sibling: 'Hermano/Hermana',
        child: 'Hijo/Hija',
        friend: 'Amigo/Amiga',
        other: 'Otro'
      },
      required: 'Requerido',
      optional: 'Opcional',
      continue: 'Continuar a Depósito Directo',
      back: 'Atrás',
      validation: {
        nameRequired: 'El nombre del contacto es requerido',
        phoneRequired: 'El número de teléfono es requerido',
        relationshipRequired: 'La relación es requerida'
      }
    }
  };

  const currentT = t[language];
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.primaryContactName.trim()) {
      newErrors.primaryContactName = currentT.validation.nameRequired;
    }
    if (!formData.primaryContactPhone.trim()) {
      newErrors.primaryContactPhone = currentT.validation.phoneRequired;
    }
    if (!formData.primaryContactRelationship) {
      newErrors.primaryContactRelationship = currentT.validation.relationshipRequired;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onContactCompleted(formData);
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

      <div className="space-y-8">
        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Icon name="UserPlus" size={24} className="text-red-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">{currentT.primaryContact}</h3>
            <span className="ml-2 text-sm text-red-600">({currentT.required})</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.contactName} *
              </label>
              <input
                type="text"
                value={formData.primaryContactName}
                onChange={(e) => updateField('primaryContactName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.primaryContactName ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={currentT.contactName}
              />
              {errors.primaryContactName && (
                <p className="text-red-500 text-sm mt-1">{errors.primaryContactName}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.contactPhone} *
              </label>
              <input
                type="tel"
                value={formData.primaryContactPhone}
                onChange={(e) => updateField('primaryContactPhone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.primaryContactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="(555) 123-4567"
              />
              {errors.primaryContactPhone && (
                <p className="text-red-500 text-sm mt-1">{errors.primaryContactPhone}</p>
              )}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.relationship} *
              </label>
              <select
                value={formData.primaryContactRelationship}
                onChange={(e) => updateField('primaryContactRelationship', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.primaryContactRelationship ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">{currentT.relationship}</option>
                {Object.entries(currentT.relationshipOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              {errors.primaryContactRelationship && (
                <p className="text-red-500 text-sm mt-1">{errors.primaryContactRelationship}</p>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center mb-4">
            <Icon name="Users" size={24} className="text-blue-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">{currentT.secondaryContact}</h3>
            <span className="ml-2 text-sm text-gray-500">({currentT.optional})</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.contactName}
              </label>
              <input
                type="text"
                value={formData.secondaryContactName}
                onChange={(e) => updateField('secondaryContactName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={currentT.contactName}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.contactPhone}
              </label>
              <input
                type="tel"
                value={formData.secondaryContactPhone}
                onChange={(e) => updateField('secondaryContactPhone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.relationship}
              </label>
              <select
                value={formData.secondaryContactRelationship}
                onChange={(e) => updateField('secondaryContactRelationship', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{currentT.relationship}</option>
                {Object.entries(currentT.relationshipOptions).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-between mt-8">
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
