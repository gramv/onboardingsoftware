import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../stores/authStore';
import { KPIOverview } from '../components/hr/KPIOverview';
import { EmployeeStatusWidgets } from '../components/hr/EmployeeStatusWidgets';
import { ComplianceMonitoring } from '../components/hr/ComplianceMonitoring';
import { AdvancedEmployeeDirectory } from '../components/hr/AdvancedEmployeeDirectory';
import { PayrollConfiguration } from '../components/hr/PayrollConfiguration';
import { AnnouncementComposer } from '../components/hr/AnnouncementComposer';
import { AuditTrailViewer } from '../components/hr/AuditTrailViewer';
import { DataExport } from '../components/hr/DataExport';
import { HRApprovalInterface } from '../components/hr/HRApprovalInterface';

type DashboardTab = 
  | 'overview' 
  | 'employees' 
  | 'compliance' 
  | 'approvals'
  | 'payroll' 
  | 'announcements' 
  | 'audit' 
  | 'export';

export const HRDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  // const [notifications, setNotifications] = useState<any[]>([]);

  // Mock data for demonstration - in real app this would come from API
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 156,
    activeEmployees: 142,
    onboardingEmployees: 8,
    terminatedThisMonth: 6,
    complianceAlerts: 3,
    pendingApprovals: 12,
    locations: [
      { id: '1', name: 'Downtown Motel', employees: 45, status: 'operational' as const },
      { id: '2', name: 'Airport Motel', employees: 38, status: 'operational' as const },
      { id: '3', name: 'Highway Motel', employees: 42, status: 'operational' as const },
      { id: '4', name: 'Seaside Motel', employees: 31, status: 'maintenance' as const },
    ]
  });

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      // Update dashboard data periodically
      setDashboardData(prev => ({
        ...prev,
        // Add small random variations to simulate real-time updates
        activeEmployees: prev.activeEmployees + Math.floor(Math.random() * 3) - 1,
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
    { id: 'employees', label: 'Employee Management', icon: 'Users' },
    { id: 'compliance', label: 'Compliance', icon: 'Shield' },
    { id: 'approvals', label: 'Final Approvals', icon: 'CheckCircle' },
    { id: 'payroll', label: 'Payroll Config', icon: 'DollarSign' },
    { id: 'announcements', label: 'Announcements', icon: 'Megaphone' },
    { id: 'audit', label: 'Audit Trail', icon: 'FileSearch' },
    { id: 'export', label: 'Data Export', icon: 'Download' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <KPIOverview data={dashboardData} />
            <EmployeeStatusWidgets data={dashboardData} />
          </div>
        );
      case 'employees':
        return <AdvancedEmployeeDirectory />;
      case 'compliance':
        return <ComplianceMonitoring />;
      case 'approvals':
        return <HRApprovalInterface />;
      case 'payroll':
        return <PayrollConfiguration />;
      case 'announcements':
        return <AnnouncementComposer />;
      case 'audit':
        return <AuditTrailViewer />;
      case 'export':
        return <DataExport />;
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
              HR Command Center
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Welcome back, {user?.firstName}! Manage your organization across all locations.
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {dashboardData.complianceAlerts > 0 && (
              <Badge variant="destructive" className="animate-pulse">
                {dashboardData.complianceAlerts} Compliance Alerts
              </Badge>
            )}
            {dashboardData.pendingApprovals > 0 && (
              <Badge variant="warning">
                {dashboardData.pendingApprovals} Pending Approvals
              </Badge>
            )}
            <Button variant="outline" size="sm">
              <Icon name="RefreshCw" size={16} className="mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors
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
                  {tab.id === 'compliance' && dashboardData.complianceAlerts > 0 && (
                    <Badge variant="destructive" size="sm" className="ml-2">
                      {dashboardData.complianceAlerts}
                    </Badge>
                  )}
                  {tab.id === 'overview' && dashboardData.pendingApprovals > 0 && (
                    <Badge variant="secondary" size="sm" className="ml-2">
                      {dashboardData.pendingApprovals}
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