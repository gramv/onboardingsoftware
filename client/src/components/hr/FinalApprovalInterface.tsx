import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

interface PendingApproval {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
  };
  jobDetails: {
    title: string;
    department: string;
    payRate: number;
    startDate: string;
  };
  manager: {
    firstName: string;
    lastName: string;
  };
  documents: any[];
  onboardingSession: any;
  submittedAt: string;
}

export const FinalApprovalInterface: React.FC = () => {
  const [pendingApprovals, setPendingApprovals] = useState<PendingApproval[]>([]);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [loading, setLoading] = useState(true);
  const [showEditRequest, setShowEditRequest] = useState(false);
  const [editRequest, setEditRequest] = useState({
    formType: '',
    comments: ''
  });
  const [loading, setLoading] = useState(true);
  const [editRequest, setEditRequest] = useState<{
    approvalId: string;
    formType: string;
    comments: string;
  } | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await fetch('/api/hr/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingApprovals(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFinalApproval = async (approvalId: string) => {
    try {
      const response = await fetch(`/api/hr/final-approval/${approvalId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'approved' })
      });

      if (response.ok) {
        setPendingApprovals(prev => prev.filter(a => a.id !== approvalId));
      }
    } catch (error) {
      console.error('Error approving:', error);
    }
  };

  const formTypes = ['I-9 Form', 'W-4 Form', 'Direct Deposit Form', 'Emergency Contacts', 'Health Insurance Selection'];

  const handleRequestEdit = async () => {
    if (!selectedApproval || !editRequest.formType || !editRequest.comments) return;

    try {
      const response = await fetch(`/api/hr/request-edit/${selectedApproval.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          formType: editRequest.formType, 
          comments: editRequest.comments,
          ccManager: true 
        })
      });

      if (response.ok) {
        setEditRequest({ formType: '', comments: '' });
        setShowEditRequest(false);
        fetchPendingApprovals();
      }
    } catch (error) {
      console.error('Error requesting edit:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'manager_approved':
        return <Badge variant="warning">Pending HR Review</Badge>;
      case 'completed':
        return <Badge variant="success">Completed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (showEditRequest) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Request Document Edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Form Type
            </label>
            <select
              value={editRequest.formType}
              onChange={(e) => setEditRequest(prev => ({ ...prev, formType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">Select form type</option>
              {formTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comments for Employee
            </label>
            <textarea
              value={editRequest.comments}
              onChange={(e) => setEditRequest(prev => ({ ...prev, comments: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={4}
              placeholder="Describe what needs to be corrected..."
            />
          </div>

          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowEditRequest(false);
                setEditRequest({ formType: '', comments: '' });
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleRequestEdit}>
              Send Edit Request
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Final HR Approval Queue</CardTitle>
          <p className="text-gray-600">
            Review and approve completed onboarding submissions from managers
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader" className="animate-spin h-8 w-8" />
            </div>
          ) : pendingApprovals.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="CheckCircle" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No pending approvals</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingApprovals.map((approval) => (
                <Card key={approval.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {approval.employee.firstName} {approval.employee.lastName}
                        </h3>
                        <p className="text-gray-600">{approval.jobDetails.title}</p>
                        <p className="text-gray-500 text-sm">{approval.employee.email}</p>
                        
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-4">
                            <Badge variant="outline">
                              {approval.jobDetails.department}
                            </Badge>
                            <span className="text-sm text-gray-600">
                              ${approval.jobDetails.payRate}/hr
                            </span>
                            <span className="text-sm text-gray-600">
                              Start: {new Date(approval.jobDetails.startDate).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-500">
                            Approved by: {approval.manager.firstName} {approval.manager.lastName}
                          </p>
                          
                          <p className="text-sm text-gray-500">
                            Submitted: {new Date(approval.submittedAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="mt-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">Documents:</p>
                          <div className="flex gap-2">
                            {approval.documents.map((doc, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {doc.type}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApproval(approval);
                            setShowEditRequest(true);
                          }}
                        >
                          <Icon name="Edit" className="mr-1" size={16} />
                          Request Edit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleFinalApproval(approval.id)}
                        >
                          <Icon name="Check" className="mr-1" size={16} />
                          Final Approve
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
