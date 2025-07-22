import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

// Types for employee creation workflow
interface EmployeeCreationData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  
  // ID Verification (Manager must verify manually)
  driversLicenseNumber: string;
  driversLicenseState: string;
  driversLicenseExpiration: string;
  driversLicenseVerified: boolean;
  ssnLastFour: string;
  ssnNameMatch: boolean;
  ssnVerified: boolean;
  idVerificationNotes: string;
  
  // Employment Information
  employeeId: string;
  position: string;
  department: string;
  hourlyRate: number;
  hireDate: string;
  
  // Assignment Information
  organizationId: string;
  managerId?: string;
  
  // Emergency Contact
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  
  // Address Information
  street: string;
  city: string;
  state: string;
  zipCode: string;
  
}

interface Organization {
  id: string;
  name: string;
  type: 'corporate' | 'motel';
  parentId?: string;
  children?: Organization[];
}

interface Manager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  organizationId: string;
  organizationName: string;
}


interface ValidationErrors {
  [key: string]: string;
}

interface BulkImportResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// Wizard steps
const WIZARD_STEPS = [
  { id: 'personal', title: 'Personal Information', icon: 'User' },
  { id: 'id-verification', title: 'ID Verification', icon: 'Shield' },
  { id: 'employment', title: 'Employment Details', icon: 'Briefcase' },
  { id: 'assignment', title: 'Manager Assignment', icon: 'Users' },
  { id: 'contact', title: 'Emergency Contact', icon: 'Phone' },
  { id: 'address', title: 'Address Information', icon: 'MapPin' },
  { id: 'review', title: 'Review & Create', icon: 'CheckCircle' }
];

