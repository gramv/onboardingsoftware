import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobApplicationReview } from '../../client/src/components/manager/JobApplicationReview';

jest.mock('../../client/src/stores/authStore', () => ({
  useAuthStore: () => ({
    user: { id: 'manager-id', role: 'manager' }
  })
}));

jest.mock('../../client/src/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}));

global.fetch = jest.fn();

describe('JobApplicationReview Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should render applications list', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'pending',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Housekeeper',
          department: 'Housekeeping',
          organization: { name: 'Test Hotel' }
        },
        experience: 'Previous hotel experience'
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockApplications })
    });

    render(<JobApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText(/Applied for: Housekeeper/i)).toBeInTheDocument();
    });
  });

  test('should show approval modal when approve button is clicked', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'pending',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Housekeeper',
          department: 'Housekeeping',
          organization: { name: 'Test Hotel' }
        }
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockApplications })
    });

    render(<JobApplicationReview />);

    await waitFor(() => {
      const approveButton = screen.getByText(/Approve/i);
      fireEvent.click(approveButton);
    });

    expect(screen.getByText('Approve Application')).toBeInTheDocument();
    expect(screen.getByLabelText(/Job Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Pay Rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Benefits/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument();
  });

  test('should handle application approval', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'pending',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Housekeeper',
          department: 'Housekeeping',
          organization: { name: 'Test Hotel' }
        }
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApplications })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Application approved' })
      });

    render(<JobApplicationReview />);

    await waitFor(() => {
      const approveButton = screen.getByText(/Approve/i);
      fireEvent.click(approveButton);
    });

    fireEvent.change(screen.getByLabelText(/Job Description/i), {
      target: { value: 'Room cleaning and maintenance' }
    });
    fireEvent.change(screen.getByLabelText(/Pay Rate/i), {
      target: { value: '$15.00/hour' }
    });

    const submitButton = screen.getByText(/Send Approval & Onboarding Email/i);
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/jobs/applications/app-1/approve',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Room cleaning and maintenance')
        })
      );
    });
  });

  test('should handle application rejection', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'pending',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Housekeeper',
          department: 'Housekeeping',
          organization: { name: 'Test Hotel' }
        }
      }
    ];

    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: mockApplications })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'Application rejected' })
      });

    render(<JobApplicationReview />);

    await waitFor(() => {
      const rejectButton = screen.getByText(/Reject/i);
      fireEvent.click(rejectButton);
    });

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/jobs/applications/app-1/reject',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          }),
          body: expect.stringContaining('Position filled')
        })
      );
    });
  });

  test('should display correct status badges', async () => {
    const mockApplications = [
      {
        id: 'app-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        status: 'pending',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Housekeeper',
          department: 'Housekeeping',
          organization: { name: 'Test Hotel' }
        }
      },
      {
        id: 'app-2',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane@example.com',
        status: 'approved',
        appliedAt: '2025-01-01T00:00:00Z',
        jobPosting: {
          title: 'Front Desk Agent',
          department: 'Reception',
          organization: { name: 'Test Hotel' }
        }
      }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockApplications })
    });

    render(<JobApplicationReview />);

    await waitFor(() => {
      expect(screen.getByText('pending')).toBeInTheDocument();
      expect(screen.getByText('approved')).toBeInTheDocument();
    });
  });
});
