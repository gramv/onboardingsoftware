import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface EmployeeProfileProps {
  employeeId?: string;
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  status: 'active' | 'on_shift' | 'off_shift' | 'on_break' | 'sick' | 'vacation' | 'terminated';
  hireDate: string;
  terminationDate?: string;
  manager: string;
  managerId?: string;
  employeeId: string;
  performance: number;
  rehireEligible?: boolean;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  documents: {
    id: string;
    name: string;
    type: string;
    status: string;
    uploadedAt: string;
    signedAt?: string;
  }[];
  employmentHistory: {
    id: string;
    position: string;
    department: string;
    startDate: string;
    endDate?: string;
    managerName: string;
    location?: string;
    notes?: string;
  }[];
  schedulePreferences?: {
    availableDays: string[];
    preferredShifts: string[];
    maxHoursPerWeek: number;
    notes: string;
  };
}
export const EmployeeProfileManagement: React.FC<EmployeeProfileProps> = ({ employeeId }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);
  const [showTerminationModal, setShowTerminationModal] = useState(false);
  const [terminationData, setTerminationData] = useState({
    terminationDate: new Date().toISOString().split('T')[0],
    managerRating: 3,
    rehireEligible: true,
    generateExperienceLetter: true,
    reason: '',
    notes: ''
  });

  // Mock employee data - in a real app, this would be fetched from an API
  const [employeeData, setEmployeeData] = useState<EmployeeData>({
    id: '1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.j@motel.com',
    phone: '(555) 123-4567',
    position: 'Front Desk Supervisor',
    department: 'Front Office',
    status: 'active',
    hireDate: '2023-03-15',
    manager: 'John Smith',
    managerId: 'manager-1',
    employeeId: 'EMP001',
    performance: 4.8,
    address: {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
    emergencyContact: {
      name: 'Michael Johnson',
      relationship: 'Spouse',
      phone: '(555) 987-6543',
    },
    documents: [
      {
        id: '1',
        name: 'I-9 Employment Eligibility Verification',
        type: 'i9',
        status: 'signed',
        uploadedAt: '2023-03-15',
        signedAt: '2023-03-15',
      },
      {
        id: '2',
        name: 'W-4 Tax Withholding Form',
        type: 'w4',
        status: 'signed',
        uploadedAt: '2023-03-15',
        signedAt: '2023-03-15',
      },
      {
        id: '3',
        name: 'Employee Handbook Acknowledgment',
        type: 'handbook',
        status: 'signed',
        uploadedAt: '2023-03-16',
        signedAt: '2023-03-16',
      },
    ],
    employmentHistory: [
      {
        id: '1',
        position: 'Front Desk Associate',
        department: 'Front Office',
        startDate: '2023-03-15',
        endDate: '2023-09-01',
        managerName: 'John Smith',
        location: 'Downtown Location',
        notes: 'Promoted after 6 months due to excellent customer service skills',
      },
      {
        id: '2',
        position: 'Front Desk Supervisor',
        department: 'Front Office',
        startDate: '2023-09-01',
        managerName: 'John Smith',
        location: 'Downtown Location',
      },
    ],
    schedulePreferences: {
      availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      preferredShifts: ['Morning', 'Afternoon'],
      maxHoursPerWeek: 40,
      notes: 'Prefers consistent schedule, available for occasional weekends if needed',
    },
  });
 
 const handleInputChange = (field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (section: string, field: string, value: string) => {
    setEmployeeData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof EmployeeData],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    // In a real app, this would make an API call to save the data
    console.log('Saving employee data:', employeeData);
    setEditMode(false);
  };

  const handleTerminate = () => {
    // In a real app, this would make an API call to terminate the employee
    console.log('Terminating employee with data:', terminationData);
    
    // Update the employee status and add termination data
    setEmployeeData(prev => ({
      ...prev,
      status: 'terminated',
      terminationDate: terminationData.terminationDate,
      rehireEligible: terminationData.rehireEligible,
    }));
    
    setShowTerminationModal(false);
  };

  const getStatusBadge = (status: string) => {
    let color = 'default';
    let icon = 'User';
    
    switch (status) {
      case 'active':
        color = 'success';
        icon = 'UserCheck';
        break;
      case 'on_shift':
        color = 'success';
        icon = 'UserCheck';
        break;
      case 'off_shift':
        color = 'secondary';
        icon = 'UserX';
        break;
      case 'on_break':
        color = 'warning';
        icon = 'Coffee';
        break;
      case 'sick':
        color = 'destructive';
        icon = 'Heart';
        break;
      case 'vacation':
        color = 'default';
        icon = 'Plane';
        break;
      case 'terminated':
        color = 'destructive';
        icon = 'UserMinus';
        break;
      default:
        color = 'default';
        icon = 'User';
    }
    
    return (
      <Badge variant={color as any} className="capitalize">
        <Icon name={icon as any} size={12} className="mr-1" />
        {status.replace('_', ' ')}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Employee Profile Management</h2>
        <p className="text-gray-600">Manage employee profiles and information</p>
      </div>
    </div>
  );
};