import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export const PayrollConfiguration: React.FC = () => {
  const [selectedLocation, setSelectedLocation] = useState('all');

  const payrollSettings = [
    {
      id: '1',
      location: 'Downtown Motel',
      payPeriod: 'Bi-weekly',
      nextPayDate: '2024-01-15',
      employees: 45,
      totalPayroll: 89250,
      status: 'processed',
    },
    {
      id: '2',
      location: 'Airport Motel',
      payPeriod: 'Bi-weekly',
      nextPayDate: '2024-01-15',
      employees: 38,
      totalPayroll: 76800,
      status: 'pending',
    },
    {
      id: '3',
      location: 'Highway Motel',
      payPeriod: 'Bi-weekly',
      nextPayDate: '2024-01-15',
      employees: 42,
      totalPayroll: 82400,
      status: 'processing',
    },
    {
      id: '4',
      location: 'Seaside Motel',
      payPeriod: 'Bi-weekly',
      nextPayDate: '2024-01-15',
      employees: 31,
      totalPayroll: 65200,
      status: 'pending',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="DollarSign" size={20} className="mr-2" />
            Payroll Configuration & Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Total Monthly Payroll
                  </p>
                  <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                    $313,650
                  </p>
                </div>
                <Icon name="TrendingUp" size={24} className="text-green-600" />
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    Active Employees
                  </p>
                  <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                    156
                  </p>
                </div>
                <Icon name="Users" size={24} className="text-blue-600" />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                    Pending Approvals
                  </p>
                  <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                    12
                  </p>
                </div>
                <Icon name="Clock" size={24} className="text-yellow-600" />
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    Next Pay Date
                  </p>
                  <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                    Jan 15, 2024
                  </p>
                </div>
                <Icon name="Calendar" size={24} className="text-purple-600" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {payrollSettings.map((setting) => (
              <div key={setting.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {setting.location}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {setting.employees} employees • {setting.payPeriod} • Next: {setting.nextPayDate}
                    </p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Total: ${setting.totalPayroll.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge 
                      variant={setting.status === 'processed' ? 'success' : setting.status === 'processing' ? 'default' : 'warning'}
                      className="capitalize"
                    >
                      {setting.status}
                    </Badge>
                    <Button variant="outline" size="sm">
                      Configure
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center space-x-4">
            <Button>
              <Icon name="Settings" size={16} className="mr-2" />
              Bulk Configuration
            </Button>
            <Button variant="outline">
              <Icon name="Download" size={16} className="mr-2" />
              Export Payroll Data
            </Button>
            <Button variant="outline">
              <Icon name="FileText" size={16} className="mr-2" />
              Generate Reports
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};