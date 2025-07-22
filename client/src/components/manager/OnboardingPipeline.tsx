import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface OnboardingCandidate {
  id: string;
  name: string;
  position: string;
  email: string;
  phone: string;
  startDate: string;
  progress: number;
  currentStep: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'stalled';
  assignedManager: string;
  documents: {
    i9: boolean;
    w4: boolean;
    handbook: boolean;
    id: boolean;
  };
}

interface OnboardingPipelineProps {
  propertyName: string;
}

export const OnboardingPipeline: React.FC<OnboardingPipelineProps> = ({ propertyName }) => {
  const [selectedCandidate, setSelectedCandidate] = useState<OnboardingCandidate | null>(null);

  const onboardingSteps = [
    'Welcome & Orientation',
    'Document Collection',
    'System Access Setup',
    'Training Modules',
    'Property Tour',
    'Final Review'
  ];

  const candidates: OnboardingCandidate[] = [
    {
      id: '1',
      name: 'Alex Thompson',
      position: 'Front Desk Associate',
      email: 'alex.t@email.com',
      phone: '(555) 123-4567',
      startDate: '2024-01-15',
      progress: 75,
      currentStep: 'Training Modules',
      status: 'in_progress',
      assignedManager: 'Sarah Johnson',
      documents: { i9: true, w4: true, handbook: false, id: true },
    },
    {
      id: '2',
      name: 'Maria Garcia',
      position: 'Housekeeper',
      email: 'maria.g@email.com',
      phone: '(555) 234-5678',
      startDate: '2024-01-12',
      progress: 100,
      currentStep: 'Completed',
      status: 'completed',
      assignedManager: 'Emma Wilson',
      documents: { i9: true, w4: true, handbook: true, id: true },
    },
    {
      id: '3',
      name: 'Robert Lee',
      position: 'Maintenance Assistant',
      email: 'robert.l@email.com',
      phone: '(555) 345-6789',
      startDate: '2024-01-18',
      progress: 25,
      currentStep: 'Document Collection',
      status: 'stalled',
      assignedManager: 'Mike Chen',
      documents: { i9: false, w4: true, handbook: false, id: false },
    },
    {
      id: '4',
      name: 'Jennifer Wu',
      position: 'Guest Services',
      email: 'jennifer.w@email.com',
      phone: '(555) 456-7890',
      startDate: '2024-01-20',
      progress: 0,
      currentStep: 'Welcome & Orientation',
      status: 'not_started',
      assignedManager: 'Sarah Johnson',
      documents: { i9: false, w4: false, handbook: false, id: false },
    },
  ];

  const getStatusColor = (status: OnboardingCandidate['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'default';
      case 'stalled':
        return 'destructive';
      case 'not_started':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    if (progress >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const statusCounts = {
    not_started: candidates.filter(c => c.status === 'not_started').length,
    in_progress: candidates.filter(c => c.status === 'in_progress').length,
    stalled: candidates.filter(c => c.status === 'stalled').length,
    completed: candidates.filter(c => c.status === 'completed').length,
  };

  return (
    <div className="space-y-6">
      {/* Pipeline Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statusCounts.not_started}
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">Not Started</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                {statusCounts.in_progress}
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">In Progress</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {statusCounts.stalled}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">Stalled</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {statusCounts.completed}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Completed</p>
            </div>
          </CardContent>
        </Card>

        {/* Walk-in Onboarding Quick Access */}
        <Card 
          className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => window.open('/onboarding/tablet', '_blank')}
        >
          <CardContent className="p-4">
            <div className="text-center">
              <Icon name="Tablet" size={24} className="text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">Walk-in Onboarding</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Onboarding Pipeline */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Icon name="UserPlus" size={20} className="mr-2" />
                  Onboarding Pipeline - {propertyName}
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => window.location.href = '/employees/create'}
                    variant="outline"
                  >
                    <Icon name="Plus" size={16} className="mr-2" />
                    Add Candidate
                  </Button>
                  <Button
                    onClick={() => window.open('/onboarding/tablet', '_blank')}
                  >
                    <Icon name="Tablet" size={16} className="mr-2" />
                    Walk-in Onboarding
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidates.map((candidate) => (
                  <div 
                    key={candidate.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedCandidate?.id === candidate.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedCandidate(candidate)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {candidate.name}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {candidate.position} • Start: {new Date(candidate.startDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Manager: {candidate.assignedManager}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getStatusColor(candidate.status) as any} className="capitalize">
                          {candidate.status.replace('_', ' ')}
                        </Badge>
                        <Button variant="ghost" size="sm">
                          <Icon name="MoreHorizontal" size={16} />
                        </Button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">
                          {candidate.currentStep}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {candidate.progress}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(candidate.progress)}`}
                          style={{ width: `${candidate.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Document Status */}
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-gray-500 dark:text-gray-400">Documents:</span>
                      <Badge variant={candidate.documents.i9 ? 'success' : 'secondary'} size="sm">
                        I-9
                      </Badge>
                      <Badge variant={candidate.documents.w4 ? 'success' : 'secondary'} size="sm">
                        W-4
                      </Badge>
                      <Badge variant={candidate.documents.handbook ? 'success' : 'secondary'} size="sm">
                        Handbook
                      </Badge>
                      <Badge variant={candidate.documents.id ? 'success' : 'secondary'} size="sm">
                        ID
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Candidate Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Candidate Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCandidate ? (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Icon name="User" size={32} className="text-gray-600 dark:text-gray-300" />
                    </div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {selectedCandidate.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCandidate.position}
                    </p>
                    <Badge variant={getStatusColor(selectedCandidate.status) as any} className="mt-2 capitalize">
                      {selectedCandidate.status.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Progress
                      </label>
                      <div className="mt-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">
                            {selectedCandidate.currentStep}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {selectedCandidate.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${getProgressColor(selectedCandidate.progress)}`}
                            style={{ width: `${selectedCandidate.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Contact Information
                      </label>
                      <div className="mt-1 space-y-1">
                        <p className="text-sm text-gray-900 dark:text-white">{selectedCandidate.email}</p>
                        <p className="text-sm text-gray-900 dark:text-white">{selectedCandidate.phone}</p>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Start Date
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {new Date(selectedCandidate.startDate).toLocaleDateString()}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Assigned Manager
                      </label>
                      <p className="text-sm text-gray-900 dark:text-white mt-1">
                        {selectedCandidate.assignedManager}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <Button className="w-full" size="sm">
                        <Icon name="Play" size={16} className="mr-2" />
                        Continue
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        size="sm"
                        onClick={() => window.open('/onboarding/tablet', '_blank')}
                      >
                        <Icon name="Tablet" size={16} className="mr-2" />
                        Tablet
                      </Button>
                    </div>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="MessageSquare" size={16} className="mr-2" />
                      Send Message
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="FileText" size={16} className="mr-2" />
                      View Documents
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="Calendar" size={16} className="mr-2" />
                      Schedule Meeting
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="UserPlus" size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a candidate to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};