import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Input } from '../ui/Input';
import { AITextEnhancer } from '../ui/AITextEnhancer';
import { apiClient } from '../../services/apiClient';
import { useToast } from '../../hooks/useToast';
import { ToastContainer } from '../ui/Toast';


interface JobPosting {
  id: string;
  title: string;
  description: string;
  department: string;
  position: string;
  salaryRange: string;
  requirements: string;
  benefits: string;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
  organizationName: string;
  applicationCount: number;
}

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
  };
}

interface JobFormData {
  title: string;
  description: string;
  department: string;
  position: string;
  salaryRange: string;
  requirements: string;
  benefits: string;
  expiresAt: string;
  isActive?: boolean;
}

export const JobManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | null>(null);
  const [showJobForm, setShowJobForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [loading, setLoading] = useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    description: '',
    department: '',
    position: '',
    salaryRange: '',
    requirements: '',
    benefits: '',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
  });

  // Fetch jobs
  useEffect(() => {
    if (activeTab === 'jobs') {
      fetchJobs();
    } else {
      fetchApplications();
    }
  }, [activeTab]);

  const fetchJobs = async () => {
    setLoading(true);
                try {
        const response = await apiClient.get('/jobs/manage/all');
        if (response.success) {
          setJobs(response.data || []);
        } else {
          console.error('Failed to fetch jobs:', response.error);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching applications...');
      const response = await apiClient.get('/jobs/applications');
      console.log('📥 Applications response:', response);
      
      if (response.success) {
        console.log('✅ Applications data:', response.data);
        setApplications(response.data || []);
      } else {
        console.error('❌ Failed to fetch applications:', response.error);
        showToast('Failed to fetch applications: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('💥 Error fetching applications:', error);
      showToast('Error fetching applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      department: '',
      position: '',
      salaryRange: '',
      requirements: '',
      benefits: '',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });
    setEditingJob(null);
    setShowJobForm(false);
  };

  const handleCreateJob = async () => {
    setLoading(true);
    try {
      console.log('📝 Form data being sent:', formData);
      
      // Validate required fields on frontend first
      if (!formData.title.trim()) {
        showToast('Job title is required', 'error');
        return;
      }
      if (!formData.description.trim() || formData.description.length < 10) {
        showToast('Job description must be at least 10 characters', 'error');
        return;
      }
      if (!formData.department.trim()) {
        showToast('Department is required', 'error');
        return;
      }
      if (!formData.position.trim()) {
        showToast('Position is required', 'error');
        return;
      }
      if (!formData.salaryRange.trim()) {
        showToast('Salary range is required', 'error');
        return;
      }
      if (!formData.requirements.trim() || formData.requirements.length < 10) {
        showToast('Requirements must be at least 10 characters', 'error');
        return;
      }
      if (!formData.benefits.trim()) {
        showToast('Benefits are required', 'error');
        return;
      }
      
      // Add isActive field to the data
      const jobData = {
        ...formData,
        isActive: true
      };
      
      console.log('📤 Sending job data:', jobData);
      const response = await apiClient.post('/jobs', jobData);
        
        if (response.success) {
          await fetchJobs();
          resetForm();
          showToast('Job posting created successfully!', 'success');
        } else {
          console.error('❌ Backend error:', response.error);
          showToast(response.error || 'Failed to create job posting', 'error');
        }
    } catch (error) {
      console.error('Error creating job:', error);
      showToast('Failed to create job posting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateJob = async () => {
    if (!editingJob) return;

    setLoading(true);
    try {
      const response = await apiClient.put(`/jobs/${editingJob.id}`, formData);
        
      if (response.success) {
        await fetchJobs();
        resetForm();
        showToast('Job posting updated successfully!', 'success');
      } else {
        showToast(response.error || 'Failed to update job posting', 'error');
      }
    } catch (error) {
      console.error('Error updating job:', error);
      showToast('Failed to update job posting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) return;

    setLoading(true);
    try {
      const response = await apiClient.delete(`/jobs/${jobId}`);
        
      if (response.success) {
        await fetchJobs();
        showToast('Job posting deleted successfully!', 'success');
      } else {
        showToast(response.error || 'Failed to delete job posting', 'error');
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      showToast('Failed to delete job posting', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (!window.confirm(`Are you sure you want to ${action} this job posting?`)) return;

    setLoading(true);
    try {
      const response = await apiClient.put(`/jobs/${jobId}`, {
        isActive: !currentStatus
      });
        
      if (response.success) {
        await fetchJobs();
        showToast(`Job posting ${action}d successfully!`, 'success');
      } else {
        showToast(response.error || `Failed to ${action} job posting`, 'error');
      }
    } catch (error) {
      console.error(`Error ${action}ing job:`, error);
      showToast(`Failed to ${action} job posting`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateApplicationStatus = async (applicationId: string, status: string) => {
    setLoading(true);
    try {
                     const response = await apiClient.put(`/jobs/applications/${applicationId}/status`, { status });
        
        if (response.success) {
          await fetchApplications();
          showToast(`Application ${status} successfully!`, 'success');
        } else {
          showToast(response.error || 'Failed to update application status', 'error');
        }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Failed to update application status');
    } finally {
      setLoading(false);
    }
  };

  const handleEditJob = (job: JobPosting) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      description: job.description,
      department: job.department,
      position: job.position,
      salaryRange: job.salaryRange,
      requirements: job.requirements,
      benefits: job.benefits,
      expiresAt: new Date(job.expiresAt).toISOString().split('T')[0],
    });
    setShowJobForm(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'reviewed': return 'secondary';
      case 'approved': return 'success';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const departments = ['Front Office', 'Housekeeping', 'Maintenance', 'Security', 'Management'];
  const positions = ['Associate', 'Team Member', 'Supervisor', 'Lead', 'Coordinator', 'Manager', 'Technician'];

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">

      {/* Header and Tabs */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
                             <Icon name="FileText" size={20} className="mr-2" />
              Job Management
            </CardTitle>
            {activeTab === 'jobs' && (
              <Button onClick={() => setShowJobForm(true)}>
                <Icon name="Plus" size={16} className="mr-2" />
                Create Job Posting
              </Button>
            )}
          </div>
          <div className="flex space-x-4 mt-4">
            <Button
              variant={activeTab === 'jobs' ? 'default' : 'outline'}
              onClick={() => setActiveTab('jobs')}
            >
              Job Postings ({jobs.length})
            </Button>
            <Button
              variant={activeTab === 'applications' ? 'default' : 'outline'}
              onClick={() => setActiveTab('applications')}
            >
              Applications ({applications.length})
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Job Creation/Edit Form */}
      {showJobForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingJob ? 'Edit Job Posting' : 'Create New Job Posting'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Job Title *"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
              />
              
              <select
                value={formData.department}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                required
              >
                <option value="">Select Department *</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={formData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                required
              >
                <option value="">Select Position *</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>{pos}</option>
                ))}
              </select>

              <Input
                placeholder="Salary Range (e.g., $15-18/hour) *"
                value={formData.salaryRange}
                onChange={(e) => handleInputChange('salaryRange', e.target.value)}
                required
              />

              <div className="md:col-span-2">
                <AITextEnhancer
                  value={formData.description}
                  onChange={(value) => handleInputChange('description', value)}
                  placeholder="Describe the job role, responsibilities, and what makes it attractive..."
                  enhancementType="job-description"
                  label="Job Description *"
                  rows={4}
                  context={{
                    title: formData.title,
                    department: formData.department,
                    position: formData.position,
                    salaryRange: formData.salaryRange,
                  }}
                  onEnhancementComplete={(original, enhanced) => {
                    console.log('Job description enhanced:', { original: original.length, enhanced: enhanced.length });
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <AITextEnhancer
                  value={formData.requirements}
                  onChange={(value) => handleInputChange('requirements', value)}
                  placeholder="List the requirements, qualifications, and skills needed..."
                  enhancementType="requirements"
                  label="Requirements *"
                  rows={4}
                  context={{
                    title: formData.title,
                    department: formData.department,
                    position: formData.position,
                    salaryRange: formData.salaryRange,
                  }}
                  onEnhancementComplete={(original, enhanced) => {
                    console.log('Requirements enhanced:', { original: original.length, enhanced: enhanced.length });
                  }}
                />
              </div>

              <div className="md:col-span-2">
                <AITextEnhancer
                  value={formData.benefits}
                  onChange={(value) => handleInputChange('benefits', value)}
                  placeholder="List the benefits, perks, and what's great about working here..."
                  enhancementType="benefits"
                  label="Benefits *"
                  rows={3}
                  context={{
                    title: formData.title,
                    department: formData.department,
                    position: formData.position,
                    salaryRange: formData.salaryRange,
                  }}
                  onEnhancementComplete={(original, enhanced) => {
                    console.log('Benefits enhanced:', { original: original.length, enhanced: enhanced.length });
                  }}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expires On *
                </label>
                <Input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={editingJob ? handleUpdateJob : handleCreateJob}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                    {editingJob ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Icon name={editingJob ? "Save" : "Plus"} size={16} className="mr-2" />
                    {editingJob ? 'Update Job' : 'Create Job'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jobs Tab */}
      {activeTab === 'jobs' && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading job postings...</p>
              </CardContent>
            </Card>
          ) : jobs.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon name="Plus" size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Job Postings</h3>
                <p className="text-gray-600 mb-4">
                  Create your first job posting to start attracting candidates
                </p>
                <Button onClick={() => setShowJobForm(true)}>
                  <Icon name="Plus" size={16} className="mr-2" />
                  Create Job Posting
                </Button>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {job.title}
                      </h3>
                      <p className="text-gray-600">
                        {job.department} • {job.position} • {job.salaryRange}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={job.isActive ? 'success' : 'secondary'}>
                        {job.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {job.applicationCount} applications
                      </Badge>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Created {new Date(job.createdAt).toLocaleDateString()}</span>
                    <span>Expires {new Date(job.expiresAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => handleEditJob(job)}>
                      <Icon name="Edit" size={16} className="mr-1" />
                      Edit
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleToggleJobStatus(job.id, job.isActive)}
                      className={job.isActive ? 'text-orange-600 border-orange-600 hover:bg-orange-50' : 'text-green-600 border-green-600 hover:bg-green-50'}
                    >
                      <Icon name={job.isActive ? "X" : "Eye"} size={16} className="mr-1" />
                      {job.isActive ? 'Take Offline' : 'Put Online'}
                    </Button>
                    
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleDeleteJob(job.id)}
                      className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                      <Icon name="X" size={16} className="mr-1" />
                      Delete
                    </Button>
                    
                    <Button size="sm" variant="outline">
                      <Icon name="Eye" size={16} className="mr-1" />
                      View Public
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Applications Tab */}
      {activeTab === 'applications' && (
        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading applications...</p>
              </CardContent>
            </Card>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Icon name="Users" size={48} className="mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Applications Yet</h3>
                <p className="text-gray-600">
                  Applications will appear here once people start applying to your job postings
                </p>
              </CardContent>
            </Card>
          ) : (
            applications.map((application) => (
              <Card key={application.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-1">
                        {application.firstName} {application.lastName}
                      </h3>
                      <p className="text-gray-600">
                        Applied for {application.jobPosting.title} • {application.jobPosting.department}
                      </p>
                      <p className="text-gray-500 text-sm">
                        {application.email} • {application.phone}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={getStatusColor(application.status) as any}>
                        {application.status}
                      </Badge>
                    </div>
                  </div>

                  {application.experience && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1">Experience</h4>
                      <p className="text-gray-700 text-sm">{application.experience}</p>
                    </div>
                  )}

                  {application.education && (
                    <div className="mb-3">
                      <h4 className="font-medium text-gray-900 mb-1">Education</h4>
                      <p className="text-gray-700 text-sm">{application.education}</p>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <span>Applied {new Date(application.appliedAt).toLocaleDateString()}</span>
                  </div>

                  {application.status === 'pending' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateApplicationStatus(application.id, 'reviewed')}
                      >
                        <Icon name="Eye" size={16} className="mr-1" />
                        Mark Reviewed
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleUpdateApplicationStatus(application.id, 'approved')}
                      >
                        <Icon name="Check" size={16} className="mr-1" />
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleUpdateApplicationStatus(application.id, 'rejected')}
                      >
                        <Icon name="X" size={16} className="mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
    </>
  );
}; 