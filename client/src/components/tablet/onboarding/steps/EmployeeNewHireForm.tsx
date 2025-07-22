import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../ui/Card';
import { Input } from '../../../ui/Input';
import { Button } from '../../../ui/Button';

interface EmployeeNewHireFormProps {
  onComplete: (data: any) => void;
  onBack: () => void;
  initialData?: any;
}

export const EmployeeNewHireForm: React.FC<EmployeeNewHireFormProps> = ({
  onComplete,
  onBack,
  initialData = {}
}) => {
  const [formData, setFormData] = useState({
    hotelName: initialData.organizationName || '',
    stateOfEmployment: initialData.state || '',
    employeeFirstName: initialData.firstName || '',
    employeeLastName: initialData.lastName || '',
    address1: initialData.address?.street || '',
    address2: initialData.address?.apt || '',
    partTimeOrFullTime: initialData.employmentType || 'full_time',
    gender: '',
    employeePhoneNumber: initialData.phone || '',
    employeeEmailAddress: initialData.email || '',
    socialSecurityNumber: '',
    marriageStatus: '',
    dependents: '',
    dateOfBirth: initialData.dateOfBirth || '',
    rateOfPay: initialData.payRate || '',
    hireDate: initialData.startDate || '',
    department: initialData.department || '',
    position: initialData.position || '',
    healthInsuranceSelection: '',
    healthInsuranceCopay: '',
    ...initialData
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.employeeFirstName) newErrors.employeeFirstName = 'First name is required';
    if (!formData.employeeLastName) newErrors.employeeLastName = 'Last name is required';
    if (!formData.employeeEmailAddress) newErrors.employeeEmailAddress = 'Email is required';
    if (!formData.employeePhoneNumber) newErrors.employeePhoneNumber = 'Phone number is required';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.socialSecurityNumber) newErrors.socialSecurityNumber = 'Social Security Number is required';
    if (!formData.healthInsuranceSelection) newErrors.healthInsuranceSelection = 'Health insurance selection is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onComplete(formData);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Employee New Hire Form</CardTitle>
        <p className="text-sm text-gray-600">
          Complete your employment information as required by your manager
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Hotel Name/Address"
                value={formData.hotelName}
                onChange={(e) => handleChange('hotelName', e.target.value)}
                disabled
              />
            </div>
            <div>
              <Input
                label="State of Employment"
                value={formData.stateOfEmployment}
                onChange={(e) => handleChange('stateOfEmployment', e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="First Name *"
                value={formData.employeeFirstName}
                onChange={(e) => handleChange('employeeFirstName', e.target.value)}
                className={errors.employeeFirstName ? 'border-red-500' : ''}
              />
              {errors.employeeFirstName && <p className="text-red-500 text-sm mt-1">{errors.employeeFirstName}</p>}
            </div>
            <div>
              <Input
                label="Last Name *"
                value={formData.employeeLastName}
                onChange={(e) => handleChange('employeeLastName', e.target.value)}
                className={errors.employeeLastName ? 'border-red-500' : ''}
              />
              {errors.employeeLastName && <p className="text-red-500 text-sm mt-1">{errors.employeeLastName}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Address 1"
                value={formData.address1}
                onChange={(e) => handleChange('address1', e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Address 2"
                value={formData.address2}
                onChange={(e) => handleChange('address2', e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employment Type
              </label>
              <select
                value={formData.partTimeOrFullTime}
                onChange={(e) => handleChange('partTimeOrFullTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <select
                value={formData.gender}
                onChange={(e) => handleChange('gender', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Gender</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Phone Number *"
                value={formData.employeePhoneNumber}
                onChange={(e) => handleChange('employeePhoneNumber', e.target.value)}
                className={errors.employeePhoneNumber ? 'border-red-500' : ''}
              />
              {errors.employeePhoneNumber && <p className="text-red-500 text-sm mt-1">{errors.employeePhoneNumber}</p>}
            </div>
            <div>
              <Input
                label="Email Address *"
                type="email"
                value={formData.employeeEmailAddress}
                onChange={(e) => handleChange('employeeEmailAddress', e.target.value)}
                className={errors.employeeEmailAddress ? 'border-red-500' : ''}
              />
              {errors.employeeEmailAddress && <p className="text-red-500 text-sm mt-1">{errors.employeeEmailAddress}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Social Security Number *"
                value={formData.socialSecurityNumber}
                onChange={(e) => handleChange('socialSecurityNumber', e.target.value)}
                className={errors.socialSecurityNumber ? 'border-red-500' : ''}
                placeholder="XXX-XX-XXXX"
              />
              {errors.socialSecurityNumber && <p className="text-red-500 text-sm mt-1">{errors.socialSecurityNumber}</p>}
            </div>
            <div>
              <Input
                label="Date of Birth *"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                className={errors.dateOfBirth ? 'border-red-500' : ''}
              />
              {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Marriage Status
              </label>
              <select
                value={formData.marriageStatus}
                onChange={(e) => handleChange('marriageStatus', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select Status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </div>
            <div>
              <Input
                label="Number of Dependents"
                type="number"
                value={formData.dependents}
                onChange={(e) => handleChange('dependents', e.target.value)}
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Rate of Pay"
                value={formData.rateOfPay}
                onChange={(e) => handleChange('rateOfPay', e.target.value)}
                disabled
              />
            </div>
            <div>
              <Input
                label="Hire Date"
                type="date"
                value={formData.hireDate}
                onChange={(e) => handleChange('hireDate', e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Department"
                value={formData.department}
                onChange={(e) => handleChange('department', e.target.value)}
                disabled
              />
            </div>
            <div>
              <Input
                label="Position"
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                disabled
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Health Insurance Selection *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="uhc_hra_6k"
                  checked={formData.healthInsuranceSelection === 'uhc_hra_6k'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                UHC HRA $6K Plan
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="uhc_hra_4k"
                  checked={formData.healthInsuranceSelection === 'uhc_hra_4k'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                UHC HRA $4K Plan
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="uhc_hra_2k"
                  checked={formData.healthInsuranceSelection === 'uhc_hra_2k'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                UHC HRA $2K Plan
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="cwi_minimum_essential"
                  checked={formData.healthInsuranceSelection === 'cwi_minimum_essential'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                CWI Minimum Essential Plan
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="cwi_minimum_indemnity"
                  checked={formData.healthInsuranceSelection === 'cwi_minimum_indemnity'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                CWI Minimum Indemnity Plan
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="uhc_dental"
                  checked={formData.healthInsuranceSelection === 'uhc_dental'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                UHC Dental
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="uhc_vision"
                  checked={formData.healthInsuranceSelection === 'uhc_vision'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                UHC Vision
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="healthInsurance"
                  value="waive_coverage"
                  checked={formData.healthInsuranceSelection === 'waive_coverage'}
                  onChange={(e) => handleChange('healthInsuranceSelection', e.target.value)}
                  className="mr-2"
                />
                I waive coverage
              </label>
            </div>
            {errors.healthInsuranceSelection && <p className="text-red-500 text-sm mt-1">{errors.healthInsuranceSelection}</p>}
          </div>

          <div className="flex justify-between pt-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Back
            </Button>
            <Button type="submit">
              Continue to I-9 Form
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
