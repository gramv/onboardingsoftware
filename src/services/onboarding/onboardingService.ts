import { OnboardingStatus, LanguageCode } from '@prisma/client';
import { OnboardingRepository, CreateOnboardingSessionData, UpdateOnboardingSessionData, OnboardingSessionFilters, OnboardingSessionWithEmployee } from '@/repositories/onboarding.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { PaginatedResponse } from '@/repositories/base.repository';
import { translationService, ONBOARDING_ERROR_KEYS } from '@/utils/i18n/translationService';

export interface CreateOnboardingSessionRequest {
  employeeId: string;
  languagePreference?: LanguageCode;
  expirationHours?: number;
  currentStep?: string;
  formData?: any;
}

export interface UpdateOnboardingProgressRequest {
  currentStep?: string;
  formData?: any;
  languagePreference?: LanguageCode;
  status?: OnboardingStatus;
}

export interface OnboardingSessionResponse {
  id: string;
  employeeId: string;
  token: string;
  languagePreference: LanguageCode;
  currentStep?: string;
  formData: any;
  status: OnboardingStatus;
  expiresAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  employee: {
    id: string;
    employeeId: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      organization: {
        id: string;
        name: string;
        type: string;
      };
    };
  };
}

export interface OnboardingValidationResult {
  isValid: boolean;
  isExpired: boolean;
  session?: OnboardingSessionWithEmployee;
  error?: string;
}

export class OnboardingService {
  private onboardingRepository: OnboardingRepository;
  private employeeRepository: EmployeeRepository;

  constructor() {
    this.onboardingRepository = new OnboardingRepository();
    this.employeeRepository = new EmployeeRepository();
  }

