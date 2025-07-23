import { PrismaClient } from '@prisma/client';

export interface PropertyQRData {
  propertyId: string;
  qrCodeUrl: string;
  applicationUrl: string;
}

export class PropertyQRService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async generatePropertyQRCode(propertyId: string): Promise<PropertyQRData> {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const applicationUrl = `${baseUrl}/apply?property=${propertyId}`;
    
    return {
      propertyId,
      qrCodeUrl: applicationUrl,
      applicationUrl
    };
  }

  async getPropertyJobPostings(propertyId: string, department?: string) {
    const where: any = {
      organizationId: propertyId
    };

    if (department) {
      where.department = department;
    }

    return await this.prisma.jobPosting.findMany({
      where,
      include: {
        organization: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async getPropertyDepartments(propertyId: string): Promise<string[]> {
    const departments = await this.prisma.jobPosting.findMany({
      where: {
        organizationId: propertyId
      },
      select: {
        department: true
      },
      distinct: ['department']
    });

    return departments.map(d => d.department).filter(Boolean);
  }

  async getPositionsByDepartment(propertyId: string, department: string): Promise<string[]> {
    const positions = await this.prisma.jobPosting.findMany({
      where: {
        organizationId: propertyId,
        department
      },
      select: {
        title: true
      },
      distinct: ['title']
    });

    return positions.map(p => p.title);
  }
}

export const propertyQRService = new PropertyQRService();
