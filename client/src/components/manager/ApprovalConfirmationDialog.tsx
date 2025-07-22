import React, { useState } from 'react';
import { PropertyApplication } from '../../types/application';
import { JobDetails } from './JobDetailsForm';

interface ApprovalConfirmationDialogProps {
  application: PropertyApplication;
  jobDetails: JobDetails;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

// Export utility functions for pay rate calculations
export const calculatePayRateInfo = (rate: number, frequency: 'weekly' | 'bi-weekly') => {
  const annualRate = frequency === 'weekly' ? rate * 40 * 52 : rate * 40 * 26;
  return {
    hourly: rate.toFixed(2),
    annual: annualRate.toLocaleString(),
    weeklyGross: (rate * 40).toFixed(2),
    biWeeklyGross: (rate * 80).toFixed(2),
    monthlyGross: (annualRate / 12).toFixed(2),
  };
};

// Export function to format start time for display
export const formatStartTime = (time: string): string => {
  try {
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch {
    return time; // Return original if parsing fails
  }
};

// Export email preview function for use in other components
export const previewOnboardingEmail = (application: PropertyApplication, jobDetails: JobDetails): string => {
  const payInfo = calculatePayRateInfo(jobDetails.payRate, jobDetails.payFrequency);
  const startDate = new Date(jobDetails.startDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const startTime = formatStartTime(jobDetails.startTime);
  const propertyName = application.property?.name || '[Property Name]';

  return `
Subject: Congratulations! Job Offer from ${propertyName}

Dear ${application.firstName} ${application.lastName},

We are pleased to offer you the position of ${jobDetails.jobTitle} in our ${jobDetails.department} department at ${propertyName}.

Job Details:
• Position: ${jobDetails.jobTitle}
• Department: ${jobDetails.department}
• Start Date: ${startDate}
• Start Time: ${jobDetails.startTime}
• Pay Rate: $${payInfo.hourly} (approximately $${payInfo.annual})
• Pay Frequency: ${jobDetails.payFrequency === 'bi-weekly' ? 'Bi-weekly' : 'Weekly'}
• Benefits Eligible: ${jobDetails.benefitsEligible ? 'Yes' : 'No'}
• Direct Supervisor: ${jobDetails.directSupervisor}
${jobDetails.specialInstructions ? `\nSpecial Instructions:\n${jobDetails.specialInstructions}` : ''}

To accept this offer and complete your onboarding, please click the link below:
[Onboarding Link - Will be generated upon approval]

This offer is contingent upon successful completion of our onboarding process, including required documentation and background checks.

Important Next Steps:
1. Click the onboarding link when you receive it
2. Complete all required forms (I-9, W-4, etc.)
3. Upload required identification documents
4. Review and sign all employment documents

We look forward to welcoming you to our team!

Best regards,
${propertyName} Hiring Team

---
This is an automated message. Please do not reply to this email.
For questions, please contact your property manager.
  `.trim();
};

export const ApprovalConfirmationDialog: React.FC<ApprovalConfirmationDialogProps> = ({
  application,
  jobDetails,
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const [showEmailPreview, setShowEmailPreview] = useState(false);

  const formatPayRate = (rate: number, frequency: string) => {
    const annualRate = frequency === 'weekly' ? rate * 40 * 52 : rate * 40 * 26;
    return {
      hourly: `$${rate.toFixed(2)}/hour`,
      annual: `$${annualRate.toLocaleString()}/year`,
    };
  };

  const getEmailPreview = () => {
    const payInfo = calculatePayRateInfo(jobDetails.payRate, jobDetails.payFrequency);
    const startDate = new Date(jobDetails.startDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const startTime = formatStartTime(jobDetails.startTime);
    const propertyName = application.property?.name || '[Property Name]';

    return `
Subject: Congratulations! Job Offer from ${propertyName}

Dear ${application.firstName} ${application.lastName},

We are pleased to offer you the position of ${jobDetails.jobTitle} in our ${jobDetails.department} department at ${propertyName}.

Job Details:
• Position: ${jobDetails.jobTitle}
• Department: ${jobDetails.department}
• Start Date: ${startDate}
• Start Time: ${jobDetails.startTime}
• Pay Rate: $${payInfo.hourly} (approximately $${payInfo.annual})
• Pay Frequency: ${jobDetails.payFrequency === 'bi-weekly' ? 'Bi-weekly' : 'Weekly'}
• Benefits Eligible: ${jobDetails.benefitsEligible ? 'Yes' : 'No'}
• Direct Supervisor: ${jobDetails.directSupervisor}
${jobDetails.specialInstructions ? `\nSpecial Instructions:\n${jobDetails.specialInstructions}` : ''}

To accept this offer and complete your onboarding, please click the link below:
[Onboarding Link - Will be generated upon approval]

This offer is contingent upon successful completion of our onboarding process, including required documentation and background checks.

Important Next Steps:
1. Click the onboarding link when you receive it
2. Complete all required forms (I-9, W-4, etc.)
3. Upload required identification documents
4. Review and sign all employment documents

We look forward to welcoming you to our team!

Best regards,
${propertyName} Hiring Team

---
This is an automated message. Please do not reply to this email.
For questions, please contact your property manager.
    `.trim();
  };



  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">
              Confirm Job Offer
            </h3>
            <p className="text-sm text-gray-600 mt-2">
              Please review the job details before sending the offer to {application.firstName} {application.lastName}
            </p>
          </div>

          {/* Application Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Applicant Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{application.firstName} {application.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{application.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{application.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Applied For:</span>
                <span className="ml-2 font-medium">{application.position}</span>
              </div>
            </div>
          </div>

          {/* Job Details Summary */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Job Offer Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Job Title:</span>
                <span className="ml-2 font-medium">{jobDetails.jobTitle}</span>
              </div>
              <div>
                <span className="text-gray-600">Department:</span>
                <span className="ml-2 font-medium">{jobDetails.department}</span>
              </div>
              <div>
                <span className="text-gray-600">Start Date:</span>
                <span className="ml-2 font-medium">
                  {new Date(jobDetails.startDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Start Time:</span>
                <span className="ml-2 font-medium">{jobDetails.startTime}</span>
              </div>
              <div>
                <span className="text-gray-600">Pay Rate:</span>
                <span className="ml-2 font-medium">
                  ${jobDetails.payRate.toFixed(2)}/hour
                </span>
              </div>
              <div>
                <span className="text-gray-600">Pay Frequency:</span>
                <span className="ml-2 font-medium capitalize">
                  {jobDetails.payFrequency.replace('-', ' ')}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Benefits:</span>
                <span className="ml-2 font-medium">
                  {jobDetails.benefitsEligible ? 'Eligible' : 'Not Eligible'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Supervisor:</span>
                <span className="ml-2 font-medium">{jobDetails.directSupervisor}</span>
              </div>
              {jobDetails.specialInstructions && (
                <div className="md:col-span-2">
                  <span className="text-gray-600">Special Instructions:</span>
                  <p className="ml-2 font-medium mt-1">{jobDetails.specialInstructions}</p>
                </div>
              )}
            </div>
          </div>

          {/* Email Preview Toggle */}
          <div>
            <button
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <svg className={`h-4 w-4 mr-1 transform ${showEmailPreview ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              {showEmailPreview ? 'Hide' : 'Preview'} Email
            </button>
            
            {showEmailPreview && (
              <div className="mt-3 bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-medium text-gray-900 mb-2">Email Preview</h5>
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono bg-gray-50 p-3 rounded border overflow-x-auto">
                  {getEmailPreview()}
                </pre>
              </div>
            )}
          </div>

          {/* Impact Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Offer email will be sent to {application.firstName} {application.lastName}</li>
                    <li>Unique onboarding link will be generated (expires in 72 hours)</li>
                    <li>Employee record will be created in the system</li>
                    <li>Other {application.department} applicants will be notified of rejection</li>
                    <li>Rejected candidates will be added to talent pool for future opportunities</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Important - This action cannot be undone
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Please review all details carefully before confirming. Once approved, the candidate will receive the job offer and other applicants will be automatically processed.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Confirm & Send Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};