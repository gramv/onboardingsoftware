import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

export const AnnouncementComposer: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');

  const locations = ['Downtown Motel', 'Airport Motel', 'Highway Motel', 'Seaside Motel'];
  const roles = ['hr_admin', 'manager', 'employee'];

  const recentAnnouncements = [
    {
      id: '1',
      title: 'Holiday Schedule Update',
      message: 'Please review the updated holiday schedule for December.',
      author: 'HR Admin',
      timestamp: '2024-01-08T10:30:00Z',
      priority: 'high' as const,
      locations: ['All Locations'],
      roles: ['All Roles'],
    },
    {
      id: '2',
      title: 'New Safety Protocol',
      message: 'Updated safety protocols are now in effect.',
      author: 'Safety Manager',
      timestamp: '2024-01-07T14:15:00Z',
      priority: 'medium' as const,
      locations: ['Downtown Motel', 'Airport Motel'],
      roles: ['manager', 'employee'],
    },
  ];

  const handleLocationToggle = (location: string) => {
    setSelectedLocations(prev => 
      prev.includes(location) 
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleRoleToggle = (role: string) => {
    setSelectedRoles(prev => 
      prev.includes(role) 
        ? prev.filter(r => r !== role)
        : [...prev, role]
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Announcement Composer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="Megaphone" size={20} className="mr-2" />
              Create Announcement
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
                placeholder="Enter your announcement message..."
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
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Locations
              </label>
              <div className="flex flex-wrap gap-2">
                {locations.map((location) => (
                  <button
                    key={location}
                    onClick={() => handleLocationToggle(location)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                      selectedLocations.includes(location)
                        ? 'bg-primary-100 text-primary-800 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {location}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Target Roles
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleToggle(role)}
                    className={`px-3 py-1 text-sm rounded-full border transition-colors capitalize ${
                      selectedRoles.includes(role)
                        ? 'bg-primary-100 text-primary-800 border-primary-300'
                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button className="flex-1">
                <Icon name="Send" size={16} className="mr-2" />
                Send Announcement
              </Button>
              <Button variant="outline">
                <Icon name="Save" size={16} className="mr-2" />
                Save Draft
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
                    <Badge variant={getPriorityColor(announcement.priority) as any} className="capitalize">
                      {announcement.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {announcement.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>By {announcement.author}</span>
                    <span>{new Date(announcement.timestamp).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {announcement.locations.map((location, index) => (
                      <Badge key={index} variant="outline" size="sm">
                        {location}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};