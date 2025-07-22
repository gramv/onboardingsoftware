import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { useAuthStore } from '../../stores/authStore';
import { JobOfferForm } from './JobOfferForm';

interface JobApplication {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  appliedAt: string;
  experience?: string;
  education?: string;
  jobPosting: {
    title: string;
    department: string;
    position: string;
  };
}

export const JobApplicationReview: React.FC = () => {
  const { user } = useAuthStore();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showOfferForm, setShowOfferForm] = useState(false);

  const departments = ['Housekeeping', 'Front Desk', 'Maintenance', 'Food Service', 'Management'];

  useEffect(() => {
    fetchApplications();
  }, [selectedDepartment]);

  const fetchApplications = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedDepartment !== 'all') {
        params.append('department', selectedDepartment);
      }
      params.append('status', 'pending');

      const response = await fetch(`/api/jobs/applications?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = (application: JobApplication) => {
    setSelectedApplication(application);
    setShowOfferForm(true);
  };

  const handleOfferSubmit = async (offerDetails: any) => {
    if (!selectedApplication) return;

    try {
      const response = await fetch(`/api/jobs/applications/${selectedApplication.id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          status: 'approved',
          offerDetails
        })
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== selectedApplication.id));
        setShowOfferForm(false);
        setSelectedApplication(null);
      }
    } catch (error) {
      console.error('Error approving application:', error);
    }
  };

  const handleRejection = async (applicationId: string) => {
    try {
      const response = await fetch(`/api/jobs/applications/${applicationId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ status: 'rejected' })
      });

      if (response.ok) {
        setApplications(prev => prev.filter(app => app.id !== applicationId));
      }
    } catch (error) {
      console.error('Error rejecting application:', error);
    }
  };

  if (showOfferForm && selectedApplication) {
    return (
      <JobOfferForm
        application={selectedApplication}
        onSubmit={handleOfferSubmit}
        onCancel={() => {
          setShowOfferForm(false);
          setSelectedApplication(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Job Applications by Department</CardTitle>
          <div className="flex gap-2">
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Icon name="Loader" className="animate-spin h-8 w-8" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Icon name="Users" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No pending applications found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => (
                <Card key={application.id} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {application.firstName} {application.lastName}
                        </h3>
                        <p className="text-gray-600">{application.jobPosting.title}</p>
                        <p className="text-gray-500 text-sm">{application.email}</p>
                        <p className="text-gray-500 text-sm">{application.phone}</p>
                        
                        <div className="mt-2">
                          <Badge variant="outline">
                            {application.jobPosting.department}
                          </Badge>
                          <span className="ml-2 text-xs text-gray-500">
                            Applied: {new Date(application.appliedAt).toLocaleDateString()}
                          </span>
                        </div>

                        {application.experience && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-gray-700">Experience:</p>
                            <p className="text-sm text-gray-600 line-clamp-2">{application.experience}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRejection(application.id)}
                        >
                          <Icon name="X" className="mr-1" size={16} />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleApproval(application)}
                        >
                          <Icon name="Check" className="mr-1" size={16} />
                          Approve
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