  /**
   * Create a new onboarding session
   */
  async createSession(
    data: CreateOnboardingSessionRequest,
    requesterId?: string
  ): Promise<OnboardingSessionResponse & { onboardingUrl?: string; qrCodeData?: string }> {
    // Verify employee exists and requester has permission
    const employee = await this.employeeRepository.findById(data.employeeId);
    if (!employee) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.EMPLOYEE_NOT_FOUND));
    }

    // Check if there's already an active session for this employee
    const existingSession = await this.onboardingRepository.findActiveByEmployeeId(data.employeeId);
    if (existingSession) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_ALREADY_EXISTS));
    }

    // Generate unique token
    const token = await this.generateUniqueToken();

    // Calculate expiration time (default 7 days)
    const expirationHours = data.expirationHours || 168; // 7 days
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expirationHours);

    const sessionData: CreateOnboardingSessionData = {
      employeeId: data.employeeId,
      token,
      languagePreference: data.languagePreference || 'en',
      expiresAt,
      currentStep: data.currentStep || 'language_selection',
      formData: data.formData || {}
    };

    const session = await this.onboardingRepository.create(sessionData);
    const response = this.mapToResponse(session);
    
    // Generate onboarding URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const onboardingUrl = `${baseUrl}/onboarding?token=${token}`;
    const qrCodeData = onboardingUrl; // QR code data is just the URL
    
    return {
      ...response,
      onboardingUrl,
      qrCodeData
    };
  }

  /**
   * Validate token and return session
   */
  async validateToken(token: string): Promise<OnboardingValidationResult> {
    const session = await this.onboardingRepository.findByToken(token);

    if (!session) {
      return {
        isValid: false,
        isExpired: false,
        error: translationService.t(ONBOARDING_ERROR_KEYS.INVALID_TOKEN)
      };
    }

    const now = new Date();
    const isExpired = session.expiresAt < now || session.status === 'expired';

    if (isExpired) {
      // Mark as expired if not already
      if (session.status === 'in_progress') {
        await this.onboardingRepository.update(session.id, { status: 'expired' });
      }

      return {
        isValid: false,
        isExpired: true,
        session,
        error: translationService.t(ONBOARDING_ERROR_KEYS.TOKEN_EXPIRED)
      };
    }

    if (session.status !== 'in_progress') {
      return {
        isValid: false,
        isExpired: false,
        session,
        error: translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_ACTIVE)
      };
    }

    return {
      isValid: true,
      isExpired: false,
      session
    };
  }

  /**
   * Get onboarding session by ID
   */
  async getSession(id: string, requesterId?: string): Promise<OnboardingSessionResponse> {
    const session = await this.onboardingRepository.findById(id);
    if (!session) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_FOUND));
    }

    return this.mapToResponse(session);
  }

  /**
   * Update onboarding session progress
   */
  async updateProgress(
    id: string,
    data: UpdateOnboardingProgressRequest
  ): Promise<OnboardingSessionResponse> {
    const session = await this.onboardingRepository.findById(id);
    if (!session) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_FOUND));
    }

    // Check if session is still valid
    const now = new Date();
    if (session.expiresAt < now || session.status !== 'in_progress') {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_EXPIRED));
    }

    // Merge form data if provided
    let updatedFormData = session.formData;
    if (data.formData) {
      const existingData = (session.formData as Record<string, any>) || {};
      updatedFormData = {
        ...existingData,
        ...data.formData
      };
    }

    const updateData: UpdateOnboardingSessionData = {
      ...(data.currentStep && { currentStep: data.currentStep }),
      ...(data.languagePreference && { languagePreference: data.languagePreference }),
      formData: updatedFormData
    };

    const updatedSession = await this.onboardingRepository.update(id, updateData);
    return this.mapToResponse(updatedSession);
  }

  /**
   * Complete onboarding session
   */
  async completeSession(id: string): Promise<OnboardingSessionResponse> {
    const session = await this.onboardingRepository.findById(id);
    if (!session) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_FOUND));
    }

    if (session.status !== 'in_progress') {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_ACTIVE));
    }

    const updateData: UpdateOnboardingSessionData = {
      status: 'completed',
      completedAt: new Date(),
      currentStep: 'completed'
    };

    const updatedSession = await this.onboardingRepository.update(id, updateData);
    return this.mapToResponse(updatedSession);
  }

  /**
   * Cancel onboarding session
   */
  async cancelSession(id: string, requesterId?: string): Promise<void> {
    const session = await this.onboardingRepository.findById(id);
    if (!session) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_FOUND));
    }

    await this.onboardingRepository.update(id, { status: 'cancelled' });
  }

  /**
   * List onboarding sessions with filters
   */
  async listSessions(
    filters: OnboardingSessionFilters,
    pagination: { page?: number; limit?: number },
    requesterId?: string
  ): Promise<PaginatedResponse<OnboardingSessionResponse>> {
    const result = await this.onboardingRepository.list(filters, pagination);

    return {
      data: result.data.map(session => this.mapToResponse(session)),
      pagination: result.pagination
    };
  }

  /**
   * Get sessions by employee ID
   */
  async getSessionsByEmployee(employeeId: string, requesterId?: string): Promise<OnboardingSessionResponse[]> {
    const sessions = await this.onboardingRepository.findByEmployeeId(employeeId);
    return sessions.map(session => this.mapToResponse(session));
  }

  /**
   * Get active session for employee
   */
  async getActiveSessionByEmployee(employeeId: string): Promise<OnboardingSessionResponse | null> {
    const session = await this.onboardingRepository.findActiveByEmployeeId(employeeId);
    return session ? this.mapToResponse(session) : null;
  }

  /**
   * Extend session expiration
   */
  async extendSession(id: string, additionalHours: number, requesterId?: string): Promise<OnboardingSessionResponse> {
    const session = await this.onboardingRepository.findById(id);
    if (!session) {
      throw new Error(translationService.t(ONBOARDING_ERROR_KEYS.ONBOARDING_SESSION_NOT_FOUND));
    }

    const newExpiresAt = new Date(session.expiresAt);
    newExpiresAt.setHours(newExpiresAt.getHours() + additionalHours);

    const updateData: UpdateOnboardingSessionData = {
      expiresAt: newExpiresAt,
      // Reactivate if it was expired
      ...(session.status === 'expired' && { status: 'in_progress' })
    };

    const updatedSession = await this.onboardingRepository.update(id, updateData);
    return this.mapToResponse(updatedSession);
  }

  /**
   * Mark expired sessions (cleanup job)
   */
  async markExpiredSessions(): Promise<number> {
    return this.onboardingRepository.markExpiredSessions();
  }

  /**
   * Get onboarding statistics for organization
   */
  async getOrganizationStats(organizationId: string, requesterId?: string) {
    return this.onboardingRepository.getOrganizationStats(organizationId);
  }

  /**
   * Find sessions expiring soon
   */
  async getExpiringSessions(hoursFromNow: number = 24): Promise<OnboardingSessionResponse[]> {
    const sessions = await this.onboardingRepository.findExpiringSoon(hoursFromNow);
    return sessions.map(session => this.mapToResponse(session));
  }

  /**
   * Generate unique token
   */
  private async generateUniqueToken(): Promise<string> {
    let token: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      token = this.generateToken();
      attempts++;

      if (attempts > maxAttempts) {
        throw new Error('Unable to generate unique token');
      }
    } while (await this.onboardingRepository.tokenExists(token));

    return token;
  }

  /**
   * Generate random token
   */
  private generateToken(): string {
    // Generate 12-character alphanumeric token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Map database model to response DTO
   */
  private mapToResponse(session: OnboardingSessionWithEmployee): OnboardingSessionResponse {
    // Handle both regular onboarding sessions and walk-in sessions
    let employeeData = null;
    
    if ('employee' in session && session.employee && session.employee.user) {
      const employee = session.employee;
      const user = employee.user;
      employeeData = {
        id: employee.id,
        employeeId: employee.employeeId,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          organization: {
            id: user.organization?.id || '',
            name: user.organization?.name || 'Organization',
            type: user.organization?.type || 'motel'
          }
        }
      };
    } else {
      // Walk-in session (no employee yet)
      employeeData = {
        id: '',
        employeeId: '',
        user: {
          id: '',
          firstName: session.firstName || '',
          lastName: session.lastName || '',
          email: session.email || '',
          organization: {
            id: session.organizationId || '',
            name: session.organizationName || 'Organization',
            type: 'motel'
          }
        }
      };
    }

    return {
      id: session.id,
      employeeId: session.employeeId || '',
      token: session.token || '',
      languagePreference: session.languagePreference,
      currentStep: session.currentStep || undefined,
      formData: session.formData || {},
      status: session.status,
      expiresAt: session.expiresAt,
      completedAt: session.completedAt || undefined,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      employee: employeeData
    };
  }
}