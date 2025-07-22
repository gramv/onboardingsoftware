import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  location: string;
  status: 'active' | 'inactive' | 'onboarding' | 'terminated';
  hireDate: string;
  phone: string;
  emergencyContact: string;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
}

export const EmployeeSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Mock employee data
  const employees: Employee[] = [
    {
      id: '1',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@motel.com',
      position: 'Front Desk Manager',
      department: 'Front Office',
      location: 'Downtown Motel',
      status: 'active',
      hireDate: '2023-03-15',
      phone: '(555) 123-4567',
      emergencyContact: 'John Johnson - (555) 987-6543',
      complianceStatus: 'compliant',
    },
    {
      id: '2',
      firstName: 'Mike',
      lastName: 'Chen',
      email: 'mike.chen@motel.com',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      location: 'Airport Motel',
      status: 'active',
      hireDate: '2022-11-08',
      phone: '(555) 234-5678',
      emergencyContact: 'Lisa Chen - (555) 876-5432',
      complianceStatus: 'warning',
    },
    {
      id: '3',
      firstName: 'Lisa',
      lastName: 'Rodriguez',
      email: 'lisa.rodriguez@motel.com',
      position: 'Night Auditor',
      department: 'Front Office',
      location: 'Highway Motel',
      status: 'onboarding',
      hireDate: '2024-01-02',
      phone: '(555) 345-6789',
      emergencyContact: 'Carlos Rodriguez - (555) 765-4321',
      complianceStatus: 'non-compliant',
    },
    {
      id: '4',
      firstName: 'David',
      lastName: 'Kim',
      email: 'david.kim@motel.com',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      location: 'Seaside Motel',
      status: 'active',
      hireDate: '2023-07-20',
      phone: '(555) 456-7890',
      emergencyContact: 'Susan Kim - (555) 654-3210',
      complianceStatus: 'compliant',
    },
    {
      id: '5',
      firstName: 'Emma',
      lastName: 'Wilson',
      email: 'emma.wilson@motel.com',
      position: 'Guest Services',
      department: 'Front Office',
      location: 'Downtown Motel',
      status: 'onboarding',
      hireDate: '2024-01-08',
      phone: '(555) 567-8901',
      emergencyContact: 'Robert Wilson - (555) 543-2109',
      complianceStatus: 'warning',
    },
  ];

  const locations = ['Downtown Motel', 'Airport Motel', 'Highway Motel', 'Seaside Motel'];

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      `${employee.firstName} ${employee.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.department.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = selectedLocation === 'all' || employee.location === selectedLocation;
    const matchesStatus = selectedStatus === 'all' || employee.status === selectedStatus;
    
    return matchesSearch && matchesLocation && matchesStatus;
  });

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'onboarding':
        return 'default';
      case 'inactive':
        return 'secondary';
      case 'terminated':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getComplianceColor = (status: Employee['complianceStatus']) => {
    switch (status) {
      case 'compliant':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'non-compliant':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Search" size={20} className="mr-2" />
            Employee Search & Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="md:col-span-2"
            />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Locations</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="onboarding">Onboarding</option>
              <option value="inactive">Inactive</option>
              <option value="terminated">Terminated</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Employee Directory ({filteredEmployees.length})
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Icon name="Download" size={16} className="mr-2" />
                    Export
                  </Button>
                  <Button size="sm">
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Add Employee
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEmployees.map((employee) => (
                  <div 
                    key={employee.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedEmployee?.id === employee.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedEmployee(employee)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Icon name="User" size={20} className="text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position} • {employee.department}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {employee.location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`text-xs ${getComplianceColor(employee.complianceStatus)}`}>
                          {employee.complianceStatus}
                        </div>
                        <Badge variant={getStatusColor(employee.status) as any} className="capitalize">
                          {employee.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Employee Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Employee Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedEmployee ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon name="User" size={32} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedEmployee.firstName} {selectedEmployee.lastName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedEmployee.position}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Contact Information
                      </label>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.email}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.phone}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Employment Details
                      </label>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.department}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.location}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hired: {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Emergency Contact
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedEmployee.emergencyContact}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Status
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <Badge variant={getStatusColor(selectedEmployee.status) as any} className="capitalize">
                          {selectedEmployee.status}
                        </Badge>
                        <span className={`text-xs ${getComplianceColor(selectedEmployee.complianceStatus)}`}>
                          {selectedEmployee.complianceStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button className="w-full" size="sm">
                      <Icon name="Edit" size={16} className="mr-2" />
                      Edit Employee
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="FileText" size={16} className="mr-2" />
                      View Documents
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="Calendar" size={16} className="mr-2" />
                      View Schedule
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="Users" size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select an employee to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};