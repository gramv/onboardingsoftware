import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface PerformanceTrackingProps {
  propertyName: string;
}

export const PerformanceTracking: React.FC<PerformanceTrackingProps> = ({ propertyName }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const performanceData = [
    {
      id: '1',
      employee: 'Sarah Johnson',
      position: 'Front Desk Supervisor',
      rating: 4.8,
      trend: 'up',
      metrics: {
        punctuality: 95,
        customerService: 98,
        teamwork: 92,
        productivity: 88,
      },
      lastReview: '2024-01-01',
      nextReview: '2024-04-01',
    },
    {
      id: '2',
      employee: 'Mike Chen',
      position: 'Maintenance Technician',
      rating: 4.6,
      trend: 'stable',
      metrics: {
        punctuality: 88,
        customerService: 85,
        teamwork: 90,
        productivity: 95,
      },
      lastReview: '2023-12-15',
      nextReview: '2024-03-15',
    },
    {
      id: '3',
      employee: 'Lisa Rodriguez',
      position: 'Housekeeper',
      rating: 4.9,
      trend: 'up',
      metrics: {
        punctuality: 98,
        customerService: 92,
        teamwork: 95,
        productivity: 96,
      },
      lastReview: '2024-01-05',
      nextReview: '2024-04-05',
    },
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'TrendingUp';
      case 'down':
        return 'TrendingDown';
      default:
        return 'Minus';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Icon name="TrendingUp" size={20} className="mr-2" />
              Performance Tracking - {propertyName}
            </CardTitle>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
              <Button>
                <Icon name="FileText" size={16} className="mr-2" />
                Generate Report
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {performanceData.map((employee) => (
          <Card key={employee.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {employee.employee}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {employee.position}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-lg font-bold ${getRatingColor(employee.rating)}`}>
                    ★ {employee.rating}
                  </span>
                  <Icon 
                    name={getTrendIcon(employee.trend) as any} 
                    size={20} 
                    className={getTrendColor(employee.trend)} 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Performance Metrics */}
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Punctuality</span>
                      <span className="font-medium">{employee.metrics.punctuality}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${employee.metrics.punctuality}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Customer Service</span>
                      <span className="font-medium">{employee.metrics.customerService}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${employee.metrics.customerService}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Teamwork</span>
                      <span className="font-medium">{employee.metrics.teamwork}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${employee.metrics.teamwork}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">Productivity</span>
                      <span className="font-medium">{employee.metrics.productivity}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${employee.metrics.productivity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Review Dates */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      Last Review: {new Date(employee.lastReview).toLocaleDateString()}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      Next: {new Date(employee.nextReview).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Icon name="Edit" size={14} className="mr-1" />
                    Review
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Icon name="MessageSquare" size={14} className="mr-1" />
                    Feedback
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Team Performance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">4.8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Rating</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">94%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Team Punctuality</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">92%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Customer Satisfaction</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">93%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Productivity Score</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};