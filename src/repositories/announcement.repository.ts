import { PrismaClient, Announcement } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface CreateAnnouncementData {
  title: string;
  content: string;
  priority: string;
  targetRoles: string[];
  targetOrgs: string[];
  expiresAt?: Date;
}

export interface UpdateAnnouncementData {
  title?: string;
  content?: string;
  priority?: string;
  targetRoles?: string[];
  targetOrgs?: string[];
  isActive?: boolean;
  expiresAt?: Date | null;
}

export interface AnnouncementFilters {
  isActive?: boolean;
  priority?: string;
  targetRoles?: string[];
  targetOrgs?: string[];
  search?: string;
}

export class AnnouncementRepository extends BaseRepository {
  constructor() {
    super();
  }

  async create(data: CreateAnnouncementData): Promise<Announcement> {
    return this.prisma.announcement.create({
      data
    });
  }

  async findById(id: string): Promise<Announcement | null> {
    return this.prisma.announcement.findUnique({
      where: { id }
    });
  }

  async update(id: string, data: UpdateAnnouncementData): Promise<Announcement> {
    return this.prisma.announcement.update({
      where: { id },
      data
    });
  }

  async delete(id: string): Promise<Announcement> {
    return this.prisma.announcement.delete({
      where: { id }
    });
  }

  async findAll(filters?: AnnouncementFilters, page = 1, limit = 10): Promise<{ announcements: Announcement[], total: number }> {
    const where: any = {};
    
    if (filters) {
      if (filters.isActive !== undefined) {
        where.isActive = filters.isActive;
      }
      
      if (filters.priority) {
        where.priority = filters.priority;
      }
      
      if (filters.targetRoles && filters.targetRoles.length > 0) {
        where.targetRoles = {
          hasSome: filters.targetRoles
        };
      }
      
      if (filters.targetOrgs && filters.targetOrgs.length > 0) {
        where.targetOrgs = {
          hasSome: filters.targetOrgs
        };
      }
      
      if (filters.search) {
        where.OR = [
          { title: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    const skip = (page - 1) * limit;
    
    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.announcement.count({ where })
    ]);

    return { announcements, total };
  }

  async findActiveForUser(userId: string, userRole: string, organizationId: string): Promise<Announcement[]> {
    const now = new Date();
    
    return this.prisma.announcement.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: now } }
            ]
          },
          {
            OR: [
              { targetRoles: { hasSome: [userRole] } },
              { targetRoles: { isEmpty: true } }
            ]
          },
          {
            OR: [
              { targetOrgs: { hasSome: [organizationId] } },
              { targetOrgs: { isEmpty: true } }
            ]
          }
        ]
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ]
    });
  }
}