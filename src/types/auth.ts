export interface User {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'hr_admin' | 'manager' | 'employee';
  organizationId: string;
  languagePreference?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
  permissions?: string[];
}

export const PERMISSIONS = {
  CREATE_USER: 'create_user',
  READ_USER: 'read_user',
  UPDATE_USER: 'update_user',
  DELETE_USER: 'delete_user',
  
  CREATE_EMPLOYEE: 'create_employee',
  READ_EMPLOYEE: 'read_employee',
  UPDATE_EMPLOYEE: 'update_employee',
  DELETE_EMPLOYEE: 'delete_employee',
  
  CREATE_ORGANIZATION: 'create_organization',
  READ_ORGANIZATION: 'read_organization',
  UPDATE_ORGANIZATION: 'update_organization',
  DELETE_ORGANIZATION: 'delete_organization',
  
  CREATE_ONBOARDING: 'create_onboarding',
  READ_ONBOARDING: 'read_onboarding',
  UPDATE_ONBOARDING: 'update_onboarding',
  DELETE_ONBOARDING: 'delete_onboarding',
  APPROVE_ONBOARDING: 'approve_onboarding',
  
  CREATE_JOB: 'create_job',
  READ_JOB: 'read_job',
  UPDATE_JOB: 'update_job',
  DELETE_JOB: 'delete_job',
  REVIEW_APPLICATION: 'review_application',
  
  CREATE_DOCUMENT: 'create_document',
  READ_DOCUMENT: 'read_document',
  UPDATE_DOCUMENT: 'update_document',
  DELETE_DOCUMENT: 'delete_document',
  
  MANAGE_SYSTEM: 'manage_system',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  hr_admin: Object.values(PERMISSIONS),
  manager: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.CREATE_EMPLOYEE,
    PERMISSIONS.READ_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.READ_ORGANIZATION,
    PERMISSIONS.CREATE_ONBOARDING,
    PERMISSIONS.READ_ONBOARDING,
    PERMISSIONS.UPDATE_ONBOARDING,
    PERMISSIONS.APPROVE_ONBOARDING,
    PERMISSIONS.CREATE_JOB,
    PERMISSIONS.READ_JOB,
    PERMISSIONS.UPDATE_JOB,
    PERMISSIONS.REVIEW_APPLICATION,
    PERMISSIONS.READ_DOCUMENT,
    PERMISSIONS.UPDATE_DOCUMENT,
    PERMISSIONS.VIEW_ANALYTICS,
  ],
  employee: [
    PERMISSIONS.READ_USER,
    PERMISSIONS.UPDATE_USER,
    PERMISSIONS.READ_EMPLOYEE,
    PERMISSIONS.UPDATE_EMPLOYEE,
    PERMISSIONS.READ_ONBOARDING,
    PERMISSIONS.UPDATE_ONBOARDING,
    PERMISSIONS.READ_JOB,
    PERMISSIONS.READ_DOCUMENT,
    PERMISSIONS.CREATE_DOCUMENT,
  ],
};
