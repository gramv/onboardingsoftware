import { PrismaClient, UserRole, ApplicationStatus } from '@prisma/client';
import { z } from 'zod';
import { SimpleEmailService } from '../email/simpleEmailService';
import { OnboardingService } from '../onboarding/onboardingService';
import { hashPassword } from '../../utils/auth/password';

const prisma = new PrismaClient();
const simpleEmailService = new SimpleEmailService();
const onboardingService = new OnboardingService();

// Validation schemas
export const createJobPostingSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  department: z.string().min(1, 'Department is required'),
  position: z.string().min(1, 'Position is required'),
  salaryRange: z.string().min(1, 'Salary range is required'),
  requirements: z.string().min(10, 'Requirements must be at least 10 characters'),
  benefits: z.string().min(1, 'Benefits are required'),
  expiresAt: z.string().transform((str) => new Date(str)),
  isActive: z.boolean().optional().default(true),
});

export const createJobApplicationSchema = z.object({
  jobPostingId: z.string().uuid('Invalid job posting ID'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(2, 'State is required'),
    zipCode: z.string().min(5, 'ZIP code is required'),
  }),
  resumeText: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  additionalInfo: z.string().optional(),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'approved', 'rejected']),
  reviewNotes: z.string().optional(),
});

export interface JobServiceContext {
  userId: string;
  role: UserRole;
  organizationId: string;
}

