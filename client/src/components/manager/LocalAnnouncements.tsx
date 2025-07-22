import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface LocalAnnouncementsProps {
  propertyName: string;
}

export const LocalAnnouncements: React.FC<LocalAnnouncementsProps> = ({ propertyName }) => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const targetOptions = [
    'Front Office Staff',
    'Housekeeping Team',
    'Maintenance Crew',
    'Security Personnel',
    'All Staff'
  ];

  const recentAnnouncements = [
    {
      id: '1',
      title: 'Shift Change Notice',
      message: 'Please note the temporary schedule changes for this weekend.',
      author: 'Manager',
      timestamp: '2024-01-08T09:00:00Z',
      priority: 'medium' as const,
      targets: ['All Staff'],
      readCount: 18,
      totalTargets: 24,
    },
    {
      id: '2',
      title: 'New Safety Protocol',
      message: 'Updated cleaning procedures are now in effect in all guest rooms.',
      author: 'Manager',
      timestamp: '2024-01-07T14:30:00Z',
      priority: 'high' as const,
      targets: ['Housekeeping Team'],
      readCount: 12,
      totalTargets: 15,
    },
    {
      id: '3',
      title: 'Team Meeting Reminder',
      message: 'Monthly team meeting scheduled for Friday at 3 PM in the conference room.',
      author: 'Manager',
      timestamp: '2024-01-06T11:15:00Z',
      priority: 'low' as const,
      targets: ['All Staff'],
      readCount: 22,
      totalTargets: 24,
    },
  ];

  const handleTargetToggle = (target: string) => {
    setSelectedTargets(prev => 
      prev.includes(target) 
        ? prev.filter(t => t !== target)
        : [...prev, target]
    );
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
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

  const getReadPercentage = (readCount: number, totalTargets: number) => {
    return Math.round((readCount / totalTargets) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Create Announcement */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="Megaphone" size={20} className="mr-2" />
              Create Local Announcement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter announcement title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter your message..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Audience
              </label>
              <div className="flex flex-wrap gap-2">
                {targetOptions.map((target) => (
                  <button
                    key={target}
                    onClick={() => handleTargetToggle(target)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedTargets.includes(target)
                        ? 'bg-primary-100 text-primary-800 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {target}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button className="flex-1">
                <Icon name="Send" size={16} className="mr-2" />
                Send Now
              </Button>
              <Button variant="outline">
                <Icon name="Clock" size={16} className="mr-2" />
                Schedule
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="History" size={20} className="mr-2" />
              Recent Announcements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAnnouncements.map((announcement) => (
                <div key={announcement.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {announcement.title}
                    </h4>
                    <Badge variant={getPriorityColor(announcement.priority) as any} size="sm" className="capitalize">
                      {announcement.priority}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {announcement.message}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>By {announcement.author}</span>
                    <span>{new Date(announcement.timestamp).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {announcement.targets.map((target, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {target}
                        </Badge>
                      ))}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Read: {announcement.readCount}/{announcement.totalTargets} ({getReadPercentage(announcement.readCount, announcement.totalTargets)}%)
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-primary-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${getReadPercentage(announcement.readCount, announcement.totalTargets)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Announcement Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="BarChart3" size={20} className="mr-2" />
            Announcement Analytics - {propertyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">87%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Average Read Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">2.3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time (hrs)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">High Priority</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};