import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';

interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  type?: 'text' | 'quick_action' | 'link';
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  content: string;
  tags: string[];
  helpful: number;
  views: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
}

export const HelpCenter: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'articles' | 'faq' | 'contact'>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant. I can help you with questions about your schedule, documents, company policies, and more. What would you like to know?',
      sender: 'ai',
      timestamp: new Date(),
      type: 'text',
      actions: [
        { label: 'View My Schedule', action: 'schedule' },
        { label: 'Upload Documents', action: 'documents' },
        { label: 'Company Policies', action: 'policies' },
        { label: 'Time Tracking Help', action: 'timetracking' },
      ],
    },
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Mock data for help articles
  const helpArticles: HelpArticle[] = [
    {
      id: '1',
      title: 'How to Clock In and Out',
      category: 'Time Tracking',
      content: 'Learn how to use the time tracking system to clock in and out of your shifts...',
      tags: ['time', 'clock', 'shifts'],
      helpful: 45,
      views: 234,
    },
    {
      id: '2',
      title: 'Uploading Required Documents',
      category: 'Documents',
      content: 'Step-by-step guide on how to upload and sign your employment documents...',
      tags: ['documents', 'upload', 'signature'],
      helpful: 38,
      views: 189,
    },
    {
      id: '3',
      title: 'Understanding Your Schedule',
      category: 'Scheduling',
      content: 'How to view your work schedule and request time off...',
      tags: ['schedule', 'time off', 'shifts'],
      helpful: 52,
      views: 312,
    },
    {
      id: '4',
      title: 'Company Safety Policies',
      category: 'Policies',
      content: 'Important safety guidelines and procedures for all employees...',
      tags: ['safety', 'policies', 'procedures'],
      helpful: 29,
      views: 156,
    },
  ];

  // Mock data for FAQs
  const faqs: FAQ[] = [
    {
      id: '1',
      question: 'How do I request time off?',
      answer: 'You can request time off through the Schedule section of your dashboard. Click on "Request Time Off" and fill out the form with your desired dates and reason.',
      category: 'Scheduling',
      helpful: 67,
    },
    {
      id: '2',
      question: 'What documents do I need to upload?',
      answer: 'You need to upload your driver\'s license or state ID, Social Security card, and complete your I-9 and W-4 forms. All required documents are listed in your Document Center.',
      category: 'Documents',
      helpful: 54,
    },
    {
      id: '3',
      question: 'How do I reset my password?',
      answer: 'Click on "Forgot Password" on the login page and enter your email address. You\'ll receive instructions to reset your password.',
      category: 'Account',
      helpful: 43,
    },
    {
      id: '4',
      question: 'Who do I contact for payroll questions?',
      answer: 'For payroll questions, please contact the HR department through the messaging system or call the HR hotline at (555) 123-4567.',
      category: 'Payroll',
      helpful: 38,
    },
  ];

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!currentMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: currentMessage,
      sender: 'user',
      timestamp: new Date(),
    };

    setChatMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = generateAIResponse(currentMessage);
      setChatMessages(prev => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1500);
  };

  const generateAIResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('shift')) {
      return {
        id: (Date.now() + 1).toString(),
        content: 'I can help you with schedule-related questions! You can view your current schedule, upcoming shifts, and request time off through the Schedule section. Would you like me to guide you there?',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { label: 'View Schedule', action: 'schedule', url: '/schedule' },
          { label: 'Request Time Off', action: 'timeoff' },
        ],
      };
    } else if (lowerMessage.includes('document') || lowerMessage.includes('upload')) {
      return {
        id: (Date.now() + 1).toString(),
        content: 'For document-related help, I can assist you with uploading required documents, digital signatures, and checking your document status. What specific document help do you need?',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { label: 'Upload Documents', action: 'documents', url: '/documents' },
          { label: 'Document Requirements', action: 'requirements' },
        ],
      };
    } else if (lowerMessage.includes('time') || lowerMessage.includes('clock')) {
      return {
        id: (Date.now() + 1).toString(),
        content: 'I can help you with time tracking! You can clock in/out, view your timesheet, and submit hours for approval. The time tracking system also supports break tracking.',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { label: 'Time Tracking', action: 'timetracking', url: '/time-tracking' },
          { label: 'View Timesheet', action: 'timesheet' },
        ],
      };
    } else if (lowerMessage.includes('policy') || lowerMessage.includes('handbook')) {
      return {
        id: (Date.now() + 1).toString(),
        content: 'I can help you find information about company policies and procedures. The employee handbook contains important information about safety, conduct, and benefits.',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { label: 'Employee Handbook', action: 'handbook' },
          { label: 'Safety Policies', action: 'safety' },
        ],
      };
    } else {
      return {
        id: (Date.now() + 1).toString(),
        content: 'I\'m here to help! I can assist you with questions about your schedule, documents, time tracking, company policies, and general system navigation. Could you be more specific about what you need help with?',
        sender: 'ai',
        timestamp: new Date(),
        actions: [
          { label: 'Schedule Help', action: 'schedule' },
          { label: 'Document Help', action: 'documents' },
          { label: 'Time Tracking', action: 'timetracking' },
          { label: 'Policies', action: 'policies' },
        ],
      };
    }
  };

  const handleQuickAction = (action: string) => {
    const actionMessage = `Help me with ${action}`;
    setCurrentMessage(actionMessage);
    sendMessage();
  };

  const filteredArticles = helpArticles.filter(article =>
    article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderChat = () => (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon name="MessageCircle" size={20} className="mr-2" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {chatMessages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                {message.actions && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {message.actions.map((action, index) => (
                      <Button
                        key={index}
                        size="sm"
                        variant="ghost"
                        className="text-xs bg-white/20 hover:bg-white/30"
                        onClick={() => handleQuickAction(action.action)}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                )}
                <p className="text-xs opacity-70 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="flex space-x-2">
          <Input
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            placeholder="Ask me anything..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={!currentMessage.trim()}>
            <Icon name="Send" size={16} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderArticles = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help articles..."
          className="pl-10"
        />
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => (
          <Card key={article.id} className="hover:shadow-medium transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded">
                  {article.category}
                </span>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Icon name="Eye" size={12} />
                  <span>{article.views}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {article.title}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {article.content}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {article.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Icon name="ThumbsUp" size={12} />
                  <span>{article.helpful}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon name="FileSearch" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No articles found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or browse all categories
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Icon name="Search" size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search frequently asked questions..."
          className="pl-10"
        />
      </div>

      {/* FAQ List */}
      <div className="space-y-4">
        {filteredFAQs.map((faq) => (
          <Card key={faq.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {faq.category}
                </span>
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <Icon name="ThumbsUp" size={12} />
                  <span>{faq.helpful}</span>
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {faq.question}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {faq.answer}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFAQs.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Icon name="HelpCircle" size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No FAQs found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your search terms or contact support
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderContact = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Contact Support</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Icon name="MessageSquare" size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Live Chat</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Available 24/7</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Icon name="Phone" size={20} className="text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Phone Support</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">(555) 123-4567</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Icon name="Mail" size={20} className="text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Email Support</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">support@motelmanager.com</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Send a Message</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject
              </label>
              <Input placeholder="What do you need help with?" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Message
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Describe your issue or question..."
              />
            </div>
            <Button className="w-full">
              <Icon name="Send" size={16} className="mr-2" />
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Help Center</h2>
        <div className="flex items-center space-x-2">
          <Button size="sm" variant="ghost">
            <Icon name="BookOpen" size={16} className="mr-1" />
            User Guide
          </Button>
          <Button size="sm" variant="ghost">
            <Icon name="Video" size={16} className="mr-1" />
            Video Tutorials
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Help Articles', value: helpArticles.length, icon: 'FileText', color: 'text-blue-600' },
          { label: 'FAQs', value: faqs.length, icon: 'HelpCircle', color: 'text-green-600' },
          { label: 'Video Guides', value: 12, icon: 'Video', color: 'text-purple-600' },
          { label: 'Support Tickets', value: 0, icon: 'MessageSquare', color: 'text-yellow-600' },
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
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant={activeTab === 'chat' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('chat')}
        >
          <Icon name="MessageCircle" size={16} className="mr-1" />
          AI Chat
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'articles' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('articles')}
        >
          <Icon name="FileText" size={16} className="mr-1" />
          Help Articles
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'faq' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('faq')}
        >
          <Icon name="HelpCircle" size={16} className="mr-1" />
          FAQ
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'contact' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('contact')}
        >
          <Icon name="Phone" size={16} className="mr-1" />
          Contact
        </Button>
      </div>

      {/* Content */}
      {activeTab === 'chat' && renderChat()}
      {activeTab === 'articles' && renderArticles()}
      {activeTab === 'faq' && renderFAQ()}
      {activeTab === 'contact' && renderContact()}
    </div>
  );
};