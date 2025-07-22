import { OnboardingService } from './onboardingService';
import { PrismaClient } from '@prisma/client';
import { translationService, ONBOARDING_ERROR_KEYS } from '@/utils/i18n/translationService';
import { SimpleEmailService } from '@/services/email/simpleEmailService';

const prisma = new PrismaClient();

export interface WalkInEmployeeData {
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  department: string;
  hourlyRate: number;
  organizationId: string;
}

export class WalkInOnboardingService {
  private onboardingService: OnboardingService;
  private emailService: SimpleEmailService;

  constructor() {
    this.onboardingService = new OnboardingService();
    this.emailService = new SimpleEmailService();
  }

  /**
   * Create a new onboarding session for walk-in candidates (no login required)
   * @param data Employee data
   * @param requesterId ID of the manager creating the session
   * @returns Onboarding session with token
   */
  async createWalkInOnboarding(
    data: WalkInEmployeeData,
    requesterId: string
  ) {
    // Verify requester has permission (should be a manager)
    const requester = await prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, organizationId: true }
    });

    if (!requester || (requester.role !== 'manager' && requester.role !== 'hr_admin')) {
      throw new Error(translationService.t('api.errors.insufficient_permissions'));
    }

    // Create onboarding session for the candidate (no employee/user yet)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    const formData = {
      position: data.position,
      department: data.department,
      hourlyRate: data.hourlyRate,
      employmentType: 'full_time', // Default for walk-ins
      hireDate: new Date().toISOString(),
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email
    };
    
    // Generate proper token instead of access code
    const token = this.generateToken();
    
    const onboardingSession = await prisma.onboardingSession.create({
      data: {
        token: token,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        jobTitle: data.position,
        organizationId: data.organizationId,
        languagePreference: 'en',
        currentStep: 'personal_info',
        status: 'in_progress',
        expiresAt,
        formData
      }
    });

    // Send onboarding email to the candidate
    try {
      // Get organization name for the email
      const organization = await prisma.organization.findUnique({
        where: { id: data.organizationId },
        select: { name: true }
      });
      
      const organizationName = organization?.name || 'Our Company';
      const candidateName = `${data.firstName} ${data.lastName}`;
      const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      
      await this.emailService.sendOnboardingEmail(
        data.email,
        candidateName,
        organizationName,
        token,
        baseUrl
      );
      
      console.log(`📧 Walk-in onboarding email sent to ${data.email} with token: ${token}`);
    } catch (error) {
      console.error('🚨 ERROR: Failed to send walk-in onboarding email:', error);
      // Don't fail the whole process if email fails - just log the error
    }

    return {
      session: onboardingSession,
      token: token,
      onboardingUrl: `/onboarding?token=${token}`,
      candidate: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position,
        department: data.department,
        hourlyRate: data.hourlyRate,
        organizationId: data.organizationId,
        hireDate: new Date().toISOString().split('T')[0],
        employmentType: 'full_time'
      }
    };
  }

  private generateToken(): string {
    return Math.random().toString(36).substring(2, 10).toUpperCase() + 
           Date.now().toString(36).substring(4, 8);
  }

  /**
   * Get active walk-in onboarding sessions for an organization
   * @param organizationId Organization ID
   * @param requesterId ID of the manager requesting the sessions
   * @returns List of active walk-in onboarding sessions
   */
  async getActiveWalkInSessions(organizationId: string, requesterId: string) {
    // Get all active onboarding sessions for walk-in candidates (no employeeId)
    const sessions = await prisma.onboardingSession.findMany({
      where: {
        status: 'in_progress',
        employeeId: null, // Walk-in candidates don't have employee records yet
        organizationId: organizationId,
        expiresAt: {
          gt: new Date() // Not expired
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Filter for walk-in sessions (created within the last 24 hours)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const walkInSessions = sessions.filter(session => 
      session.createdAt > oneDayAgo
    );

    return walkInSessions.map(session => ({
      id: session.id,
      token: session.token,
      languagePreference: session.languagePreference,
      currentStep: session.currentStep,
      status: session.status,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt,
      employee: {
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        email: session.email || '',
        position: session.jobTitle || ''
      },
      candidate: {
        firstName: session.firstName || '',
        lastName: session.lastName || '',
        email: session.email || '',
        position: session.jobTitle || '',
        department: session.formData?.department || session.department || '',
        hourlyRate: session.formData?.hourlyRate || session.hourlyRate || 0,
        organizationName: session.organizationName || 'Organization',
        hireDate: session.formData?.hireDate || new Date().toISOString().split('T')[0],
        employmentType: session.formData?.employmentType || 'full_time'
      }
    }));
  }
}