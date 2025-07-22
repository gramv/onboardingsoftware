import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';

interface JobApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: any;
  experience?: string;
  education?: string;
  additionalInfo?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  appliedAt: string;
  jobPosting: {
    title: string;
    department: string;
    position: string;
    organization: {
      name: string;
    };
  };
}

export const JobApplicationReview: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    jobDescription: '',
    payRate: '',
    benefits: '',
    startDate: '',
    notes: ''
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/jobs/applications', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setApplications(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
      showToast('Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/jobs/applications/${selectedApplication.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(approvalData)
      });

      if (response.ok) {
        showToast('Application approved and onboarding email sent', 'success');
        setShowApprovalModal(false);
        setSelectedApplication(null);
        fetchApplications();
      } else {
        const error = await response.json();
        showToast(error.error || 'Failed to approve application', 'error');
      }
    } catch (error) {
      console.error('Error approving application:', error);
      showToast('Failed to approve application', 'error');
    }
  };

  const handleReject = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/jobs/applications/${applicationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          reason: 'Position filled or qualifications not met'
        })
      });

      if (response.ok) {
        showToast('Application rejected and notification sent', 'success');
        fetchApplications();
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
      showToast('Failed to reject application', 'error');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "error" | "warning" | "default"> = {
      pending: 'warning',
      reviewed: 'default',
      approved: 'success',
      rejected: 'error'
    };
    return <Badge variant={variants[status] || 'default'}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon name="Loader" size={32} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Applications Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {applications.length === 0 ? (
              <div className="text-center py-8">
                <Icon name="Inbox" size={48} className="mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600">No applications to review</p>
              </div>
            ) : (
              applications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">
                        {application.firstName} {application.lastName}
                      </h3>
                      <p className="text-gray-600">{application.email}</p>
                      <p className="text-sm text-gray-500">
                        Applied for: {application.jobPosting.title} ({application.jobPosting.department})
                      </p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(application.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(application.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {application.experience && (
                    <div className="mb-3">
                      <h4 className="font-medium text-sm text-gray-700">Experience:</h4>
                      <p className="text-sm text-gray-600">{application.experience}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    {application.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(application);
                            setShowApprovalModal(true);
                          }}
                        >
                          <Icon name="Check" size={14} className="mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(application.id)}
                        >
                          <Icon name="X" size={14} className="mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {showApprovalModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Approve Application</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Job Description</label>
                  <textarea
                    value={approvalData.jobDescription}
                    onChange={(e) => setApprovalData({...approvalData, jobDescription: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={3}
                    placeholder="Brief job description for email..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Pay Rate</label>
                  <input
                    type="text"
                    value={approvalData.payRate}
                    onChange={(e) => setApprovalData({...approvalData, payRate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    placeholder="$15.00/hour"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Benefits</label>
                  <textarea
                    value={approvalData.benefits}
                    onChange={(e) => setApprovalData({...approvalData, benefits: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                    rows={2}
                    placeholder="Health insurance, PTO, etc..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={approvalData.startDate}
                    onChange={(e) => setApprovalData({...approvalData, startDate: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleApprove} className="flex-1">
                    Send Approval & Onboarding Email
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowApprovalModal(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