export class JobService {
  // Create a new job posting
  async createJobPosting(
    data: z.infer<typeof createJobPostingSchema>,
    context: JobServiceContext
  ) {
    // Validate permissions - only HR admins and managers can create job postings
    if (context.role !== 'hr_admin' && context.role !== 'manager') {
      throw new Error('Insufficient permissions to create job postings');
    }

    const jobPosting = await prisma.jobPosting.create({
      data: {
        ...data,
        organizationId: context.organizationId,
        createdBy: context.userId,
      },
      include: {
        organization: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return jobPosting;
  }

  // Get all job postings with filtering
  async getJobPostings(filters: {
    isActive?: boolean;
    organizationId?: string;
    department?: string;
    position?: string;
    search?: string;
  } = {}) {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.organizationId) {
      where.organizationId = filters.organizationId;
    }

    if (filters.department) {
      where.department = filters.department;
    }

    if (filters.position) {
      where.position = filters.position;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
        { requirements: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const jobPostings = await prisma.jobPosting.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        _count: {
          select: {
            applications: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return jobPostings;
  }

  // Get a single job posting by ID
  async getJobPostingById(id: string) {
    console.log('🔍 getJobPostingById called with ID:', id, 'type:', typeof id, 'length:', id?.length);
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      console.error('❌ Invalid UUID format:', id);
      throw new Error(`Invalid job posting ID format: ${id}`);
    }
    
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            type: true,
            address: true,
          },
        },
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        applications: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            status: true,
            appliedAt: true,
          },
          orderBy: {
            appliedAt: 'desc',
          },
        },
      },
    });

    if (!jobPosting) {
      throw new Error('Job posting not found');
    }

    return jobPosting;
  }

  // Update job posting
  async updateJobPosting(
    id: string,
    data: Partial<z.infer<typeof createJobPostingSchema>>,
    context: JobServiceContext
  ) {
    // Check if job posting exists and user has permission
    const existingJobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existingJobPosting) {
      throw new Error('Job posting not found');
    }

    // Check permissions
    if (
      context.role !== 'hr_admin' &&
      (context.role !== 'manager' || existingJobPosting.organizationId !== context.organizationId)
    ) {
      throw new Error('Insufficient permissions to update this job posting');
    }

    const updatedJobPosting = await prisma.jobPosting.update({
      where: { id },
      data,
      include: {
        organization: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return updatedJobPosting;
  }

  // Delete job posting
  async deleteJobPosting(id: string, context: JobServiceContext) {
    const existingJobPosting = await prisma.jobPosting.findUnique({
      where: { id },
    });

    if (!existingJobPosting) {
      throw new Error('Job posting not found');
    }

    // Check permissions
    if (
      context.role !== 'hr_admin' &&
      (context.role !== 'manager' || existingJobPosting.organizationId !== context.organizationId)
    ) {
      throw new Error('Insufficient permissions to delete this job posting');
    }

    await prisma.jobPosting.delete({
      where: { id },
    });

    return { message: 'Job posting deleted successfully' };
  }

  // Submit job application (public endpoint - no authentication required)
  async submitJobApplication(data: z.infer<typeof createJobApplicationSchema>) {
    // Check if job posting exists and is active
    const jobPosting = await prisma.jobPosting.findUnique({
      where: { id: data.jobPostingId },
    });

    if (!jobPosting) {
      throw new Error('Job posting not found');
    }

    if (!jobPosting.isActive) {
      throw new Error('This job posting is no longer accepting applications');
    }

    if (new Date() > jobPosting.expiresAt) {
      throw new Error('This job posting has expired');
    }

    // Check for duplicate applications (same email for same job)
    const existingApplication = await prisma.jobApplication.findFirst({
      where: {
        jobPostingId: data.jobPostingId,
        email: data.email,
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied for this position');
    }

    const application = await prisma.jobApplication.create({
      data: {
        ...data,
        status: 'pending',
      },
      include: {
        jobPosting: {
          select: {
            title: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return application;
  }

  // Get applications for a job posting
  async getJobApplicationsByDepartment(
    filters: {
      jobPostingId?: string;
      organizationId?: string;
      department?: string;
      status?: ApplicationStatus;
      search?: string;
    } = {},
    context: JobServiceContext
  ) {
    console.log('🔍 getJobApplications called with:', { filters, context });
    const where: any = {};

    // Apply role-based filtering
    if (context.role === 'manager') {
      // For managers, filter by their organization ID
      if (where.jobPosting) {
        where.jobPosting.organizationId = context.organizationId;
      } else {
        where.jobPosting = {
          organizationId: context.organizationId,
        };
      }
      console.log('👤 Manager filter applied, organizationId:', context.organizationId);
    } else if (context.role !== 'hr_admin') {
      throw new Error('Insufficient permissions to view applications');
    }

    if (filters.jobPostingId) {
      where.jobPostingId = filters.jobPostingId;
    }

    if (filters.organizationId && context.role === 'hr_admin') {
      if (where.jobPosting) {
        where.jobPosting.organizationId = filters.organizationId;
      } else {
        where.jobPosting = {
          organizationId: filters.organizationId,
        };
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    console.log('🔍 Final where clause:', JSON.stringify(where, null, 2));
    
    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            position: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    console.log('📥 Found applications:', applications.length);
    console.log('📋 Applications data:', JSON.stringify(applications, null, 2));
    return applications;
  }

  // Get a specific application
  async getJobApplicationById(id: string, context: JobServiceContext) {
    const application = await prisma.jobApplication.findUnique({
      where: { id },
      include: {
        jobPosting: {
          include: {
            organization: {
              select: {
                name: true,
                type: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!application) {
      throw new Error('Application not found');
    }

    // Check permissions
    if (
      context.role !== 'hr_admin' &&
      (context.role !== 'manager' || application.jobPosting.organizationId !== context.organizationId)
    ) {
      throw new Error('Insufficient permissions to view this application');
    }

    return application;
  }

  // Update application status
  async updateApplicationStatus(
    id: string,
    data: z.infer<typeof updateApplicationStatusSchema>,
    context: JobServiceContext
  ) {
    const application = await this.getJobApplicationById(id, context);

    const updatedApplication = await prisma.jobApplication.update({
      where: { id },
      data: {
        status: data.status,
        reviewedAt: new Date(),
        reviewedBy: context.userId,
      },
      include: {
        jobPosting: {
          include: {
            organization: true,
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Handle approved applications - create employee and onboarding session
    console.log('🔍 CHECKING STATUS:', data.status, 'for application:', updatedApplication.email);
    if (data.status === 'approved') {
      console.log('🎯 APPROVAL DETECTED: Creating employee and onboarding session for:', updatedApplication.email);
      try {
        // Create employee record from application
        const employee = await this.createEmployeeFromApplication(updatedApplication, context);
        
        // Create onboarding session using proper onboarding service
        const onboardingResult = await onboardingService.createSession({
          employeeId: employee.id,
          languagePreference: 'en',
          expirationHours: 168, // 7 days
          currentStep: 'language_selection',
          formData: {
            applicationId: updatedApplication.id,
            jobTitle: updatedApplication.jobPosting.title,
            organizationName: updatedApplication.jobPosting.organization.name
          }
        }, context.userId);

                // Send onboarding email with proper base URL
        const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        
        await simpleEmailService.sendOnboardingEmail(
          updatedApplication.email,
          `${updatedApplication.firstName} ${updatedApplication.lastName}`,
          updatedApplication.jobPosting.organization.name,
          onboardingResult.token,
          baseUrl
        );
        
        console.log(`📧 Onboarding email sent to ${updatedApplication.email} with token: ${onboardingResult.token}`);
      } catch (error) {
        console.error('🚨 ERROR: Failed to send onboarding email:', error);
        
        // Send fallback approval email
        try {
          const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
          await simpleEmailService.sendOnboardingEmail(
            updatedApplication.email,
            `${updatedApplication.firstName} ${updatedApplication.lastName}`,
            updatedApplication.jobPosting.organization.name,
            'TOKEN_PLACEHOLDER', // Placeholder for token
            baseUrl
          );
          console.log(`📧 Fallback email sent to ${updatedApplication.email}`);
        } catch (emailError) {
          console.error('🚨 CRITICAL: Even fallback email failed:', emailError);
        }
      }
    } else if (data.status === 'rejected') {
      // Send rejection email and store in talent pool
      console.log(`📧 Sending rejection notification to ${updatedApplication.email}`);
      
      try {
        await simpleEmailService.sendRejectionEmail(
          updatedApplication.email,
          `${updatedApplication.firstName} ${updatedApplication.lastName}`,
          updatedApplication.jobPosting.organization.name,
          updatedApplication.jobPosting.department
        );

        await this.addToTalentPool(updatedApplication);
        
        // Send rejection emails to other candidates in same department
        await this.sendDepartmentRejectionEmails(
          updatedApplication.jobPosting.id,
          updatedApplication.jobPosting.department,
          updatedApplication.id
        );
        
        console.log(`📧 Rejection emails sent for ${updatedApplication.jobPosting.department} department`);
      } catch (error) {
        console.error('🚨 ERROR: Failed to send rejection emails:', error);
      }
    }

    return updatedApplication;
  }

  // Get dashboard stats for managers/HR
  async getJobDashboardStats(context: JobServiceContext) {
    const where: any = {};

    if (context.role === 'manager') {
      where.organizationId = context.organizationId;
    }

    const [
      totalJobPostings,
      activeJobPostings,
      totalApplications,
      pendingApplications,
      approvedApplications,
    ] = await Promise.all([
      prisma.jobPosting.count({ where }),
      prisma.jobPosting.count({ where: { ...where, isActive: true } }),
      prisma.jobApplication.count({
        where: context.role === 'manager' 
          ? { jobPosting: { organizationId: context.organizationId } }
          : {},
      }),
      prisma.jobApplication.count({
        where: {
          status: 'pending',
          ...(context.role === 'manager' 
            ? { jobPosting: { organizationId: context.organizationId } }
            : {}),
        },
      }),
      prisma.jobApplication.count({
        where: {
          status: 'approved',
          ...(context.role === 'manager' 
            ? { jobPosting: { organizationId: context.organizationId } }
            : {}),
        },
      }),
    ]);

    return {
      totalJobPostings,
      activeJobPostings,
      totalApplications,
      pendingApplications,
      approvedApplications,
    };
  }

  private async createEmployeeFromApplication(application: any, context: JobServiceContext) {
    // Create user account for the employee
    const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1!';
    const passwordHash = await hashPassword(tempPassword);
    
    const user = await prisma.user.create({
      data: {
        email: application.email,
        firstName: application.firstName,
        lastName: application.lastName,
        role: 'employee',
        organizationId: context.organizationId,
        passwordHash,
      }
    });

    // Generate unique employee ID
    const employeeId = `EMP-${Date.now().toString().slice(-8)}`;

    // Create employee record
    const employee = await prisma.employee.create({
      data: {
        userId: user.id,
        employeeId,
        position: application.jobPosting.position,
        department: application.jobPosting.department,
        hireDate: new Date(),
        employmentStatus: 'active',
        address: application.address,
      },
      include: {
        user: {
          include: {
            organization: true
          }
        }
      }
    });

    return employee;
  }

  async generatePropertyQRCode(organizationId: string, context: JobServiceContext): Promise<string> {
    if (context.role !== 'hr_admin' && context.role !== 'manager') {
      throw new Error('Insufficient permissions to generate QR codes');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/jobs?org=${organizationId}`;
    
    return qrUrl;
  }

  async getJobApplicationsByDepartment(
    filters: {
      jobPostingId?: string;
      organizationId?: string;
      department?: string;
      status?: ApplicationStatus;
      search?: string;
    } = {},
    context: JobServiceContext
  ) {
    const where: any = {};

    if (context.role === 'manager') {
      if (where.jobPosting) {
        where.jobPosting.organizationId = context.organizationId;
      } else {
        where.jobPosting = {
          organizationId: context.organizationId,
        };
      }
    } else if (context.role !== 'hr_admin') {
      throw new Error('Insufficient permissions to view applications');
    }

    if (filters.jobPostingId) {
      where.jobPostingId = filters.jobPostingId;
    }

    if (filters.organizationId && context.role === 'hr_admin') {
      if (where.jobPosting) {
        where.jobPosting.organizationId = filters.organizationId;
      } else {
        where.jobPosting = {
          organizationId: filters.organizationId,
        };
      }
    }

    if (filters.department) {
      if (where.jobPosting) {
        where.jobPosting.department = filters.department;
      } else {
        where.jobPosting = {
          department: filters.department,
        };
      }
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.search) {
      where.OR = [
        { firstName: { contains: filters.search, mode: 'insensitive' } },
        { lastName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const applications = await prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            position: true,
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
        reviewer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        appliedAt: 'desc',
      },
    });

    return applications;
  }

  private async addToTalentPool(application: any) {
    await prisma.talentPool.create({
      data: {
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
        address: application.address,
        experience: application.experience,
        education: application.education,
        interestedDepartments: [application.jobPosting.department],
        organizationId: application.jobPosting.organizationId,
        source: 'job_application',
        status: 'available',
        lastContactDate: new Date(),
      }
    });
  }

  private async sendDepartmentRejectionEmails(jobPostingId: string, department: string, excludeApplicationId: string) {
    const otherApplications = await prisma.jobApplication.findMany({
      where: {
        jobPostingId,
        status: 'pending',
        id: { not: excludeApplicationId }
      },
      include: {
        jobPosting: {
          include: {
            organization: true
          }
        }
      }
    });

    for (const app of otherApplications) {
      try {
        await simpleEmailService.sendRejectionEmail(
          app.email,
          `${app.firstName} ${app.lastName}`,
          app.jobPosting.organization.name,
          department
        );

        await prisma.jobApplication.update({
          where: { id: app.id },
          data: { status: 'rejected' }
        });

        await this.addToTalentPool(app);
      } catch (error) {
        console.error(`Error processing rejection for ${app.email}:`, error);
      }
    }
  }

  async generatePropertyQRCode(organizationId: string, context: JobServiceContext): Promise<string> {
    if (context.role !== 'hr_admin' && context.role !== 'manager') {
      throw new Error('Insufficient permissions to generate QR codes');
    }

    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const qrUrl = `${baseUrl}/jobs?org=${organizationId}`;
    
    return qrUrl;
  }

  private async addToTalentPool(application: any) {
    const talentPoolData = {
      firstName: application.firstName,
      lastName: application.lastName,
      email: application.email,
      phone: application.phone || null,
      address: application.address || null,
      experience: application.experience || null,
      education: application.education || null,
      interestedDepartments: [application.jobPosting.department],
      organizationId: application.jobPosting.organizationId,
      source: 'job_application',
      status: 'available',
      lastContactDate: new Date(),
    };

    console.log('Adding to talent pool:', talentPoolData);
  }

  private async sendDepartmentRejectionEmails(jobPostingId: string, department: string, excludeApplicationId: string) {
    const otherApplications = await prisma.jobApplication.findMany({
      where: {
        jobPostingId,
        status: 'pending',
        id: { not: excludeApplicationId }
      },
      include: {
        jobPosting: {
          include: {
            organization: true
          }
        }
      }
    });

    for (const app of otherApplications) {
      try {
        await simpleEmailService.sendRejectionEmail(
          app.email,
          `${app.firstName} ${app.lastName}`,
          app.jobPosting.organization.name,
          department
        );

        await prisma.jobApplication.update({
          where: { id: app.id },
          data: { status: 'rejected' }
        });

        await this.addToTalentPool(app);
      } catch (error) {
        console.error(`Error processing rejection for ${app.email}:`, error);
      }
    }
  }

  async getJobApplications(
    filters: {
      jobPostingId?: string;
      organizationId?: string;
      status?: ApplicationStatus;
      search?: string;
    } = {},
    context: JobServiceContext
  ) {
    return this.getJobApplicationsByDepartment(filters, context);
  }
}        