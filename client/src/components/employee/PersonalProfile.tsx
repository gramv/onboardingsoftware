import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Icon } from '../ui/Icon';
import { useAuthStore } from '../../stores/authStore';

// interface ProfileSection {
//   id: string;
//   title: string;
//   icon: string;
//   editable: boolean;
// }

interface PersonalInfo {
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
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  employmentInfo: {
    employeeId: string;
    position: string;
    department: string;
    hireDate: string;
    manager: string;
  };
}

export const PersonalProfile: React.FC = () => {
  const { user } = useAuthStore();
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<PersonalInfo>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: '(555) 123-4567',
    address: {
      street: '123 Main Street',
      city: 'Anytown',
      state: 'CA',
      zipCode: '12345',
    },
    emergencyContact: {
      name: 'Jane Doe',
      relationship: 'Spouse',
      phone: '(555) 987-6543',
    },
    employmentInfo: {
      employeeId: 'EMP001',
      position: 'Front Desk Associate',
      department: 'Operations',
      hireDate: '2024-01-15',
      manager: 'John Smith',
    },
  });

  // const profileSections: ProfileSection[] = [
  //   { id: 'personal', title: 'Personal Information', icon: 'User', editable: true },
  //   { id: 'contact', title: 'Contact Information', icon: 'Phone', editable: true },
  //   { id: 'address', title: 'Address', icon: 'MapPin', editable: true },
  //   { id: 'emergency', title: 'Emergency Contact', icon: 'Heart', editable: true },
  //   { id: 'employment', title: 'Employment Information', icon: 'Building', editable: false },
  // ];

  const handleEdit = (sectionId: string) => {
    setEditingSection(sectionId);
  };

  const handleSave = (sectionId: string) => {
    // Here you would typically make an API call to save the data
    console.log('Saving section:', sectionId, profileData);
    setEditingSection(null);
  };

  const handleCancel = () => {
    setEditingSection(null);
    // Reset any unsaved changes
  };

  const updateProfileData = (section: string, field: string, value: string) => {
    setProfileData(prev => {
      const sectionData = prev[section as keyof PersonalInfo];
      if (typeof sectionData === 'object' && sectionData !== null) {
        return {
          ...prev,
          [section]: {
            ...sectionData,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const renderPersonalSection = () => {
    const isEditing = editingSection === 'personal';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="User" size={20} className="text-gray-600" />
              <CardTitle>Personal Information</CardTitle>
            </div>
            {!isEditing && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('personal')}>
                <Icon name="Edit" size={16} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              {isEditing ? (
                <Input
                  value={profileData.firstName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              {isEditing ? (
                <Input
                  value={profileData.lastName}
                  onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.lastName}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleSave('personal')}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderContactSection = () => {
    const isEditing = editingSection === 'contact';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Phone" size={20} className="text-gray-600" />
              <CardTitle>Contact Information</CardTitle>
            </div>
            {!isEditing && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('contact')}>
                <Icon name="Edit" size={16} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.email}</p>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={profileData.phone}
                  onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.phone}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleSave('contact')}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAddressSection = () => {
    const isEditing = editingSection === 'address';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="MapPin" size={20} className="text-gray-600" />
              <CardTitle>Address</CardTitle>
            </div>
            {!isEditing && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('address')}>
                <Icon name="Edit" size={16} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              {isEditing ? (
                <Input
                  value={profileData.address.street}
                  onChange={(e) => updateProfileData('address', 'street', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.address.street}</p>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                {isEditing ? (
                  <Input
                    value={profileData.address.city}
                    onChange={(e) => updateProfileData('address', 'city', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profileData.address.city}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State
                </label>
                {isEditing ? (
                  <Input
                    value={profileData.address.state}
                    onChange={(e) => updateProfileData('address', 'state', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profileData.address.state}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ZIP Code
                </label>
                {isEditing ? (
                  <Input
                    value={profileData.address.zipCode}
                    onChange={(e) => updateProfileData('address', 'zipCode', e.target.value)}
                  />
                ) : (
                  <p className="text-gray-900 dark:text-white">{profileData.address.zipCode}</p>
                )}
              </div>
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleSave('address')}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmergencyContactSection = () => {
    const isEditing = editingSection === 'emergency';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="Heart" size={20} className="text-gray-600" />
              <CardTitle>Emergency Contact</CardTitle>
            </div>
            {!isEditing && (
              <Button size="sm" variant="ghost" onClick={() => handleEdit('emergency')}>
                <Icon name="Edit" size={16} />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              {isEditing ? (
                <Input
                  value={profileData.emergencyContact.name}
                  onChange={(e) => updateProfileData('emergencyContact', 'name', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.emergencyContact.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Relationship
              </label>
              {isEditing ? (
                <Input
                  value={profileData.emergencyContact.relationship}
                  onChange={(e) => updateProfileData('emergencyContact', 'relationship', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.emergencyContact.relationship}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              {isEditing ? (
                <Input
                  value={profileData.emergencyContact.phone}
                  onChange={(e) => updateProfileData('emergencyContact', 'phone', e.target.value)}
                />
              ) : (
                <p className="text-gray-900 dark:text-white">{profileData.emergencyContact.phone}</p>
              )}
            </div>
          </div>
          
          {isEditing && (
            <div className="flex justify-end space-x-2 mt-4">
              <Button size="sm" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="sm" onClick={() => handleSave('emergency')}>
                Save Changes
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEmploymentSection = () => {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Icon name="Building" size={20} className="text-gray-600" />
            <CardTitle>Employment Information</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employee ID
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.employmentInfo.employeeId}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Position
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.employmentInfo.position}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.employmentInfo.department}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Hire Date
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(profileData.employmentInfo.hireDate).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Manager
              </label>
              <p className="text-gray-900 dark:text-white">{profileData.employmentInfo.manager}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <Icon name="AlertCircle" size={16} className="inline mr-1" />
              Employment information can only be updated by your manager or HR.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Profile</h2>
        <div className="flex items-center space-x-2">
          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
            <Icon name="User" size={24} className="text-primary-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">
              {profileData.firstName} {profileData.lastName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {profileData.employmentInfo.position}
            </p>
          </div>
        </div>
      </div>

      {renderPersonalSection()}
      {renderContactSection()}
      {renderAddressSection()}
      {renderEmergencyContactSection()}
      {renderEmploymentSection()}
    </div>
  );
};