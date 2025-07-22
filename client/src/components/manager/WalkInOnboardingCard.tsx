import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

const WalkInOnboardingCard: React.FC = () => {
  return (
    <Card className="h-full">
      <CardContent className="p-6">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
            <Icon name="UserPlus" className="text-green-600" />
          </div>
          <h3 className="text-lg font-semibold">Walk-In Onboarding</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          Create onboarding sessions for walk-in candidates and provide them with a tablet to complete the process on-site.
        </p>
        
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-start">
            <Icon name="CheckCircle" className="text-green-500 mr-2 mt-0.5" size={16} />
            <span>Quick employee creation</span>
          </div>
          <div className="flex items-start">
            <Icon name="CheckCircle" className="text-green-500 mr-2 mt-0.5" size={16} />
            <span>Tablet-optimized interface</span>
          </div>
          <div className="flex items-start">
            <Icon name="CheckCircle" className="text-green-500 mr-2 mt-0.5" size={16} />
            <span>QR code for easy access</span>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="px-6 pb-6 pt-0">
        <Link to="/manager/onboarding/walkin" className="w-full">
          <Button className="w-full">
            <Icon name="Plus" className="mr-2" size={16} />
            Start Walk-In Onboarding
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

export default WalkInOnboardingCard;