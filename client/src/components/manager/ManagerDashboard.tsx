import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { PropertyQRManager } from './PropertyQRManager';
import { JobApplicationReview } from './JobApplicationReview';
import { JobManagement } from './JobManagement';

export const ManagerDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'qr-codes' | 'applications' | 'jobs'>('overview');

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'BarChart3' },
    { id: 'qr-codes', label: 'QR Codes', icon: 'QrCode' },
    { id: 'applications', label: 'Applications', icon: 'Users' },
    { id: 'jobs', label: 'Job Postings', icon: 'Briefcase' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'qr-codes':
        return <PropertyQRManager />;
      case 'applications':
        return <JobApplicationReview />;
      case 'jobs':
        return <JobManagement />;
      default:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="QrCode" className="mr-2" />
                  QR Code Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Generate QR codes for property-specific job applications</p>
                <Button onClick={() => setActiveTab('qr-codes')} size="sm">
                  Manage QR Codes
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Users" className="mr-2" />
                  Application Review
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Review and approve job applications for your property</p>
                <Button onClick={() => setActiveTab('applications')} size="sm">
                  Review Applications
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Icon name="Briefcase" className="mr-2" />
                  Job Postings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">Manage job postings and requirements</p>
                <Button onClick={() => setActiveTab('jobs')} size="sm">
                  Manage Jobs
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
