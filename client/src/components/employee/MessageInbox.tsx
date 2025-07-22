import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';

interface Message {
  id: string;
  subject: string;
  content: string;
  sender: {
    name: string;
    role: string;
    avatar?: string;
  };
  recipient: {
    name: string;
    role: string;
  };
  timestamp: string;
  read: boolean;
  priority: 'low' | 'normal' | 'high';
  thread?: Message[];
}

interface Conversation {
  id: string;
  participants: Array<{
    name: string;
    role: string;
    avatar?: string;
  }>;
  lastMessage: Message;
  unreadCount: number;
}

export const MessageInbox: React.FC = () => {
  const [activeView, setActiveView] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  // const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [composeData, setComposeData] = useState({
    to: '',
    subject: '',
    content: '',
    priority: 'normal' as const,
  });

  // Mock data for messages
  const messages: Message[] = [
    {
      id: '1',
      subject: 'Schedule Update for Next Week',
      content: 'Hi there! I wanted to let you know that your schedule for next week has been updated. Please check your schedule viewer for the latest changes. If you have any questions, feel free to reach out.',
      sender: {
        name: 'Sarah Johnson',
        role: 'Manager',
      },
      recipient: {
        name: 'You',
        role: 'Employee',
      },
      timestamp: '2024-01-16T10:30:00Z',
      read: false,
      priority: 'high',
    },
    {
      id: '2',
      subject: 'Welcome to the Team!',
      content: 'Welcome to our motel team! We\'re excited to have you on board. Please make sure to complete all your onboarding documents by the end of the week.',
      sender: {
        name: 'HR Department',
        role: 'HR Admin',
      },
      recipient: {
        name: 'You',
        role: 'Employee',
      },
      timestamp: '2024-01-15T14:20:00Z',
      read: true,
      priority: 'normal',
    },
    {
      id: '3',
      subject: 'Safety Training Reminder',
      content: 'This is a reminder that your monthly safety training is due by January 20th. Please complete the online module in your training portal.',
      sender: {
        name: 'Safety Coordinator',
        role: 'Manager',
      },
      recipient: {
        name: 'You',
        role: 'Employee',
      },
      timestamp: '2024-01-14T09:15:00Z',
      read: true,
      priority: 'normal',
    },
    {
      id: '4',
      subject: 'Shift Coverage Request',
      content: 'Hi! I was wondering if you could cover my shift on Friday evening (6 PM - 2 AM). I have a family emergency. Please let me know if you\'re available. Thanks!',
      sender: {
        name: 'Mike Chen',
        role: 'Employee',
      },
      recipient: {
        name: 'You',
        role: 'Employee',
      },
      timestamp: '2024-01-13T16:45:00Z',
      read: false,
      priority: 'normal',
    },
  ];

  // Mock data for conversations
  const conversations: Conversation[] = [
    {
      id: '1',
      participants: [
        { name: 'Sarah Johnson', role: 'Manager' },
        { name: 'You', role: 'Employee' },
      ],
      lastMessage: messages[0],
      unreadCount: 1,
    },
    {
      id: '2',
      participants: [
        { name: 'HR Department', role: 'HR Admin' },
        { name: 'You', role: 'Employee' },
      ],
      lastMessage: messages[1],
      unreadCount: 0,
    },
    {
      id: '3',
      participants: [
        { name: 'Mike Chen', role: 'Employee' },
        { name: 'You', role: 'Employee' },
      ],
      lastMessage: messages[3],
      unreadCount: 1,
    },
  ];

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'AlertTriangle';
      case 'normal':
        return 'MessageSquare';
      case 'low':
        return 'MessageCircle';
      default:
        return 'MessageSquare';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const filteredMessages = messages.filter(message =>
    message.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    message.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    console.log('Sending message:', composeData);
    // Here you would typically send the message to your API
    setComposeData({
      to: '',
      subject: '',
      content: '',
      priority: 'normal',
    });
    setActiveView('inbox');
  };

  const renderMessageList = () => (
    <div className="space-y-2">
      {filteredMessages.map((message) => (
        <div
          key={message.id}
          className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
            !message.read ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : 'bg-white dark:bg-gray-900 border-gray-200'
          } ${selectedMessage?.id === message.id ? 'ring-2 ring-primary-500' : ''}`}
          onClick={() => setSelectedMessage(message)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                <Icon name="User" size={20} className="text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <p className={`font-medium ${!message.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {message.sender.name}
                  </p>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {message.sender.role}
                  </span>
                  <Icon 
                    name={getPriorityIcon(message.priority) as any} 
                    size={14} 
                    className={getPriorityColor(message.priority)} 
                  />
                </div>
                <p className={`text-sm mt-1 ${!message.read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                  {message.subject}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {message.content}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end space-y-1">
              <span className="text-xs text-gray-500">
                {formatTimestamp(message.timestamp)}
              </span>
              {!message.read && (
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              )}
            </div>
          </div>
        </div>
      ))}
      
      {filteredMessages.length === 0 && (
        <div className="text-center py-12">
          <Icon name="MessageSquare" size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery ? 'No messages found matching your search' : 'No messages in your inbox'}
          </p>
        </div>
      )}
    </div>
  );

  const renderMessageDetail = () => {
    if (!selectedMessage) return null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="ghost" onClick={() => setSelectedMessage(null)}>
                <Icon name="ChevronLeft" size={16} />
              </Button>
              <div>
                <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  From: {selectedMessage.sender.name} ({selectedMessage.sender.role})
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Icon 
                name={getPriorityIcon(selectedMessage.priority) as any} 
                size={16} 
                className={getPriorityColor(selectedMessage.priority)} 
              />
              <span className="text-sm text-gray-500">
                {new Date(selectedMessage.timestamp).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
              {selectedMessage.content}
            </p>
          </div>
          
          <div className="flex items-center space-x-2 mt-6 pt-6 border-t">
            <Button size="sm">
              <Icon name="Reply" size={16} className="mr-1" />
              Reply
            </Button>
            <Button size="sm" variant="ghost">
              <Icon name="Forward" size={16} className="mr-1" />
              Forward
            </Button>
            <Button size="sm" variant="ghost">
              <Icon name="Archive" size={16} className="mr-1" />
              Archive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderComposeMessage = () => (
    <Card>
      <CardHeader>
        <CardTitle>Compose Message</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              To
            </label>
            <select
              value={composeData.to}
              onChange={(e) => setComposeData(prev => ({ ...prev, to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select recipient</option>
              <option value="manager">My Manager</option>
              <option value="hr">HR Department</option>
              <option value="team">Team Members</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <Input
                value={composeData.subject}
                onChange={(e) => setComposeData(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter message subject"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority
              </label>
              <select
                value={composeData.priority}
                onChange={(e) => setComposeData(prev => ({ ...prev, priority: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message
            </label>
            <textarea
              value={composeData.content}
              onChange={(e) => setComposeData(prev => ({ ...prev, content: e.target.value }))}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Type your message here..."
            />
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setActiveView('inbox')}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage}>
              <Icon name="Send" size={16} className="mr-1" />
              Send Message
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h2>
        <Button onClick={() => setActiveView('compose')}>
          <Icon name="Plus" size={16} className="mr-1" />
          Compose
        </Button>
      </div>

      {/* Message Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Messages', value: messages.length, icon: 'MessageSquare', color: 'text-blue-600' },
          { label: 'Unread', value: messages.filter(m => !m.read).length, icon: 'Bell', color: 'text-red-600' },
          { label: 'High Priority', value: messages.filter(m => m.priority === 'high').length, icon: 'AlertTriangle', color: 'text-yellow-600' },
          { label: 'Conversations', value: conversations.length, icon: 'MessageCircle', color: 'text-green-600' },
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

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          <Button
            size="sm"
            variant={activeView === 'inbox' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('inbox')}
          >
            <Icon name="Inbox" size={16} className="mr-1" />
            Inbox
          </Button>
          <Button
            size="sm"
            variant={activeView === 'sent' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('sent')}
          >
            <Icon name="Send" size={16} className="mr-1" />
            Sent
          </Button>
          <Button
            size="sm"
            variant={activeView === 'compose' ? 'primary' : 'ghost'}
            onClick={() => setActiveView('compose')}
          >
            <Icon name="Edit" size={16} className="mr-1" />
            Compose
          </Button>
        </div>
        
        {activeView === 'inbox' && (
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="pl-10 w-64"
              />
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      {activeView === 'compose' && renderComposeMessage()}
      
      {activeView === 'inbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Inbox</CardTitle>
              </CardHeader>
              <CardContent>
                {renderMessageList()}
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            {selectedMessage ? (
              renderMessageDetail()
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Icon name="MessageSquare" size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a message
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Choose a message from your inbox to read its contents
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
};