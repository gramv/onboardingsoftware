import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { Card, CardContent } from '../../components/ui/Card';
import { useAuthStore } from '../../stores/authStore';

export const MFASetup: React.FC = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  
  // In a real app, this would come from an API
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretKey, setSecretKey] = useState('');
  
  useEffect(() => {
    const generateMfaDetails = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock QR code and secret key
        setQrCodeUrl('https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=otpauth://totp/MotelManager:demo@example.com?secret=JBSWY3DPEHPK3PXP&issuer=MotelManager');
        setSecretKey('JBSWY3DPEHPK3PXP');
      } catch (error) {
        console.error('Error generating MFA details:', error);
        setError('Failed to generate MFA setup details. Please try again.');
      }
    };
    
    generateMfaDetails();
  }, []);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!verificationCode) {
      setError('Please enter the verification code');
      return;
    }
    
    if (verificationCode.length !== 6 || !/^\d+$/.test(verificationCode)) {
      setError('Verification code must be 6 digits');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // For demo purposes, accept any 6-digit code
      if (user) {
        updateUser({ ...user, mfaEnabled: true });
      }
      
      setIsSetupComplete(true);
    } catch (error) {
      console.error('MFA verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSetupComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                  <Icon name="Check" size={24} className="text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Two-Factor Authentication Enabled
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your account is now protected with two-factor authentication.
                </p>
                <Button
                  onClick={() => {
                    // Redirect based on user role after MFA setup
                    const user = JSON.parse(localStorage.getItem('user') || '{}');
                    switch (user.role) {
                      case 'hr_admin':
                        navigate('/hr-dashboard');
                        break;
                      case 'manager':
                        navigate('/manager-dashboard');
                        break;
                      case 'employee':
                        navigate('/employee-dashboard');
                        break;
                      default:
                        navigate('/hr-dashboard');
                    }
                  }}
                  className="mt-2"
                >
                  Continue to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            <Icon name="Shield" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Set Up Two-Factor Authentication
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Enhance your account security with 2FA
          </p>
        </div>

        <Card>
          <CardContent className="space-y-6 pt-6">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                <div className="flex items-center">
                  <Icon name="AlertCircle" size={16} className="mr-2 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Step 1: Scan QR Code
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
              </p>
              <div className="flex justify-center my-4">
                {qrCodeUrl ? (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code for MFA setup" 
                    className="w-48 h-48 border border-gray-200 dark:border-gray-700 rounded-lg"
                  />
                ) : (
                  <div className="w-48 h-48 border border-gray-200 dark:border-gray-700 rounded-lg flex items-center justify-center">
                    <Icon name="Loader" size={24} className="animate-spin text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-base font-medium text-gray-900 dark:text-white">
                Step 2: Manual Entry
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                If you can't scan the QR code, enter this code manually in your app:
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg text-center">
                <code className="text-lg font-mono tracking-wider text-gray-900 dark:text-white">
                  {secretKey || '...'}
                </code>
              </div>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-base font-medium text-gray-900 dark:text-white">
                  Step 3: Verify Setup
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </p>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-wider"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Icon name="Loader" size={16} className="animate-spin mr-2" />
                    Verifying...
                  </span>
                ) : (
                  'Verify and Enable'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <Icon name="AlertTriangle" size={20} className="text-yellow-600 dark:text-yellow-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Important Security Information
                </h3>
                <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-400">
                  <p>
                    Store your backup codes in a safe place. If you lose access to your authenticator app, you'll need these codes to regain access to your account.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MFASetup;