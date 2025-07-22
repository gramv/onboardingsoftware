import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface ScheduleManagementProps {
  propertyName: string;
}

interface ShiftSlot {
  id: string;
  time: string;
  position: string;
  employee?: string;
  status: 'filled' | 'open' | 'conflict';
}

export const ScheduleManagement: React.FC<ScheduleManagementProps> = ({ propertyName }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Mock schedule data
  const todaySchedule: ShiftSlot[] = [
    { id: '1', time: '6:00 AM - 2:00 PM', position: 'Front Desk', employee: 'Sarah Johnson', status: 'filled' },
    { id: '2', time: '6:00 AM - 2:00 PM', position: 'Housekeeping', employee: 'Lisa Rodriguez', status: 'filled' },
    { id: '3', time: '8:00 AM - 4:00 PM', position: 'Maintenance', employee: 'Mike Chen', status: 'filled' },
    { id: '4', time: '2:00 PM - 10:00 PM', position: 'Front Desk', employee: '', status: 'open' },
    { id: '5', time: '3:00 PM - 11:00 PM', position: 'Housekeeping', employee: 'Emma Wilson', status: 'conflict' },
    { id: '6', time: '11:00 PM - 7:00 AM', position: 'Night Audit', employee: 'David Kim', status: 'filled' },
  ];

  const scheduleRequests = [
    {
      id: '1',
      employee: 'Sarah Johnson',
      type: 'time_off',
      date: '2024-01-15',
      reason: 'Doctor appointment',
      status: 'pending',
    },
    {
      id: '2',
      employee: 'Mike Chen',
      type: 'shift_swap',
      date: '2024-01-12',
      reason: 'Family event',
      status: 'pending',
    },
    {
      id: '3',
      employee: 'Lisa Rodriguez',
      type: 'overtime',
      date: '2024-01-10',
      reason: 'Extra coverage needed',
      status: 'approved',
    },
  ];

  const getStatusColor = (status: ShiftSlot['status']) => {
    switch (status) {
      case 'filled':
        return 'success';
      case 'open':
        return 'destructive';
      case 'conflict':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const getRequestStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      {/* Schedule Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Icon name="Calendar" size={20} className="mr-2" />
              Schedule Management - {propertyName}
            </CardTitle>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant={viewMode === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('day')}
                >
                  Day
                </Button>
                <Button
                  variant={viewMode === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('week')}
                >
                  Week
                </Button>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button>
                <Icon name="Plus" size={16} className="mr-2" />
                Create Schedule
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Schedule Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Today's Schedule - {new Date(selectedDate).toLocaleDateString()}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {todaySchedule.map((slot) => (
                  <div 
                    key={slot.id} 
                    className={`p-4 rounded-lg border-l-4 ${
                      slot.status === 'filled' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      slot.status === 'open' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                      'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {slot.position}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {slot.time}
                        </p>
                        {slot.employee && (
                          <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                            Assigned: {slot.employee}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(slot.status) as any} className="capitalize">
                          {slot.status}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Icon name="Edit" size={16} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 flex space-x-4">
                <Button variant="outline" className="flex-1">
                  <Icon name="Copy" size={16} className="mr-2" />
                  Copy from Template
                </Button>
                <Button variant="outline" className="flex-1">
                  <Icon name="Download" size={16} className="mr-2" />
                  Export Schedule
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Schedule Requests & Actions */}
        <div className="space-y-6">
          {/* Pending Requests */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Clock" size={20} className="mr-2" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {scheduleRequests.map((request) => (
                  <div key={request.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {request.employee}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                          {request.type.replace('_', ' ')} - {new Date(request.date).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={getRequestStatusColor(request.status) as any} size="sm">
                        {request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      {request.reason}
                    </p>
                    {request.status === 'pending' && (
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Icon name="Check" size={12} className="mr-1" />
                          Approve
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Icon name="X" size={12} className="mr-1" />
                          Deny
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Zap" size={20} className="mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Icon name="UserPlus" size={16} className="mr-2" />
                  Assign Employee
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Icon name="RotateCcw" size={16} className="mr-2" />
                  Find Coverage
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Icon name="AlertTriangle" size={16} className="mr-2" />
                  Report Conflict
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  <Icon name="MessageSquare" size={16} className="mr-2" />
                  Notify Team
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="BarChart3" size={20} className="mr-2" />
                Schedule Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Coverage Rate</span>
                  <span className="font-medium text-green-600">83%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Open Shifts</span>
                  <span className="font-medium text-red-600">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Overtime Hours</span>
                  <span className="font-medium text-yellow-600">12.5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Conflicts</span>
                  <span className="font-medium text-orange-600">1</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};