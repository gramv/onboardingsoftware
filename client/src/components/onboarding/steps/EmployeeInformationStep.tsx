import React, { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { useToast } from '../../../hooks/useToast';

interface EmployeeInformationStepProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: any;
  language: 'en' | 'es';
}

export const EmployeeInformationStep: React.FC<EmployeeInformationStepProps> = ({
  onNext,
  onBack,
  initialData,
  language = 'en'
}) => {
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    dateOfBirth: initialData?.dateOfBirth || '',
    socialSecurityNumber: initialData?.socialSecurityNumber || '',
    maritalStatus: initialData?.maritalStatus || '',
    address: {
      street: initialData?.address?.street || '',
      city: initialData?.address?.city || '',
      state: initialData?.address?.state || '',
      zipCode: initialData?.address?.zipCode || ''
    },
    position: initialData?.position || '',
    department: initialData?.department || '',
    startDate: initialData?.startDate || '',
    employmentType: initialData?.employmentType || 'full-time',
    emergencyContactName: initialData?.emergencyContactName || '',
    emergencyContactPhone: initialData?.emergencyContactPhone || '',
    emergencyContactRelationship: initialData?.emergencyContactRelationship || ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const t = {
    en: {
      title: 'Employee Information',
      subtitle: 'Please provide your personal and employment information',
      personalInfo: 'Personal Information',
      firstName: 'First Name',
      lastName: 'Last Name',
      email: 'Email Address',
      phone: 'Phone Number',
      dateOfBirth: 'Date of Birth',
      socialSecurityNumber: 'Social Security Number',
      maritalStatus: 'Marital Status',
      single: 'Single',
      married: 'Married',
      divorced: 'Divorced',
      widowed: 'Widowed',
      addressInfo: 'Address Information',
      street: 'Street Address',
      city: 'City',
      state: 'State',
      zipCode: 'ZIP Code',
      employmentInfo: 'Employment Information',
      position: 'Position',
      department: 'Department',
      startDate: 'Start Date',
      employmentType: 'Employment Type',
      fullTime: 'Full Time',
      partTime: 'Part Time',
      contract: 'Contract',
      temporary: 'Temporary',
      emergencyContact: 'Emergency Contact',
      emergencyContactName: 'Emergency Contact Name',
      emergencyContactPhone: 'Emergency Contact Phone',
      emergencyContactRelationship: 'Relationship',
      spouse: 'Spouse',
      parent: 'Parent',
      sibling: 'Sibling',
      friend: 'Friend',
      other: 'Other',
      continue: 'Continue',
      back: 'Back',
      requiredField: 'This field is required',
      invalidEmail: 'Please enter a valid email address',
      invalidPhone: 'Please enter a valid phone number',
      invalidSSN: 'Please enter a valid Social Security Number',
      success: 'Employee information saved successfully'
    },
    es: {
      title: 'Información del Empleado',
      subtitle: 'Por favor proporcione su información personal y de empleo',
      personalInfo: 'Información Personal',
      firstName: 'Nombre',
      lastName: 'Apellido',
      email: 'Dirección de Correo Electrónico',
      phone: 'Número de Teléfono',
      dateOfBirth: 'Fecha de Nacimiento',
      socialSecurityNumber: 'Número de Seguro Social',
      maritalStatus: 'Estado Civil',
      single: 'Soltero/a',
      married: 'Casado/a',
      divorced: 'Divorciado/a',
      widowed: 'Viudo/a',
      addressInfo: 'Información de Dirección',
      street: 'Dirección',
      city: 'Ciudad',
      state: 'Estado',
      zipCode: 'Código Postal',
      employmentInfo: 'Información de Empleo',
      position: 'Posición',
      department: 'Departamento',
      startDate: 'Fecha de Inicio',
      employmentType: 'Tipo de Empleo',
      fullTime: 'Tiempo Completo',
      partTime: 'Tiempo Parcial',
      contract: 'Contrato',
      temporary: 'Temporal',
      emergencyContact: 'Contacto de Emergencia',
      emergencyContactName: 'Nombre del Contacto de Emergencia',
      emergencyContactPhone: 'Teléfono del Contacto de Emergencia',
      emergencyContactRelationship: 'Relación',
      spouse: 'Cónyuge',
      parent: 'Padre/Madre',
      sibling: 'Hermano/a',
      friend: 'Amigo/a',
      other: 'Otro',
      continue: 'Continuar',
      back: 'Atrás',
      requiredField: 'Este campo es requerido',
      invalidEmail: 'Por favor ingrese una dirección de correo válida',
      invalidPhone: 'Por favor ingrese un número de teléfono válido',
      invalidSSN: 'Por favor ingrese un Número de Seguro Social válido',
      success: 'Información del empleado guardada exitosamente'
    }
  };

  const currentT = t[language];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = currentT.requiredField;
    if (!formData.lastName.trim()) newErrors.lastName = currentT.requiredField;
    if (!formData.email.trim()) newErrors.email = currentT.requiredField;
    if (!formData.phone.trim()) newErrors.phone = currentT.requiredField;
    if (!formData.dateOfBirth) newErrors.dateOfBirth = currentT.requiredField;
    if (!formData.socialSecurityNumber.trim()) newErrors.socialSecurityNumber = currentT.requiredField;
    if (!formData.address.street.trim()) newErrors['address.street'] = currentT.requiredField;
    if (!formData.address.city.trim()) newErrors['address.city'] = currentT.requiredField;
    if (!formData.address.state.trim()) newErrors['address.state'] = currentT.requiredField;
    if (!formData.address.zipCode.trim()) newErrors['address.zipCode'] = currentT.requiredField;
    if (!formData.startDate) newErrors.startDate = currentT.requiredField;
    if (!formData.emergencyContactName.trim()) newErrors.emergencyContactName = currentT.requiredField;
    if (!formData.emergencyContactPhone.trim()) newErrors.emergencyContactPhone = currentT.requiredField;
    if (!formData.emergencyContactRelationship) newErrors.emergencyContactRelationship = currentT.requiredField;

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = currentT.invalidEmail;
    }

    if (formData.phone && !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formData.phone)) {
      newErrors.phone = currentT.invalidPhone;
    }

    if (formData.socialSecurityNumber && !/^\d{3}-?\d{2}-?\d{4}$/.test(formData.socialSecurityNumber)) {
      newErrors.socialSecurityNumber = currentT.invalidSSN;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleSubmit = () => {
    if (!validateForm()) {
      showToast('Please correct the errors before continuing', 'error');
      return;
    }

    showToast(currentT.success, 'success');
    onNext(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{currentT.title}</h1>
        <p className="text-lg text-gray-600">{currentT.subtitle}</p>
      </div>

      <div className="space-y-8">
        {/* Personal Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Icon name="User" size={24} className="text-blue-600 mr-3" />
            {currentT.personalInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.firstName} *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.firstName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.lastName} *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.lastName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.email} *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.phone} *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.dateOfBirth} *
              </label>
              <input
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.socialSecurityNumber} *
              </label>
              <input
                type="text"
                value={formData.socialSecurityNumber}
                onChange={(e) => handleInputChange('socialSecurityNumber', e.target.value)}
                placeholder="123-45-6789"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.socialSecurityNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.socialSecurityNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.socialSecurityNumber}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.maritalStatus}
              </label>
              <select
                value={formData.maritalStatus}
                onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select...</option>
                <option value="single">{currentT.single}</option>
                <option value="married">{currentT.married}</option>
                <option value="divorced">{currentT.divorced}</option>
                <option value="widowed">{currentT.widowed}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Address Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Icon name="MapPin" size={24} className="text-green-600 mr-3" />
            {currentT.addressInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.street} *
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['address.street'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['address.street'] && (
                <p className="mt-1 text-sm text-red-600">{errors['address.street']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.city} *
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['address.city'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['address.city'] && (
                <p className="mt-1 text-sm text-red-600">{errors['address.city']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.state} *
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['address.state'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['address.state'] && (
                <p className="mt-1 text-sm text-red-600">{errors['address.state']}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.zipCode} *
              </label>
              <input
                type="text"
                value={formData.address.zipCode}
                onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors['address.zipCode'] ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors['address.zipCode'] && (
                <p className="mt-1 text-sm text-red-600">{errors['address.zipCode']}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Employment Information */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Icon name="Briefcase" size={24} className="text-purple-600 mr-3" />
            {currentT.employmentInfo}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.position}
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.department}
              </label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.startDate} *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.employmentType}
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) => handleInputChange('employmentType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="full-time">{currentT.fullTime}</option>
                <option value="part-time">{currentT.partTime}</option>
                <option value="contract">{currentT.contract}</option>
                <option value="temporary">{currentT.temporary}</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Emergency Contact */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Icon name="Phone" size={24} className="text-red-600 mr-3" />
            {currentT.emergencyContact}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.emergencyContactName} *
              </label>
              <input
                type="text"
                value={formData.emergencyContactName}
                onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyContactName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.emergencyContactName && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.emergencyContactPhone} *
              </label>
              <input
                type="tel"
                value={formData.emergencyContactPhone}
                onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                placeholder="(555) 123-4567"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyContactPhone ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.emergencyContactPhone && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactPhone}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {currentT.emergencyContactRelationship} *
              </label>
              <select
                value={formData.emergencyContactRelationship}
                onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyContactRelationship ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select...</option>
                <option value="spouse">{currentT.spouse}</option>
                <option value="parent">{currentT.parent}</option>
                <option value="sibling">{currentT.sibling}</option>
                <option value="friend">{currentT.friend}</option>
                <option value="other">{currentT.other}</option>
              </select>
              {errors.emergencyContactRelationship && (
                <p className="mt-1 text-sm text-red-600">{errors.emergencyContactRelationship}</p>
              )}
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