export const EmployeeCreationWorkflow: React.FC = () => {
  // Core state
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdEmployee, setCreatedEmployee] = useState<any>(null);
  
  // Form data
  const [formData, setFormData] = useState<EmployeeCreationData>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    employeeId: '',
    position: '',
    department: '',
    hourlyRate: 15,
    hireDate: new Date().toISOString().split('T')[0],
    organizationId: '',
    managerId: '',
    emergencyContactName: '',
    emergencyContactRelationship: '',
    emergencyContactPhone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
        driversLicenseNumber: '',
    driversLicenseState: '',
    driversLicenseExpiration: '',
    driversLicenseVerified: false,
    ssnLastFour: '',
    ssnNameMatch: false,
    ssnVerified: false,
    idVerificationNotes: ''
  });
  
  // Validation
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  
  // Data for dropdowns and selections
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [filteredManagers, setFilteredManagers] = useState<Manager[]>([]);
  
  // UI state
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportFile, setBulkImportFile] = useState<File | null>(null);
  const [bulkImportResults, setBulkImportResults] = useState<BulkImportResult | null>(null);
  const [bulkImportProgress, setBulkImportProgress] = useState(0);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock data - in a real app, this would come from APIs
  useEffect(() => {
    // Load organizations
    setOrganizations([
      { id: '1', name: 'Corporate Headquarters', type: 'corporate' },
      { id: '2', name: 'Downtown Motel', type: 'motel', parentId: '1' },
      { id: '3', name: 'Airport Motel', type: 'motel', parentId: '1' },
      { id: '4', name: 'Highway Motel', type: 'motel', parentId: '1' },
      { id: '5', name: 'Seaside Motel', type: 'motel', parentId: '1' }
    ]);
    
    // Load managers
    setManagers([
      { id: 'mgr1', firstName: 'John', lastName: 'Smith', email: 'john.smith@motel.com', position: 'General Manager', organizationId: '2', organizationName: 'Downtown Motel' },
      { id: 'mgr2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.johnson@motel.com', position: 'Assistant Manager', organizationId: '2', organizationName: 'Downtown Motel' },
      { id: 'mgr3', firstName: 'Mike', lastName: 'Davis', email: 'mike.davis@motel.com', position: 'General Manager', organizationId: '3', organizationName: 'Airport Motel' },
      { id: 'mgr4', firstName: 'Lisa', lastName: 'Wilson', email: 'lisa.wilson@motel.com', position: 'Operations Manager', organizationId: '4', organizationName: 'Highway Motel' }
    ]);
    
    
    // Auto-generate employee ID
    generateEmployeeId();
  }, []);

  // Filter managers based on selected organization
  useEffect(() => {
    if (formData.organizationId) {
      const filtered = managers.filter(manager => manager.organizationId === formData.organizationId);
      setFilteredManagers(filtered);
    } else {
      setFilteredManagers([]);
    }
  }, [formData.organizationId, managers]);

  // Auto-generate employee ID
  const generateEmployeeId = useCallback(() => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const employeeId = `EMP${timestamp}${randomNum}`;
    
    setFormData(prev => ({ ...prev, employeeId }));
  }, []);

  // Form validation
  const validateStep = useCallback((step: number): boolean => {
    const errors: ValidationErrors = {};
    
    switch (step) {
      case 0: // Personal Information
        if (!formData.firstName.trim()) errors.firstName = 'First name is required';
        if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
        if (!formData.email.trim()) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = 'Invalid email format';
        if (!formData.phone.trim()) errors.phone = 'Phone number is required';
        if (!formData.dateOfBirth) errors.dateOfBirth = 'Date of birth is required';
        break;
        
      case 1: // ID Verification
        if (!formData.driversLicenseNumber.trim()) errors.driversLicenseNumber = 'Driver\'s License Number is required';
        if (!formData.driversLicenseState.trim()) errors.driversLicenseState = 'Driver\'s License State is required';
        if (!formData.driversLicenseExpiration) errors.driversLicenseExpiration = 'Driver\'s License Expiration Date is required';
        if (!formData.ssnLastFour.trim()) errors.ssnLastFour = 'SSN Last Four is required';
        if (!formData.ssnNameMatch) errors.ssnNameMatch = 'SSN Name Match is required';
        if (!formData.ssnVerified) errors.ssnVerified = 'SSN Verification is required';
        if (!formData.idVerificationNotes.trim()) errors.idVerificationNotes = 'Notes for ID Verification are required';
        break;
        
      case 2: // Employment Details
        if (!formData.employeeId.trim()) errors.employeeId = 'Employee ID is required';
        if (!formData.position.trim()) errors.position = 'Position is required';
        if (!formData.department.trim()) errors.department = 'Department is required';
        if (!formData.hourlyRate || formData.hourlyRate < 7.25) errors.hourlyRate = 'Valid hourly rate is required (minimum $7.25)';
        if (!formData.hireDate) errors.hireDate = 'Hire date is required';
        break;
        
      case 3: // Manager Assignment
        if (!formData.organizationId) errors.organizationId = 'Organization is required';
        if (!formData.managerId) errors.managerId = 'Manager assignment is required';
        break;
        
      case 4: // Emergency Contact
        if (!formData.emergencyContactName.trim()) errors.emergencyContactName = 'Emergency contact name is required';
        if (!formData.emergencyContactRelationship.trim()) errors.emergencyContactRelationship = 'Relationship is required';
        if (!formData.emergencyContactPhone.trim()) errors.emergencyContactPhone = 'Emergency contact phone is required';
        break;
        
      case 5: // Address Information
        if (!formData.street.trim()) errors.street = 'Street address is required';
        if (!formData.city.trim()) errors.city = 'City is required';
        if (!formData.state.trim()) errors.state = 'State is required';
        if (!formData.zipCode.trim()) errors.zipCode = 'ZIP code is required';
        break;
        
      case 6: // Onboarding Setup
        // Optional validations - most fields have defaults
        break;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof EmployeeCreationData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [validationErrors]);

  // Navigation
  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, WIZARD_STEPS.length - 1));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    // Validate all previous steps before jumping
    let canJump = true;
    for (let i = 0; i < step; i++) {
      if (!validateStep(i)) {
        canJump = false;
        break;
      }
    }
    
    if (canJump) {
      setCurrentStep(step);
    }
  }, [validateStep]);

  // Create employee
  const createEmployee = useCallback(async () => {
    if (!validateStep(currentStep)) return;
    
    setIsLoading(true);
    
    try {
      console.log('Creating employee with data:', formData);
      
      // Get auth token
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      
      // Create employee via API
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email,
          password: 'TempPass123!', // Temporary password - employee will reset on first login
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          languagePreference: formData.languagePreference,
          employeeId: formData.employeeId,
          position: formData.position,
          department: formData.department,
          hourlyRate: formData.hourlyRate,
          hireDate: formData.hireDate,
          dateOfBirth: formData.dateOfBirth,
          organizationId: formData.organizationId,
          emergencyContact: {
            name: formData.emergencyContactName,
            relationship: formData.emergencyContactRelationship,
            phone: formData.emergencyContactPhone
          },
          address: {
            street: formData.street,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode
          }
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create employee');
      }
      
      const employeeResult = await response.json();
      console.log('Employee created successfully:', employeeResult);
      
      setCreatedEmployee(employeeResult.employee);
      
      
      setShowSuccess(true);
      
    } catch (error) {
      console.error('Error creating employee:', error);
      // Handle error - show user-friendly message
      alert(error instanceof Error ? error.message : 'Failed to create employee. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData, currentStep, validateStep]);

  // Generate access code
  const generateAccessCode = (): string => {
    const chars = 'ABCDEFGHJKMNPQRTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Reset form
  const resetForm = useCallback(() => {
    setCurrentStep(0);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      employeeId: '',
      position: '',
      department: '',
      hourlyRate: 15,
      hireDate: new Date().toISOString().split('T')[0],
      organizationId: '',
      managerId: '',
      emergencyContactName: '',
      emergencyContactRelationship: '',
      emergencyContactPhone: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      languagePreference: 'en',
                  driversLicenseNumber: '',
      driversLicenseState: '',
      driversLicenseExpiration: '',
      driversLicenseVerified: false,
      ssnLastFour: '',
      ssnNameMatch: false,
      ssnVerified: false,
      idVerificationNotes: ''
    });
    setValidationErrors({});
    setShowSuccess(false);
    setCreatedEmployee(null);
    generateEmployeeId();
  }, [generateEmployeeId]);

  // Bulk import handlers
  const handleBulkImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setBulkImportFile(file);
    } else {
      alert('Please select a valid CSV file');
    }
  }, []);

  const processBulkImport = useCallback(async () => {
    if (!bulkImportFile) return;
    
    setIsLoading(true);
    setBulkImportProgress(0);
    
    try {
      // In a real app, this would process the CSV file
      console.log('Processing bulk import file:', bulkImportFile.name);
      
      // Simulate processing with progress updates
      for (let i = 1; i <= 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        setBulkImportProgress(i * 10);
      }
      
      // Mock results
      const results: BulkImportResult = {
        total: 25,
        successful: 23,
        failed: 2,
        errors: [
          { row: 5, error: 'Invalid email format: john.doe@invalid' },
          { row: 12, error: 'Missing required field: position' }
        ]
      };
      
      setBulkImportResults(results);
      
    } catch (error) {
      console.error('Error processing bulk import:', error);
    } finally {
      setIsLoading(false);
    }
  }, [bulkImportFile]);

  if (showSuccess) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Icon name="CheckCircle" size={24} />
              Employee Created Successfully!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Employee Summary */}
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Employee Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {createdEmployee?.firstName} {createdEmployee?.lastName}
                </div>
                <div>
                  <span className="font-medium">Employee ID:</span> {createdEmployee?.employeeId}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {createdEmployee?.email}
                </div>
                <div>
                  <span className="font-medium">Position:</span> {createdEmployee?.position}
                </div>
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button onClick={resetForm}>
                <Icon name="Plus" size={16} className="mr-2" />
                Create Another Employee
              </Button>
              <Button variant="outline" onClick={() => window.print()}>
                <Icon name="FileText" size={16} className="mr-2" />
                Print Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Bulk Import Modal */}
      {showBulkImport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Upload" size={20} />
                Bulk Import Employees
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!bulkImportResults ? (
                <>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <p className="text-blue-800 dark:text-blue-300">
                      Upload a CSV file with employee data to create multiple employees at once. 
                      The file should include all required fields.
                    </p>
                  </div>
                  
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center">
                    {bulkImportFile ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-3">
                          <Icon name="FileText" size={32} className="text-blue-500" />
                          <div className="text-left">
                            <p className="font-medium">{bulkImportFile.name}</p>
                            <p className="text-sm text-gray-500">
                              {(bulkImportFile.size / 1024).toFixed(2)} KB • {bulkImportFile.type}
                            </p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => setBulkImportFile(null)}
                          variant="outline"
                          size="sm"
                        >
                          <Icon name="X" size={14} className="mr-2" />
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Icon name="Upload" size={32} className="mx-auto mb-4 text-gray-400" />
                        <p className="mb-2">Drag and drop your CSV file here, or click to browse</p>
                        <p className="text-sm text-gray-500 mb-4">Supports CSV files up to 5MB</p>
                        <input
                          type="file"
                          accept=".csv"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handleBulkImportFile}
                        />
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Browse Files
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">CSV Format Requirements</h3>
                    <ul className="list-disc list-inside text-sm space-y-1 text-gray-600 dark:text-gray-400">
                      <li>First row must contain column headers</li>
                      <li>Required columns: firstName, lastName, email, position, department</li>
                      <li>Optional columns: phone, dateOfBirth, hourlyRate, hireDate</li>
                      <li>Organization and manager assignment will be done after import</li>
                    </ul>
                  </div>
                  
                  {bulkImportProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Processing...</span>
                        <span>{bulkImportProgress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${bulkImportProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-6">
                  <div className={`p-4 rounded-lg ${
                    bulkImportResults.failed === 0 
                      ? 'bg-green-50 dark:bg-green-900/20' 
                      : 'bg-yellow-50 dark:bg-yellow-900/20'
                  }`}>
                    <div className="flex items-center gap-3 mb-2">
                      <Icon 
                        name={bulkImportResults.failed === 0 ? "CheckCircle" : "AlertTriangle"} 
                        size={24} 
                        className={bulkImportResults.failed === 0 ? "text-green-500" : "text-yellow-500"} 
                      />
                      <h3 className="font-medium text-lg">
                        {bulkImportResults.failed === 0 
                          ? 'Import Completed Successfully' 
                          : 'Import Completed with Errors'}
                      </h3>
                    </div>
                    <p>
                      {bulkImportResults.successful} of {bulkImportResults.total} employees were imported successfully.
                      {bulkImportResults.failed > 0 && ` ${bulkImportResults.failed} records had errors.`}
                    </p>
                  </div>
                  
                  {bulkImportResults.failed > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Error Details</h3>
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Error</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                            {bulkImportResults.errors.map((error, index) => (
                              <tr key={index}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm">{error.row}</td>
                                <td className="px-4 py-3 text-sm text-red-600">{error.error}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Next Steps</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {bulkImportResults.successful > 0 
                        ? 'Successfully imported employees need to be assigned to managers and locations.' 
                        : 'Please fix the errors in your CSV file and try again.'}
                    </p>
                    {bulkImportResults.successful > 0 && (
                      <Button size="sm" variant="outline">
                        <Icon name="Users" size={14} className="mr-2" />
                        Manage Imported Employees
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowBulkImport(false);
                  setBulkImportFile(null);
                  setBulkImportResults(null);
                  setBulkImportProgress(0);
                }}
              >
                {bulkImportResults ? 'Close' : 'Cancel'}
              </Button>
              
              {!bulkImportResults && (
                <Button 
                  onClick={processBulkImport}
                  disabled={!bulkImportFile || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Icon name="Upload" size={16} className="mr-2" />
                      Import Employees
                    </>
                  )}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employee Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Create new employee records and manage employee information</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowBulkImport(true)}
          >
            <Icon name="Upload" size={16} className="mr-2" />
            Bulk Import
          </Button>
          <Button variant="outline" onClick={resetForm}>
            <Icon name="RotateCcw" size={16} className="mr-2" />
            Reset Form
          </Button>
        </div>
      </div>

      {/* Progress Steps */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <button
                  onClick={() => goToStep(index)}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    index === currentStep
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : index < currentStep
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                  }`}
                >
                  <Icon name={step.icon as any} size={16} />
                </button>
                {index < WIZARD_STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    index < currentStep ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4">
            {WIZARD_STEPS.map((step, index) => (
              <div
                key={step.id}
                className={`text-xs text-center ${index < WIZARD_STEPS.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`font-medium ${
                  index === currentStep ? 'text-blue-600' : index < currentStep ? 'text-green-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name={WIZARD_STEPS[currentStep].icon as any} size={20} />
            {WIZARD_STEPS[currentStep].title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step 0: Personal Information */}
          {currentStep === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name *</label>
                <Input
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  error={validationErrors.firstName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Last Name *</label>
                <Input
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  error={validationErrors.lastName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter email address"
                  error={validationErrors.email}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number *</label>
                <Input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(555) 123-4567"
                  error={validationErrors.phone}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Date of Birth *</label>
                <Input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                  error={validationErrors.dateOfBirth}
                />
              </div>
            </div>
          )}

          {/* Step 1: ID Verification */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Driver's License Number *</label>
                <Input
                  value={formData.driversLicenseNumber}
                  onChange={(e) => handleInputChange('driversLicenseNumber', e.target.value)}
                  placeholder="e.g., 123456789"
                  error={validationErrors.driversLicenseNumber}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Driver's License State *</label>
                <Input
                  value={formData.driversLicenseState}
                  onChange={(e) => handleInputChange('driversLicenseState', e.target.value)}
                  placeholder="e.g., NY"
                  error={validationErrors.driversLicenseState}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Driver's License Expiration Date *</label>
                <Input
                  type="date"
                  value={formData.driversLicenseExpiration}
                  onChange={(e) => handleInputChange('driversLicenseExpiration', e.target.value)}
                  error={validationErrors.driversLicenseExpiration}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SSN Last Four *</label>
                <Input
                  type="text"
                  value={formData.ssnLastFour}
                  onChange={(e) => handleInputChange('ssnLastFour', e.target.value)}
                  placeholder="e.g., 1234"
                  error={validationErrors.ssnLastFour}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SSN Name Match *</label>
                <select
                  value={formData.ssnNameMatch ? 'Yes' : 'No'}
                  onChange={(e) => handleInputChange('ssnNameMatch', e.target.value === 'Yes')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {validationErrors.ssnNameMatch && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.ssnNameMatch}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">SSN Verified *</label>
                <select
                  value={formData.ssnVerified ? 'Yes' : 'No'}
                  onChange={(e) => handleInputChange('ssnVerified', e.target.value === 'Yes')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                {validationErrors.ssnVerified && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.ssnVerified}</p>
                )}
              </div>
                             <div>
                 <label className="block text-sm font-medium mb-2">Notes for ID Verification *</label>
                 <textarea
                   value={formData.idVerificationNotes}
                   onChange={(e) => handleInputChange('idVerificationNotes', e.target.value)}
                   placeholder="Any notes or observations for the manager regarding ID verification..."
                   className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[100px]"
                 />
                 {validationErrors.idVerificationNotes && (
                   <p className="text-red-500 text-sm mt-1">{validationErrors.idVerificationNotes}</p>
                 )}
               </div>
            </div>
          )}

          {/* Step 2: Employment Details */}
          {currentStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Employee ID *</label>
                <div className="flex gap-2">
                  <Input
                    value={formData.employeeId}
                    onChange={(e) => handleInputChange('employeeId', e.target.value)}
                    placeholder="EMP001"
                    error={validationErrors.employeeId}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateEmployeeId}
                  >
                    <Icon name="RefreshCw" size={16} />
                  </Button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Position *</label>
                <Input
                  value={formData.position}
                  onChange={(e) => handleInputChange('position', e.target.value)}
                  placeholder="Front Desk Agent"
                  error={validationErrors.position}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">Select Department</option>
                  <option value="Front Office">Front Office</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Food & Beverage">Food & Beverage</option>
                  <option value="Administration">Administration</option>
                </select>
                {validationErrors.department && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.department}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate *</label>
                <Input
                  type="number"
                  step="0.25"
                  min="7.25"
                  value={formData.hourlyRate}
                  onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value))}
                  placeholder="15.00"
                  error={validationErrors.hourlyRate}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hire Date *</label>
                <Input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => handleInputChange('hireDate', e.target.value)}
                  error={validationErrors.hireDate}
                />
              </div>
            </div>
          )}

          {/* Step 3: Manager Assignment */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Location/Property *</label>
                <select
                  value={formData.organizationId}
                  onChange={(e) => handleInputChange('organizationId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                >
                  <option value="">Select Location</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                {validationErrors.organizationId && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.organizationId}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Reporting Manager *</label>
                <select
                  value={formData.managerId}
                  onChange={(e) => handleInputChange('managerId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800"
                  disabled={!formData.organizationId}
                >
                  <option value="">Select Manager</option>
                  {filteredManagers.map(manager => (
                    <option key={manager.id} value={manager.id}>
                      {manager.firstName} {manager.lastName} - {manager.position}
                    </option>
                  ))}
                </select>
                {validationErrors.managerId && (
                  <p className="text-red-500 text-sm mt-1">{validationErrors.managerId}</p>
                )}
                {!formData.organizationId && (
                  <p className="text-amber-600 text-sm mt-1">Please select a location first</p>
                )}
              </div>
              
              {/* Organization Hierarchy Visualization */}
              <div className="mt-8 border rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50">
                <h3 className="font-medium mb-4">Organization Hierarchy</h3>
                <div className="pl-4 border-l-2 border-gray-300">
                  {/* Corporate HQ */}
                  <div className="mb-2">
                    <div className="font-medium">Corporate Headquarters</div>
                    <div className="text-sm text-gray-500">Parent Organization</div>
                  </div>
                  
                  {/* Motels */}
                  <div className="pl-6 space-y-3 mt-3">
                    {organizations
                      .filter(org => org.type === 'motel')
                      .map(motel => (
                        <div 
                          key={motel.id} 
                          className={`p-3 rounded-md border ${
                            formData.organizationId === motel.id 
                              ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                              : 'bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700'
                          }`}
                        >
                          <div className="font-medium">{motel.name}</div>
                          <div className="text-sm text-gray-500 mt-1">
                            {managers.filter(m => m.organizationId === motel.id).length} Managers
                          </div>
                          
                          {/* Show managers if this location is selected */}
                          {formData.organizationId === motel.id && (
                            <div className="mt-2 pl-3 border-l-2 border-gray-200 dark:border-gray-700">
                              {managers
                                .filter(m => m.organizationId === motel.id)
                                .map(manager => (
                                  <div 
                                    key={manager.id} 
                                    className={`py-1 flex items-center ${
                                      formData.managerId === manager.id 
                                        ? 'text-blue-600 dark:text-blue-400 font-medium' 
                                        : 'text-gray-600 dark:text-gray-400'
                                    }`}
                                  >
                                    <div className="w-2 h-2 rounded-full bg-gray-400 mr-2"></div>
                                    {manager.firstName} {manager.lastName} - {manager.position}
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      ))
                    }
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Emergency Contact */}
          {currentStep === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Emergency Contact Name *</label>
                <Input
                  value={formData.emergencyContactName}
                  onChange={(e) => handleInputChange('emergencyContactName', e.target.value)}
                  placeholder="Full name of emergency contact"
                  error={validationErrors.emergencyContactName}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Relationship *</label>
                <Input
                  value={formData.emergencyContactRelationship}
                  onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                  placeholder="e.g. Spouse, Parent, Sibling"
                  error={validationErrors.emergencyContactRelationship}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact Phone *</label>
                <Input
                  type="tel"
                  value={formData.emergencyContactPhone}
                  onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                  placeholder="(555) 123-4567"
                  error={validationErrors.emergencyContactPhone}
                />
              </div>
            </div>
          )}

          {/* Step 5: Address Information */}
          {currentStep === 5 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Street Address *</label>
                <Input
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  placeholder="Street address"
                  error={validationErrors.street}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">City *</label>
                <Input
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                  error={validationErrors.city}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">State *</label>
                <Input
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                  error={validationErrors.state}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">ZIP Code *</label>
                <Input
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="ZIP Code"
                  error={validationErrors.zipCode}
                />
              </div>
            </div>
          )}

          {/* Step 6: Onboarding Setup */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Language</label>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      checked={formData.languagePreference === 'en'}
                      onChange={() => handleInputChange('languagePreference', 'en')}
                      className="mr-2"
                    />
                    <span className="flex items-center">
                      <span className="text-lg mr-2">🇺🇸</span> English
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="language"
                      checked={formData.languagePreference === 'es'}
                      onChange={() => handleInputChange('languagePreference', 'es')}
                      className="mr-2"
                    />
                    <span className="flex items-center">
                      <span className="text-lg mr-2">🇪🇸</span> Spanish
                    </span>
                  </label>
                </div>
              </div>
              
              
            </div>
          )}

          {/* Step 7: Review & Create */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
                <p className="text-blue-800 dark:text-blue-300">
                  Please review all information before creating the employee record.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Personal Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Email:</span>
                      <span className="font-medium">{formData.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium">{formData.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date of Birth:</span>
                      <span className="font-medium">{formData.dateOfBirth}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">ID Verification</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Driver's License Number:</span>
                      <span className="font-medium">{formData.driversLicenseNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">State:</span>
                      <span className="font-medium">{formData.driversLicenseState}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Expiration:</span>
                      <span className="font-medium">{formData.driversLicenseExpiration}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SSN Last Four:</span>
                      <span className="font-medium">{formData.ssnLastFour}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SSN Name Match:</span>
                      <span className="font-medium">{formData.ssnNameMatch ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">SSN Verified:</span>
                      <span className="font-medium">{formData.ssnVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                      <span className="font-medium">{formData.idVerificationNotes}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Employment Details</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Employee ID:</span>
                      <span className="font-medium">{formData.employeeId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Position:</span>
                      <span className="font-medium">{formData.position}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Department:</span>
                      <span className="font-medium">{formData.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Hourly Rate:</span>
                      <span className="font-medium">${formData.hourlyRate.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Hire Date:</span>
                      <span className="font-medium">{formData.hireDate}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Assignment</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Location:</span>
                      <span className="font-medium">
                        {organizations.find(o => o.id === formData.organizationId)?.name || 'Not assigned'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Manager:</span>
                      <span className="font-medium">
                        {managers.find(m => m.id === formData.managerId)
                          ? `${managers.find(m => m.id === formData.managerId)?.firstName} ${managers.find(m => m.id === formData.managerId)?.lastName}`
                          : 'Not assigned'
                        }
                      </span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Emergency Contact</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="font-medium">{formData.emergencyContactName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Relationship:</span>
                      <span className="font-medium">{formData.emergencyContactRelationship}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="font-medium">{formData.emergencyContactPhone}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Address</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Street:</span>
                      <span className="font-medium">{formData.street}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">City:</span>
                      <span className="font-medium">{formData.city}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">State:</span>
                      <span className="font-medium">{formData.state}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">ZIP Code:</span>
                      <span className="font-medium">{formData.zipCode}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-3 pb-2 border-b">Onboarding</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Language:</span>
                      <span className="font-medium">
                        {formData.languagePreference === 'en' ? 'English' : 'Spanish'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <Icon name="ChevronLeft" size={16} className="mr-2" />
            Previous
          </Button>
          
          <div className="flex gap-2">
            {currentStep === WIZARD_STEPS.length - 1 ? (
              <Button
                onClick={createEmployee}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icon name="Loader" size={16} className="mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={16} className="mr-2" />
                    Create Employee
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
                <Icon name="ChevronRight" size={16} className="ml-2" />
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};