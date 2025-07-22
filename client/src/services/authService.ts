import { User } from '../types/auth';

// Base API URL - use Vite proxy for development
const API_URL = '/api';

// Types for API requests and responses
interface LoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

interface RegisterRequest {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: 'hr_admin' | 'manager' | 'employee';
  organizationId: string;
  phone?: string;
  languagePreference?: 'en' | 'es';
}

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string; // Backend may include this, but we'll use HTTP-only cookie
  permissions: string[];
}

interface RefreshTokenResponse {
  accessToken: string;
}

interface ResetPasswordRequest {
  token: string;
  password: string;
}

interface MfaSetupResponse {
  qrCodeUrl: string;
  secretKey: string;
}

interface MfaVerifyRequest {
  code: string;
}

// Helper function for API calls
const apiCall = async <T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> => {
  const url = `${API_URL}${endpoint}`;
  const token = tokenService.getAccessToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const config: RequestInit = {
    method,
    headers,
    credentials: 'include', // Include cookies for refresh token
  };
  
  if (data && method !== 'GET') {
    config.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, config);
    
    // Handle 401 errors by attempting token refresh
    if (response.status === 401 && endpoint !== '/auth/login' && endpoint !== '/auth/refresh') {
      console.log('Received 401, attempting token refresh...');
      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        console.log('Token refresh successful, retrying original request');
        // Retry the original request with new token
        const newToken = tokenService.getAccessToken();
        if (newToken) {
          const newHeaders = { ...headers, Authorization: `Bearer ${newToken}` };
          const retryResponse = await fetch(url, { 
            ...config, 
            headers: newHeaders 
          });
          
          if (!retryResponse.ok) {
            const errorText = await retryResponse.text();
            console.error('Retry request failed:', retryResponse.status, errorText);
            throw new Error(`HTTP error! status: ${retryResponse.status}`);
          }
          
          return await retryResponse.json();
        }
      }
      
      // If refresh failed, redirect to login
      console.log('Token refresh failed, redirecting to login');
      tokenService.clearTokens();
      window.location.href = '/auth/login';
      throw new Error('Authentication failed');
    }
    
    if (!response.ok) {
      let errorMessage = `HTTP error! status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        // If response is not JSON, use status text
        errorMessage = response.statusText || errorMessage;
      }
      console.error('API error response:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Helper function to attempt token refresh
const attemptTokenRefresh = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      tokenService.setTokens(data.accessToken, '', false); // Refresh token is in httpOnly cookie
      return true;
    }
    return false;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return false;
  }
};

// Auth service functions
export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      console.log('Attempting login with backend database...');
      
      // Make API call to backend for authentication
      const url = `${API_URL}/auth/login`;
      console.log('Login URL:', url);
      
      // Send credentials to backend for validation against database
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for refresh token
        body: JSON.stringify(credentials),
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = response.statusText || errorMessage;
        }
        console.error('Login error response:', errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('Login successful, response data:', data);
      
      // Store the access token (refresh token is handled via httpOnly cookie)
      tokenService.setTokens(data.accessToken, '', credentials.rememberMe || false);
      
      console.log('Login successful, user role:', data.user.role);
      return data;
    } catch (error) {
      console.error('Login failed:', error);
      
      // Check for specific error messages
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (errorMessage.includes('MFA')) {
        throw new Error('MFA code required');
      } else if (errorMessage.includes('inactive')) {
        throw new Error('User account is inactive');
      } else if (errorMessage.includes('Invalid')) {
        throw new Error('Invalid email or password');
      } else if (errorMessage.includes('Internal Server Error')) {
        // Handle server errors more gracefully
        throw new Error('Server error occurred. Please try again later.');
      }
      
      throw error;
    }
  },
  
  register: async (userData: RegisterRequest): Promise<{ success: boolean; userId?: string }> => {
    try {
      const response = await apiCall<{ message: string; userId: string }>('/auth/register', 'POST', userData);
      return { success: true, userId: response.userId };
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },
  
  logout: async (): Promise<void> => {
    try {
      console.log('Logging out and invalidating refresh token...');
      // Call the backend logout endpoint to invalidate the refresh token
      await apiCall<{ message: string }>('/auth/logout', 'POST');
      console.log('Logout API call successful');
    } catch (error) {
      // Even if the API call fails, we should clear local tokens
      console.warn('Logout API call failed, but clearing local tokens:', error);
    } finally {
      // Always clear local tokens
      tokenService.clearTokens();
    }
  },
  
  refreshToken: async (): Promise<RefreshTokenResponse> => {
    console.log('Attempting to refresh token...');
    try {
      // Use the refresh endpoint (refresh token is sent via httpOnly cookie)
      const response = await apiCall<RefreshTokenResponse>('/auth/refresh', 'POST');
      console.log('Token refresh successful');
      return response;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  },
  
  forgotPassword: async (email: string): Promise<{ success: boolean }> => {
    try {
      await apiCall<{ message: string }>('/auth/forgot-password', 'POST', { email });
      return { success: true };
    } catch (error) {
      console.error('Forgot password error:', error);
      return { success: false };
    }
  },
  
  resetPassword: async (data: ResetPasswordRequest): Promise<{ success: boolean }> => {
    try {
      await apiCall<{ message: string }>('/auth/reset-password', 'POST', data);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false };
    }
  },
  
  setupMfa: async (): Promise<MfaSetupResponse> => {
    try {
      const response = await apiCall<{ secret: string; qrCodeUrl: string }>('/auth/mfa/setup', 'POST');
      return {
        secretKey: response.secret,
        qrCodeUrl: response.qrCodeUrl,
      };
    } catch (error) {
      console.error('MFA setup error:', error);
      throw error;
    }
  },
  
  verifyMfa: async (data: MfaVerifyRequest): Promise<{ success: boolean }> => {
    try {
      await apiCall<{ message: string }>('/auth/mfa/verify', 'POST', data);
      return { success: true };
    } catch (error) {
      console.error('MFA verify error:', error);
      return { success: false };
    }
  },
  
  // Method to check if user is authenticated with valid token
  checkAuth: async (): Promise<boolean> => {
    try {
      const token = tokenService.getAccessToken();
      if (!token) {
        return false;
      }
      
      // Try to refresh the token - if it works, the user is authenticated
      // If it fails, the user is not authenticated
      try {
        await authService.refreshToken();
        return true;
      } catch (error) {
        console.error('Token refresh failed during auth check:', error);
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }
};

// Token management
export const tokenService = {
  // Store tokens securely
  setTokens: (accessToken: string, _refreshToken: string, rememberMe: boolean = false): void => {
    // Store access token in localStorage/sessionStorage based on rememberMe preference
    const storage = rememberMe ? localStorage : sessionStorage;
    
    if (accessToken) {
      storage.setItem('accessToken', accessToken);
      
      // Store token expiration time (default to 15 minutes if not extractable)
      try {
        // JWT tokens are in format: header.payload.signature
        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        if (payload.exp) {
          storage.setItem('tokenExpiration', payload.exp.toString());
        } else {
          // Default expiration: current time + 15 minutes
          const expiration = Math.floor(Date.now() / 1000) + 15 * 60;
          storage.setItem('tokenExpiration', expiration.toString());
        }
      } catch (error) {
        console.warn('Could not parse token expiration, using default', error);
        const expiration = Math.floor(Date.now() / 1000) + 15 * 60;
        storage.setItem('tokenExpiration', expiration.toString());
      }
    }
    
    // Note: refreshToken parameter is renamed to _refreshToken to indicate it's not used
    // since refresh token is stored as httpOnly cookie by backend
  },
  
  // Get access token
  getAccessToken: (): string | null => {
    // Try localStorage first, then sessionStorage
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    
    // Check if token is expired
    if (token) {
      const expiration = localStorage.getItem('tokenExpiration') || sessionStorage.getItem('tokenExpiration');
      if (expiration) {
        const expirationTime = parseInt(expiration, 10);
        const currentTime = Math.floor(Date.now() / 1000);
        
        // If token is expired, return null (will trigger refresh)
        if (currentTime >= expirationTime) {
          console.log('Token expired, will need refresh');
          return null;
        }
      }
    }
    
    return token;
  },
  
  // Check if token is about to expire (within 1 minute)
  isTokenExpiringSoon: (): boolean => {
    const expiration = localStorage.getItem('tokenExpiration') || sessionStorage.getItem('tokenExpiration');
    if (!expiration) return false;
    
    const expirationTime = parseInt(expiration, 10);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Return true if token expires within 60 seconds
    return expirationTime - currentTime < 60;
  },
  
  // Clear tokens on logout
  clearTokens: (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('tokenExpiration');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('tokenExpiration');
    // Note: httpOnly refresh token cookie will be cleared by the backend
  },
};

// Automatic token refresh setup
let refreshPromise: Promise<string> | null = null;
let refreshInterval: number | null = null;

export const setupTokenRefresh = () => {
  // Function to refresh token
  const refreshAccessToken = async (): Promise<string> => {
    if (!refreshPromise) {
      refreshPromise = authService.refreshToken()
        .then(response => {
          tokenService.setTokens(response.accessToken, '', false);
          setTimeout(() => { refreshPromise = null; }, 1000); // Prevent multiple simultaneous refreshes
          return response.accessToken;
        })
        .catch(error => {
          // If refresh fails, log out the user
          console.error('Token refresh failed in background:', error);
          tokenService.clearTokens();
          window.location.href = '/auth/login';
          throw error;
        });
    }
    
    return refreshPromise;
  };
  
  // Set up periodic token refresh check
  if (!refreshInterval) {
    refreshInterval = window.setInterval(() => {
      // Check if token exists and is about to expire
      const token = tokenService.getAccessToken();
      if (token && tokenService.isTokenExpiringSoon()) {
        console.log('Token is about to expire, refreshing proactively...');
        refreshAccessToken().catch(err => {
          console.error('Background token refresh failed:', err);
        });
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Clean up interval on page unload
  window.addEventListener('beforeunload', () => {
    if (refreshInterval !== null) {
      clearInterval(refreshInterval);
      refreshInterval = null;
    }
  });
  
  return refreshAccessToken;
};