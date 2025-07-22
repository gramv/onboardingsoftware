import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface ShiftCoverageProps {
  propertyName: string;
}

interface CoverageRequest {
  id: string;
  shift: string;
  date: string;
  position: string;
  originalEmployee: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
  status: 'open' | 'covered' | 'pending';
  volunteers: string[];
  timePosted: string;
}

interface AvailableEmployee {
  id: string;
  name: string;
  position: string;
  availability: 'available' | 'busy' | 'off_duty';
  skills: string[];
  lastCoverage: string;
}

export const ShiftCoverage: React.FC<ShiftCoverageProps> = ({ propertyName }) => {
  const [selectedRequest, setSelectedRequest] = useState<CoverageRequest | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const coverageRequests: CoverageRequest[] = [
    {
      id: '1',
      shift: '2:00 PM - 10:00 PM',
      date: '2024-01-10',
      position: 'Front Desk',
      originalEmployee: 'Sarah Johnson',
      reason: 'Sick leave',
      urgency: 'high',
      status: 'open',
      volunteers: ['Mike Chen', 'Lisa Rodriguez'],
      timePosted: '2024-01-09T08:00:00Z',
    },
    {
      id: '2',
      shift: '6:00 AM - 2:00 PM',
      date: '2024-01-12',
      position: 'Housekeeping',
      originalEmployee: 'Emma Wilson',
      reason: 'Family emergency',
      urgency: 'medium',
      status: 'pending',
      volunteers: ['Maria Garcia'],
      timePosted: '2024-01-08T15:30:00Z',
    },
    {
      id: '3',
      shift: '11:00 PM - 7:00 AM',
      date: '2024-01-08',
      position: 'Night Audit',
      originalEmployee: 'David Kim',
      reason: 'Vacation',
      urgency: 'low',
      status: 'covered',
      volunteers: ['James Brown'],
      timePosted: '2024-01-05T10:00:00Z',
    },
  ];

  const availableEmployees: AvailableEmployee[] = [
    {
      id: '1',
      name: 'Mike Chen',
      position: 'Maintenance Technician',
      availability: 'available',
      skills: ['Front Desk', 'Maintenance'],
      lastCoverage: '2024-01-01',
    },
    {
      id: '2',
      name: 'Lisa Rodriguez',
      position: 'Housekeeper',
      availability: 'available',
      skills: ['Housekeeping', 'Front Desk'],
      lastCoverage: '2023-12-28',
    },
    {
      id: '3',
      name: 'Maria Garcia',
      position: 'Housekeeper',
      availability: 'busy',
      skills: ['Housekeeping'],
      lastCoverage: '2024-01-05',
    },
    {
      id: '4',
      name: 'James Brown',
      position: 'Security Guard',
      availability: 'off_duty',
      skills: ['Security', 'Night Audit'],
      lastCoverage: '2024-01-03',
    },
  ];

  const getUrgencyColor = (urgency: CoverageRequest['urgency']) => {
    switch (urgency) {
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

  const getStatusColor = (status: CoverageRequest['status']) => {
    switch (status) {
      case 'covered':
        return 'success';
      case 'pending':
        return 'warning';
      case 'open':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getAvailabilityColor = (availability: AvailableEmployee['availability']) => {
    switch (availability) {
      case 'available':
        return 'success';
      case 'busy':
        return 'warning';
      case 'off_duty':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const statusCounts = {
    open: coverageRequests.filter(r => r.status === 'open').length,
    pending: coverageRequests.filter(r => r.status === 'pending').length,
    covered: coverageRequests.filter(r => r.status === 'covered').length,
  };

  return (
    <div className="space-y-6">
      {/* Coverage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {statusCounts.open}
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">Open Requests</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                {statusCounts.pending}
              </p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">Pending Approval</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {statusCounts.covered}
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">Covered</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coverage Requests */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Icon name="Clock" size={20} className="mr-2" />
                  Shift Coverage Requests - {propertyName}
                </CardTitle>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Request Coverage
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {coverageRequests.map((request) => (
                  <div 
                    key={request.id} 
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                      selectedRequest?.id === request.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700'
                    }`}
                    onClick={() => setSelectedRequest(request)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {request.position} - {request.shift}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.date).toLocaleDateString()} • {request.originalEmployee}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Reason: {request.reason}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={getUrgencyColor(request.urgency) as any} size="sm" className="capitalize">
                          {request.urgency}
                        </Badge>
                        <Badge variant={getStatusColor(request.status) as any} size="sm" className="capitalize">
                          {request.status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Posted: {new Date(request.timePosted).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {request.volunteers.length} volunteer{request.volunteers.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {request.volunteers.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {request.volunteers.map((volunteer, index) => (
                          <Badge key={index} variant="outline" size="sm">
                            {volunteer}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Request Details & Available Staff */}
        <div className="space-y-6">
          {/* Request Details */}
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedRequest ? (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                      {selectedRequest.position}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(selectedRequest.date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Shift:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRequest.shift}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Original:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRequest.originalEmployee}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reason:</span>
                        <span className="text-gray-900 dark:text-white">
                          {selectedRequest.reason}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={getUrgencyColor(selectedRequest.urgency) as any} className="capitalize">
                      {selectedRequest.urgency} Priority
                    </Badge>
                    <Badge variant={getStatusColor(selectedRequest.status) as any} className="capitalize">
                      {selectedRequest.status}
                    </Badge>
                  </div>

                  {selectedRequest.volunteers.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        Volunteers ({selectedRequest.volunteers.length})
                      </h4>
                      <div className="space-y-1">
                        {selectedRequest.volunteers.map((volunteer, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <span className="text-sm text-gray-900 dark:text-white">
                              {volunteer}
                            </span>
                            {selectedRequest.status === 'pending' && (
                              <Button variant="outline" size="sm">
                                Approve
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    {selectedRequest.status === 'open' && (
                      <>
                        <Button className="w-full" size="sm">
                          <Icon name="UserPlus" size={16} className="mr-2" />
                          Assign Coverage
                        </Button>
                        <Button variant="outline" className="w-full" size="sm">
                          <Icon name="Megaphone" size={16} className="mr-2" />
                          Broadcast Request
                        </Button>
                      </>
                    )}
                    <Button variant="outline" className="w-full" size="sm">
                      <Icon name="Edit" size={16} className="mr-2" />
                      Edit Request
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Icon name="Clock" size={48} className="text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Select a coverage request to view details
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Available Staff */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Icon name="Users" size={20} className="mr-2" />
                Available Staff
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {availableEmployees.map((employee) => (
                  <div key={employee.id} className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                          {employee.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {employee.position}
                        </p>
                      </div>
                      <Badge variant={getAvailabilityColor(employee.availability) as any} size="sm" className="capitalize">
                        {employee.availability.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      {employee.skills.map((skill, index) => (
                        <Badge key={index} variant="outline" size="sm">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>Last coverage: {new Date(employee.lastCoverage).toLocaleDateString()}</span>
                      {employee.availability === 'available' && (
                        <Button variant="outline" size="sm">
                          <Icon name="Plus" size={12} className="mr-1" />
                          Assign
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Coverage Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="BarChart3" size={20} className="mr-2" />
            Coverage Analytics - {propertyName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">85%</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Coverage Success Rate</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">2.3</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response Time (hrs)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-600">12</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Requests This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">4</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Top Volunteers</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};