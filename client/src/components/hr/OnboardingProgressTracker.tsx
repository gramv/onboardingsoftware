import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface OnboardingSession {
  id: string;
  employeeId: string;
  token: string;
  status: 'pending' | 'in_progress' | 'completed' | 'expired';
  currentStep: string;
  progress: number;
  expiresAt: string;
  lastActivity: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  };
  steps: {
    id: string;
    name: string;
    status: 'not_started' | 'in_progress' | 'completed';
    completedAt?: string;
  }[];
}

interface OnboardingProgressTrackerProps {
  employeeId?: string;
  managerId?: string;
  organizationId?: string;
  onSessionSelect?: (session: OnboardingSession) => void;
  className?: string;
}

export const OnboardingProgressTracker: React.FC<OnboardingProgressTrackerProps> = ({
  employeeId,
  managerId,
  organizationId,
  onSessionSelect,
  className = ''
}) => {
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed' | 'expired'>('all');

  // Fetch onboarding sessions
  useEffect(() => {
    const fetchSessions = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockSessions: OnboardingSession[] = [
          {
            id: 'session1',
            employeeId: 'emp1',
            accessCode: 'ABC123',
            status: 'in_progress',
            currentStep: 'documents',
            progress: 40,
            expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            employee: {
              id: 'emp1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              position: 'Front Desk Agent'
            },
            steps: [
              { id: 'language', name: 'Language Selection', status: 'completed', completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
              { id: 'access_code', name: 'Access Code Verification', status: 'completed', completedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000).toISOString() },
              { id: 'documents', name: 'Document Upload', status: 'in_progress' },
              { id: 'forms', name: 'Form Completion', status: 'not_started' },
              { id: 'signature', name: 'Digital Signature', status: 'not_started' }
            ]
          },
          {
            id: 'session2',
            employeeId: 'emp2',
            accessCode: 'DEF456',
            status: 'pending',
            currentStep: 'language',
            progress: 0,
            expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            employee: {
              id: 'emp2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              position: 'Housekeeper'
            },
            steps: [
              { id: 'language', name: 'Language Selection', status: 'not_started' },
              { id: 'access_code', name: 'Access Code Verification', status: 'not_started' },
              { id: 'documents', name: 'Document Upload', status: 'not_started' },
              { id: 'forms', name: 'Form Completion', status: 'not_started' },
              { id: 'signature', name: 'Digital Signature', status: 'not_started' }
            ]
          },
          {
            id: 'session3',
            employeeId: 'emp3',
            accessCode: 'GHI789',
            status: 'completed',
            currentStep: 'complete',
            progress: 100,
            expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
            employee: {
              id: 'emp3',
              firstName: 'Michael',
              lastName: 'Johnson',
              email: 'michael.johnson@example.com',
              position: 'Maintenance Technician'
            },
            steps: [
              { id: 'language', name: 'Language Selection', status: 'completed', completedAt: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString() },
              { id: 'access_code', name: 'Access Code Verification', status: 'completed', completedAt: new Date(Date.now() - 15.5 * 60 * 60 * 1000).toISOString() },
              { id: 'documents', name: 'Document Upload', status: 'completed', completedAt: new Date(Date.now() - 14 * 60 * 60 * 1000).toISOString() },
              { id: 'forms', name: 'Form Completion', status: 'completed', completedAt: new Date(Date.now() - 13 * 60 * 60 * 1000).toISOString() },
              { id: 'signature', name: 'Digital Signature', status: 'completed', completedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() }
            ]
          },
          {
            id: 'session4',
            employeeId: 'emp4',
            accessCode: 'JKL012',
            status: 'expired',
            currentStep: 'documents',
            progress: 30,
            expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            lastActivity: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            employee: {
              id: 'emp4',
              firstName: 'Sarah',
              lastName: 'Williams',
              email: 'sarah.williams@example.com',
              position: 'Night Auditor'
            },
            steps: [
              { id: 'language', name: 'Language Selection', status: 'completed', completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'access_code', name: 'Access Code Verification', status: 'completed', completedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString() },
              { id: 'documents', name: 'Document Upload', status: 'in_progress' },
              { id: 'forms', name: 'Form Completion', status: 'not_started' },
              { id: 'signature', name: 'Digital Signature', status: 'not_started' }
            ]
          }
        ];
        
        // Filter by employeeId if provided
        let filteredSessions = mockSessions;
        if (employeeId) {
          filteredSessions = mockSessions.filter(session => session.employeeId === employeeId);
        }
        
        setSessions(filteredSessions);
      } catch (err) {
        console.error('Error fetching onboarding sessions:', err);
        setError('Failed to load onboarding sessions. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSessions();
  }, [employeeId, managerId, organizationId]);

  // Filter sessions based on status
  const filteredSessions = filter === 'all' 
    ? sessions 
    : sessions.filter(session => session.status === filter);

  // Get status badge color
  const getStatusBadge = (status: OnboardingSession['status']) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-gray-100 text-gray-800">Pending</Badge>;
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      default:
        return null;
    }
  };

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);
    const diffMin = Math.round(diffSec / 60);
    const diffHour = Math.round(diffMin / 60);
    const diffDay = Math.round(diffHour / 24);
    
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour !== 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Onboarding Progress</h2>
        
        <div className="flex gap-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'pending' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('pending')}
          >
            Pending
          </Button>
          <Button 
            variant={filter === 'in_progress' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('in_progress')}
          >
            In Progress
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="flex items-center gap-2">
            <Icon name="Loader" className="animate-spin" />
            <span>Loading onboarding sessions...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : filteredSessions.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 text-center p-8 rounded-lg">
          <Icon name="Search" size={32} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No onboarding sessions found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredSessions.map(session => (
            <Card 
              key={session.id} 
              className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => onSessionSelect?.(session)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      {session.employee.firstName.charAt(0)}{session.employee.lastName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-medium">{session.employee.firstName} {session.employee.lastName}</h3>
                      <p className="text-sm text-gray-500">{session.employee.position}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {getStatusBadge(session.status)}
                    <span className="text-sm text-gray-500">
                      {session.status === 'completed' 
                        ? 'Completed' 
                        : session.status === 'expired'
                        ? 'Expired'
                        : `Expires in ${Math.ceil((new Date(session.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`}
                    </span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{session.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        session.status === 'completed' ? 'bg-green-500' :
                        session.status === 'expired' ? 'bg-gray-400' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${session.progress}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {session.steps.map(step => (
                    <div 
                      key={step.id}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        step.status === 'completed' ? 'bg-green-100 text-green-800' :
                        step.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {step.name}
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-between text-sm text-gray-500">
                  <div>
                    <span className="font-medium">Current Step:</span> {
                      session.status === 'completed' 
                        ? 'All steps completed' 
                        : session.steps.find(s => s.status === 'in_progress')?.name || 'Not started'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Last Activity:</span> {formatRelativeTime(session.lastActivity)}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingProgressTracker;