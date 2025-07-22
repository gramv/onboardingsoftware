import { apiClient, ApiResponse } from './apiClient';

/**
 * Generic API call function that wraps the apiClient
 * This provides a simpler interface for making API calls
 */
export async function apiCall<T = any>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any,
  config?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  let response: ApiResponse<T>;

  switch (method) {
    case 'GET':
      response = await apiClient.get<T>(endpoint, config);
      break;
    case 'POST':
      response = await apiClient.post<T>(endpoint, data, config);
      break;
    case 'PUT':
      response = await apiClient.put<T>(endpoint, data, config);
      break;
    case 'DELETE':
      response = await apiClient.delete<T>(endpoint, config);
      break;
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }

  if (response.success) {
    // For the walk-in onboarding API, we need to return the full response
    // because it has the structure { success: true, data: [...] }
    return response as T;
  } else {
    throw new Error(response.error || 'API call failed');
  }
}

// Export the apiClient for direct use if needed
export { apiClient };
export type { ApiResponse } from './apiClient';