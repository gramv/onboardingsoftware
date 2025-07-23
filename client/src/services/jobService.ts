const API_BASE_URL = '/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

const handleApiResponse = async <T>(response: Response): Promise<ApiResponse<T>> => {
  const data = await response.json();
  return data;
};

export const jobService = {
  getPublicJobPostings: async (): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/jobs/public`);
    return handleApiResponse(response);
  },

  getPropertyJobPostings: async (propertyId: string): Promise<ApiResponse<any[]>> => {
    const response = await fetch(`${API_BASE_URL}/jobs/public?property=${propertyId}`);
    return handleApiResponse(response);
  },

  getPropertyInfo: async (propertyId: string): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/organizations/${propertyId}`);
    return handleApiResponse(response);
  },

  getPositionsByDepartment: async (propertyId: string, department: string): Promise<ApiResponse<string[]>> => {
    const response = await fetch(`${API_BASE_URL}/jobs/positions?property=${propertyId}&department=${department}`);
    return handleApiResponse(response);
  },

  submitJobApplication: async (applicationData: any): Promise<ApiResponse<any>> => {
    const response = await fetch(`${API_BASE_URL}/jobs/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicationData),
    });
    return handleApiResponse(response);
  },
};
