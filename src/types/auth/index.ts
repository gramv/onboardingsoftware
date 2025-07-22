import { User, UserRole } from '@prisma/client';

// Added comment to trigger hooks - i18n compliance check
export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  languagePreference?: 'en' | 'es';
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaCode?: string;
  deviceId?: string;
}

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  phone?: string;
  languagePreference?: 'en' | 'es';
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: PublicUser;
  permissions: string[];
}

export interface RefreshTokenData {
  userId: string;
  tokenFamily: string;
  expiresAt: Date;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  organizationId: string;
  languagePreference: 'en' | 'es';
  isActive: boolean;
  mfaEnabled: boolean;
}

export interface MFASetupResponse {
  secret: string;
  qrCodeUrl: string;
}

export const mapToPublicUser = (user: User): PublicUser => {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId,
    languagePreference: user.languagePreference,
    isActive: user.isActive,
    mfaEnabled: user.mfaEnabled,
  };
};

// Role-based permissions
export const PERMISSIONS = {
  // HR Admin permissions
  VIEW_ALL_ORGANIZATIONS: 'view:all-organizations',
  MANAGE_ORGANIZATIONS: 'manage:organizations',
  VIEW_ALL_EMPLOYEES: 'view:all-employees',
  MANAGE_ALL_EMPLOYEES: 'manage:all-employees',
  APPROVE_ONBOARDING: 'approve:onboarding',
  MANAGE_PAYROLL: 'manage:payroll',
  
  // Manager permissions
  VIEW_ORGANIZATION_EMPLOYEES: 'view:organization-employees',
  MANAGE_ORGANIZATION_EMPLOYEES: 'manage:organization-employees',
  INITIATE_ONBOARDING: 'initiate:onboarding',
  APPROVE_TIMESHEETS: 'approve:timesheets',
  MANAGE_SCHEDULES: 'manage:schedules',
  
  // Employee permissions
  VIEW_PROFILE: 'view:profile',
  EDIT_PROFILE: 'edit:profile',
  VIEW_DOCUMENTS: 'view:documents',
  TRACK_TIME: 'track:time',
  VIEW_SCHEDULE: 'view:schedule',
};

// Map roles to permissions
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  hr_admin: [
    PERMISSIONS.VIEW_ALL_ORGANIZATIONS,
    PERMISSIONS.MANAGE_ORGANIZATIONS,
    PERMISSIONS.VIEW_ALL_EMPLOYEES,
    PERMISSIONS.MANAGE_ALL_EMPLOYEES,
    PERMISSIONS.APPROVE_ONBOARDING,
    PERMISSIONS.MANAGE_PAYROLL,
    PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES,
    PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES,
    PERMISSIONS.INITIATE_ONBOARDING,
    PERMISSIONS.APPROVE_TIMESHEETS,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.TRACK_TIME,
    PERMISSIONS.VIEW_SCHEDULE,
  ],
  manager: [
    PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES,
    PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES,
    PERMISSIONS.INITIATE_ONBOARDING,
    PERMISSIONS.APPROVE_TIMESHEETS,
    PERMISSIONS.MANAGE_SCHEDULES,
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.TRACK_TIME,
    PERMISSIONS.VIEW_SCHEDULE,
  ],
  employee: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.VIEW_DOCUMENTS,
    PERMISSIONS.TRACK_TIME,
    PERMISSIONS.VIEW_SCHEDULE,
  ],
};