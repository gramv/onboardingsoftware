import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { OnboardingEditRequests } from './OnboardingEditRequests';
import { HRApprovalInterface } from './HRApprovalInterface';

export const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'approvals' | 'edit-requests'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'approvals', label: 'Approvals', icon: 'CheckCircle' },
    { id: 'edit-requests', label: 'Edit Requests', icon: 'Edit' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <HRApprovalInterface />;
      case 'edit-requests':
        return <OnboardingEditRequests />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="CheckCircle" className="mr-2" />
                  Final Approvals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Review and approve manager-approved onboarding sessions</p>
                <Button onClick={() => setActiveTab('approvals')} size="sm">
                  Review Approvals
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Edit" className="mr-2" />
                  Section Edit Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Request specific section edits for employee onboarding</p>
                <Button onClick={() => setActiveTab('edit-requests')} size="sm">
                  Manage Edit Requests
                </Button>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex-1"
          >
            <Icon name={tab.icon as any} size={16} className="mr-2" />
            {tab.label}
          </Button>
        ))}
      </div>
      
      {renderContent()}
    </div>
  );
};
