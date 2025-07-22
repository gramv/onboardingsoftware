import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'compliance' | 'payroll' | 'employee' | 'audit';
  format: 'csv' | 'xlsx' | 'pdf';
  lastUsed?: string;
  size?: string;
}

export const DataExport: React.FC = () => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv');
  const [dateRange, setDateRange] = useState<string>('30days');

  const exportTemplates: ExportTemplate[] = [
    {
      id: '1',
      name: 'Employee Directory',
      description: 'Complete employee information including contact details and employment status',
      category: 'employee',
      format: 'csv',
      lastUsed: '2024-01-07',
      size: '2.3 MB',
    },
    {
      id: '2',
      name: 'Compliance Report',
      description: 'I-9 forms, certifications, and training completion status',
      category: 'compliance',
      format: 'pdf',
      lastUsed: '2024-01-05',
      size: '5.7 MB',
    },
    {
      id: '3',
      name: 'Payroll Summary',
      description: 'Payroll data by location and pay period',
      category: 'payroll',
      format: 'xlsx',
      lastUsed: '2024-01-03',
      size: '1.8 MB',
    },
    {
      id: '4',
      name: 'Audit Trail',
      description: 'System access logs and user activity records',
      category: 'audit',
      format: 'csv',
      lastUsed: '2024-01-06',
      size: '4.2 MB',
    },
    {
      id: '5',
      name: 'Training Records',
      description: 'Employee training completion and certification tracking',
      category: 'compliance',
      format: 'xlsx',
      lastUsed: '2024-01-04',
      size: '3.1 MB',
    },
    {
      id: '6',
      name: 'Time & Attendance',
      description: 'Employee clock-in/out records and schedule adherence',
      category: 'employee',
      format: 'csv',
      lastUsed: '2024-01-02',
      size: '6.4 MB',
    },
  ];

  const recentExports = [
    {
      id: '1',
      name: 'Employee Directory - Q4 2023',
      timestamp: '2024-01-08T10:30:00Z',
      format: 'csv',
      size: '2.1 MB',
      status: 'completed',
    },
    {
      id: '2',
      name: 'Compliance Report - December',
      timestamp: '2024-01-07T14:15:00Z',
      format: 'pdf',
      size: '5.3 MB',
      status: 'completed',
    },
    {
      id: '3',
      name: 'Payroll Summary - Bi-weekly',
      timestamp: '2024-01-06T09:45:00Z',
      format: 'xlsx',
      size: '1.7 MB',
      status: 'processing',
    },
  ];

  const handleTemplateToggle = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const getCategoryColor = (category: ExportTemplate['category']) => {
    switch (category) {
      case 'compliance':
        return 'text-red-600 bg-red-100';
      case 'payroll':
        return 'text-green-600 bg-green-100';
      case 'employee':
        return 'text-blue-600 bg-blue-100';
      case 'audit':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'csv':
        return 'FileSpreadsheet';
      case 'xlsx':
        return 'FileSpreadsheet';
      case 'pdf':
        return 'FileText';
      default:
        return 'File';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'warning';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Configuration */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Download" size={20} className="mr-2" />
                Data Export Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {exportTemplates.map((template) => (
                  <div 
                    key={template.id} 
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedTemplates.includes(template.id)
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => handleTemplateToggle(template.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          <input
                            type="checkbox"
                            checked={selectedTemplates.includes(template.id)}
                            onChange={() => handleTemplateToggle(template.id)}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </h4>
                            <Badge variant="outline" className={getCategoryColor(template.category)}>
                              {template.category}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {template.description}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Icon name={getFormatIcon(template.format) as any} size={14} className="mr-1" />
                              {template.format.toUpperCase()}
                            </span>
                            {template.lastUsed && (
                              <span>Last used: {new Date(template.lastUsed).toLocaleDateString()}</span>
                            )}
                            {template.size && <span>Size: {template.size}</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-4">Export Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Export Format
                    </label>
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'csv' | 'xlsx' | 'pdf')}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="csv">CSV</option>
                      <option value="xlsx">Excel (XLSX)</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateRange}
                      onChange={(e) => setDateRange(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                      <option value="7days">Last 7 Days</option>
                      <option value="30days">Last 30 Days</option>
                      <option value="90days">Last 90 Days</option>
                      <option value="1year">Last Year</option>
                      <option value="all">All Time</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex space-x-3">
                <Button 
                  className="flex-1"
                  disabled={selectedTemplates.length === 0}
                >
                  <Icon name="Download" size={16} className="mr-2" />
                  Export Selected ({selectedTemplates.length})
                </Button>
                <Button variant="outline">
                  <Icon name="Save" size={16} className="mr-2" />
                  Save Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Exports */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="History" size={20} className="mr-2" />
                Recent Exports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentExports.map((export_) => (
                  <div key={export_.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                        {export_.name}
                      </h4>
                      <Badge variant={getStatusColor(export_.status) as any} size="sm" className="capitalize">
                        {export_.status}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                      <span className="flex items-center">
                        <Icon name={getFormatIcon(export_.format) as any} size={12} className="mr-1" />
                        {export_.format.toUpperCase()}
                      </span>
                      <span>{export_.size}</span>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(export_.timestamp).toLocaleDateString()} at{' '}
                      {new Date(export_.timestamp).toLocaleTimeString()}
                    </p>
                    {export_.status === 'completed' && (
                      <Button variant="ghost" size="sm" className="w-full mt-2">
                        <Icon name="Download" size={14} className="mr-1" />
                        Download
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="BarChart3" size={20} className="mr-2" />
                Export Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">This Month</span>
                  <span className="font-medium text-gray-900 dark:text-white">24 exports</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Size</span>
                  <span className="font-medium text-gray-900 dark:text-white">156.7 MB</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Most Used</span>
                  <span className="font-medium text-gray-900 dark:text-white">Employee Directory</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Success Rate</span>
                  <span className="font-medium text-green-600">98.5%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};