import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface Location {
  id: string;
  name: string;
  employees: number;
  status: 'operational' | 'maintenance' | 'closed';
}

interface KPIData {
  totalEmployees: number;
  activeEmployees: number;
  onboardingEmployees: number;
  terminatedThisMonth: number;
  complianceAlerts: number;
  pendingApprovals: number;
  locations: Location[];
}

interface KPIOverviewProps {
  data: KPIData;
}

export const KPIOverview: React.FC<KPIOverviewProps> = ({ data }) => {
  const kpiCards = [
    {
      title: 'Total Employees',
      value: data.totalEmployees,
      change: '+12 this month',
      changeType: 'positive' as const,
      icon: 'Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Employees',
      value: data.activeEmployees,
      change: `${((data.activeEmployees / data.totalEmployees) * 100).toFixed(1)}% of total`,
      changeType: 'neutral' as const,
      icon: 'UserCheck',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Onboarding',
      value: data.onboardingEmployees,
      change: '3 completed this week',
      changeType: 'positive' as const,
      icon: 'UserPlus',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Terminated (Month)',
      value: data.terminatedThisMonth,
      change: '-2 vs last month',
      changeType: 'positive' as const,
      icon: 'UserMinus',
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const getLocationStatusColor = (status: Location['status']) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 bg-green-100';
      case 'maintenance':
        return 'text-yellow-600 bg-yellow-100';
      case 'closed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive':
        return 'text-green-600';
      case 'negative':
        return 'text-red-600';
      case 'neutral':
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {kpi.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {kpi.value.toLocaleString()}
                  </p>
                  <p className={`text-sm mt-1 ${getChangeColor(kpi.changeType)}`}>
                    {kpi.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                  <Icon name={kpi.icon as any} size={24} className={kpi.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Multi-Location Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="MapPin" size={20} className="mr-2" />
              Location Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.locations.map((location) => (
                <div key={location.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                      <Icon name="Building" size={20} className="text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {location.name}
                      </h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {location.employees} employees
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={location.status === 'operational' ? 'success' : location.status === 'maintenance' ? 'warning' : 'destructive'}
                    className="capitalize"
                  >
                    {location.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="TrendingUp" size={20} className="mr-2" />
              Key Metrics Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Employee Retention Rate
                  </span>
                  <span className="text-sm font-bold text-green-600">94.2%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '94.2%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Onboarding Completion Rate
                  </span>
                  <span className="text-sm font-bold text-blue-600">87.5%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '87.5%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Compliance Score
                  </span>
                  <span className="text-sm font-bold text-yellow-600">91.8%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-yellow-600 h-2 rounded-full" style={{ width: '91.8%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Average Time to Hire
                  </span>
                  <span className="text-sm font-bold text-purple-600">12 days</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};