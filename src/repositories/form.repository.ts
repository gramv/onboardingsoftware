import { PrismaClient, FormSubmission, FormType, FormStatus, LanguageCode } from '@prisma/client';
import { FormData } from '@/types/forms';
import { prisma } from '@/utils/database';

/**
 * Repository for managing form submissions with database persistence
 */
export class FormRepository {
  private prisma: PrismaClient;

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma;
  }

  /**
   * Save a form submission to the database
   */
  async save(formData: FormData): Promise<FormSubmission> {
    const submission = await this.prisma.formSubmission.upsert({
      where: { formId: formData.formId },
      update: {
        data: formData.data,
        status: formData.status as FormStatus,
        validationErrors: formData.validationErrors || undefined,
        submittedAt: formData.submittedAt || null,
        reviewedAt: formData.reviewedAt || null,
        reviewedBy: formData.reviewedBy || null,
        updatedAt: new Date(),
      },
      create: {
        formId: formData.formId,
        employeeId: formData.employeeId,
        formType: formData.formType as FormType,
        language: formData.language as LanguageCode,
        data: formData.data,
        status: formData.status as FormStatus,
        version: formData.version,
        validationErrors: formData.validationErrors || undefined,
        submittedAt: formData.submittedAt || null,
        reviewedAt: formData.reviewedAt || null,
        reviewedBy: formData.reviewedBy || null,
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
    });

    return submission;
  }

  /**
   * Find a form submission by ID
   */
  async findById(formId: string): Promise<FormData | null> {
    const submission = await this.prisma.formSubmission.findUnique({
      where: { formId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
    });

    if (!submission) {
      return null;
    }

    return this.mapToFormData(submission);
  }

  /**
   * Find all form submissions for an employee
   */
  async findByEmployeeId(employeeId: string): Promise<FormData[]> {
    const submissions = await this.prisma.formSubmission.findMany({
      where: { employeeId },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map(this.mapToFormData);
  }

  /**
   * Find form submissions by status
   */
  async findByStatus(status: FormStatus): Promise<FormData[]> {
    const submissions = await this.prisma.formSubmission.findMany({
      where: { status },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map(this.mapToFormData);
  }

  /**
   * Find form submissions by type
   */
  async findByType(formType: FormType): Promise<FormData[]> {
    const submissions = await this.prisma.formSubmission.findMany({
      where: { formType },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
        reviewer: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return submissions.map(this.mapToFormData);
  }

  /**
   * Get all form submissions with pagination
   */
  async findAll(options?: {
    page?: number;
    limit?: number;
    employeeId?: string;
    formType?: FormType;
    status?: FormStatus;
  }): Promise<{ forms: FormData[]; total: number; page: number; limit: number }> {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (options?.employeeId) where.employeeId = options.employeeId;
    if (options?.formType) where.formType = options.formType;
    if (options?.status) where.status = options.status;

    const [submissions, total] = await Promise.all([
      this.prisma.formSubmission.findMany({
        where,
        include: {
          employee: {
            include: {
              user: true,
            },
          },
          reviewer: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.formSubmission.count({ where }),
    ]);

    return {
      forms: submissions.map(this.mapToFormData),
      total,
      page,
      limit,
    };
  }

  /**
   * Delete a form submission
   */
  async delete(formId: string): Promise<boolean> {
    try {
      await this.prisma.formSubmission.delete({
        where: { formId },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update form PDF path
   */
  async updatePdfPath(formId: string, pdfPath: string): Promise<FormSubmission | null> {
    try {
      return await this.prisma.formSubmission.update({
        where: { formId },
        data: { pdfPath },
      });
    } catch (error) {
      return null;
    }
  }

  /**
   * Get form submission statistics
   */
  async getStatistics(organizationId?: string): Promise<{
    total: number;
    byStatus: Record<FormStatus, number>;
    byType: Record<FormType, number>;
  }> {
    const where: any = {};
    if (organizationId) {
      where.employee = {
        user: {
          organizationId,
        },
      };
    }

    const [
      total,
      statusCounts,
      typeCounts,
    ] = await Promise.all([
      this.prisma.formSubmission.count({ where }),
      this.prisma.formSubmission.groupBy({
        by: ['status'],
        where,
        _count: { status: true },
      }),
      this.prisma.formSubmission.groupBy({
        by: ['formType'],
        where,
        _count: { formType: true },
      }),
    ]);

    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<FormStatus, number>);

    const byType = typeCounts.reduce((acc, item) => {
      acc[item.formType] = item._count.formType;
      return acc;
    }, {} as Record<FormType, number>);

    return { total, byStatus, byType };
  }

  /**
   * Map Prisma FormSubmission to FormData
   */
  private mapToFormData = (submission: FormSubmission & {
    employee: any;
    reviewer: any;
  }): FormData => {
    return {
      formId: submission.formId,
      employeeId: submission.employeeId,
      formType: submission.formType as any,
      language: submission.language as 'en' | 'es',
      data: submission.data as Record<string, any>,
      status: submission.status as any,
      version: submission.version,
      validationErrors: submission.validationErrors as Record<string, string> || undefined,
      submittedAt: submission.submittedAt || undefined,
      reviewedAt: submission.reviewedAt || undefined,
      reviewedBy: submission.reviewedBy || undefined,
    };
  };
}