import { PrismaClient } from '@prisma/client';

export class JobServiceExtensions {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async getJobApplicationsByDepartment(
    department: string,
    organizationId: string
  ): Promise<any[]> {
    return this.prisma.jobApplication.findMany({
      where: {
        jobPosting: {
          department: department,
          organizationId: organizationId
        }
      },
      include: {
        jobPosting: {
          include: {
            organization: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async sendRejectionEmails(applicationIds: string[], department: string): Promise<void> {
    try {
      const applications = await this.prisma.jobApplication.findMany({
        where: {
          id: { in: applicationIds }
        },
        include: {
          jobPosting: {
            include: {
              organization: true
            }
          }
        }
      });

      for (const application of applications) {
        await this.prisma.jobApplication.update({
          where: { id: application.id },
          data: {
            status: 'rejected',
            reviewedAt: new Date()
          }
        });

        await this.addToTalentPool(application);
      }
    } catch (error) {
      console.error('Error sending rejection emails:', error);
    }
  }

  async addToTalentPool(application: any): Promise<void> {
    try {
      console.log('Adding to talent pool:', application.firstName, application.lastName);
    } catch (error) {
      console.error('Error adding to talent pool:', error);
    }
  }
}

export const jobServiceExtensions = new JobServiceExtensions();
