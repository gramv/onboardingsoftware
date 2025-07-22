import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface EmployeeStatusData {
  totalEmployees: number;
  activeEmployees: number;
  onboardingEmployees: number;
  terminatedThisMonth: number;
  complianceAlerts: number;
  pendingApprovals: number;
  locations: any[];
}

interface EmployeeStatusWidgetsProps {
  data: EmployeeStatusData;
}

interface Employee {
  id: string;
  name: string;
  position: string;
  location: string;
  status: 'active' | 'onboarding' | 'inactive' | 'terminated';
  lastActivity: string;
  complianceStatus: 'compliant' | 'warning' | 'non-compliant';
  avatar?: string;
}

export const EmployeeStatusWidgets: React.FC<EmployeeStatusWidgetsProps> = ({ data }) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'onboarding' | 'alerts'>('all');

  // Mock employee data - in real app this would come from API
  const employees: Employee[] = [
    {
      id: '1',
      name: 'Sarah Johnson',
      position: 'Front Desk Manager',
      location: 'Downtown Motel',
      status: 'active',
      lastActivity: '2 hours ago',
      complianceStatus: 'compliant',
    },
    {
      id: '2',
      name: 'Mike Chen',
      position: 'Housekeeping Supervisor',
      location: 'Airport Motel',
      status: 'active',
      lastActivity: '30 minutes ago',
      complianceStatus: 'warning',
    },
    {
      id: '3',
      name: 'Lisa Rodriguez',
      position: 'Night Auditor',
      location: 'Highway Motel',
      status: 'onboarding',
      lastActivity: '1 day ago',
      complianceStatus: 'non-compliant',
    },
    {
      id: '4',
      name: 'David Kim',
      position: 'Maintenance Technician',
      location: 'Seaside Motel',
      status: 'active',
      lastActivity: '4 hours ago',
      complianceStatus: 'compliant',
    },
    {
      id: '5',
      name: 'Emma Wilson',
      position: 'Guest Services',
      location: 'Downtown Motel',
      status: 'onboarding',
      lastActivity: '6 hours ago',
      complianceStatus: 'warning',
    },
  ];

  const getStatusColor = (status: Employee['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'onboarding':
        return 'text-blue-600 bg-blue-100';
      case 'inactive':
        return 'text-gray-600 bg-gray-100';
      case 'terminated':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
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

  const getComplianceIcon = (status: Employee['complianceStatus']) => {
    switch (status) {
      case 'compliant':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'non-compliant':
        return 'XCircle';
      default:
        return 'Circle';
    }
  };

  const filteredEmployees = employees.filter(employee => {
    switch (selectedFilter) {
      case 'active':
        return employee.status === 'active';
      case 'onboarding':
        return employee.status === 'onboarding';
      case 'alerts':
        return employee.complianceStatus !== 'compliant';
      default:
        return true;
    }
  });

  const statusCounts = {
    active: employees.filter(e => e.status === 'active').length,
    onboarding: employees.filter(e => e.status === 'onboarding').length,
    alerts: employees.filter(e => e.complianceStatus !== 'compliant').length,
  };

  return (
    <div className="space-y-6">
      {/* Real-time Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Currently Active
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {data.activeEmployees}
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Online now
                </p>
              </div>
              <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
                <Icon name="Users" size={24} className="text-green-700 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  In Onboarding
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {data.onboardingEmployees}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  In progress
                </p>
              </div>
              <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
                <Icon name="UserPlus" size={24} className="text-blue-700 dark:text-blue-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-700 dark:text-red-300">
                  Compliance Alerts
                </p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100 mt-1">
                  {data.complianceAlerts}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  Need attention
                </p>
              </div>
              <div className="p-3 bg-red-200 dark:bg-red-800 rounded-full">
                <Icon name="AlertTriangle" size={24} className="text-red-700 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Status List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Icon name="Activity" size={20} className="mr-2" />
              Real-time Employee Status
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant={selectedFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('all')}
              >
                All ({employees.length})
              </Button>
              <Button
                variant={selectedFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('active')}
              >
                Active ({statusCounts.active})
              </Button>
              <Button
                variant={selectedFilter === 'onboarding' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('onboarding')}
              >
                Onboarding ({statusCounts.onboarding})
              </Button>
              <Button
                variant={selectedFilter === 'alerts' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedFilter('alerts')}
              >
                Alerts ({statusCounts.alerts})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredEmployees.map((employee) => (
              <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                    <Icon name="User" size={20} className="text-gray-600 dark:text-gray-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {employee.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {employee.position} • {employee.location}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      Last active: {employee.lastActivity}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <Icon 
                      name={getComplianceIcon(employee.complianceStatus) as any} 
                      size={16} 
                      className={getComplianceColor(employee.complianceStatus)} 
                    />
                    <span className={`text-xs font-medium ${getComplianceColor(employee.complianceStatus)}`}>
                      {employee.complianceStatus.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                  <Badge 
                    variant={employee.status === 'active' ? 'success' : employee.status === 'onboarding' ? 'default' : 'secondary'}
                    className="capitalize"
                  >
                    {employee.status}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Icon name="MoreHorizontal" size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};