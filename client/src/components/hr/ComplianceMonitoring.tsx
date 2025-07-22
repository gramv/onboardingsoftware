import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface ComplianceAlert {
  id: string;
  type: 'document_expiry' | 'training_overdue' | 'certification_missing' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  employee: string;
  location: string;
  description: string;
  dueDate: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export const ComplianceMonitoring: React.FC = () => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock compliance alerts data
  const alerts: ComplianceAlert[] = [
    {
      id: '1',
      type: 'document_expiry',
      severity: 'high',
      employee: 'Sarah Johnson',
      location: 'Downtown Motel',
      description: 'Driver\'s license expires in 7 days',
      dueDate: '2024-01-15',
      createdAt: '2024-01-08',
      status: 'open',
    },
    {
      id: '2',
      type: 'training_overdue',
      severity: 'medium',
      employee: 'Mike Chen',
      location: 'Airport Motel',
      description: 'Safety training overdue by 15 days',
      dueDate: '2023-12-20',
      createdAt: '2024-01-05',
      status: 'in_progress',
    },
    {
      id: '3',
      type: 'certification_missing',
      severity: 'critical',
      employee: 'Lisa Rodriguez',
      location: 'Highway Motel',
      description: 'Food handler certification not on file',
      dueDate: '2024-01-10',
      createdAt: '2024-01-01',
      status: 'open',
    },
    {
      id: '4',
      type: 'policy_violation',
      severity: 'low',
      employee: 'David Kim',
      location: 'Seaside Motel',
      description: 'Uniform policy violation reported',
      dueDate: '2024-01-12',
      createdAt: '2024-01-07',
      status: 'resolved',
    },
  ];

  const getSeverityColor = (severity: ComplianceAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'text-red-700 bg-red-100 border-red-200';
      case 'high':
        return 'text-orange-700 bg-orange-100 border-orange-200';
      case 'medium':
        return 'text-yellow-700 bg-yellow-100 border-yellow-200';
      case 'low':
        return 'text-blue-700 bg-blue-100 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-100 border-gray-200';
    }
  };

  const getTypeIcon = (type: ComplianceAlert['type']) => {
    switch (type) {
      case 'document_expiry':
        return 'FileText';
      case 'training_overdue':
        return 'GraduationCap';
      case 'certification_missing':
        return 'Award';
      case 'policy_violation':
        return 'AlertTriangle';
      default:
        return 'AlertCircle';
    }
  };

  const getStatusColor = (status: ComplianceAlert['status']) => {
    switch (status) {
      case 'open':
        return 'destructive';
      case 'in_progress':
        return 'warning';
      case 'resolved':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSeverity = selectedSeverity === 'all' || alert.severity === selectedSeverity;
    const matchesSearch = searchTerm === '' || 
      alert.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSeverity && matchesSearch;
  });

  const severityCounts = {
    critical: alerts.filter(a => a.severity === 'critical').length,
    high: alerts.filter(a => a.severity === 'high').length,
    medium: alerts.filter(a => a.severity === 'medium').length,
    low: alerts.filter(a => a.severity === 'low').length,
  };

  const complianceMetrics = {
    overallScore: 91.8,
    documentsExpiring: 12,
    trainingOverdue: 8,
    certificationsNeeded: 5,
    policyViolations: 3,
  };

  return (
    <div className="space-y-6">
      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Compliance Score
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {complianceMetrics.overallScore}%
                </p>
              </div>
              <Icon name="Shield" size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Documents Expiring
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {complianceMetrics.documentsExpiring}
                </p>
              </div>
              <Icon name="FileText" size={24} className="text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Training Overdue
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {complianceMetrics.trainingOverdue}
                </p>
              </div>
              <Icon name="GraduationCap" size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Missing Certifications
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {complianceMetrics.certificationsNeeded}
                </p>
              </div>
              <Icon name="Award" size={24} className="text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Icon name="AlertTriangle" size={20} className="mr-2" />
              Compliance Alerts
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search alerts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button variant="outline" size="sm">
                <Icon name="Download" size={16} className="mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Severity Filters */}
          <div className="flex items-center space-x-2 mb-6">
            <Button
              variant={selectedSeverity === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('all')}
            >
              All ({alerts.length})
            </Button>
            <Button
              variant={selectedSeverity === 'critical' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('critical')}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              Critical ({severityCounts.critical})
            </Button>
            <Button
              variant={selectedSeverity === 'high' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('high')}
              className="text-orange-600 border-orange-200 hover:bg-orange-50"
            >
              High ({severityCounts.high})
            </Button>
            <Button
              variant={selectedSeverity === 'medium' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('medium')}
              className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              Medium ({severityCounts.medium})
            </Button>
            <Button
              variant={selectedSeverity === 'low' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedSeverity('low')}
              className="text-blue-600 border-blue-200 hover:bg-blue-50"
            >
              Low ({severityCounts.low})
            </Button>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.map((alert) => (
              <div key={alert.id} className={`p-4 rounded-lg border-l-4 ${getSeverityColor(alert.severity)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Icon 
                      name={getTypeIcon(alert.type) as any} 
                      size={20} 
                      className="mt-1 text-gray-600 dark:text-gray-400" 
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {alert.employee}
                        </h4>
                        <Badge variant="outline" size="sm">
                          {alert.location}
                        </Badge>
                        <Badge variant={alert.severity as any} size="sm" className="capitalize">
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {alert.description}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>Due: {new Date(alert.dueDate).toLocaleDateString()}</span>
                        <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={getStatusColor(alert.status) as any} className="capitalize">
                      {alert.status.replace('_', ' ')}
                    </Badge>
                    <Button variant="ghost" size="sm">
                      <Icon name="MoreHorizontal" size={16} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};