import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { PropertyMetrics } from '../components/manager/PropertyMetrics';
import { EmployeeOverview } from '../components/manager/EmployeeOverview';
import { ScheduleManagement } from '../components/manager/ScheduleManagement';
import { OnboardingPipeline } from '../components/manager/OnboardingPipeline';
import { PerformanceTracking } from '../components/manager/PerformanceTracking';
import { LocalAnnouncements } from '../components/manager/LocalAnnouncements';
import { ShiftCoverage } from '../components/manager/ShiftCoverage';
import { CommunicationHub } from '../components/manager/CommunicationHub';
import { JobManagement } from '../components/manager/JobManagement';
import { OnboardingReviewInterface } from '../components/manager/OnboardingReviewInterface';
import WalkInOnboardingManager from '../components/manager/WalkInOnboardingManager';

type DashboardTab = 
  | 'overview' 
  | 'employees' 
  | 'schedule' 
  | 'onboarding' 
  | 'reviews'
  | 'performance' 
  | 'announcements' 
  | 'coverage'
  | 'messages'
  | 'jobs';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [propertyData, setPropertyData] = useState({
    propertyName: 'Downtown Motel',
    totalEmployees: 24,
    activeEmployees: 22,
    onboardingEmployees: 2,
    scheduledToday: 18,
    pendingTasks: 5,
    unreadMessages: 3,
    shiftCoverageNeeded: 1,
    performanceAlerts: 2,
  });

  // Mock real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setPropertyData(prev => ({
        ...prev,
        activeEmployees: prev.activeEmployees + Math.floor(Math.random() * 3) - 1,
        unreadMessages: Math.max(0, prev.unreadMessages + Math.floor(Math.random() * 2) - 1),
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Property Overview', icon: 'LayoutDashboard' },
    { id: 'employees', label: 'Team Management', icon: 'Users' },
    { id: 'schedule', label: 'Schedule', icon: 'Calendar' },
    { id: 'onboarding', label: 'Onboarding', icon: 'UserPlus' },
    { id: 'reviews', label: 'Reviews', icon: 'FileCheck' },
    { id: 'performance', label: 'Performance', icon: 'TrendingUp' },
    { id: 'announcements', label: 'Announcements', icon: 'Megaphone' },
    { id: 'coverage', label: 'Shift Coverage', icon: 'Clock' },
    { id: 'messages', label: 'Messages', icon: 'MessageSquare' },
    { id: 'jobs', label: 'Job Postings', icon: 'FileText' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <PropertyMetrics data={propertyData} />;
      case 'employees':
        return <EmployeeOverview propertyName={propertyData.propertyName} />;
      case 'schedule':
        return <ScheduleManagement propertyName={propertyData.propertyName} />;
      case 'onboarding':
        return <WalkInOnboardingManager />;
      case 'reviews':
        return <OnboardingReviewInterface />;
      case 'performance':
        return <PerformanceTracking propertyName={propertyData.propertyName} />;
      case 'announcements':
        return <LocalAnnouncements propertyName={propertyData.propertyName} />;
      case 'coverage':
        return <ShiftCoverage propertyName={propertyData.propertyName} />;
      case 'messages':
        return <CommunicationHub propertyName={propertyData.propertyName} />;
      case 'jobs':
        return <JobManagement />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Manager Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.firstName}! Managing {propertyData.propertyName}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {propertyData.shiftCoverageNeeded > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {propertyData.shiftCoverageNeeded} Coverage Needed
              </Badge>
            )}
            {propertyData.performanceAlerts > 0 && (
              <Badge variant="warning">
                {propertyData.performanceAlerts} Performance Alerts
              </Badge>
            )}
            {propertyData.pendingTasks > 0 && (
              <Badge variant="secondary">
                {propertyData.pendingTasks} Pending Tasks
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">
                  Total Team
                </p>
                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">
                  {propertyData.totalEmployees}
                </p>
              </div>
              <Icon name="Users" size={20} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">
                  Active Now
                </p>
                <p className="text-xl font-bold text-green-900 dark:text-green-100">
                  {propertyData.activeEmployees}
                </p>
              </div>
              <Icon name="UserCheck" size={20} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-yellow-700 dark:text-yellow-300">
                  Onboarding
                </p>
                <p className="text-xl font-bold text-yellow-900 dark:text-yellow-100">
                  {propertyData.onboardingEmployees}
                </p>
              </div>
              <Icon name="UserPlus" size={20} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  Scheduled
                </p>
                <p className="text-xl font-bold text-purple-900 dark:text-purple-100">
                  {propertyData.scheduledToday}
                </p>
              </div>
              <Icon name="Calendar" size={20} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  Coverage
                </p>
                <p className="text-xl font-bold text-red-900 dark:text-red-100">
                  {propertyData.shiftCoverageNeeded}
                </p>
              </div>
              <Icon name="Clock" size={20} className="text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  Tasks
                </p>
                <p className="text-xl font-bold text-indigo-900 dark:text-indigo-100">
                  {propertyData.pendingTasks}
                </p>
              </div>
              <Icon name="CheckSquare" size={20} className="text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-pink-700 dark:text-pink-300">
                  Messages
                </p>
                <p className="text-xl font-bold text-pink-900 dark:text-pink-100">
                  {propertyData.unreadMessages}
                </p>
              </div>
              <Icon name="MessageSquare" size={20} className="text-pink-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-teal-700 dark:text-teal-300">
                  Alerts
                </p>
                <p className="text-xl font-bold text-teal-900 dark:text-teal-100">
                  {propertyData.performanceAlerts}
                </p>
              </div>
              <Icon name="AlertTriangle" size={20} className="text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6 overflow-x-auto" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap
                    ${activeTab === tab.id
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }
                  `}
                >
                  <Icon 
                    name={tab.icon as any} 
                    size={16} 
                    className="mr-2" 
                  />
                  {tab.label}
                  {tab.id === 'coverage' && propertyData.shiftCoverageNeeded > 0 && (
                    <Badge variant="destructive" size="sm" className="ml-2">
                      {propertyData.shiftCoverageNeeded}
                    </Badge>
                  )}
                  {tab.id === 'messages' && propertyData.unreadMessages > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-2">
                      {propertyData.unreadMessages}
                    </Badge>
                  )}
                  {tab.id === 'performance' && propertyData.performanceAlerts > 0 && (
                    <Badge variant="warning" size="sm" className="ml-2">
                      {propertyData.performanceAlerts}
                    </Badge>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </CardContent>
      </Card>

      {/* Tab Content */}
      <div className="min-h-[600px]">
        {renderTabContent()}
      </div>
    </div>
  );
};