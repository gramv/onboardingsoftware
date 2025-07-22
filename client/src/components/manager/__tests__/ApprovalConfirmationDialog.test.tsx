import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApprovalConfirmationDialog } from '../ApprovalConfirmationDialog';
import { PropertyApplication } from '../../../types/application';
import { JobDetails } from '../JobDetailsForm';

// Mock application data
const mockApplication: PropertyApplication = {
  id: '1',
  propertyId: 'prop-1',
  department: 'Housekeeping',
  position: 'Room Attendant',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  phone: '555-0123',
  address: {
    street: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipCode: '12345'
  },
  workAuthorized: true,
  requiresSponsorship: false,
  availableStartDate: '2024-02-01',
  shiftPreference: 'morning',
  employmentType: 'full_time',
  yearsExperience: 'one_to_three',
  hotelExperience: true,
  status: 'pending',
  appliedAt: '2024-01-15T10:00:00Z',
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z'
};

const mockJobDetails: JobDetails = {
  jobTitle: 'Senior Room Attendant',
  startDate: '2024-02-01',
  startTime: '08:00',
  payRate: 16.50,
  payFrequency: 'bi-weekly',
  department: 'Housekeeping',
  benefitsEligible: true,
  directSupervisor: 'Jane Smith',
  specialInstructions: 'Please report to housekeeping office on first day.'
};

