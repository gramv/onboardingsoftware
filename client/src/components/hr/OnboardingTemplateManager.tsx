import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';

interface OnboardingStep {
  id: string;
  name: string;
  description: string;
  isRequired: boolean;
  order: number;
}

interface OnboardingTemplate {
  id: string;
  name: string;
  description: string;
  targetRoles: string[];
  estimatedDuration: string;
  steps: OnboardingStep[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface OnboardingTemplateManagerProps {
  onTemplateSelect?: (template: OnboardingTemplate) => void;
  onTemplateCreate?: (template: Omit<OnboardingTemplate, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onTemplateUpdate?: (template: OnboardingTemplate) => void;
  onTemplateDelete?: (templateId: string) => void;
  className?: string;
}

export const OnboardingTemplateManager: React.FC<OnboardingTemplateManagerProps> = ({
  onTemplateSelect,
  onTemplateCreate,
  onTemplateUpdate,
  onTemplateDelete,
  className = ''
}) => {
  const [templates, setTemplates] = useState<OnboardingTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<OnboardingTemplate | null>(null);
  const [formData, setFormData] = useState<Partial<OnboardingTemplate>>({
    name: '',
    description: '',
    targetRoles: [],
    estimatedDuration: '',
    steps: [],
    isDefault: false
  });
  const [newRole, setNewRole] = useState('');
  const [newStep, setNewStep] = useState<Partial<OnboardingStep>>({
    name: '',
    description: '',
    isRequired: true,
    order: 0
  });

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // In a real app, this would be an API call
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockTemplates: OnboardingTemplate[] = [
          {
            id: 'template1',
            name: 'Front Desk Staff',
            description: 'Standard onboarding for front desk positions',
            targetRoles: ['Front Desk Agent', 'Front Desk Supervisor', 'Night Auditor'],
            estimatedDuration: '2-3 hours',
            steps: [
              { id: 'step1', name: 'Document Upload', description: 'Upload identification documents', isRequired: true, order: 1 },
              { id: 'step2', name: 'I-9 Completion', description: 'Complete I-9 employment eligibility form', isRequired: true, order: 2 },
              { id: 'step3', name: 'W-4 Setup', description: 'Complete W-4 tax withholding form', isRequired: true, order: 3 },
              { id: 'step4', name: 'Handbook Review', description: 'Review employee handbook and policies', isRequired: true, order: 4 },
              { id: 'step5', name: 'System Training', description: 'Complete basic system training modules', isRequired: false, order: 5 }
            ],
            isDefault: true,
            createdAt: '2023-01-15T12:00:00Z',
            updatedAt: '2023-03-22T09:30:00Z'
          },
          {
            id: 'template2',
            name: 'Housekeeping Staff',
            description: 'Onboarding process for housekeeping team',
            targetRoles: ['Housekeeper', 'Housekeeping Supervisor', 'Laundry Attendant'],
            estimatedDuration: '1-2 hours',
            steps: [
              { id: 'step1', name: 'Document Upload', description: 'Upload identification documents', isRequired: true, order: 1 },
              { id: 'step2', name: 'I-9 Completion', description: 'Complete I-9 employment eligibility form', isRequired: true, order: 2 },
              { id: 'step3', name: 'W-4 Setup', description: 'Complete W-4 tax withholding form', isRequired: true, order: 3 },
              { id: 'step4', name: 'Safety Training', description: 'Review safety procedures and protocols', isRequired: true, order: 4 },
              { id: 'step5', name: 'Equipment Training', description: 'Learn about cleaning equipment and supplies', isRequired: true, order: 5 }
            ],
            isDefault: false,
            createdAt: '2023-02-10T14:15:00Z',
            updatedAt: '2023-02-10T14:15:00Z'
          },
          {
            id: 'template3',
            name: 'Management Staff',
            description: 'Comprehensive onboarding for management positions',
            targetRoles: ['Manager', 'Assistant Manager', 'Supervisor'],
            estimatedDuration: '3-4 hours',
            steps: [
              { id: 'step1', name: 'Document Upload', description: 'Upload identification documents', isRequired: true, order: 1 },
              { id: 'step2', name: 'I-9 Completion', description: 'Complete I-9 employment eligibility form', isRequired: true, order: 2 },
              { id: 'step3', name: 'W-4 Setup', description: 'Complete W-4 tax withholding form', isRequired: true, order: 3 },
              { id: 'step4', name: 'Handbook Review', description: 'Review employee handbook and policies', isRequired: true, order: 4 },
              { id: 'step5', name: 'Management Training', description: 'Complete management training modules', isRequired: true, order: 5 },
              { id: 'step6', name: 'System Access Setup', description: 'Set up system access and permissions', isRequired: true, order: 6 }
            ],
            isDefault: false,
            createdAt: '2023-03-05T10:45:00Z',
            updatedAt: '2023-04-12T16:20:00Z'
          }
        ];
        
        setTemplates(mockTemplates);
      } catch (err) {
        console.error('Error fetching onboarding templates:', err);
        setError('Failed to load onboarding templates. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, []);

  // Handle template selection
  const handleTemplateSelect = (template: OnboardingTemplate) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template);
  };

  // Handle form input changes
  const handleInputChange = (field: keyof OnboardingTemplate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Add new role to target roles
  const handleAddRole = () => {
    if (!newRole.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      targetRoles: [...(prev.targetRoles || []), newRole.trim()]
    }));
    
    setNewRole('');
  };

  // Remove role from target roles
  const handleRemoveRole = (role: string) => {
    setFormData(prev => ({
      ...prev,
      targetRoles: (prev.targetRoles || []).filter(r => r !== role)
    }));
  };

  // Handle step input changes
  const handleStepInputChange = (field: keyof OnboardingStep, value: any) => {
    setNewStep(prev => ({ ...prev, [field]: value }));
  };

  // Add new step
  const handleAddStep = () => {
    if (!newStep.name?.trim()) return;
    
    const step: OnboardingStep = {
      id: `step_${Date.now()}`,
      name: newStep.name.trim(),
      description: newStep.description?.trim() || '',
      isRequired: newStep.isRequired || false,
      order: (formData.steps?.length || 0) + 1
    };
    
    setFormData(prev => ({
      ...prev,
      steps: [...(prev.steps || []), step]
    }));
    
    setNewStep({
      name: '',
      description: '',
      isRequired: true,
      order: 0
    });
  };

  // Remove step
  const handleRemoveStep = (stepId: string) => {
    setFormData(prev => ({
      ...prev,
      steps: (prev.steps || []).filter(s => s.id !== stepId).map((s, idx) => ({ ...s, order: idx + 1 }))
    }));
  };

  // Move step up or down
  const handleMoveStep = (stepId: string, direction: 'up' | 'down') => {
    const steps = [...(formData.steps || [])];
    const index = steps.findIndex(s => s.id === stepId);
    
    if (index === -1) return;
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === steps.length - 1) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const step = steps[index];
    steps.splice(index, 1);
    steps.splice(newIndex, 0, step);
    
    // Update order
    const updatedSteps = steps.map((s, idx) => ({ ...s, order: idx + 1 }));
    
    setFormData(prev => ({
      ...prev,
      steps: updatedSteps
    }));
  };

