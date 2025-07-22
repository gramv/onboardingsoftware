import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';

interface JobPosting {
  id: string;
  title: string;
  description: string;
  department: string;
  position: string;
  salaryRange: string;
  requirements: string;
  benefits: string;
  organizationName: string;
  createdAt: string;
  expiresAt: string;
  applicationCount: number;
}

interface JobApplication {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  resumeText?: string;
  experience?: string;
  education?: string;
  additionalInfo?: string;
}

export const PublicJobPortal: React.FC = () => {
  const [searchParams] = useSearchParams();
  const organizationId = searchParams.get('org'); // Get organization ID from URL
  const departmentFilter = searchParams.get('dept'); // Get department filter from QR code
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobPosting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState(departmentFilter || 'all');
  const [organizationName, setOrganizationName] = useState('');
  
  // Application form state
  const [applicationData, setApplicationData] = useState<JobApplication>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    resumeText: '',
    experience: '',
    education: '',
    additionalInfo: '',
  });
  
  const [applicationLoading, setApplicationLoading] = useState(false);
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  // Fetch jobs
  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    if (departmentFilter && departmentFilter !== selectedDepartment) {
      setSelectedDepartment(departmentFilter);
    }
  }, [departmentFilter]);

  // Filter jobs when search or department changes
  useEffect(() => {
    filterJobs();
  }, [jobs, searchTerm, selectedDepartment]);

  const fetchJobs = async () => {
    try {
      // Build URL with organization filter if provided
      const url = organizationId 
        ? `/api/jobs?organizationId=${organizationId}`
        : '/api/jobs';
      
      const response = await fetch(`${url}`);
      if (response.ok) {
        const result = await response.json();
        const jobsData = result.data || [];
        setJobs(jobsData);
        
        // Set organization name from first job if available
        if (jobsData.length > 0 && organizationId) {
          setOrganizationName(jobsData[0].organizationName);
        }
      } else {
        console.error('Failed to fetch jobs');
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterJobs = () => {
    let filtered = [...jobs];

    if (searchTerm) {
      filtered = filtered.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.requirements.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(job => job.department === selectedDepartment);
    }

    setFilteredJobs(filtered);
  };

  const handleJobClick = (job: JobPosting) => {
    setSelectedJob(job);
    setShowApplicationForm(false);
    setApplicationSubmitted(false);
  };

  const handleApplyClick = () => {
    setShowApplicationForm(true);
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.startsWith('address.')) {
      const addressField = field.split('.')[1];
      setApplicationData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setApplicationData(prev => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const submitApplication = async () => {
    if (!selectedJob) return;

    setApplicationLoading(true);
    try {
      const response = await fetch(`/api/jobs/${selectedJob.id}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(applicationData),
      });

      if (response.ok) {
        setApplicationSubmitted(true);
        setShowApplicationForm(false);
        // Reset form
        setApplicationData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          address: {
            street: '',
            city: '',
            state: '',
            zipCode: '',
          },
          resumeText: '',
          experience: '',
          education: '',
          additionalInfo: '',
        });
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      alert('Failed to submit application');
    } finally {
      setApplicationLoading(false);
    }
  };

  // Get unique departments for filter
  const departments = [...new Set(jobs.map(job => job.department))];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader" size={48} className="animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading job opportunities...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {organizationName ? `Join ${organizationName}` : 'Join Our Team'}
            </h1>
            <p className="text-lg text-gray-600">
              {organizationName 
                ? `Explore available positions at ${organizationName}`
                : 'Discover exciting career opportunities in hospitality'
              }
            </p>
            {organizationName && (
              <div className="mt-4">
                <Badge variant="outline" className="text-lg px-4 py-2">
                  <Icon name="MapPin" size={16} className="mr-2" />
                  {organizationName}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Jobs List */}
          <div className="lg:col-span-2">
            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <Input
                    placeholder="Search jobs by title, description, or requirements..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 min-w-[150px]"
                  >
                    <option value="all">All Departments</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Jobs Grid */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Icon name="Search" size={48} className="mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
                    <p className="text-gray-600">
                      {searchTerm || selectedDepartment !== 'all'
                        ? 'Try adjusting your search criteria'
                        : 'No job postings are currently available'
                      }
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card
                    key={job.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedJob?.id === job.id ? 'ring-2 ring-blue-500 shadow-lg' : ''
                    }`}
                    onClick={() => handleJobClick(job)}
                  >
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900 mb-1">
                            {job.title}
                          </h3>
                          <p className="text-gray-600">
                            {job.organizationName} • {job.department}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {job.applicationCount} applicants
                        </Badge>
                      </div>
                      
                      <p className="text-gray-700 mb-4 line-clamp-3">
                        {job.description}
                      </p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="outline">{job.position}</Badge>
                        <Badge variant="outline">{job.salaryRange}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
                        <span>Expires {new Date(job.expiresAt).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Job Details & Application Form */}
          <div className="space-y-6">
            {selectedJob ? (
              <>
                {/* Job Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{selectedJob.title}</span>
                      {applicationSubmitted && (
                        <Badge variant="success">Application Submitted!</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Company</h4>
                        <p className="text-gray-700">{selectedJob.organizationName}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Department</h4>
                        <p className="text-gray-700">{selectedJob.department}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Position</h4>
                        <p className="text-gray-700">{selectedJob.position}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Salary Range</h4>
                        <p className="text-gray-700">{selectedJob.salaryRange}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Job Description</h4>
                        <p className="text-gray-700 whitespace-pre-line">{selectedJob.description}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Requirements</h4>
                        <p className="text-gray-700 whitespace-pre-line">{selectedJob.requirements}</p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Benefits</h4>
                        <p className="text-gray-700 whitespace-pre-line">{selectedJob.benefits}</p>
                      </div>
                    </div>
                    
                    {!applicationSubmitted && (
                      <Button
                        onClick={handleApplyClick}
                        className="w-full mt-6"
                        size="lg"
                      >
                        <Icon name="Send" size={20} className="mr-2" />
                        Apply for This Position
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Application Form */}
                {showApplicationForm && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Job Application</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Personal Information */}
                        <div className="grid grid-cols-2 gap-4">
                          <Input
                            placeholder="First Name *"
                            value={applicationData.firstName}
                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                            required
                          />
                          <Input
                            placeholder="Last Name *"
                            value={applicationData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            required
                          />
                        </div>
                        
                        <Input
                          type="email"
                          placeholder="Email Address *"
                          value={applicationData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          required
                        />
                        
                        <Input
                          type="tel"
                          placeholder="Phone Number *"
                          value={applicationData.phone}
                          onChange={(e) => handleInputChange('phone', e.target.value)}
                          required
                        />
                        
                        {/* Address */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Address</h4>
                          <Input
                            placeholder="Street Address *"
                            value={applicationData.address.street}
                            onChange={(e) => handleInputChange('address.street', e.target.value)}
                            required
                          />
                          <div className="grid grid-cols-2 gap-4">
                            <Input
                              placeholder="City *"
                              value={applicationData.address.city}
                              onChange={(e) => handleInputChange('address.city', e.target.value)}
                              required
                            />
                            <Input
                              placeholder="State *"
                              value={applicationData.address.state}
                              onChange={(e) => handleInputChange('address.state', e.target.value)}
                              required
                            />
                          </div>
                          <Input
                            placeholder="ZIP Code *"
                            value={applicationData.address.zipCode}
                            onChange={(e) => handleInputChange('address.zipCode', e.target.value)}
                            required
                          />
                        </div>
                        
                        {/* Experience & Education */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Work Experience
                            </label>
                            <textarea
                              placeholder="Describe your relevant work experience..."
                              value={applicationData.experience}
                              onChange={(e) => handleInputChange('experience', e.target.value)}
                              rows={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Education
                            </label>
                            <textarea
                              placeholder="Describe your educational background..."
                              value={applicationData.education}
                              onChange={(e) => handleInputChange('education', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Additional Information
                            </label>
                            <textarea
                              placeholder="Any additional information you'd like to share..."
                              value={applicationData.additionalInfo}
                              onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        
                        {/* Submit Button */}
                        <div className="flex gap-4 pt-4">
                          <Button
                            onClick={() => setShowApplicationForm(false)}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={submitApplication}
                            disabled={applicationLoading}
                            className="flex-1"
                          >
                            {applicationLoading ? (
                              <>
                                <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Icon name="Send" size={16} className="mr-2" />
                                Submit Application
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Icon name="Eye" size={48} className="mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Job</h3>
                  <p className="text-gray-600">
                    Click on a job posting to view details and apply
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};  