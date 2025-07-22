import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Icon } from '../components/ui/Icon';
import { useAuthStore } from '../stores/authStore';

export const Dashboard: React.FC = () => {
  const { user } = useAuthStore();

  const stats = [
    {
      title: 'Total Employees',
      value: '24',
      change: '+2 this month',
      icon: 'Users',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Active Schedules',
      value: '8',
      change: 'This week',
      icon: 'Calendar',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'Pending Documents',
      value: '5',
      change: 'Require attention',
      icon: 'FileText',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Messages',
      value: '12',
      change: '3 unread',
      icon: 'MessageSquare',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Here's what's happening at {user?.organizationName} today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-medium transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <Icon name={stat.icon as any} size={24} className={stat.color} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'New employee onboarded',
                  user: 'Sarah Johnson',
                  time: '2 hours ago',
                  icon: 'UserPlus',
                },
                {
                  action: 'Schedule updated',
                  user: 'Mike Chen',
                  time: '4 hours ago',
                  icon: 'Calendar',
                },
                {
                  action: 'Document uploaded',
                  user: 'Lisa Rodriguez',
                  time: '6 hours ago',
                  icon: 'FileText',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon name={activity.icon as any} size={16} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {activity.user} • {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Add Employee', icon: 'UserPlus', href: '/employees/create' },
                { label: 'Create Schedule', icon: 'Calendar', href: '/scheduling' },
                { label: 'Send Message', icon: 'MessageSquare', href: '/messages' },
                { label: 'View Reports', icon: 'BarChart3', href: '/reports' },
              ].map((action) => (
                <a
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <Icon name={action.icon as any} size={24} className="text-primary-600 dark:text-primary-400 mb-2" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {action.label}
                  </span>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};