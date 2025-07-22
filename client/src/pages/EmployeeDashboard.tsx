import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { useAuthStore } from '../stores/authStore';
import { PersonalProfile } from '../components/employee/PersonalProfile';
import { ScheduleViewer } from '../components/employee/ScheduleViewer';
import { DocumentCenter } from '../components/employee/DocumentCenter';
import { MessageInbox } from '../components/employee/MessageInbox';
import { NotificationCenter } from '../components/employee/NotificationCenter';
import { TimeTracking } from '../components/employee/TimeTracking';
import { HelpCenter } from '../components/employee/HelpCenter';

type DashboardSection = 
  | 'overview' 
  | 'profile' 
  | 'schedule' 
  | 'documents' 
  | 'messages' 
  | 'notifications' 
  | 'time-tracking' 
  | 'help';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeSection, setActiveSection] = useState<DashboardSection>('overview');

  // Mock data for dashboard stats
  const dashboardStats = [
    {
      title: 'Upcoming Shifts',
      value: '3',
      subtitle: 'This week',
      icon: 'Calendar',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      action: () => setActiveSection('schedule'),
    },
    {
      title: 'Pending Documents',
      value: '2',
      subtitle: 'Need attention',
      icon: 'FileText',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
      action: () => setActiveSection('documents'),
    },
    {
      title: 'Unread Messages',
      value: '5',
      subtitle: 'New messages',
      icon: 'MessageSquare',
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      action: () => setActiveSection('messages'),
    },
    {
      title: 'Hours This Week',
      value: '32',
      subtitle: '8 hours remaining',
      icon: 'Clock',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      action: () => setActiveSection('time-tracking'),
    },
  ];

  const quickActions = [
    {
      label: 'Clock In/Out',
      icon: 'Clock',
      action: () => setActiveSection('time-tracking'),
      variant: 'primary' as const,
    },
    {
      label: 'View Schedule',
      icon: 'Calendar',
      action: () => setActiveSection('schedule'),
      variant: 'secondary' as const,
    },
    {
      label: 'Upload Document',
      icon: 'FileText',
      action: () => setActiveSection('documents'),
      variant: 'secondary' as const,
    },
    {
      label: 'Get Help',
      icon: 'HelpCircle',
      action: () => setActiveSection('help'),
      variant: 'secondary' as const,
    },
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <PersonalProfile />;
      case 'schedule':
        return <ScheduleViewer />;
      case 'documents':
        return <DocumentCenter />;
      case 'messages':
        return <MessageInbox />;
      case 'notifications':
        return <NotificationCenter />;
      case 'time-tracking':
        return <TimeTracking />;
      case 'help':
        return <HelpCenter />;
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Welcome back, {user?.firstName}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Here's your personal workspace for {user?.organizationName}
              </p>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                <Icon name="User" size={32} className="text-primary-600" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {dashboardStats.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-medium transition-shadow cursor-pointer"
            onClick={stat.action}
          >
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
                    {stat.subtitle}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant={action.variant}
                onClick={action.action}
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Icon name={action.icon as any} size={24} />
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  action: 'Clocked in for morning shift',
                  time: '2 hours ago',
                  icon: 'Clock',
                  type: 'success',
                },
                {
                  action: 'Uploaded W-4 form',
                  time: '1 day ago',
                  icon: 'FileText',
                  type: 'info',
                },
                {
                  action: 'Schedule updated for next week',
                  time: '2 days ago',
                  icon: 'Calendar',
                  type: 'info',
                },
                {
                  action: 'Completed safety training',
                  time: '3 days ago',
                  icon: 'CheckCircle',
                  type: 'success',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    activity.type === 'success' ? 'bg-green-100' : 'bg-blue-100'
                  }`}>
                    <Icon 
                      name={activity.icon as any} 
                      size={16} 
                      className={
                        activity.type === 'success' ? 'text-green-600' : 'text-blue-600'
                      } 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.action}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  task: 'Complete monthly safety quiz',
                  due: 'Due in 3 days',
                  priority: 'high',
                  icon: 'AlertTriangle',
                },
                {
                  task: 'Submit timesheet for approval',
                  due: 'Due tomorrow',
                  priority: 'medium',
                  icon: 'Clock',
                },
                {
                  task: 'Review updated employee handbook',
                  due: 'Due in 1 week',
                  priority: 'low',
                  icon: 'FileText',
                },
                {
                  task: 'Schedule annual performance review',
                  due: 'Due in 2 weeks',
                  priority: 'medium',
                  icon: 'Calendar',
                },
              ].map((task, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      task.priority === 'high' ? 'bg-red-100' :
                      task.priority === 'medium' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Icon 
                        name={task.icon as any} 
                        size={16} 
                        className={
                          task.priority === 'high' ? 'text-red-600' :
                          task.priority === 'medium' ? 'text-yellow-600' : 'text-gray-600'
                        } 
                      />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {task.due}
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <Icon name="ChevronRight" size={16} />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Section Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-soft">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
            { id: 'profile', label: 'My Profile', icon: 'User' },
            { id: 'schedule', label: 'Schedule', icon: 'Calendar' },
            { id: 'documents', label: 'Documents', icon: 'FileText' },
            { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
            { id: 'notifications', label: 'Notifications', icon: 'Bell' },
            { id: 'time-tracking', label: 'Time Tracking', icon: 'Clock' },
            { id: 'help', label: 'Help', icon: 'HelpCircle' },
          ].map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(section.id as DashboardSection)}
              leftIcon={<Icon name={section.icon as any} size={16} />}
            >
              {section.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Active Section Content */}
      {renderActiveSection()}
    </div>
  );
};