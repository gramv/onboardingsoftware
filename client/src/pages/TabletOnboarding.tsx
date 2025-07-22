import React, { useState } from 'react';
import OnboardingWizard from '../components/tablet/onboarding/OnboardingWizard';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { DeviceProvider, useDevice } from '../components/ui/DeviceDetector';

const TabletOnboardingContent: React.FC = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [chosenExperience, setChosenExperience] = useState<'tablet' | 'modern' | null>(null);
  const { deviceInfo, isTabletMode, isMobileMode } = useDevice();
  
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-6">👋</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Employee Onboarding
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Choose your preferred onboarding experience based on your device and situation.
            </p>
            {/* Device Detection Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
              <p className="text-sm text-blue-800">
                <Icon name="Info" size={16} className="inline mr-2" />
                <strong>Device Detected:</strong> {deviceInfo.deviceType} 
                {deviceInfo.hasTouch && ' with touch support'}
                {deviceInfo.orientation === 'landscape' && ' (landscape)'}
                {deviceInfo.orientation === 'portrait' && ' (portrait)'}
              </p>
              {isTabletMode && (
                <p className="text-sm text-blue-700 mt-2">
                  💡 <strong>Recommended:</strong> Tablet Experience is optimized for your device
                </p>
              )}
              {isMobileMode && (
                <p className="text-sm text-blue-700 mt-2">
                  💡 <strong>Recommended:</strong> Mobile/PC Experience is optimized for your device
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            {/* Modern Mobile/PC Experience */}
            <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-blue-500">
              <div className="text-center">
                                 <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Icon name="Phone" size={32} className="text-white" />
                 </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Mobile/PC Experience
                </h3>
                <p className="text-gray-600 mb-4">
                  Modern, responsive design optimized for smartphones, tablets, and computers. 
                  Complete onboarding from any device, anywhere.
                </p>
                <div className="space-y-2 text-sm text-gray-600 mb-6">
                  <div className="flex items-center justify-center">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                    Works on any device
                  </div>
                  <div className="flex items-center justify-center">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                    Camera integration for document upload
                  </div>
                  <div className="flex items-center justify-center">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                    Real-time OCR processing
                  </div>
                  <div className="flex items-center justify-center">
                    <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                    Government-compliant forms
                  </div>
                </div>
                <Button 
                  size="lg" 
                  className="w-full"
                  onClick={() => {
                    const searchParams = new URLSearchParams(window.location.search);
                    window.location.href = `/onboarding?${searchParams.toString()}`;
                  }}
                >
                                                        Use Modern Experience
                   <Icon name="Plus" size={16} className="ml-2" />
                 </Button>
               </div>
             </Card>

             {/* Tablet Walk-in Experience */}
             <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500">
               <div className="text-center">
                 <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Icon name="Settings" size={32} className="text-white" />
                 </div>
                 <h3 className="text-xl font-semibold text-gray-900 mb-3">
                   Tablet Kiosk Mode
                 </h3>
                 <p className="text-gray-600 mb-4">
                   Full-screen tablet interface designed for walk-in onboarding at your location. 
                   Optimized for touch interactions and larger displays.
                 </p>
                 <div className="space-y-2 text-sm text-gray-600 mb-6">
                   <div className="flex items-center justify-center">
                     <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                     Kiosk-optimized interface
                   </div>
                   <div className="flex items-center justify-center">
                     <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                     Large touch-friendly buttons
                   </div>
                   <div className="flex items-center justify-center">
                     <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                     Voice guidance support
                   </div>
                   <div className="flex items-center justify-center">
                     <Icon name="CheckCircle" size={16} className="text-green-600 mr-2" />
                     High contrast accessibility
                   </div>
                 </div>
                 <Button 
                   size="lg" 
                   variant="outline"
                   className="w-full"
                   onClick={() => setChosenExperience('tablet')}
                 >
                   Use Tablet Experience
                   <Icon name="Settings" size={16} className="ml-2" />
                </Button>
              </div>
            </Card>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center">
              <Icon name="AlertTriangle" size={20} className="mr-2" />
              What you'll need for onboarding:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-amber-700">
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">📄</span> Driver's License or State ID
                </div>
                <div className="flex items-center">
                  <span className="mr-2">🔢</span> Social Security Card
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center">
                  <span className="mr-2">🔑</span> Access code from your manager
                </div>
                <div className="flex items-center">
                  <span className="mr-2">⏱️</span> 15-20 minutes of time
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            Need help? Contact your manager or HR department.
          </div>
        </Card>
      </div>
    );
  }

  if (chosenExperience === 'tablet') {
    return (
      <div className="min-h-screen">
        <OnboardingWizard 
          onComplete={(data) => {
            console.log('Onboarding completed with data:', data);
            // In a real app, we would redirect to the employee dashboard or show a success screen
          }}
          onStepChange={(step, data) => {
            console.log(`Step changed to ${step}`, data);
            // In a real app, we would save progress to the server
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <OnboardingWizard 
        onComplete={(data) => {
          console.log('Onboarding completed with data:', data);
          // In a real app, we would redirect to the employee dashboard or show a success screen
        }}
        onStepChange={(step, data) => {
          console.log(`Step changed to ${step}`, data);
          // In a real app, we would save progress to the server
        }}
      />
    </div>
  );
};

const TabletOnboarding: React.FC = () => {
  return (
    <DeviceProvider>
      <TabletOnboardingContent />
    </DeviceProvider>
  );
};

export default TabletOnboarding;