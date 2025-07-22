import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useToast } from '../../hooks/useToast';

interface OnboardingSession {
  id: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
  };
  status: string;
  currentStep: string;
  formData: any;
  submittedAt?: string;
  reviewedAt?: string;
}

interface EditRequest {
  section: string;
  field: string;
  currentValue: string;
  requestedChange: string;
  reason: string;
}

export const OnboardingEditRequests: React.FC = () => {
  const { showToast } = useToast();
  const [sessions, setSessions] = useState<OnboardingSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<OnboardingSession | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingSessions();
  }, []);

  const fetchPendingSessions = async () => {
    try {
      const response = await fetch('/api/onboarding/pending-review', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setSessions(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/onboarding/${sessionId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        showToast('Onboarding session approved', 'success');
        fetchPendingSessions();
      }
    } catch (error) {
      console.error('Error approving session:', error);
      showToast('Failed to approve session', 'error');
    }
  };

  const handleRequestEdits = async () => {
    if (!selectedSession || editRequests.length === 0) return;

    try {
      const response = await fetch(`/api/onboarding/${selectedSession.id}/request-changes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          editRequests,
          managerEmail: selectedSession.employee.email
        })
      });

      if (response.ok) {
        showToast('Edit requests sent to employee and manager', 'success');
        setShowEditModal(false);
        setEditRequests([]);
        setSelectedSession(null);
        fetchPendingSessions();
      }
    } catch (error) {
      console.error('Error requesting edits:', error);
      showToast('Failed to send edit requests', 'error');
    }
  };

  const addEditRequest = () => {
    setEditRequests([...editRequests, {
      section: '',
      field: '',
      currentValue: '',
      requestedChange: '',
      reason: ''
    }]);
  };

  const updateEditRequest = (index: number, field: string, value: string) => {
    const updated = [...editRequests];
    updated[index] = { ...updated[index], [field]: value };
    setEditRequests(updated);
  };

  const removeEditRequest = (index: number) => {
    setEditRequests(editRequests.filter((_, i) => i !== index));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "success" | "error" | "warning" | "default"> = {
      'manager_approved': 'warning',
      'submitted': 'default',
      'approved': 'success',
      'requires_changes': 'error'
    };
    return <Badge variant={variants[status] || 'default'}>{status.replace('_', ' ')}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>HR Final Review - Onboarding Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">
                      {session.employee.firstName} {session.employee.lastName}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {session.employee.position} - {session.employee.department}
                    </p>
                    <p className="text-xs text-gray-500">{session.employee.email}</p>
                  </div>
                  <div className="text-right">
                    {getStatusBadge(session.status)}
                    <p className="text-xs text-gray-500 mt-1">
                      Step: {session.currentStep}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleApproveSession(session.id)}
                  >
                    <Icon name="Check" size={14} className="mr-1" />
                    Final Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSession(session);
                      setShowEditModal(true);
                    }}
                  >
                    <Icon name="Edit" size={14} className="mr-1" />
                    Request Edits
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {showEditModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Request Edits - {selectedSession.employee.firstName} {selectedSession.employee.lastName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {editRequests.map((request, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Section</label>
                        <select
                          value={request.section}
                          onChange={(e) => updateEditRequest(index, 'section', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                        >
                          <option value="">Select Section</option>
                          <option value="personal_info">Personal Information</option>
                          <option value="i9_form">I-9 Form</option>
                          <option value="w4_form">W-4 Form</option>
                          <option value="handbook">Handbook Acknowledgment</option>
                          <option value="documents">Document Upload</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Field</label>
                        <input
                          type="text"
                          value={request.field}
                          onChange={(e) => updateEditRequest(index, 'field', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md"
                          placeholder="Field name"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium mb-1">Reason for Change</label>
                      <textarea
                        value={request.reason}
                        onChange={(e) => updateEditRequest(index, 'reason', e.target.value)}
                        className="w-full px-3 py-2 border rounded-md"
                        rows={2}
                        placeholder="Explain why this change is needed..."
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => removeEditRequest(index)}
                      >
                        <Icon name="X" size={14} />
                      </Button>
                    </div>
                  </div>
                ))}

                <Button variant="outline" onClick={addEditRequest} className="w-full">
                  <Icon name="Plus" size={16} className="mr-2" />
                  Add Edit Request
                </Button>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleRequestEdits} className="flex-1">
                    Send Edit Requests
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditRequests([]);
                      setSelectedSession(null);
                    }}
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
