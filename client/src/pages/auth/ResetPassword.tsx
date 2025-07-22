import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  // Calculate password strength
  const getStrength = (password: string): number => {
    if (!password) return 0;
    
    let score = 0;
    
    // Length check
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    
    // Complexity checks
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    
    return Math.min(5, score);
  };
  
  const strength = getStrength(password);
  
  const getStrengthLabel = (strength: number): string => {
    if (strength === 0) return 'Very Weak';
    if (strength === 1) return 'Weak';
    if (strength === 2) return 'Fair';
    if (strength === 3) return 'Good';
    if (strength === 4) return 'Strong';
    return 'Very Strong';
  };
  
  const getStrengthColor = (strength: number): string => {
    if (strength === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    if (strength === 4) return 'bg-green-500';
    return 'bg-emerald-500';
  };
  
  return (
    <div className="mt-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
          Password strength:
        </span>
        <span className={`text-xs font-medium ${
          strength <= 1 ? 'text-red-600' : 
          strength === 2 ? 'text-orange-600' : 
          strength === 3 ? 'text-yellow-600' : 
          'text-green-600'
        }`}>
          {getStrengthLabel(strength)}
        </span>
      </div>
      <div className="h-1.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div 
          className={`h-full ${getStrengthColor(strength)} transition-all duration-300`}
          style={{ width: `${(strength / 5) * 100}%` }}
        />
      </div>
      {password && (
        <ul className="mt-2 text-xs space-y-1 text-gray-600 dark:text-gray-400">
          <li className={`flex items-center ${password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
            <Icon name={password.length >= 8 ? 'Check' : 'X'} size={12} className="mr-1" />
            At least 8 characters
          </li>
          <li className={`flex items-center ${/[A-Z]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
            <Icon name={/[A-Z]/.test(password) ? 'Check' : 'X'} size={12} className="mr-1" />
            At least one uppercase letter
          </li>
          <li className={`flex items-center ${/[0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
            <Icon name={/[0-9]/.test(password) ? 'Check' : 'X'} size={12} className="mr-1" />
            At least one number
          </li>
          <li className={`flex items-center ${/[^A-Za-z0-9]/.test(password) ? 'text-green-600 dark:text-green-400' : ''}`}>
            <Icon name={/[^A-Za-z0-9]/.test(password) ? 'Check' : 'X'} size={12} className="mr-1" />
            At least one special character
          </li>
        </ul>
      )}
    </div>
  );
};

export const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    password: '',
    confirmPassword: '',
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState<boolean | null>(null);
  const [isResetComplete, setIsResetComplete] = useState(false);

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsTokenValid(false);
        return;
      }
      
      try {
        // In a real app, this would be an API call to validate the token
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, we'll consider any token valid except "invalid"
        setIsTokenValid(token !== 'invalid');
      } catch (error) {
        console.error('Token validation error:', error);
        setIsTokenValid(false);
      }
    };
    
    validateToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear error when field is edited
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: '',
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/[A-Z]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter';
    } else if (!/[0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one special character';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // In a real app, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Simulate successful password reset
      setIsResetComplete(true);
    } catch (error) {
      console.error('Password reset error:', error);
      setErrors({
        ...errors,
        form: 'An error occurred while resetting your password. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isTokenValid === null) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="animate-spin mx-auto w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Validating your reset link...</p>
        </div>
      </div>
    );
  }

  if (isTokenValid === false) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="pt-6 pb-6">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                  <Icon name="X" size={24} className="text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Invalid or Expired Link
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  This password reset link is invalid or has expired.
                </p>
                <Button
                  onClick={() => navigate('/auth/forgot-password')}
                  className="mt-2"
                >
                  Request New Link
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isResetComplete) {
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
                  Password Reset Complete
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your password has been successfully reset.
                </p>
                <Button
                  onClick={() => navigate('/auth/login')}
                  className="mt-2"
                >
                  Sign In
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
            <Icon name="Building" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create a new secure password for your account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {errors.form && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <div className="flex items-center">
                    <Icon name="AlertCircle" size={16} className="mr-2 flex-shrink-0" />
                    <span>{errors.form}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
                <PasswordStrengthIndicator password={formData.password} />
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                  disabled={isLoading}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Icon name="Loader" size={16} className="animate-spin mr-2" />
                    Resetting password...
                  </span>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Remember your password?{' '}
            <Link to="/auth/login" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;