describe('ApprovalConfirmationDialog', () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderApprovalDialog = (props = {}) => {
    return render(
      <ApprovalConfirmationDialog
        application={mockApplication}
        jobDetails={mockJobDetails}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('renders confirmation dialog with application and job details', () => {
    renderApprovalDialog();
    
    expect(screen.getByText('Confirm Job Offer')).toBeInTheDocument();
    expect(screen.getByText(/Please review the job details before sending the offer to John Doe/)).toBeInTheDocument();
    
    // Check applicant information
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('555-0123')).toBeInTheDocument();
    expect(screen.getByText('Room Attendant')).toBeInTheDocument();
    
    // Check job offer details
    expect(screen.getByText('Senior Room Attendant')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping')).toBeInTheDocument();
    expect(screen.getByText('2/1/2024')).toBeInTheDocument();
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.getByText('$16.50/hour')).toBeInTheDocument();
    expect(screen.getByText('Bi weekly')).toBeInTheDocument();
    expect(screen.getByText('Eligible')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Please report to housekeeping office on first day.')).toBeInTheDocument();
  });

  it('shows email preview when toggle is clicked', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    // Initially email preview should be hidden
    expect(screen.queryByText('Email Preview')).not.toBeInTheDocument();
    
    // Click preview toggle
    const previewButton = screen.getByText('Preview Email');
    await user.click(previewButton);
    
    // Email preview should now be visible
    expect(screen.getByText('Email Preview')).toBeInTheDocument();
    expect(screen.getByText(/Congratulations! Job Offer/)).toBeInTheDocument();
    expect(screen.getByText(/Dear John Doe/)).toBeInTheDocument();
    expect(screen.getByText(/Senior Room Attendant/)).toBeInTheDocument();
    
    // Button text should change to "Hide"
    expect(screen.getByText('Hide Email')).toBeInTheDocument();
  });

  it('hides email preview when toggle is clicked again', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    // Show email preview first
    const previewButton = screen.getByText('Preview Email');
    await user.click(previewButton);
    expect(screen.getByText('Email Preview')).toBeInTheDocument();
    
    // Click hide button
    const hideButton = screen.getByText('Hide Email');
    await user.click(hideButton);
    
    // Email preview should be hidden again
    expect(screen.queryByText('Email Preview')).not.toBeInTheDocument();
    expect(screen.getByText('Preview Email')).toBeInTheDocument();
  });

  it('displays warning about consequences of approval', () => {
    renderApprovalDialog();
    
    expect(screen.getByText('Important')).toBeInTheDocument();
    expect(screen.getByText('This will send an offer email to the candidate')).toBeInTheDocument();
    expect(screen.getByText('Other pending applications in this department will be automatically rejected')).toBeInTheDocument();
    expect(screen.getByText('Rejected candidates will be added to the talent pool')).toBeInTheDocument();
    expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
  });

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    const confirmButton = screen.getByText('Confirm & Send Offer');
    await user.click(confirmButton);
    
    expect(mockOnConfirm).toHaveBeenCalled();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables buttons when loading', () => {
    renderApprovalDialog({ loading: true });
    
    const confirmButton = screen.getByText('Confirm & Send Offer');
    const cancelButton = screen.getByText('Cancel');
    
    expect(confirmButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('shows loading spinner when submitting', () => {
    renderApprovalDialog({ loading: true });
    
    const confirmButton = screen.getByText('Confirm & Send Offer');
    const spinner = confirmButton.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('formats pay rate correctly for different frequencies', () => {
    const weeklyJobDetails = { ...mockJobDetails, payFrequency: 'weekly' as const };
    
    render(
      <ApprovalConfirmationDialog
        application={mockApplication}
        jobDetails={weeklyJobDetails}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Weekly')).toBeInTheDocument();
  });

  it('handles job details without special instructions', () => {
    const jobDetailsWithoutInstructions = { ...mockJobDetails, specialInstructions: undefined };
    
    render(
      <ApprovalConfirmationDialog
        application={mockApplication}
        jobDetails={jobDetailsWithoutInstructions}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Should not show special instructions section
    expect(screen.queryByText('Special Instructions:')).not.toBeInTheDocument();
  });

  it('shows benefits as "Not Eligible" when false', () => {
    const jobDetailsNoBenefits = { ...mockJobDetails, benefitsEligible: false };
    
    render(
      <ApprovalConfirmationDialog
        application={mockApplication}
        jobDetails={jobDetailsNoBenefits}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    expect(screen.getByText('Not Eligible')).toBeInTheDocument();
  });

  it('generates correct email preview content', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    // Show email preview
    const previewButton = screen.getByText('Preview Email');
    await user.click(previewButton);
    
    const emailContent = screen.getByRole('generic', { name: /email preview/i });
    const emailText = emailContent.textContent;
    
    // Check key email content
    expect(emailText).toContain('Dear John Doe');
    expect(emailText).toContain('Senior Room Attendant');
    expect(emailText).toContain('Housekeeping');
    expect(emailText).toContain('Thursday, February 1, 2024'); // Formatted date
    expect(emailText).toContain('08:00');
    expect(emailText).toContain('16.50/hour');
    expect(emailText).toContain('34,320/year'); // Calculated annual salary
    expect(emailText).toContain('Bi-weekly');
    expect(emailText).toContain('Benefits Eligible: Yes');
    expect(emailText).toContain('Jane Smith');
    expect(emailText).toContain('Please report to housekeeping office on first day.');
  });

  it('calculates annual salary correctly for weekly pay', async () => {
    const user = userEvent.setup();
    const weeklyJobDetails = { ...mockJobDetails, payFrequency: 'weekly' as const };
    
    render(
      <ApprovalConfirmationDialog
        application={mockApplication}
        jobDetails={weeklyJobDetails}
        onConfirm={mockOnConfirm}
        onCancel={mockOnCancel}
      />
    );
    
    // Show email preview
    const previewButton = screen.getByText('Preview Email');
    await user.click(previewButton);
    
    const emailContent = screen.getByRole('generic', { name: /email preview/i });
    const emailText = emailContent.textContent;
    
    // Weekly: 16.50 * 40 * 52 = 34,320
    expect(emailText).toContain('34,320/year');
  });

  it('calculates annual salary correctly for bi-weekly pay', async () => {
    const user = userEvent.setup();
    renderApprovalDialog();
    
    // Show email preview
    const previewButton = screen.getByText('Preview Email');
    await user.click(previewButton);
    
    const emailContent = screen.getByRole('generic', { name: /email preview/i });
    const emailText = emailContent.textContent;
    
    // Bi-weekly: 16.50 * 40 * 26 = 17,160
    expect(emailText).toContain('17,160/year');
  });
});