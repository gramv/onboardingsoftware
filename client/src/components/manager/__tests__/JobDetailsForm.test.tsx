import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobDetailsForm, JobDetails } from '../JobDetailsForm';
import { PropertyApplication } from '../../../types/application';

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

describe('JobDetailsForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock Date to ensure consistent date behavior
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T10:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const renderJobDetailsForm = (props = {}) => {
    return render(
      <JobDetailsForm
        application={mockApplication}
        onSubmit={mockOnSubmit}
        onCancel={mockOnCancel}
        {...props}
      />
    );
  };

  it('renders the form with application information', () => {
    renderJobDetailsForm();
    
    expect(screen.getByText('Job Details for John Doe')).toBeInTheDocument();
    expect(screen.getByText('Room Attendant - Housekeeping')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Room Attendant')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Housekeeping')).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    // Clear required fields
    const jobTitleInput = screen.getByLabelText(/job title/i);
    const payRateInput = screen.getByLabelText(/pay rate/i);
    const supervisorInput = screen.getByLabelText(/direct supervisor/i);

    await user.clear(jobTitleInput);
    await user.clear(payRateInput);
    await user.clear(supervisorInput);

    // Try to submit
    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Job title is required')).toBeInTheDocument();
      expect(screen.getByText('Pay rate must be greater than 0')).toBeInTheDocument();
      expect(screen.getByText('Direct supervisor is required')).toBeInTheDocument();
    });

    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('validates pay rate constraints', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const payRateInput = screen.getByLabelText(/pay rate/i);

    // Test below minimum wage
    await user.clear(payRateInput);
    await user.type(payRateInput, '5.00');
    
    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Pay rate cannot be below federal minimum wage ($7.25)')).toBeInTheDocument();
    });

    // Test unreasonably high rate
    await user.clear(payRateInput);
    await user.type(payRateInput, '150.00');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Pay rate seems unusually high, please verify')).toBeInTheDocument();
    });
  });

  it('validates start date is in the future', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const startDateInput = screen.getByLabelText(/start date/i);
    
    // Set date to today (should fail)
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-01-20'); // Same as mocked current date

    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Start date must be in the future')).toBeInTheDocument();
    });
  });

  it('applies position-specific template when available', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    // Click template dropdown
    const templateButton = screen.getByText('Use Template');
    await user.click(templateButton);

    // Should show Room Attendant template since it exists
    const roomAttendantTemplate = screen.getByText('Room Attendant Template');
    await user.click(roomAttendantTemplate);

    // Check that template values are applied
    expect(screen.getByDisplayValue('15.00')).toBeInTheDocument(); // Pay rate
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument(); // Start time
    expect(screen.getByDisplayValue('Housekeeping Supervisor')).toBeInTheDocument(); // Supervisor
  });

  it('applies generic templates', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    // Click template dropdown
    const templateButton = screen.getByText('Use Template');
    await user.click(templateButton);

    // Apply entry level template
    const entryLevelTemplate = screen.getByText('Entry Level ($15/hr)');
    await user.click(entryLevelTemplate);

    // Check that template values are applied
    expect(screen.getByDisplayValue('15.00')).toBeInTheDocument(); // Pay rate
    expect(screen.getByDisplayValue('09:00')).toBeInTheDocument(); // Start time
    
    // Benefits should be unchecked for entry level
    const benefitsCheckbox = screen.getByLabelText('Benefits Eligible') as HTMLInputElement;
    expect(benefitsCheckbox.checked).toBe(false);
  });

  it('provides job title suggestions from department', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const jobTitleInput = screen.getByLabelText(/job title/i);
    
    // Check that datalist exists with housekeeping positions
    const datalist = document.querySelector('#jobTitles');
    expect(datalist).toBeInTheDocument();
    
    const options = datalist?.querySelectorAll('option');
    const optionValues = Array.from(options || []).map(option => option.getAttribute('value'));
    
    expect(optionValues).toContain('Room Attendant');
    expect(optionValues).toContain('Housekeeping Supervisor');
    expect(optionValues).toContain('Laundry Attendant');
  });

  it('provides supervisor suggestions from department', async () => {
    renderJobDetailsForm();

    // Check that supervisor datalist exists with housekeeping supervisors
    const datalist = document.querySelector('#supervisors');
    expect(datalist).toBeInTheDocument();
    
    const options = datalist?.querySelectorAll('option');
    const optionValues = Array.from(options || []).map(option => option.getAttribute('value'));
    
    expect(optionValues).toContain('Housekeeping Manager');
    expect(optionValues).toContain('Executive Housekeeper');
    expect(optionValues).toContain('Housekeeping Supervisor');
  });

  it('validates special instructions character limit', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const specialInstructionsTextarea = screen.getByLabelText(/special instructions/i);
    
    // Type more than 500 characters
    const longText = 'a'.repeat(501);
    await user.type(specialInstructionsTextarea, longText);

    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Special instructions cannot exceed 500 characters')).toBeInTheDocument();
    });
  });

  it('shows character count for special instructions', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const specialInstructionsTextarea = screen.getByLabelText(/special instructions/i);
    
    // Initially should show 0/500
    expect(screen.getByText('(0/500 characters)')).toBeInTheDocument();
    
    // Type some text
    await user.type(specialInstructionsTextarea, 'Test instructions');
    
    // Should update character count
    expect(screen.getByText('(17/500 characters)')).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    // Fill in required fields
    const jobTitleInput = screen.getByLabelText(/job title/i);
    const startDateInput = screen.getByLabelText(/start date/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const payRateInput = screen.getByLabelText(/pay rate/i);
    const supervisorInput = screen.getByLabelText(/direct supervisor/i);
    const specialInstructionsTextarea = screen.getByLabelText(/special instructions/i);

    await user.clear(jobTitleInput);
    await user.type(jobTitleInput, 'Senior Room Attendant');
    
    await user.clear(startDateInput);
    await user.type(startDateInput, '2024-02-01');
    
    await user.clear(startTimeInput);
    await user.type(startTimeInput, '08:00');
    
    await user.clear(payRateInput);
    await user.type(payRateInput, '16.50');
    
    await user.clear(supervisorInput);
    await user.type(supervisorInput, 'Jane Smith');
    
    await user.type(specialInstructionsTextarea, 'Please report to housekeeping office on first day.');

    // Submit form
    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        jobTitle: 'Senior Room Attendant',
        startDate: '2024-02-01',
        startTime: '08:00',
        payRate: 16.50,
        payFrequency: 'bi-weekly',
        department: 'Housekeeping',
        benefitsEligible: true,
        directSupervisor: 'Jane Smith',
        specialInstructions: 'Please report to housekeeping office on first day.',
      });
    });
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalled();
  });

  it('disables form when loading', () => {
    renderJobDetailsForm({ loading: true });

    const submitButton = screen.getByText('Approve & Send Offer');
    const cancelButton = screen.getByText('Cancel');

    expect(submitButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it('shows loading spinner when submitting', () => {
    renderJobDetailsForm({ loading: true });

    // Should show loading spinner in submit button
    const submitButton = screen.getByText('Approve & Send Offer');
    const spinner = submitButton.querySelector('svg.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('clears errors when user starts typing', async () => {
    const user = userEvent.setup();
    renderJobDetailsForm();

    const jobTitleInput = screen.getByLabelText(/job title/i);
    
    // Clear field to trigger error
    await user.clear(jobTitleInput);
    
    const submitButton = screen.getByText('Approve & Send Offer');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Job title is required')).toBeInTheDocument();
    });

    // Start typing to clear error
    await user.type(jobTitleInput, 'New Title');

    await waitFor(() => {
      expect(screen.queryByText('Job title is required')).not.toBeInTheDocument();
    });
  });
});