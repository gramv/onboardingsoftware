import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';

interface JobOfferFormProps {
  application: any;
  onSubmit: (offerDetails: any) => void;
  onCancel: () => void;
}

export const JobOfferForm: React.FC<JobOfferFormProps> = ({
  application,
  onSubmit,
  onCancel
}) => {
  const [offerDetails, setOfferDetails] = useState({
    jobTitle: application.jobPosting.title,
    startDate: '',
    startTime: '09:00',
    payRate: '',
    payFrequency: 'bi-weekly',
    department: application.jobPosting.department,
    benefitsEligible: true,
    directSupervisor: '',
    specialInstructions: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!offerDetails.jobTitle) newErrors.jobTitle = 'Job title is required';
    if (!offerDetails.startDate) newErrors.startDate = 'Start date is required';
    if (!offerDetails.payRate) newErrors.payRate = 'Pay rate is required';
    if (!offerDetails.directSupervisor) newErrors.directSupervisor = 'Direct supervisor is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(offerDetails);
    }
  };

  const handleChange = (field: string, value: any) => {
    setOfferDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Offer Details</CardTitle>
        <p className="text-gray-600">
          Approving {application.firstName} {application.lastName} for {application.jobPosting.title}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Job Title *"
                value={offerDetails.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
            </div>
            <div>
              <Input
                label="Start Date *"
                type="date"
                value={offerDetails.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Start Time"
                type="time"
                value={offerDetails.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Pay Rate ($/hour) *"
                type="number"
                step="0.01"
                value={offerDetails.payRate}
                onChange={(e) => handleChange('payRate', e.target.value)}
                className={errors.payRate ? 'border-red-500' : ''}
              />
              {errors.payRate && <p className="text-red-500 text-sm mt-1">{errors.payRate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Frequency
              </label>
              <select
                value={offerDetails.payFrequency}
                onChange={(e) => handleChange('payFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <Input
                label="Department"
                value={offerDetails.department}
                onChange={(e) => handleChange('department', e.target.value)}
                disabled
              />
            </div>
          </div>

          <div>
            <Input
              label="Direct Supervisor *"
              value={offerDetails.directSupervisor}
              onChange={(e) => handleChange('directSupervisor', e.target.value)}
              className={errors.directSupervisor ? 'border-red-500' : ''}
            />
            {errors.directSupervisor && <p className="text-red-500 text-sm mt-1">{errors.directSupervisor}</p>}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={offerDetails.benefitsEligible}
                onChange={(e) => handleChange('benefitsEligible', e.target.checked)}
                className="mr-2"
              />
              Benefits Eligible
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={offerDetails.specialInstructions}
              onChange={(e) => handleChange('specialInstructions', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Any special instructions for the new employee..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Icon name="Send" className="mr-2" />
            Send Onboarding Email
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
    
    if (!offerDetails.jobTitle) newErrors.jobTitle = 'Job title is required';
    if (!offerDetails.startDate) newErrors.startDate = 'Start date is required';
    if (!offerDetails.payRate || parseFloat(offerDetails.payRate) <= 0) {
      newErrors.payRate = 'Valid pay rate is required';
    }
    if (!offerDetails.directSupervisor) newErrors.directSupervisor = 'Direct supervisor is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(offerDetails);
    }
  };

  const handleChange = (field: string, value: any) => {
    setOfferDetails(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Job Offer Details</CardTitle>
        <p className="text-gray-600">
          Approving {application.firstName} {application.lastName} for {application.jobPosting.title}
        </p>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Job Title *"
                value={offerDetails.jobTitle}
                onChange={(e) => handleChange('jobTitle', e.target.value)}
                className={errors.jobTitle ? 'border-red-500' : ''}
              />
              {errors.jobTitle && <p className="text-red-500 text-sm mt-1">{errors.jobTitle}</p>}
            </div>
            <div>
              <Input
                label="Start Date *"
                type="date"
                value={offerDetails.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                className={errors.startDate ? 'border-red-500' : ''}
              />
              {errors.startDate && <p className="text-red-500 text-sm mt-1">{errors.startDate}</p>}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Input
                label="Start Time"
                type="time"
                value={offerDetails.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
              />
            </div>
            <div>
              <Input
                label="Pay Rate ($/hour) *"
                type="number"
                step="0.01"
                value={offerDetails.payRate}
                onChange={(e) => handleChange('payRate', e.target.value)}
                className={errors.payRate ? 'border-red-500' : ''}
              />
              {errors.payRate && <p className="text-red-500 text-sm mt-1">{errors.payRate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pay Frequency
              </label>
              <select
                value={offerDetails.payFrequency}
                onChange={(e) => handleChange('payFrequency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="weekly">Weekly</option>
                <option value="bi-weekly">Bi-weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <Input
                label="Department"
                value={offerDetails.department}
                onChange={(e) => handleChange('department', e.target.value)}
                disabled
              />
            </div>
          </div>

          <div>
            <Input
              label="Direct Supervisor *"
              value={offerDetails.directSupervisor}
              onChange={(e) => handleChange('directSupervisor', e.target.value)}
              className={errors.directSupervisor ? 'border-red-500' : ''}
            />
            {errors.directSupervisor && <p className="text-red-500 text-sm mt-1">{errors.directSupervisor}</p>}
          </div>

          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={offerDetails.benefitsEligible}
                onChange={(e) => handleChange('benefitsEligible', e.target.checked)}
                className="mr-2"
              />
              Benefits Eligible
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Instructions
            </label>
            <textarea
              value={offerDetails.specialInstructions}
              onChange={(e) => handleChange('specialInstructions', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Any special instructions for the new employee..."
            />
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            <Icon name="Send" className="mr-2" />
            Send Onboarding Email
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};
