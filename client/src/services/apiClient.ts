import { tokenService } from './authService';

// Types
interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  retries?: number;
}

class ApiClient {
  private baseURL: string;
  private isRefreshing: boolean = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
  }> = [];

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach(({ resolve, reject }) => {
      if (error) {
        reject(error);
      } else {
        resolve(token);
      }
    });
    
    this.failedQueue = [];
  }

  private async refreshToken(): Promise<string | null> {
    if (this.isRefreshing) {
      // If already refreshing, wait for it to complete
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const newToken = data.accessToken;
        
        // Store the new token
        tokenService.setTokens(newToken, '', false);
        
        this.processQueue(null, newToken);
        this.isRefreshing = false;
        
        return newToken;
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      this.processQueue(error, null);
      this.isRefreshing = false;
      
      // Clear invalid tokens and redirect to login
      tokenService.clearTokens();
      if (window.location.pathname !== '/auth/login') {
        window.location.href = '/auth/login';
      }
      
      return null;
    }
  }

  async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<ApiResponse<T>> {
    const {
      skipAuth = false,
      retries = 1,
      ...requestConfig
    } = config;

    const url = `${this.baseURL}${endpoint}`;
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...requestConfig.headers as Record<string, string>,
    };

    // Add authentication header if not skipped
    if (!skipAuth) {
      const token = tokenService.getAccessToken();
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
    }

    try {
      const response = await fetch(url, {
        ...requestConfig,
        headers,
      });

      // Handle 401 - Token expired or invalid
      if (response.status === 401 && !skipAuth && retries > 0) {
        const newToken = await this.refreshToken();
        if (newToken) {
          // Retry with new token
          return this.request(endpoint, { ...config, retries: retries - 1 });
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        return {
          success: true,
          data: data.data || data,
          message: data.message,
        };
      } else {
        return {
          success: false,
          error: data.error || data.message || `HTTP ${response.status}`,
          data: data,
        };
      }
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Convenience methods
  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Create and export API client instance
export const apiClient = new ApiClient('/api');

// Export types
export type { ApiResponse, RequestConfig }; 