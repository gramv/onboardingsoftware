import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../../hooks/useToast';

interface EmergencyContactData {
  name: string;
  relationship: string;
  phone: string;
}

interface EmergencyContactStepProps {
  onNext: (data: EmergencyContactData) => void;
  onBack: () => void;
  initialData?: EmergencyContactData;
  language: 'en' | 'es';
}

export const EmergencyContactStep: React.FC<EmergencyContactStepProps> = ({
  onNext,
  onBack,
  initialData,
  language = 'en'
}) => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState<EmergencyContactData>({
    name: initialData?.name || '',
    relationship: initialData?.relationship || '',
    phone: initialData?.phone || ''
  });

  const [errors, setErrors] = useState<Partial<EmergencyContactData>>({});

  const translations = {
    en: {
      title: 'Emergency Contact Information',
      subtitle: 'Please provide emergency contact details',
      name: 'Full Name',
      namePlaceholder: 'Enter emergency contact name',
      relationship: 'Relationship',
      relationshipPlaceholder: 'e.g., Spouse, Parent, Sibling',
      phone: 'Phone Number',
      phonePlaceholder: 'Enter phone number',
      required: 'This field is required',
      invalidPhone: 'Please enter a valid phone number',
      back: 'Back',
      continue: 'Continue',
      success: 'Emergency contact information saved successfully'
    },
    es: {
      title: 'Información de Contacto de Emergencia',
      subtitle: 'Por favor proporcione los detalles del contacto de emergencia',
      name: 'Nombre Completo',
      namePlaceholder: 'Ingrese el nombre del contacto de emergencia',
      relationship: 'Relación',
      relationshipPlaceholder: 'ej., Cónyuge, Padre, Hermano',
      phone: 'Número de Teléfono',
      phonePlaceholder: 'Ingrese el número de teléfono',
      required: 'Este campo es obligatorio',
      invalidPhone: 'Por favor ingrese un número de teléfono válido',
      back: 'Atrás',
      continue: 'Continuar',
      success: 'Información de contacto de emergencia guardada exitosamente'
    }
  };

  const t = translations[language];

  const validateForm = (): boolean => {
    const newErrors: Partial<EmergencyContactData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t.required;
    }

    if (!formData.relationship.trim()) {
      newErrors.relationship = t.required;
    }

    if (!formData.phone.trim()) {
      newErrors.phone = t.required;
    } else if (!/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      newErrors.phone = t.invalidPhone;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      showToast(t.success, 'success');
      onNext(formData);
    }
  };

  const handleInputChange = (field: keyof EmergencyContactData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <Icon name="Heart" size={48} className="text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{t.title}</h2>
        <p className="text-gray-600">{t.subtitle}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Heart" size={20} className="mr-2 text-red-500" />
            {t.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.name} *
            </label>
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder={t.namePlaceholder}
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.relationship} *
            </label>
            <Input
              value={formData.relationship}
              onChange={(e) => handleInputChange('relationship', e.target.value)}
              placeholder={t.relationshipPlaceholder}
              className={errors.relationship ? 'border-red-500' : ''}
            />
            {errors.relationship && (
              <p className="mt-1 text-sm text-red-600">{errors.relationship}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t.phone} *
            </label>
            <Input
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder={t.phonePlaceholder}
              type="tel"
              className={errors.phone ? 'border-red-500' : ''}
            />
            {errors.phone && (
              <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
            )}
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
