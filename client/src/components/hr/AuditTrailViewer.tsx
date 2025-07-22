import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface AuditEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  resource: string;
  details: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high';
  category: 'auth' | 'employee' | 'payroll' | 'document' | 'system';
}

export const AuditTrailViewer: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7days');

  // Mock audit data
  const auditEntries: AuditEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-08T14:30:00Z',
      user: 'admin@motel.com',
      action: 'Employee Created',
      resource: 'Employee ID: EMP-001',
      details: 'Created new employee record for Sarah Johnson',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      severity: 'medium',
      category: 'employee',
    },
    {
      id: '2',
      timestamp: '2024-01-08T13:15:00Z',
      user: 'hr@motel.com',
      action: 'Payroll Configuration Updated',
      resource: 'Location: Downtown Motel',
      details: 'Updated pay period settings for bi-weekly payroll',
      ipAddress: '192.168.1.101',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      severity: 'high',
      category: 'payroll',
    },
    {
      id: '3',
      timestamp: '2024-01-08T12:45:00Z',
      user: 'manager@motel.com',
      action: 'Document Uploaded',
      resource: 'Document ID: DOC-123',
      details: 'Uploaded I-9 form for employee verification',
      ipAddress: '192.168.1.102',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      severity: 'low',
      category: 'document',
    },
    {
      id: '4',
      timestamp: '2024-01-08T11:20:00Z',
      user: 'system',
      action: 'Failed Login Attempt',
      resource: 'User: unknown@example.com',
      details: 'Multiple failed login attempts detected',
      ipAddress: '203.0.113.1',
      userAgent: 'curl/7.68.0',
      severity: 'high',
      category: 'auth',
    },
    {
      id: '5',
      timestamp: '2024-01-08T10:30:00Z',
      user: 'admin@motel.com',
      action: 'System Settings Updated',
      resource: 'Configuration: Email Settings',
      details: 'Updated SMTP configuration for notifications',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      severity: 'medium',
      category: 'system',
    },
  ];

  const categories = ['auth', 'employee', 'payroll', 'document', 'system'];
  const severities = ['low', 'medium', 'high'];

  const filteredEntries = auditEntries.filter(entry => {
    const matchesSearch = searchTerm === '' || 
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory;
    const matchesSeverity = selectedSeverity === 'all' || entry.severity === selectedSeverity;
    
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const getSeverityColor = (severity: AuditEntry['severity']) => {
    switch (severity) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'warning';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getCategoryIcon = (category: AuditEntry['category']) => {
    switch (category) {
      case 'auth':
        return 'Shield';
      case 'employee':
        return 'Users';
      case 'payroll':
        return 'DollarSign';
      case 'document':
        return 'FileText';
      case 'system':
        return 'Settings';
      default:
        return 'Activity';
    }
  };

  const getCategoryColor = (category: AuditEntry['category']) => {
    switch (category) {
      case 'auth':
        return 'text-red-600';
      case 'employee':
        return 'text-blue-600';
      case 'payroll':
        return 'text-green-600';
      case 'document':
        return 'text-purple-600';
      case 'system':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="FileSearch" size={20} className="mr-2" />
            Audit Trail Viewer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Input
              placeholder="Search audit logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category} className="capitalize">
                  {category}
                </option>
              ))}
            </select>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Severities</option>
              {severities.map(severity => (
                <option key={severity} value={severity} className="capitalize">
                  {severity}
                </option>
              ))}
            </select>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="1day">Last 24 Hours</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredEntries.length} of {auditEntries.length} entries
            </p>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Icon name="Download" size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button variant="outline" size="sm">
                <Icon name="FileText" size={16} className="mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Entries */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredEntries.map((entry) => (
              <div key={entry.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 ${getCategoryColor(entry.category)}`}>
                      <Icon name={getCategoryIcon(entry.category) as any} size={20} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {entry.action}
                        </h4>
                        <Badge variant={getSeverityColor(entry.severity) as any} className="capitalize">
                          {entry.severity}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {entry.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        {entry.details}
                      </p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                        <span>User: {entry.user}</span>
                        <span>Resource: {entry.resource}</span>
                        <span>IP: {entry.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </p>
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