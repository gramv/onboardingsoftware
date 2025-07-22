import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';
import { onboardingService } from '../../services/onboardingService';

interface OnboardingSession {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
    organizationName: string;
  };
  status: 'manager_approved' | 'approved' | 'rejected';
  submittedAt: string;
  managerApprovedAt?: string;
  managerApprovedBy?: string;
  managerNotes?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  documents: Array<{
    id: string;
    documentType: string;
    fileName: string;
    uploadedAt: string;
    ocrData?: any;
  }>;
  forms: {
    i9Data?: any;
    w4Data?: any;
  };
  signatures: Record<string, string>;
  createdAt: string;
  completedAt?: string;
}

interface HRApprovalInterfaceProps {
  className?: string;
}

export const HRApprovalInterface: React.FC<HRApprovalInterfaceProps> = ({ 
  className = '' 
}) => {
  const { } = useAuthStore();
  const { showToast } = useToast();
  
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<OnboardingSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  useEffect(() => {
    loadManagerApprovedSessions();
  }, []);

  const loadManagerApprovedSessions = async () => {
    setIsLoading(true);
    try {
      // Get sessions that have been approved by managers but not yet by HR
      const response = await onboardingService.listSessions({
        status: 'manager_approved'
      });
      setSessions(response.sessions || []);
    } catch (error) {
      console.error('Error loading manager approved sessions:', error);
      showToast('Failed to load pending approvals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = async (session: OnboardingSession) => {
    setSelectedSession(session);
    setViewMode('detail');
    setApprovalNotes('');
  };

  const handleFinalApproval = async (action: 'approve' | 'reject') => {
    if (!selectedSession) return;

    if (action === 'reject' && !approvalNotes.trim()) {
      showToast('Please provide notes for rejection', 'warning');
      return;
    }

    setIsSubmittingApproval(true);
    try {
      if (action === 'approve') {
        await onboardingService.hrApproveOnboarding(selectedSession.id, approvalNotes.trim());
        showToast('Onboarding approved successfully', 'success');
      } else {
        await onboardingService.rejectOnboarding(selectedSession.id, approvalNotes.trim(), 'hr_admin');
        showToast('Onboarding rejected successfully', 'success');
      }
      
      // Refresh the list
      await loadManagerApprovedSessions();
      
      // Clear selection
      setSelectedSession(null);
      setViewMode('list');
      setApprovalNotes('');
    } catch (error) {
      console.error('Error submitting final approval:', error);
      showToast('Failed to submit approval', 'error');
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const getStatusColor = (status: OnboardingSession['status']) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'manager_approved':
        return 'default';
      case 'rejected':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: OnboardingSession['status']) => {
    switch (status) {
      case 'manager_approved':
        return 'Pending HR Approval';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (viewMode === 'detail' && selectedSession) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Button 
              variant="outline" 
              onClick={() => {
                setViewMode('list');
                setSelectedSession(null);
              }}
            >
              <Icon name="ChevronLeft" size={16} className="mr-2" />
              Back to Approvals
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={getStatusColor(selectedSession.status) as any}>
              {getStatusText(selectedSession.status)}
            </Badge>
          </div>
        </div>

        {/* Employee Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="User" size={20} className="mr-2" />
              Employee Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <p className="text-gray-900">
                  {selectedSession.employee.firstName} {selectedSession.employee.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-gray-900">{selectedSession.employee.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Position</label>
                <p className="text-gray-900">{selectedSession.employee.position}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Department</label>
                <p className="text-gray-900">{selectedSession.employee.department}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Organization</label>
                <p className="text-gray-900">{selectedSession.employee.organizationName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Session ID</label>
                <p className="text-gray-900 font-mono text-sm">{selectedSession.id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Manager Approval Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="UserCheck" size={20} className="mr-2" />
              Manager Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Approved By</label>
                <p className="text-gray-900">{selectedSession.managerApprovedBy || 'Manager'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Approved At</label>
                <p className="text-gray-900">
                  {selectedSession.managerApprovedAt ? formatDate(selectedSession.managerApprovedAt) : 'Recently'}
                </p>
              </div>
              {selectedSession.managerNotes && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Manager Notes</label>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg mt-1">
                    {selectedSession.managerNotes}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Documents Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="FileText" size={20} className="mr-2" />
              Documents ({selectedSession.documents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedSession.documents.length > 0 ? (
              <div className="space-y-3">
                {selectedSession.documents.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                      <div>
                        <span className="font-medium">{doc.documentType}</span>
                        <p className="text-sm text-gray-500">{doc.fileName}</p>
                        <p className="text-xs text-gray-400">
                          Uploaded: {formatDate(doc.uploadedAt)}
                        </p>
                        {doc.ocrData && (
                          <p className="text-xs text-blue-600">OCR processed</p>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Icon name="Eye" size={16} className="mr-2" />
                      View
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No documents uploaded</p>
            )}
          </CardContent>
        </Card>

        {/* Forms Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="FileCheck" size={20} className="mr-2" />
              Forms
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {selectedSession.forms.i9Data && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                    <span className="font-medium">Form I-9: Employment Eligibility Verification</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Icon name="Eye" size={16} className="mr-2" />
                    Review
                  </Button>
                </div>
              )}
              {selectedSession.forms.w4Data && (
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <Icon name="CheckCircle" size={20} className="text-green-600 mr-3" />
                    <span className="font-medium">Form W-4: Employee's Withholding Certificate</span>
                  </div>
                  <Button variant="outline" size="sm">
                    <Icon name="Eye" size={16} className="mr-2" />
                    Review
                  </Button>
                </div>
              )}
              {!selectedSession.forms.i9Data && !selectedSession.forms.w4Data && (
                <p className="text-gray-500 italic">No forms completed</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Signatures Review */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="Edit" size={20} className="mr-2" />
              Digital Signatures
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(selectedSession.signatures).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(selectedSession.signatures).map(([key, signature]) => (
                  <div key={key} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium capitalize">
                        {key.replace('_signature', '').replace('_', ' ')} Signature
                      </span>
                      <Icon name="CheckCircle" size={20} className="text-green-600" />
                    </div>
                    <div className="bg-white border rounded p-2">
                      <img 
                        src={signature} 
                        alt={`${key} signature`}
                        className="max-h-24 mx-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No signatures captured</p>
            )}
          </CardContent>
        </Card>

        {/* HR Final Approval Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Icon name="MessageSquare" size={20} className="mr-2" />
              HR Final Approval Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label htmlFor="approvalNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Final approval comments (optional)
                </label>
                <textarea
                  id="approvalNotes"
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your final approval comments here..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Approval Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-center space-x-4">
              <Button
                onClick={() => handleFinalApproval('approve')}
                disabled={isSubmittingApproval}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                size="lg"
              >
                {isSubmittingApproval ? (
                  <Icon name="Loader" className="animate-spin mr-2" size={16} />
                ) : (
                  <Icon name="CheckCircle" size={16} className="mr-2" />
                )}
                Final Approval
              </Button>
              <Button
                onClick={() => handleFinalApproval('reject')}
                disabled={isSubmittingApproval}
                variant="outline"
                className="border-red-500 text-red-600 hover:bg-red-50 px-8 py-3"
                size="lg"
              >
                {isSubmittingApproval ? (
                  <Icon name="Loader" className="animate-spin mr-2" size={16} />
                ) : (
                  <Icon name="X" size={16} className="mr-2" />
                )}
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">HR Final Approvals</h2>
          <p className="text-gray-600">Review and provide final approval for manager-approved onboardings</p>
        </div>
        <Button onClick={loadManagerApprovedSessions} disabled={isLoading}>
          {isLoading ? (
            <Icon name="Loader" className="animate-spin mr-2" size={16} />
          ) : (
            <Icon name="RefreshCw" size={16} className="mr-2" />
          )}
          Refresh
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-yellow-600">
                {sessions.length}
              </p>
              <p className="text-sm text-gray-600">Pending HR Approval</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">
                0
              </p>
              <p className="text-sm text-gray-600">Approved Today</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">
                {sessions.length}
              </p>
              <p className="text-sm text-gray-600">Total This Week</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="List" size={20} className="mr-2" />
            Pending HR Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader" className="animate-spin h-8 w-8 text-primary-500" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="CheckCircle" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No onboardings pending HR approval</p>
              <p className="text-sm mt-2">All manager-approved onboardings have been processed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <div 
                  key={session.id} 
                  className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">
                          {session.employee.firstName} {session.employee.lastName}
                        </h4>
                        <Badge variant={getStatusColor(session.status) as any}>
                          {getStatusText(session.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {session.employee.position} • {session.employee.department}
                      </p>
                      <p className="text-sm text-gray-500">
                        Organization: {session.employee.organizationName}
                      </p>
                      <p className="text-sm text-gray-500">
                        Manager Approved: {session.managerApprovedAt ? formatDate(session.managerApprovedAt) : 'Recently'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        <span>Documents: {session.documents.length}</span>
                        <span>Forms: {Object.keys(session.forms).length}</span>
                        <span>Signatures: {Object.keys(session.signatures).length}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Icon name="ChevronRight" size={20} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};