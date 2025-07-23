
import { apiCall } from './apiService';

interface OnboardingSession {
  id: string;
  employeeId: string;
  token: string;
  languagePreference: string;
  currentStep?: string;
  formData: any;
  status: string;
  expiresAt: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface WalkInOnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  position: string;
  department: string;
  hourlyRate: number;
  organizationId: string;
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  retryCount?: number;
}

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2
};

const handleServiceError = (error: any, context: string): ServiceResponse<never> => {
  console.error(`[${context}] Service error:`, error);
  
  if (error.response) {
    return {
      success: false,
      error: error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`
    };
  } else if (error.request) {
    return {
      success: false,
      error: 'Network error - please check your connection'
    };
  } else {
    return {
      success: false,
      error: error.message || 'Unknown error occurred'
    };
  }
};

const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  context: string
): Promise<ServiceResponse<T>> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const result = await operation();
      return {
        success: true,
        data: result,
        retryCount: attempt
      };
    } catch (error) {
      lastError = error;
      
      if (attempt === config.maxRetries) {
        break;
      }
      
      const delay = config.retryDelay * Math.pow(config.backoffMultiplier, attempt);
      console.warn(`[${context}] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return handleServiceError(lastError, context);
};

// Session cache to reduce redundant API calls
class SessionCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }
  
  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const sessionCache = new SessionCache();

export const onboardingService = {
  // Validate onboarding token (public endpoint)
  validateToken: async (token: string): Promise<ServiceResponse<{
    session: OnboardingSession;
    employee: {
      id: string;
      name: string;
      firstName: string;
      lastName: string;
      email: string;
      position: string;
      department: string;
      startDate: string;
      manager: string;
      organizationName: string;
    };
  }>> => {
    const cacheKey = `validate-token-${token}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    return retryWithBackoff(async () => {
      const response = await apiCall<{
        success: boolean;
        session: OnboardingSession;
        employee: any;
      }>('/onboarding/validate-token', 'POST', { token }, { skipAuth: true });
      
      // Extract the actual data from the nested response structure
      const result = {
        session: response.session,
        employee: response.employee
      };
      
      sessionCache.set(cacheKey, result, 300000); // 5 minute cache
      return { success: true, data: result };
    }, DEFAULT_RETRY_CONFIG, 'validateToken');
  },

  // Start onboarding session
  startOnboarding: async (employeeId: string, token: string, languagePreference?: string): Promise<ServiceResponse<{
    message: string;
    session: OnboardingSession & {
      employee: {
        firstName: string;
        lastName: string;
        organizationName: string;
      };
    };
  }>> => {
    return retryWithBackoff(async () => {
      const response = await apiCall<{
        message: string;
        session: any;
      }>('/onboarding/start', 'POST', {
        employeeId,
        token,
        languagePreference
      }, { skipAuth: true });
      
      return response;
    }, DEFAULT_RETRY_CONFIG, 'startOnboarding');
  },

  // Get onboarding session with caching
  getSession: async (sessionId: string): Promise<ServiceResponse<{ session: OnboardingSession }>> => {
    const cacheKey = `session-${sessionId}`;
    const cached = sessionCache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    try {
      const response = await apiCall<{ session: OnboardingSession }>(`/onboarding/session/${sessionId}`, 'GET', undefined, { skipAuth: true });
      
      const sessionData = { session: response.session };
      sessionCache.set(cacheKey, sessionData, 60000);
      return { success: true, data: sessionData };
    } catch (error) {
      return handleServiceError(error, 'getSession');
    }
  },

  // Update onboarding progress with retry
  updateProgress: async (token: string, data: { currentStep?: string; formData?: any; languagePreference?: string }): Promise<ServiceResponse<{ session: OnboardingSession }>> => {
    try {
      const response = await apiCall<{ session: OnboardingSession }>('/onboarding/update-progress', 'PUT', { 
        token, 
        ...data 
      }, { skipAuth: true });
      
      sessionCache.clear(`session-${token}`);
      const sessionData = { session: response.session };
      return { success: true, data: sessionData };
    } catch (error) {
      return handleServiceError(error, 'updateProgress');
    }
  },

  // Submit onboarding forms with orchestration
  submitForms: async (sessionId: string, i9Data: any, w4Data: any, language: string = 'en'): Promise<ServiceResponse<{
    success: boolean;
    submissionId: string;
    message: string;
    data: {
      formData: any;
      nextStep: string;
    };
  }>> => {
    try {
      // Validate form data before submission
      if (!i9Data || !w4Data) {
        throw new Error('Both I-9 and W-4 form data are required');
      }

      return retryWithBackoff(async () => {
        const response = await apiCall<{
          success: boolean;
          submissionId: string;
          message: string;
          data: any;
        }>(`/onboarding/session/${sessionId}/forms`, 'POST', {
          i9Data,
          w4Data,
          language
        }, { skipAuth: true });
        
        if (!response.success) {
          throw new Error(response.data?.message || 'Failed to submit forms');
        }
        
        // Clear cache after successful submission
        sessionCache.clear(`session-${sessionId}`);
        return response.data;
      }, DEFAULT_RETRY_CONFIG, 'submitForms');
    } catch (error) {
      return handleServiceError(error, 'submitForms');
    }
  },

  // Submit signature with validation
  submitSignature: async (sessionId: string, signatureBase64: string, documentIds?: string[]): Promise<ServiceResponse<{
    success: boolean;
    message: string;
    data: {
      signatureData: any;
      nextStep: string;
    };
  }>> => {
    try {
      if (!signatureBase64 || signatureBase64.length < 100) {
        throw new Error('Invalid signature data provided');
      }

      return retryWithBackoff(async () => {
        const response = await apiCall<{
          success: boolean;
          message: string;
          data: any;
        }>(`/onboarding/session/${sessionId}/signature`, 'POST', {
          signatureBase64,
          documentIds
        }, { skipAuth: true });
        
        if (!response.success) {
          throw new Error(response.data?.message || 'Failed to submit signature');
        }
        
        sessionCache.clear(`session-${sessionId}`);
        return response.data;
      }, DEFAULT_RETRY_CONFIG, 'submitSignature');
    } catch (error) {
      return handleServiceError(error, 'submitSignature');
    }
  },

  // Submit completed onboarding with validation
  submitOnboarding: async (token: string, formData: any): Promise<ServiceResponse<any>> => {
    try {
      if (!token || !formData) {
        throw new Error('Token and form data are required');
      }

      return retryWithBackoff(async () => {
        const response = await apiCall<any>('/onboarding/complete', 'POST', {
          token,
          finalData: formData
        }, { skipAuth: true });
        
        if (!response.success) {
          throw new Error(response.data?.message || 'Failed to complete onboarding');
        }
        
        // Clear all cached data for this session
        sessionCache.clear(`session-${token}`);
        sessionCache.clear(`validate-token-${token}`);
        
        return response.data;
      }, DEFAULT_RETRY_CONFIG, 'submitOnboarding');
    } catch (error) {
      return handleServiceError(error, 'submitOnboarding');
    }
  },

  // Manager: Create walk-in onboarding session with validation
  createWalkInOnboarding: async (data: WalkInOnboardingData): Promise<ServiceResponse<any>> => {
    try {
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'position', 'department', 'organizationId'];
      const missingFields = requiredFields.filter(field => !data[field as keyof WalkInOnboardingData]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      return retryWithBackoff(async () => {
        const response = await apiCall<any>('/walkin-onboarding/create', 'POST', data);
        
        // apiCall already handles success/error and returns the data on success
        // The response here is the actual API response data
        return response;
      }, DEFAULT_RETRY_CONFIG, 'createWalkInOnboarding');
    } catch (error) {
      return handleServiceError(error, 'createWalkInOnboarding');
    }
  },

  // Manager: Get active walk-in onboarding sessions with caching
  getActiveWalkInSessions: async (): Promise<ServiceResponse<any[]>> => {
    const cacheKey = 'active-walkin-sessions';
    const cached = sessionCache.get(cacheKey);
    if (cached) return { success: true, data: cached };

    return retryWithBackoff(async () => {
      const response = await apiCall<{ success: boolean; data: any[] }>('/walkin-onboarding/active', 'GET');
      
      // apiCall now returns the full response: { success: true, data: [...] }
      const sessions = response.data || [];
      sessionCache.set(cacheKey, sessions, 60000); // 1 minute cache
      return sessions;
    }, DEFAULT_RETRY_CONFIG, 'getActiveWalkInSessions');
  },

  // Manager: Get QR code for walk-in onboarding
  getWalkInQrCode: async (sessionId: string) => {
    return apiCall<any>(`/walkin-onboarding/qr/${sessionId}`, 'GET');
  },

  // Manager: Approve onboarding
  approveOnboarding: async (sessionId: string, comments?: string) => {
    return apiCall<any>(`/onboarding/session/${sessionId}/approve`, 'POST', {
      comments,
      approverType: 'manager'
    });
  },

  // HR: Final approve onboarding
  hrApproveOnboarding: async (sessionId: string, comments?: string) => {
    return apiCall<any>(`/onboarding/session/${sessionId}/approve`, 'POST', {
      comments,
      approverType: 'hr_admin'
    });
  },

  // Manager/HR: Reject onboarding
  rejectOnboarding: async (sessionId: string, comments: string, rejectorType: 'manager' | 'hr_admin' = 'manager') => {
    return apiCall<any>(`/onboarding/session/${sessionId}/reject`, 'POST', {
      comments,
      rejectorType
    });
  },

  // Manager/HR: List onboarding sessions
  listSessions: async (filters: any = {}) => {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    return apiCall<any>(`/onboarding/sessions?${queryParams.toString()}`, 'GET');
  },

  // Upload document during onboarding
  uploadDocument: async (sessionId: string, file: File, documentType: 'drivers_license' | 'ssn_card' | 'passport' | 'other') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('sessionId', sessionId);
    formData.append('documentType', documentType);
    formData.append('documentName', file.name);

    // Use fetch directly since this is a file upload with FormData
    const response = await fetch('/api/documents/onboarding-upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      documentId: result.data?.documentId,
      ocrResult: result.data?.ocrResult || null,
      document: result.data
    };
  },

  // Process document with OCR (when available)
  processDocumentOCR: async (documentId: string, language: 'en' | 'es' = 'en') => {
    return apiCall<{
      success: boolean;
      ocrResult: any;
    }>('/ocr/process', 'POST', { documentId, language }, { skipAuth: true });
  },

  // Get OCR results for a document
  getOCRResults: async (documentId: string) => {
    return apiCall<{
      success: boolean;
      data: any;
    }>(`/ocr/${documentId}`, 'GET', undefined, { skipAuth: true });
  },

  // Manager: Get pending reviews
  getPendingReviews: async () => {
    return apiCall<{
      success: boolean;
      data: any[];
    }>('/onboarding/pending-reviews', 'GET');
  },

  // Manager: Submit review
  submitReview: async (sessionId: string, reviewData: {
    action: 'approve' | 'reject' | 'request_changes';
    notes: string;
    reviewedBy: string;
  }) => {
    return apiCall<{
      success: boolean;
      message: string;
    }>(`/onboarding/session/${sessionId}/review`, 'POST', reviewData);
  }
};
