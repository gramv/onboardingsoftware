import React from 'react';
import { Button, Input, Card, CardHeader, CardTitle, CardContent, Badge } from './ui';

export const DesignSystemDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Motel Employee Management Design System
          </h1>
          <p className="text-lg text-gray-600">
            Enterprise-grade UI components for consistent user experience
          </p>
        </div>

        {/* Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle>Buttons</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="error">Error</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button loading>Loading</Button>
                <Button disabled>Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Inputs Section */}
        <Card>
          <CardHeader>
            <CardTitle>Form Inputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Employee Name"
                placeholder="Enter employee name"
                helperText="This will be displayed on the employee badge"
              />
              <Input
                label="Email Address"
                type="email"
                placeholder="employee@motel.com"
                error="Please enter a valid email address"
              />
              <Input
                label="Phone Number"
                placeholder="(555) 123-4567"
                leftIcon="📞"
              />
              <Input
                label="Employee ID"
                placeholder="EMP001"
                rightIcon="🆔"
              />
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        <Card>
          <CardHeader>
            <CardTitle>Status Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Badge variant="primary">Active</Badge>
                <Badge variant="success">Completed</Badge>
                <Badge variant="warning">Pending</Badge>
                <Badge variant="error">Overdue</Badge>
                <Badge variant="gray">Draft</Badge>
              </div>
              <div className="flex flex-wrap gap-4">
                <Badge size="sm" variant="primary">Small</Badge>
                <Badge size="md" variant="primary">Medium</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Employee Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Name:</span>
                  <span className="text-sm text-gray-900">John Doe</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Position:</span>
                  <span className="text-sm text-gray-900">Front Desk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-500">Status:</span>
                  <Badge variant="success" size="sm">Active</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Onboarding Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Documents</span>
                  <Badge variant="success" size="sm">Complete</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Training</span>
                  <Badge variant="warning" size="sm">In Progress</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">System Access</span>
                  <Badge variant="gray" size="sm">Pending</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Color Palette */}
        <Card>
          <CardHeader>
            <CardTitle>Color Palette</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <div className="h-16 bg-primary-500 rounded-lg"></div>
                <p className="text-sm font-medium text-center">Primary</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-success-500 rounded-lg"></div>
                <p className="text-sm font-medium text-center">Success</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-warning-500 rounded-lg"></div>
                <p className="text-sm font-medium text-center">Warning</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-error-500 rounded-lg"></div>
                <p className="text-sm font-medium text-center">Error</p>
              </div>
              <div className="space-y-2">
                <div className="h-16 bg-gray-500 rounded-lg"></div>
                <p className="text-sm font-medium text-center">Gray</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};