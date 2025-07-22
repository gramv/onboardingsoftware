import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';

interface CommunicationHubProps {
  propertyName: string;
}

interface Message {
  id: string;
  sender: string;
  recipient: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  type: 'direct' | 'group' | 'announcement';
  threadId?: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isGroup: boolean;
  groupName?: string;
}

export const CommunicationHub: React.FC<CommunicationHubProps> = ({ propertyName }) => {
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'compose'>('inbox');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const conversations: Conversation[] = [
    {
      id: '1',
      participants: ['Sarah Johnson'],
      lastMessage: 'Can you cover my shift tomorrow?',
      lastMessageTime: '2024-01-09T14:30:00Z',
      unreadCount: 2,
      isGroup: false,
    },
    {
      id: '2',
      participants: ['Mike Chen', 'Lisa Rodriguez'],
      lastMessage: 'Maintenance request completed',
      lastMessageTime: '2024-01-09T12:15:00Z',
      unreadCount: 0,
      isGroup: true,
      groupName: 'Maintenance Team',
    },
    {
      id: '3',
      participants: ['Emma Wilson'],
      lastMessage: 'Schedule update received',
      lastMessageTime: '2024-01-09T10:45:00Z',
      unreadCount: 1,
      isGroup: false,
    },
    {
      id: '4',
      participants: ['Front Office Team'],
      lastMessage: 'New guest services protocol',
      lastMessageTime: '2024-01-09T09:20:00Z',
      unreadCount: 0,
      isGroup: true,
      groupName: 'Front Office Team',
    },
  ];

  const messages: Message[] = [
    {
      id: '1',
      sender: 'Sarah Johnson',
      recipient: 'Manager',
      subject: 'Shift Coverage Request',
      content: 'Hi, I need to request coverage for my shift tomorrow due to a family emergency. Can someone help?',
      timestamp: '2024-01-09T14:30:00Z',
      isRead: false,
      priority: 'high',
      type: 'direct',
      threadId: '1',
    },
    {
      id: '2',
      sender: 'Mike Chen',
      recipient: 'Manager',
      subject: 'Maintenance Update',
      content: 'Room 205 maintenance has been completed. All systems are working properly now.',
      timestamp: '2024-01-09T12:15:00Z',
      isRead: true,
      priority: 'medium',
      type: 'direct',
      threadId: '2',
    },
    {
      id: '3',
      sender: 'Emma Wilson',
      recipient: 'Manager',
      subject: 'Schedule Confirmation',
      content: 'I received the updated schedule for next week. Thank you for the advance notice.',
      timestamp: '2024-01-09T10:45:00Z',
      isRead: false,
      priority: 'low',
      type: 'direct',
      threadId: '3',
    },
  ];

  const teamMembers = [
    'Sarah Johnson',
    'Mike Chen',
    'Lisa Rodriguez',
    'Emma Wilson',
    'David Kim',
    'James Brown',
    'Maria Garcia',
  ];

  const getPriorityColor = (priority: Message['priority']) => {
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

  const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = Math.floor((now.getTime() - messageTime.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return messageTime.toLocaleDateString();
  };

  const filteredConversations = conversations.filter(conv =>
    searchTerm === '' || 
    conv.participants.some(p => p.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (conv.groupName && conv.groupName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const unreadCount = conversations.reduce((total, conv) => total + conv.unreadCount, 0);

  return (
    <div className="space-y-6">
      {/* Communication Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {unreadCount}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">Unread Messages</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {conversations.length}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Active Conversations</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {teamMembers.length}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Team Members</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                95%
              </p>
              <p className="text-sm text-purple-700 dark:text-purple-300">Response Rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Icon name="MessageSquare" size={20} className="mr-2" />
                  Messages
                </CardTitle>
                <Button size="sm" onClick={() => setActiveTab('compose')}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  New
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search */}
              <div className="mb-4">
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Conversation List */}
              <div className="space-y-2">
                {filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedConversation?.id === conversation.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <Icon 
                            name={conversation.isGroup ? 'Users' : 'User'} 
                            size={16} 
                            className="text-gray-600 dark:text-gray-300" 
                          />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {conversation.isGroup ? conversation.groupName : conversation.participants[0]}
                          </h4>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-32">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <span className="text-xs text-gray-400">
                          {getTimeAgo(conversation.lastMessageTime)}
                        </span>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="destructive" size="sm">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Message Thread */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="MessageCircle" size={20} className="mr-2" />
                {selectedConversation 
                  ? (selectedConversation.isGroup ? selectedConversation.groupName : selectedConversation.participants[0])
                  : 'Select a conversation'
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages
                      .filter(msg => msg.threadId === selectedConversation.id)
                      .map((message) => (
                        <div key={message.id} className="flex space-x-3">
                          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Icon name="User" size={16} className="text-gray-600 dark:text-gray-300" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="font-medium text-gray-900 dark:text-white text-sm">
                                {message.sender}
                              </span>
                              <span className="text-xs text-gray-400">
                                {getTimeAgo(message.timestamp)}
                              </span>
                              <Badge variant={getPriorityColor(message.priority) as any} size="sm">
                                {message.priority}
                              </Badge>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-sm text-gray-900 dark:text-white">
                                {message.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>

                  {/* Message Input */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex space-x-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newMessage.trim()) {
                            // Handle send message
                            setNewMessage('');
                          }
                        }}
                      />
                      <Button>
                        <Icon name="Send" size={16} />
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <Icon name="MessageSquare" size={48} className="text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Select a conversation to start messaging
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Zap" size={20} className="mr-2" />
            Quick Communication Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Megaphone" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Team Announcement</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="AlertTriangle" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Emergency Alert</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Calendar" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Schedule Update</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center p-4 h-auto">
              <Icon name="Users" size={24} className="mb-2 text-primary-600" />
              <span className="text-sm">Group Message</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Communication Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="BarChart3" size={20} className="mr-2" />
            Communication Analytics - {propertyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">156</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Messages This Week</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">2.1</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time (hrs)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">8</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Group Chats</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">95%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Message Read Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};