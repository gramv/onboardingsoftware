import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyQRManager } from '../../client/src/components/manager/PropertyQRManager';

jest.mock('../../client/src/stores/authStore', () => ({
  useAuthStore: () => ({
    user: {
      organizationId: 'test-org-id',
      organization: { name: 'Test Hotel' }
    }
  })
}));

jest.mock('../../client/src/hooks/useToast', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}));

jest.mock('react-qr-code', () => {
  return function MockQRCode({ value, size }) {
    return <div data-testid="qr-code" data-value={value} data-size={size}>QR Code</div>;
  };
});

describe('PropertyQRManager Component', () => {
  test('should render department selection dropdown', () => {
    render(<PropertyQRManager />);
    
    const departmentSelect = screen.getByLabelText(/Department Filter/i);
    expect(departmentSelect).toBeInTheDocument();
    
    expect(screen.getByText('All Departments')).toBeInTheDocument();
    expect(screen.getByText('Reception')).toBeInTheDocument();
    expect(screen.getByText('Housekeeping')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Pool Services')).toBeInTheDocument();
    expect(screen.getByText('Facilities')).toBeInTheDocument();
  });

  test('should generate QR code when button is clicked', () => {
    render(<PropertyQRManager />);
    
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);
    
    const qrCode = screen.getByTestId('qr-code');
    expect(qrCode).toBeInTheDocument();
    expect(qrCode.getAttribute('data-value')).toContain('org=test-org-id');
  });

  test('should generate department-specific QR code', () => {
    render(<PropertyQRManager />);
    
    const departmentSelect = screen.getByLabelText(/Department Filter/i);
    fireEvent.change(departmentSelect, { target: { value: 'housekeeping' } });
    
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);
    
    const qrCode = screen.getByTestId('qr-code');
    expect(qrCode.getAttribute('data-value')).toContain('dept=housekeeping');
  });

  test('should show copy and download buttons after QR generation', () => {
    render(<PropertyQRManager />);
    
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);
    
    expect(screen.getByText(/Copy Link/i)).toBeInTheDocument();
    expect(screen.getByText(/Download QR/i)).toBeInTheDocument();
  });

  test('should display correct QR code description', () => {
    render(<PropertyQRManager />);
    
    const generateButton = screen.getByText(/Generate QR Code/i);
    fireEvent.click(generateButton);
    
    expect(screen.getByText(/Scan to apply for any position/i)).toBeInTheDocument();
    
    const departmentSelect = screen.getByLabelText(/Department Filter/i);
    fireEvent.change(departmentSelect, { target: { value: 'reception' } });
    fireEvent.click(generateButton);
    
    expect(screen.getByText(/Scan to apply for Reception positions/i)).toBeInTheDocument();
  });
});