  // Create new template
  const handleCreateTemplate = () => {
    if (!formData.name?.trim()) return;
    
    const newTemplate: Omit<OnboardingTemplate, 'id' | 'createdAt' | 'updatedAt'> = {
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      targetRoles: formData.targetRoles || [],
      estimatedDuration: formData.estimatedDuration?.trim() || '1-2 hours',
      steps: formData.steps || [],
      isDefault: formData.isDefault || false
    };
    
    onTemplateCreate?.(newTemplate);
    
    // In a real app, this would be handled by the API response
    const mockId = `template_${Date.now()}`;
    const now = new Date().toISOString();
    
    setTemplates(prev => [
      ...prev,
      {
        ...newTemplate,
        id: mockId,
        createdAt: now,
        updatedAt: now
      }
    ]);
    
    setShowCreateModal(false);
    setFormData({
      name: '',
      description: '',
      targetRoles: [],
      estimatedDuration: '',
      steps: [],
      isDefault: false
    });
  };

  // Update existing template
  const handleUpdateTemplate = () => {
    if (!selectedTemplate || !formData.name?.trim()) return;
    
    const updatedTemplate: OnboardingTemplate = {
      ...selectedTemplate,
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
      targetRoles: formData.targetRoles || [],
      estimatedDuration: formData.estimatedDuration?.trim() || '1-2 hours',
      steps: formData.steps || [],
      isDefault: formData.isDefault || false,
      updatedAt: new Date().toISOString()
    };
    
    onTemplateUpdate?.(updatedTemplate);
    
    setTemplates(prev => prev.map(t => 
      t.id === updatedTemplate.id ? updatedTemplate : t
    ));
    
    setShowEditModal(false);
    setSelectedTemplate(null);
    setFormData({
      name: '',
      description: '',
      targetRoles: [],
      estimatedDuration: '',
      steps: [],
      isDefault: false
    });
  };

