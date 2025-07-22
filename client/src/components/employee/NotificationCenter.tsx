import React, { useState } from 'react';
import { Card, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'reminder';
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  priority: 'low' | 'normal' | 'high';
  category: 'schedule' | 'document' | 'system' | 'announcement' | 'reminder';
}

interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'normal' | 'high';
  category: 'training' | 'document' | 'review' | 'task';
  completed: boolean;
  actionUrl?: string;
}

export const NotificationCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'notifications' | 'actions' | 'reminders'>('notifications');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Mock notification data
  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Schedule Updated',
      message: 'Your schedule for next week has been updated. Please review the changes.',
      type: 'info',
      timestamp: '2024-01-16T10:30:00Z',
      read: false,
      actionUrl: '/schedule',
      actionLabel: 'View Schedule',
      priority: 'high',
      category: 'schedule',
    },
    {
      id: '2',
      title: 'Document Signed Successfully',
      message: 'Your W-4 form has been successfully signed and submitted.',
      type: 'success',
      timestamp: '2024-01-15T14:20:00Z',
      read: true,
      priority: 'normal',
      category: 'document',
    },
    {
      id: '3',
      title: 'Safety Training Due',
      message: 'Your monthly safety training is due by January 20th. Please complete it soon.',
      type: 'warning',
      timestamp: '2024-01-14T09:15:00Z',
      read: false,
      actionUrl: '/training',
      actionLabel: 'Start Training',
      priority: 'high',
      category: 'reminder',
    },
    {
      id: '4',
      title: 'New Company Announcement',
      message: 'A new company-wide announcement has been posted. Check it out!',
      type: 'info',
      timestamp: '2024-01-13T16:45:00Z',
      read: true,
      actionUrl: '/announcements',
      actionLabel: 'Read Announcement',
      priority: 'normal',
      category: 'announcement',
    },
    {
      id: '5',
      title: 'System Maintenance',
      message: 'The system will undergo maintenance tonight from 11 PM to 2 AM.',
      type: 'warning',
      timestamp: '2024-01-12T08:00:00Z',
      read: true,
      priority: 'normal',
      category: 'system',
    },
  ];

  // Mock action items data
  const actionItems: ActionItem[] = [
    {
      id: '1',
      title: 'Complete Safety Training',
      description: 'Monthly safety training module must be completed',
      dueDate: '2024-01-20',
      priority: 'high',
      category: 'training',
      completed: false,
      actionUrl: '/training/safety',
    },
    {
      id: '2',
      title: 'Submit Timesheet',
      description: 'Weekly timesheet for approval',
      dueDate: '2024-01-19',
      priority: 'normal',
      category: 'task',
      completed: false,
      actionUrl: '/timesheet',
    },
    {
      id: '3',
      title: 'Review Employee Handbook',
      description: 'Updated employee handbook requires acknowledgment',
      dueDate: '2024-01-25',
      priority: 'normal',
      category: 'document',
      completed: false,
      actionUrl: '/documents/handbook',
    },
    {
      id: '4',
      title: 'Performance Review Meeting',
      description: 'Schedule your quarterly performance review',
      dueDate: '2024-01-30',
      priority: 'normal',
      category: 'review',
      completed: false,
      actionUrl: '/schedule-review',
    },
  ];

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'CheckCircle';
      case 'warning':
        return 'AlertTriangle';
      case 'error':
        return 'AlertCircle';
      case 'reminder':
        return 'Clock';
      default:
        return 'Bell';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'reminder':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600';
      case 'normal':
        return 'text-blue-600';
      case 'low':
        return 'text-gray-600';
      default:
        return 'text-gray-600';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'training':
        return 'GraduationCap';
      case 'document':
        return 'FileText';
      case 'review':
        return 'Star';
      case 'task':
        return 'CheckSquare';
      default:
        return 'Activity';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const now = new Date();
    const diffInDays = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffInDays;
  };

  const filteredNotifications = notifications.filter(notification => {
    if (showOnlyUnread && notification.read) return false;
    if (filterType !== 'all' && notification.category !== filterType) return false;
    return true;
  });

  const markAsRead = (notificationId: string) => {
    console.log('Marking notification as read:', notificationId);
    // Here you would typically update the notification status via API
  };

  const markAllAsRead = () => {
    console.log('Marking all notifications as read');
    // Here you would typically update all notifications via API
  };

  const completeActionItem = (actionId: string) => {
    console.log('Completing action item:', actionId);
    // Here you would typically update the action item status via API
  };

  const renderNotifications = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="all">All Categories</option>
            <option value="schedule">Schedule</option>
            <option value="document">Documents</option>
            <option value="announcement">Announcements</option>
            <option value="reminder">Reminders</option>
            <option value="system">System</option>
          </select>
          <label className="flex items-center space-x-2 text-sm">
            <input
              type="checkbox"
              checked={showOnlyUnread}
              onChange={(e) => setShowOnlyUnread(e.target.checked)}
              className="rounded"
            />
            <span>Unread only</span>
          </label>
        </div>
        <Button size="sm" variant="ghost" onClick={markAllAsRead}>
          Mark all as read
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifications.map((notification) => (
          <Card 
            key={notification.id} 
            className={`${!notification.read ? 'ring-2 ring-blue-200' : ''} hover:shadow-medium transition-shadow`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                  <Icon name={getNotificationIcon(notification.type) as any} size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(notification.priority)} bg-gray-100`}>
                        {notification.priority.toUpperCase()}
                      </span>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {notification.message}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(notification.timestamp)}
                    </span>
                    <div className="flex items-center space-x-2">
                      {notification.actionUrl && (
                        <Button size="sm" variant="ghost">
                          {notification.actionLabel || 'View'}
                        </Button>
                      )}
                      {!notification.read && (
                        <Button size="sm" variant="ghost" onClick={() => markAsRead(notification.id)}>
                          <Icon name="Check" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {filteredNotifications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon name="Bell" size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No notifications
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {showOnlyUnread ? 'All caught up! No unread notifications.' : 'You have no notifications at this time.'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );

  const renderActionItems = () => (
    <div className="space-y-4">
      {actionItems.map((item) => {
        const daysUntilDue = getDaysUntilDue(item.dueDate);
        const isOverdue = daysUntilDue < 0;
        const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
        
        return (
          <Card 
            key={item.id} 
            className={`${item.completed ? 'opacity-60' : ''} ${isOverdue ? 'ring-2 ring-red-200' : isDueSoon ? 'ring-2 ring-yellow-200' : ''}`}
          >
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-lg ${item.completed ? 'bg-green-100' : 'bg-gray-100'}`}>
                  <Icon 
                    name={item.completed ? 'CheckCircle' : getCategoryIcon(item.category) as any} 
                    size={16} 
                    className={item.completed ? 'text-green-600' : 'text-gray-600'} 
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className={`font-medium ${item.completed ? 'line-through text-gray-500' : 'text-gray-900 dark:text-white'}`}>
                      {item.title}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(item.priority)} bg-gray-100`}>
                        {item.priority.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center space-x-2">
                      <Icon name="Calendar" size={14} className="text-gray-400" />
                      <span className={`text-xs ${isOverdue ? 'text-red-600' : isDueSoon ? 'text-yellow-600' : 'text-gray-500'}`}>
                        Due: {new Date(item.dueDate).toLocaleDateString()}
                        {isOverdue && ' (Overdue)'}
                        {isDueSoon && !isOverdue && ` (${daysUntilDue} days left)`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {item.actionUrl && !item.completed && (
                        <Button size="sm">
                          Start
                        </Button>
                      )}
                      {!item.completed && (
                        <Button size="sm" variant="ghost" onClick={() => completeActionItem(item.id)}>
                          <Icon name="Check" size={14} />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderReminders = () => {
    const reminderNotifications = notifications.filter(n => n.type === 'reminder');
    
    return (
      <div className="space-y-4">
        {reminderNotifications.map((reminder) => (
          <Card key={reminder.id}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <Icon name="Clock" size={16} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {reminder.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {reminder.message}
                  </p>
                  <span className="text-xs text-gray-500 mt-2 block">
                    {formatTimestamp(reminder.timestamp)}
                  </span>
                </div>
                {reminder.actionUrl && (
                  <Button size="sm">
                    {reminder.actionLabel || 'View'}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {reminderNotifications.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Icon name="Clock" size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No reminders
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You have no active reminders at this time.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Notification Center</h2>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost">
            <Icon name="Settings" size={16} className="mr-1" />
            Settings
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { 
            label: 'Unread Notifications', 
            value: notifications.filter(n => !n.read).length, 
            icon: 'Bell', 
            color: 'text-blue-600' 
          },
          { 
            label: 'Action Items', 
            value: actionItems.filter(a => !a.completed).length, 
            icon: 'CheckSquare', 
            color: 'text-green-600' 
          },
          { 
            label: 'High Priority', 
            value: notifications.filter(n => n.priority === 'high' && !n.read).length, 
            icon: 'AlertTriangle', 
            color: 'text-red-600' 
          },
          { 
            label: 'Due Soon', 
            value: actionItems.filter(a => !a.completed && getDaysUntilDue(a.dueDate) <= 3).length, 
            icon: 'Clock', 
            color: 'text-yellow-600' 
          },
        ].map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center space-x-2">
                <Icon name={stat.icon as any} size={20} className={stat.color} />
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant={activeTab === 'notifications' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('notifications')}
        >
          <Icon name="Bell" size={16} className="mr-1" />
          Notifications
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'actions' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('actions')}
        >
          <Icon name="CheckSquare" size={16} className="mr-1" />
          Action Items
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'reminders' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('reminders')}
        >
          <Icon name="Clock" size={16} className="mr-1" />
          Reminders
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'notifications' && renderNotifications()}
      {activeTab === 'actions' && renderActionItems()}
      {activeTab === 'reminders' && renderReminders()}
    </div>
  );
};