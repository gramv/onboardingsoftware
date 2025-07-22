export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'hr_admin' | 'manager' | 'employee';
  organizationId: string;
  languagePreference: 'en' | 'es';
  isActive: boolean;
  mfaEnabled: boolean;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  permissions: string[];
}