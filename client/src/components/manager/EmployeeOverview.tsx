import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  status: 'active' | 'on_shift' | 'off_shift' | 'on_break' | 'sick' | 'vacation';
  shift: string;
  performance: number;
  lastActivity: string;
  phone: string;
  email: string;
  hireDate: string;
  avatar?: string;
}

interface EmployeeOverviewProps {
  propertyName: string;
}

export const EmployeeOverview: React.FC<EmployeeOverviewProps> = ({ propertyName }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  // Mock employee data for the property
  const employees: Employee[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      position: 'Front Desk Supervisor',
      department: 'Front Office',
      status: 'on_shift',
      shift: 'Morning (6AM-2PM)',
      performance: 4.8,
      lastActivity: '5 minutes ago',
      phone: '(555) 123-4567',
      email: 'sarah.j@motel.com',
      hireDate: '2023-03-15',
    },
    {
      id: '2',
      name: 'Mike Chen',
      position: 'Maintenance Technician',
      department: 'Maintenance',
      status: 'on_shift',
      shift: 'Day (8AM-4PM)',
      performance: 4.6,
      lastActivity: '12 minutes ago',
      phone: '(555) 234-5678',
      email: 'mike.c@motel.com',
      hireDate: '2022-11-08',
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      position: 'Housekeeper',
      department: 'Housekeeping',
      status: 'on_break',
      shift: 'Morning (7AM-3PM)',
      performance: 4.9,
      lastActivity: '2 minutes ago',
      phone: '(555) 345-6789',
      email: 'lisa.r@motel.com',
      hireDate: '2023-01-20',
    },
    {
      id: '4',
      name: 'David Kim',
      position: 'Night Auditor',
      department: 'Front Office',
      status: 'off_shift',
      shift: 'Night (11PM-7AM)',
      performance: 4.4,
      lastActivity: '8 hours ago',
      phone: '(555) 456-7890',
      email: 'david.k@motel.com',
      hireDate: '2023-07-10',
    },
    {
      id: '5',
      name: 'Emma Wilson',
      position: 'Housekeeping Supervisor',
      department: 'Housekeeping',
      status: 'vacation',
      shift: 'Day (9AM-5PM)',
      performance: 4.7,
      lastActivity: '3 days ago',
      phone: '(555) 567-8901',
      email: 'emma.w@motel.com',
      hireDate: '2022-09-05',
    },
    {
      id: '6',
      name: 'James Brown',
      position: 'Security Guard',
      department: 'Security',
      status: 'sick',
      shift: 'Evening (4PM-12AM)',
      performance: 4.2,
      lastActivity: '1 day ago',
      phone: '(555) 678-9012',
      email: 'james.b@motel.com',
      hireDate: '2023-05-12',
    },
  ];

  const departments = ['Front Office', 'Housekeeping', 'Maintenance', 'Security'];

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'on_shift':
        return 'success';
      case 'on_break':
        return 'warning';
      case 'off_shift':
        return 'secondary';
      case 'sick':
        return 'destructive';
      case 'vacation':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: Employee['status']) => {
    switch (status) {
      case 'on_shift':
        return 'UserCheck';
      case 'on_break':
        return 'Coffee';
      case 'off_shift':
        return 'UserX';
      case 'sick':
        return 'Heart';
      case 'vacation':
        return 'Plane';
      default:
        return 'User';
    }
  };

  const getPerformanceColor = (performance: number) => {
    if (performance >= 4.5) return 'text-green-600';
    if (performance >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = searchTerm === '' || 
      employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || employee.department === selectedDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  const statusCounts = {
    on_shift: employees.filter(e => e.status === 'on_shift').length,
    on_break: employees.filter(e => e.status === 'on_break').length,
    off_shift: employees.filter(e => e.status === 'off_shift').length,
    sick: employees.filter(e => e.status === 'sick').length,
    vacation: employees.filter(e => e.status === 'vacation').length,
  };

  return (
    <div className="space-y-6">
      {/* Team Status Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {statusCounts.on_shift}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">On Shift</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {statusCounts.on_break}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">On Break</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statusCounts.off_shift}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Off Shift</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {statusCounts.sick}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">Sick Leave</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {statusCounts.vacation}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Vacation</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Team Members ({filteredEmployees.length})</CardTitle>
                <Button 
                  size="sm"
                  onClick={() => window.location.href = '/employees/create'}
                >
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Add Employee
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex space-x-4 mb-6">
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Employee Cards */}
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
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Icon name="User" size={24} className="text-gray-600 dark:text-gray-300" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {employee.name}
                          </h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {employee.position} • {employee.department}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {employee.shift} • Last active: {employee.lastActivity}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getPerformanceColor(employee.performance)}`}>
                            ★ {employee.performance}
                          </div>
                          <Badge variant={getStatusColor(employee.status) as any} size="sm" className="capitalize">
                            <Icon name={getStatusIcon(employee.status) as any} size={12} className="mr-1" />
                            {employee.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Icon name="MoreHorizontal" size={16} />
                        </Button>
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
                      {selectedEmployee.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedEmployee.position}
                    </p>
                    <Badge variant={getStatusColor(selectedEmployee.status) as any} className="mt-2 capitalize">
                      <Icon name={getStatusIcon(selectedEmployee.status) as any} size={12} className="mr-1" />
                      {selectedEmployee.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Performance Rating
                      </label>
                      <div className="mt-1 flex items-center space-x-2">
                        <span className={`text-lg font-bold ${getPerformanceColor(selectedEmployee.performance)}`}>
                          ★ {selectedEmployee.performance}
                        </span>
                        <span className="text-sm text-gray-500">/5.0</span>
                      </div>
                    </div>

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
                        Work Details
                      </label>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.department}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedEmployee.shift}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Hired: {new Date(selectedEmployee.hireDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <Button className="w-full" size="sm">
                      <Icon name="MessageSquare" size={16} className="mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="Calendar" size={16} className="mr-2" />
                      View Schedule
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="TrendingUp" size={16} className="mr-2" />
                      Performance Review
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="Edit" size={16} className="mr-2" />
                      Edit Details
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