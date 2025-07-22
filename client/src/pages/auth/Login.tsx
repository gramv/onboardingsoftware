import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { authService, tokenService } from '../../services/authService';
import { Button } from '../../components/ui/Button';
import { Icon } from '../../components/ui/Icon';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardFooter } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
  mfaCode?: string;
}

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();

  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
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

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    if (showMfa && !formData.mfaCode) {
      newErrors.mfaCode = 'MFA code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      console.log('Attempting login with credentials:', { email: formData.email, rememberMe: formData.rememberMe });

      // Use the actual auth service with real backend
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
        mfaCode: formData.mfaCode,
        rememberMe: formData.rememberMe,
      });

      console.log('Login successful, user:', response.user.firstName, response.user.role);

      // Update auth store with user data and permissions
      login(response.user, response.permissions);

      // Role-based redirect system
      switch (response.user.role) {
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
          navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle MFA requirement
      if (error.message === 'MFA code required') {
        setShowMfa(true);
        setLoginError('Please enter your authentication code to continue.');
        return;
      }

      // Handle different error types
      if (error.message.includes('Invalid email or password')) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.message.includes('inactive')) {
        setLoginError('Your account has been temporarily locked. Please try again later.');
      } else if (error.message.includes('MFA') && error.message.includes('Invalid')) {
        setErrors({ mfaCode: 'Invalid authentication code. Please try again.' });
      } else if (error.message.includes('Server error')) {
        setLoginError('Server error occurred. Please try again in a few moments.');
      } else if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
        setLoginError('Unable to connect to the server. Please check your internet connection and try again.');
      } else {
        setLoginError(error.message || 'An error occurred during login. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 bg-primary-600 rounded-lg flex items-center justify-center mb-4">
            <Icon name="Building" size={24} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Motel Manager
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4 pt-6">
              {loginError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  <div className="flex items-center">
                    <Icon name="AlertCircle" size={16} className="mr-2 flex-shrink-0" />
                    <span>{loginError}</span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoading || showMfa}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={errors.password ? 'border-red-500' : ''}
                  disabled={isLoading || showMfa}
                />
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              {showMfa && (
                <div className="space-y-2">
                  <label htmlFor="mfaCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Authentication Code
                  </label>
                  <div className="relative">
                    <Input
                      id="mfaCode"
                      name="mfaCode"
                      type="text"
                      value={formData.mfaCode || ''}
                      onChange={handleChange}
                      placeholder="123456"
                      className={errors.mfaCode ? 'border-red-500' : ''}
                      disabled={isLoading}
                      maxLength={6}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <Badge variant="gray" className="bg-gray-100 dark:bg-gray-800">
                        MFA
                      </Badge>
                    </div>
                  </div>
                  {errors.mfaCode && (
                    <p className="text-sm text-red-600">{errors.mfaCode}</p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Enter the 6-digit code from your authenticator app
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    name="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={handleChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <Link to="/auth/forgot-password" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                    Forgot your password?
                  </Link>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <Icon name="Loader" size={16} className="animate-spin mr-2" />
                    {showMfa ? 'Verifying...' : 'Signing in...'}
                  </span>
                ) : (
                  <span>{showMfa ? 'Verify Code' : 'Sign In'}</span>
                )}
              </Button>

              <p className="text-center text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <Link to="/auth/register" className="text-primary-600 hover:text-primary-500 dark:text-primary-400">
                  Register
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Enter your credentials to sign in to your account
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;