  // Delete template
  const handleDeleteTemplate = (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      onTemplateDelete?.(templateId);
      
      setTemplates(prev => prev.filter(t => t.id !== templateId));
    }
  };

  // Open edit modal
  const openEditModal = (template: OnboardingTemplate) => {
    setSelectedTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      targetRoles: [...template.targetRoles],
      estimatedDuration: template.estimatedDuration,
      steps: [...template.steps],
      isDefault: template.isDefault
    });
    setShowEditModal(true);
  };

  // Render template form (used for both create and edit)
  const renderTemplateForm = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Template Name *</label>
        <Input
          value={formData.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="e.g. Front Desk Staff Onboarding"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <textarea
          value={formData.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the purpose and scope of this onboarding template..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 min-h-[100px]"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Estimated Duration</label>
        <Input
          value={formData.estimatedDuration || ''}
          onChange={(e) => handleInputChange('estimatedDuration', e.target.value)}
          placeholder="e.g. 2-3 hours"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Target Roles</label>
        <div className="flex gap-2 mb-2">
          <Input
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            placeholder="Add role (e.g. Front Desk Agent)"
            className="flex-1"
          />
          <Button onClick={handleAddRole} disabled={!newRole.trim()}>
            <Icon name="Plus" size={16} />
          </Button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {(formData.targetRoles || []).map((role, index) => (
            <Badge key={index} className="flex items-center gap-1 py-1 px-3">
              {role}
              <button 
                onClick={() => handleRemoveRole(role)}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                <Icon name="X" size={12} />
              </button>
            </Badge>
          ))}
          {(formData.targetRoles || []).length === 0 && (
            <span className="text-sm text-gray-500">No roles added yet</span>
          )}
        </div>
      </div>
      
      <div>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isDefault || false}
            onChange={(e) => handleInputChange('isDefault', e.target.checked)}
            className="mr-2"
          />
          <span>Set as default template</span>
        </label>
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Onboarding Steps</label>
          <span className="text-xs text-gray-500">Drag to reorder</span>
        </div>
        
        <div className="space-y-3 mb-4">
          {(formData.steps || []).map((step) => (
            <div 
              key={step.id}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border"
            >
              <div className="flex-1">
                <div className="font-medium">{step.name}</div>
                {step.description && (
                  <div className="text-sm text-gray-500">{step.description}</div>
                )}
              </div>
              
              <Badge className={step.isRequired ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                {step.isRequired ? 'Required' : 'Optional'}
              </Badge>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleMoveStep(step.id, 'up')}
                  disabled={step.order === 1}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <Icon name="ChevronUp" size={16} />
                </button>
                <button
                  onClick={() => handleMoveStep(step.id, 'down')}
                  disabled={step.order === (formData.steps || []).length}
                  className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                >
                  <Icon name="ChevronDown" size={16} />
                </button>
                <button
                  onClick={() => handleRemoveStep(step.id)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Icon name="X" size={16} />
                </button>
              </div>
            </div>
          ))}
          
          {(formData.steps || []).length === 0 && (
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed">
              <p className="text-gray-500">No steps added yet</p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border">
          <h4 className="font-medium mb-3">Add New Step</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium mb-1">Step Name *</label>
              <Input
                value={newStep.name || ''}
                onChange={(e) => handleStepInputChange('name', e.target.value)}
                placeholder="e.g. Document Upload"
                size="sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Description</label>
              <Input
                value={newStep.description || ''}
                onChange={(e) => handleStepInputChange('description', e.target.value)}
                placeholder="Brief description of this step"
                size="sm"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={newStep.isRequired || false}
                  onChange={(e) => handleStepInputChange('isRequired', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm">Required Step</span>
              </label>
              
              <Button 
                size="sm"
                onClick={handleAddStep}
                disabled={!newStep.name?.trim()}
              >
                <Icon name="Plus" size={14} className="mr-1" />
                Add Step
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Create Template Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Plus" size={20} />
                Create Onboarding Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTemplateForm()}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({
                    name: '',
                    description: '',
                    targetRoles: [],
                    estimatedDuration: '',
                    steps: [],
                    isDefault: false
                  });
                }}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleCreateTemplate}
                disabled={!formData.name?.trim()}
              >
                <Icon name="Save" size={16} className="mr-2" />
                Create Template
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      {/* Edit Template Modal */}
      {showEditModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon name="Edit" size={20} />
                Edit Onboarding Template
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderTemplateForm()}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setSelectedTemplate(null);
                  setFormData({
                    name: '',
                    description: '',
                    targetRoles: [],
                    estimatedDuration: '',
                    steps: [],
                    isDefault: false
                  });
                }}
              >
                Cancel
              </Button>
              
              <Button 
                onClick={handleUpdateTemplate}
                disabled={!formData.name?.trim()}
              >
                <Icon name="Save" size={16} className="mr-2" />
                Update Template
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Onboarding Templates</h2>
        
        <Button onClick={() => setShowCreateModal(true)}>
          <Icon name="Plus" size={16} className="mr-2" />
          Create Template
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <div className="flex items-center gap-2">
            <Icon name="Loader" className="animate-spin" />
            <span>Loading templates...</span>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <p>{error}</p>
        </div>
      ) : templates.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800/50 text-center p-8 rounded-lg">
          <Icon name="FileText" size={32} className="mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600 dark:text-gray-400">No templates found</p>
          <Button className="mt-4" onClick={() => setShowCreateModal(true)}>
            <Icon name="Plus" size={16} className="mr-2" />
            Create First Template
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(template => (
            <Card 
              key={template.id} 
              className="cursor-pointer hover:border-blue-300 transition-colors"
              onClick={() => handleTemplateSelect(template)}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-lg">{template.name}</h3>
                  {template.isDefault && (
                    <Badge className="bg-blue-100 text-blue-800">Default</Badge>
                  )}
                </div>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                  {template.description}
                </p>
                
                <div className="flex justify-between text-sm mb-4">
                  <div>
                    <span className="font-medium">Duration:</span> {template.estimatedDuration}
                  </div>
                  <div>
                    <span className="font-medium">Steps:</span> {template.steps.length}
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-sm font-medium block mb-2">Target Roles:</span>
                  <div className="flex flex-wrap gap-2">
                    {template.targetRoles.map((role, index) => (
                      <Badge key={index} variant="outline">{role}</Badge>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      openEditModal(template);
                    }}
                  >
                    <Icon name="Edit" size={14} className="mr-1" />
                    Edit
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteTemplate(template.id);
                    }}
                  >
                    <Icon name="Trash" size={14} className="mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OnboardingTemplateManager;