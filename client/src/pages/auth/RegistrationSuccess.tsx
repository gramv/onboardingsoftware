import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Card, CardContent } from '../../components/ui/Card';

export const RegistrationSuccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardContent className="pt-6 pb-6">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                <Icon name="Check" size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Registration Complete!
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your account has been created successfully. You can now sign in to access your account.
              </p>
              <Button
                onClick={() => navigate('/auth/login')}
                className="w-full"
              >
                Sign In
              </Button>
              
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
                  What's Next?
                </h3>
                <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-2">
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>Complete your profile information</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>Upload required documents</span>
                  </li>
                  <li className="flex items-start">
                    <Icon name="CheckCircle" size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                    <span>Set up your notification preferences</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegistrationSuccess;