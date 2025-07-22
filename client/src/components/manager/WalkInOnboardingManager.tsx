import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader } from '../ui/Card';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { useAuthStore } from '../../stores/authStore';
import { useToast } from '../../hooks/useToast';
import { onboardingService } from '../../services/onboardingService';
import QRCode from 'react-qr-code';

interface WalkInFormData {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hourlyRate?: number;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'temporary';
}

interface ActiveSession {
  id: string;
  token: string;
  employee: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
  };
  candidate: {
    firstName: string;
    lastName: string;
    email: string;
    position: string;
    department: string;
    hourlyRate: number;
    hireDate: string;
    employmentType: string;
  };
  expiresAt: string;
  createdAt: string;
}

const WalkInOnboardingManager: React.FC = () => {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  
  const [formData, setFormData] = useState<WalkInFormData>({
    firstName: '',
    lastName: '',
    email: '',
    position: '',
    department: '',
    hourlyRate: undefined,
    employmentType: 'full_time'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingCreated, setOnboardingCreated] = useState(false);
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showActiveSessions, setShowActiveSessions] = useState(false);
  const [showQRCode, setShowQRCode] = useState<string | null>(null);
  const [sendEmail, setSendEmail] = useState(true); // Default to true - most people want email
  
  // Load active sessions on component mount
  useEffect(() => {
    loadActiveSessions();
  }, []);
  
  const loadActiveSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const response = await onboardingService.getActiveWalkInSessions();
      setActiveSessions(response.data || []);
    } catch (error) {
      console.error('Error loading active sessions:', error);
      showToast('Failed to load active sessions', 'error');
    } finally {
      setIsLoadingSessions(false);
    }
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (formData.hourlyRate === undefined || formData.hourlyRate <= 0) {
      newErrors.hourlyRate = 'Hourly rate must be greater than 0';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await onboardingService.createWalkInOnboarding({
        ...formData,
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate.toString()) : 0,
        organizationId: user?.organizationId || ''
      });
      
      setOnboardingCreated(true);
      setOnboardingData(response.data.data || response.data);
      showToast('Walk-in onboarding created successfully', 'success');
      
      // Refresh active sessions
      loadActiveSessions();
    } catch (error) {
      console.error('Error creating walk-in onboarding:', error);
      showToast('Failed to create walk-in onboarding', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReset = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      position: '',
      department: '',
      hourlyRate: undefined,
      employmentType: 'full_time'
    });
    setErrors({});
    setOnboardingCreated(false);
    setOnboardingData(null);
    setSendEmail(true); // Reset to default (send email)
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Walk-In Onboarding</h1>
        <div className="flex gap-2">
          <Button 
            variant={showActiveSessions ? 'default' : 'outline'}
            onClick={() => setShowActiveSessions(!showActiveSessions)}
          >
            <Icon name="List" className="mr-2" />
            {activeSessions.length > 0 ? `Active Sessions (${activeSessions.length})` : 'Active Sessions'}
          </Button>
          {showActiveSessions && (
            <Button 
              variant="outline"
              onClick={() => setShowActiveSessions(false)}
            >
              <Icon name="Plus" className="mr-2" />
              New Onboarding
            </Button>
          )}
        </div>
      </div>
      
      {showActiveSessions ? (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Active Walk-In Onboarding Sessions</h2>
            <p className="text-gray-600">
              These sessions were created in the last 24 hours and are still active
            </p>
          </CardHeader>
          
          <CardContent>
            {isLoadingSessions ? (
              <div className="flex justify-center py-8">
                <Icon name="Loader" className="animate-spin h-8 w-8 text-primary-500" />
              </div>
            ) : activeSessions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Icon name="Info" className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No active walk-in onboarding sessions found</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowActiveSessions(false)}
                >
                  Create New Session
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessions.map((session) => (
                  <Card key={session.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {session.candidate.firstName} {session.candidate.lastName}
                          </h3>
                          <p className="text-gray-600">{session.candidate.position}</p>
                          <p className="text-gray-500 text-sm">{session.candidate.email}</p>
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              Created: {formatDate(session.createdAt)}
                            </span>
                          </div>
                          <div className="mt-2">
                            <span className="text-xs text-gray-500">
                              Expires: {formatDate(session.expiresAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 p-3 flex justify-between">
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/onboarding?token=${session.token}`);
                            showToast('Onboarding URL copied to clipboard', 'success');
                          }}
                        >
                          <Icon name="Copy" className="mr-2" size={16} />
                          Copy URL
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setShowQRCode(session.token)}
                        >
                          <Icon name="QrCode" className="mr-2" size={16} />
                          Show QR
                        </Button>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => {
                          window.open(`/tablet-onboarding?token=${session.token}`, '_blank');
                        }}
                      >
                        <Icon name="ExternalLink" className="mr-2" size={16} />
                        Open Tablet View
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="bg-gray-50 flex justify-between">
            <Button 
              variant="outline"
              onClick={loadActiveSessions}
              disabled={isLoadingSessions}
            >
              <Icon name="RefreshCw" className={`mr-2 ${isLoadingSessions ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              onClick={() => setShowActiveSessions(false)}
            >
              <Icon name="Plus" className="mr-2" />
              Create New Session
            </Button>
          </CardFooter>
        </Card>
      ) : onboardingCreated ? (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Onboarding Created</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
              >
                <Icon name="Plus" className="mr-2" />
                Create Another
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icon name="CheckCircle" className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">
                    Walk-in onboarding session created successfully for {onboardingData?.candidate?.firstName} {onboardingData?.candidate?.lastName}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-4">Employee Details</h3>
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 font-medium">
                      {onboardingData?.candidate?.firstName} {onboardingData?.candidate?.lastName}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{onboardingData?.candidate?.email}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Position</dt>
                    <dd className="mt-1 text-sm text-gray-900">{onboardingData?.candidate?.position}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Department</dt>
                    <dd className="mt-1 text-sm text-gray-900">{onboardingData?.candidate?.department}</dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Hourly Rate</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      ${(onboardingData?.candidate?.hourlyRate || 0).toFixed(2)}
                    </dd>
                  </div>
                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Hire Date</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(onboardingData?.candidate?.hireDate || Date.now()).toLocaleDateString()}
                    </dd>
                  </div>

                  <div className="sm:col-span-1">
                    <dt className="text-sm font-medium text-gray-500">Employment Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">
                      {onboardingData?.candidate?.employmentType?.replace('_', ' ') || 'Full Time'}
                    </dd>
                  </div>
                </dl>
              </div>
              
            </div>
            
            <div className="bg-green-50 border-l-4 border-green-500 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Icon name="CheckCircle" className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <div className="text-sm text-green-700">
                    <p className="font-medium">Onboarding Ready!</p>
                    <p className="mt-1">
                      The candidate has been sent an email with their onboarding link. 
                      You can also share the link using the buttons below or show them the QR code.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => setShowActiveSessions(true)}
            >
              <Icon name="List" className="mr-2" />
              View Active Sessions
            </Button>
            
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const url = `${window.location.origin}${onboardingData?.onboardingUrl || `/onboarding?token=${onboardingData?.session?.token}`}`;
                  navigator.clipboard.writeText(url);
                  showToast('Onboarding URL copied to clipboard', 'success');
                }}
              >
                <Icon name="Copy" className="mr-2" />
                Copy URL
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowQRCode(onboardingData?.session?.token)}
              >
                <Icon name="QrCode" className="mr-2" />
                Show QR
              </Button>
            </div>
            
            <Button
              variant="outline"
              onClick={() => {
                const url = `${window.location.origin}${onboardingData?.onboardingUrl || `/onboarding?token=${onboardingData?.session?.token}`}`;
                window.open(url, '_blank');
              }}
            >
              <Icon name="ExternalLink" className="mr-2" />
              Open URL
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Create Walk-In Onboarding</h2>
            <p className="text-gray-600">
              Enter the candidate's information to start the walk-in onboarding process
            </p>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={errors.firstName ? 'border-red-500' : ''}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={errors.lastName ? 'border-red-500' : ''}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email *
                  </label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={errors.email ? 'border-red-500' : ''}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700">
                    Position *
                  </label>
                  <Input
                    id="position"
                    name="position"
                    value={formData.position}
                    onChange={handleChange}
                    className={errors.position ? 'border-red-500' : ''}
                  />
                  {errors.position && (
                    <p className="text-red-500 text-sm mt-1">{errors.position}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                    Department *
                  </label>
                  <Input
                    id="department"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className={errors.department ? 'border-red-500' : ''}
                  />
                  {errors.department && (
                    <p className="text-red-500 text-sm mt-1">{errors.department}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                    Hourly Rate *
                  </label>
                  <Input
                    id="hourlyRate"
                    name="hourlyRate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.hourlyRate || ''}
                    onChange={handleChange}
                    className={errors.hourlyRate ? 'border-red-500' : ''}
                  />
                  {errors.hourlyRate && (
                    <p className="text-red-500 text-sm mt-1">{errors.hourlyRate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="employmentType" className="block text-sm font-medium text-gray-700">
                    Employment Type *
                  </label>
                  <select
                    id="employmentType"
                    name="employmentType"
                    value={formData.employmentType}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="temporary">Temporary</option>
                  </select>
                </div>
              </div>
              
              {/* Email notification option */}
              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send onboarding email to candidate
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  The candidate will receive an email with the onboarding link for easy access
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowActiveSessions(true)}
              >
                <Icon name="List" className="mr-2" />
                View Active Sessions
              </Button>
              
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader" className="animate-spin mr-2" />
                    Creating...
                  </>
                ) : 'Create Onboarding'}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}
      
      {/* QR Code Modal */}
      {showQRCode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md w-full mx-4">
            <CardHeader className="text-center">
              <h3 className="text-lg font-semibold">Onboarding QR Code</h3>
              <p className="text-gray-600 text-sm">
                Scan this QR code to access the onboarding link
              </p>
            </CardHeader>
            
            <CardContent className="flex flex-col items-center space-y-4">
              <div className="bg-white p-4 rounded-lg border">
                <QRCode
                  value={`${window.location.origin}/onboarding?token=${showQRCode}`}
                  size={200}
                  level="M"
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">
                  Have the candidate scan this code with their phone camera or QR code app
                </p>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/onboarding?token=${showQRCode}`);
                  showToast('Onboarding link copied to clipboard', 'success');
                }}
              >
                <Icon name="Copy" className="mr-2" size={16} />
                Copy Link
              </Button>
              
              <Button
                onClick={() => setShowQRCode(null)}
              >
                Close
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
};

export default WalkInOnboardingManager;