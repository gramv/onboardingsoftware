import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { FinalApprovalInterface } from './FinalApprovalInterface';

export const HRDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('approvals');

  const tabs = [
    { id: 'approvals', label: 'Final Approvals', icon: 'CheckCircle' },
    { id: 'talent-pool', label: 'Talent Pool', icon: 'Users' },
    { id: 'reports', label: 'Reports', icon: 'BarChart' },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'approvals':
        return <FinalApprovalInterface />;
      case 'talent-pool':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Talent Pool Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Talent pool management coming soon...</p>
            </CardContent>
          </Card>
        );
      case 'reports':
        return (
          <Card>
            <CardHeader>
              <CardTitle>HR Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">HR reports coming soon...</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">HR Dashboard</h1>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon name={tab.icon as any} className="mr-2" size={16} />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};
