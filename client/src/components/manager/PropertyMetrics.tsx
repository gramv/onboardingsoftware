import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface PropertyData {
  propertyName: string;
  totalEmployees: number;
  activeEmployees: number;
  onboardingEmployees: number;
  scheduledToday: number;
  pendingTasks: number;
  unreadMessages: number;
  shiftCoverageNeeded: number;
  performanceAlerts: number;
}

interface PropertyMetricsProps {
  data: PropertyData;
}

export const PropertyMetrics: React.FC<PropertyMetricsProps> = ({ data }) => {
  const todayMetrics = {
    occupancyRate: 87,
    guestSatisfaction: 4.6,
    maintenanceRequests: 3,
    checkInsToday: 24,
    checkOutsToday: 18,
    roomsReady: 42,
    roomsOutOfOrder: 2,
  };

  const recentActivity = [
    {
      id: '1',
      type: 'employee',
      message: 'Sarah Johnson clocked in for morning shift',
      timestamp: '8:00 AM',
      icon: 'UserCheck',
      color: 'text-green-600',
    },
    {
      id: '2',
      type: 'maintenance',
      message: 'Room 205 maintenance request completed',
      timestamp: '7:45 AM',
      icon: 'Wrench',
      color: 'text-blue-600',
    },
    {
      id: '3',
      type: 'guest',
      message: 'Guest complaint resolved in Room 312',
      timestamp: '7:30 AM',
      icon: 'MessageCircle',
      color: 'text-yellow-600',
    },
    {
      id: '4',
      type: 'schedule',
      message: 'Mike Chen requested shift swap for tomorrow',
      timestamp: '7:15 AM',
      icon: 'Calendar',
      color: 'text-purple-600',
    },
  ];

  const upcomingTasks = [
    {
      id: '1',
      task: 'Review weekly schedules',
      priority: 'high' as const,
      dueTime: '10:00 AM',
      assignee: 'You',
    },
    {
      id: '2',
      task: 'Approve Sarah\'s time-off request',
      priority: 'medium' as const,
      dueTime: '11:30 AM',
      assignee: 'You',
    },
    {
      id: '3',
      task: 'Complete performance reviews',
      priority: 'medium' as const,
      dueTime: '2:00 PM',
      assignee: 'You',
    },
    {
      id: '4',
      task: 'Check inventory levels',
      priority: 'low' as const,
      dueTime: '4:00 PM',
      assignee: 'Lisa Rodriguez',
    },
  ];

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
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

  return (
    <div className="space-y-6">
      {/* Property Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Occupancy Rate
                </p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {todayMetrics.occupancyRate}%
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  +5% vs yesterday
                </p>
              </div>
              <Icon name="Home" size={24} className="text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  Guest Satisfaction
                </p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {todayMetrics.guestSatisfaction}/5
                </p>
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  Excellent rating
                </p>
              </div>
              <Icon name="Star" size={24} className="text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                  Rooms Ready
                </p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100 mt-1">
                  {todayMetrics.roomsReady}
                </p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                  {todayMetrics.roomsOutOfOrder} out of order
                </p>
              </div>
              <Icon name="Bed" size={24} className="text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                  Check-ins Today
                </p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100 mt-1">
                  {todayMetrics.checkInsToday}
                </p>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {todayMetrics.checkOutsToday} check-outs
                </p>
              </div>
              <Icon name="LogIn" size={24} className="text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="Activity" size={20} className="mr-2" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <Icon 
                      name={activity.icon as any} 
                      size={16} 
                      className={activity.color} 
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {activity.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              View All Activity
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="CheckSquare" size={20} className="mr-2" />
              Today's Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {task.task}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Due: {task.dueTime} • {task.assignee}
                      </p>
                    </div>
                  </div>
                  <Badge variant={getPriorityColor(task.priority) as any} size="sm">
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="w-full mt-4">
              <Icon name="Plus" size={16} className="mr-2" />
              Add Task
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Zap" size={20} className="mr-2" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button 
              variant="outline" 
              className="flex flex-col items-center p-4 h-auto"
              onClick={() => window.location.href = '/employees/create'}
            >
              <Icon name="UserPlus" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Add Employee</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Calendar" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Create Schedule</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Megaphone" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Send Notice</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="FileText" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">View Reports</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Wrench" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Maintenance</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="MessageSquare" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Team Chat</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};