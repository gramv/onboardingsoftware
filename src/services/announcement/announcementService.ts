import { Announcement, PrismaClient, User, UserRole } from '@prisma/client';
import { 
  AnnouncementRepository, 
  CreateAnnouncementData, 
  UpdateAnnouncementData,
  AnnouncementFilters
} from '../../repositories/announcement.repository';
import { ApiError } from '../../utils/errors';
import { notificationService } from '../notification/notificationService';

// Define the AnnouncementReadReceipt interface since it might not be in the Prisma client yet
interface AnnouncementReadReceipt {
  id: string;
  announcementId: string;
  userId: string;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnnouncementWithReadStatus extends Announcement {
  isRead: boolean;
}

export class AnnouncementService {
  private announcementRepository: AnnouncementRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.announcementRepository = new AnnouncementRepository();
  }

  /**
   * Create a new announcement
   */
  async createAnnouncement(
    data: CreateAnnouncementData, 
    creatorId: string
  ): Promise<Announcement> {
    // Validate creator has permission to create announcements
    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId }
    });

    if (!creator) {
      throw new ApiError('User not found', 404);
    }

    if (creator.role !== UserRole.hr_admin && creator.role !== UserRole.manager) {
      throw new ApiError('Insufficient permissions to create announcements', 403);
    }

    // Validate target roles
    if (data.targetRoles && data.targetRoles.length > 0) {
      const validRoles = Object.values(UserRole);
      const invalidRoles = data.targetRoles.filter(role => !validRoles.includes(role as UserRole));
      
      if (invalidRoles.length > 0) {
        throw new ApiError(`Invalid target roles: ${invalidRoles.join(', ')}`, 400);
      }
    }

    // Validate target organizations
    if (data.targetOrgs && data.targetOrgs.length > 0) {
      const orgCount = await this.prisma.organization.count({
        where: {
          id: {
            in: data.targetOrgs
          }
        }
      });

      if (orgCount !== data.targetOrgs.length) {
        throw new ApiError('One or more target organizations do not exist', 400);
      }

      // If creator is a manager, ensure they can only target their own organization
      if (creator.role === UserRole.manager) {
        if (!data.targetOrgs.includes(creator.organizationId)) {
          throw new ApiError('Managers can only create announcements for their own organization', 403);
        }
      }
    }

    const announcement = await this.announcementRepository.create(data);

    // Send real-time notifications to targeted users
    await this.notifyTargetedUsers(announcement, creator);

    return announcement;
  }

  /**
   * Get announcement by ID
   */
  async getAnnouncementById(id: string, userId: string): Promise<AnnouncementWithReadStatus> {
    const announcement = await this.announcementRepository.findById(id);
    
    if (!announcement) {
      throw new ApiError('Announcement not found', 404);
    }

    // Check if the user has read this announcement
    // Use raw query since the model might not be in the Prisma client yet
    const readReceipts = await this.prisma.$queryRaw<Array<{id: string}>>`
      SELECT id FROM announcement_read_receipts 
      WHERE announcement_id = ${id}::uuid AND user_id = ${userId}::uuid
      LIMIT 1
    `;

    return {
      ...announcement,
      isRead: readReceipts.length > 0
    };
  }

  /**
   * Update an announcement
   */
  async updateAnnouncement(
    id: string, 
    data: UpdateAnnouncementData, 
    updaterId: string
  ): Promise<Announcement> {
    const announcement = await this.announcementRepository.findById(id);
    
    if (!announcement) {
      throw new ApiError('Announcement not found', 404);
    }

    // Validate updater has permission
    const updater = await this.prisma.user.findUnique({
      where: { id: updaterId }
    });

    if (!updater) {
      throw new ApiError('User not found', 404);
    }

    if (updater.role !== UserRole.hr_admin && updater.role !== UserRole.manager) {
      throw new ApiError('Insufficient permissions to update announcements', 403);
    }

    // Managers can only update announcements targeting their organization
    if (updater.role === UserRole.manager) {
      if (!announcement.targetOrgs.includes(updater.organizationId)) {
        throw new ApiError('Managers can only update announcements for their own organization', 403);
      }
    }

    return this.announcementRepository.update(id, data);
  }

  /**
   * Delete an announcement
   */
  async deleteAnnouncement(id: string, deleterId: string): Promise<void> {
    const announcement = await this.announcementRepository.findById(id);
    
    if (!announcement) {
      throw new ApiError('Announcement not found', 404);
    }

    // Validate deleter has permission
    const deleter = await this.prisma.user.findUnique({
      where: { id: deleterId }
    });

    if (!deleter) {
      throw new ApiError('User not found', 404);
    }

    if (deleter.role !== UserRole.hr_admin && deleter.role !== UserRole.manager) {
      throw new ApiError('Insufficient permissions to delete announcements', 403);
    }

    // Managers can only delete announcements targeting their organization
    if (deleter.role === UserRole.manager) {
      if (!announcement.targetOrgs.includes(deleter.organizationId)) {
        throw new ApiError('Managers can only delete announcements for their own organization', 403);
      }
    }

    await this.announcementRepository.delete(id);
  }

  /**
   * List announcements with filtering and pagination
   */
  async listAnnouncements(
    filters: AnnouncementFilters, 
    page = 1, 
    limit = 10, 
    requesterId: string
  ): Promise<{ announcements: AnnouncementWithReadStatus[], total: number }> {
    // Validate requester has permission
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
    });

    if (!requester) {
      throw new ApiError('User not found', 404);
    }

    // Apply role-based filters
    if (requester.role === UserRole.manager) {
      // Managers can only see announcements for their organization
      filters.targetOrgs = [requester.organizationId];
    } else if (requester.role === UserRole.employee) {
      // Employees can only see announcements targeting their role and organization
      filters.targetRoles = [requester.role];
      filters.targetOrgs = [requester.organizationId];
    }
    // HR admins can see all announcements

    const { announcements, total } = await this.announcementRepository.findAll(filters, page, limit);

    // Get read receipts for these announcements using raw query
    const readReceipts = await this.prisma.$queryRaw<Array<{announcement_id: string}>>`
      SELECT announcement_id FROM announcement_read_receipts 
      WHERE user_id = ${requesterId}::uuid 
      AND announcement_id IN (${announcements.map(a => a.id)})
    `;

    const readAnnouncementIds = new Set(readReceipts.map(r => r.announcement_id));

    // Add read status to each announcement
    const announcementsWithReadStatus: AnnouncementWithReadStatus[] = announcements.map(announcement => ({
      ...announcement,
      isRead: readAnnouncementIds.has(announcement.id)
    }));

    return { announcements: announcementsWithReadStatus, total };
  }

  /**
   * Get active announcements for a specific user
   */
  async getActiveAnnouncementsForUser(userId: string): Promise<AnnouncementWithReadStatus[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    const announcements = await this.announcementRepository.findActiveForUser(
      userId, 
      user.role, 
      user.organizationId
    );

    // Get read receipts for these announcements using raw query
    const readReceipts = await this.prisma.$queryRaw<Array<{announcement_id: string}>>`
      SELECT announcement_id FROM announcement_read_receipts 
      WHERE user_id = ${userId}::uuid 
      AND announcement_id IN (${announcements.map(a => a.id)})
    `;

    const readAnnouncementIds = new Set(readReceipts.map(r => r.announcement_id));

    // Add read status to each announcement
    return announcements.map(announcement => ({
      ...announcement,
      isRead: readAnnouncementIds.has(announcement.id)
    }));
  }

  /**
   * Mark an announcement as read by a user
   */
  async markAnnouncementAsRead(announcementId: string, userId: string): Promise<void> {
    const announcement = await this.announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new ApiError('Announcement not found', 404);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Create read receipt if it doesn't exist using raw SQL
    await this.prisma.$executeRaw`
      INSERT INTO announcement_read_receipts (
        id, announcement_id, user_id, read_at, created_at, updated_at
      )
      VALUES (
        gen_random_uuid(), ${announcementId}::uuid, ${userId}::uuid, 
        NOW(), NOW(), NOW()
      )
      ON CONFLICT (announcement_id, user_id) DO NOTHING
    `;
  }

  /**
   * Get read statistics for an announcement
   */
  async getAnnouncementReadStats(announcementId: string, requesterId: string): Promise<{
    totalReads: number;
    totalTargetUsers: number;
    readPercentage: number;
    recentReaders: User[];
  }> {
    const announcement = await this.announcementRepository.findById(announcementId);
    
    if (!announcement) {
      throw new ApiError('Announcement not found', 404);
    }

    // Validate requester has permission
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId }
    });

    if (!requester) {
      throw new ApiError('User not found', 404);
    }

    if (requester.role !== UserRole.hr_admin && requester.role !== UserRole.manager) {
      throw new ApiError('Insufficient permissions to view announcement statistics', 403);
    }

    // Managers can only view stats for announcements targeting their organization
    if (requester.role === UserRole.manager && !announcement.targetOrgs.includes(requester.organizationId)) {
      throw new ApiError('Managers can only view statistics for their own organization', 403);
    }

    // Build query to find target users
    const targetUsersQuery: any = {};
    
    // Filter by roles if specified
    if (announcement.targetRoles.length > 0) {
      targetUsersQuery.role = {
        in: announcement.targetRoles
      };
    }
    
    // Filter by organizations if specified
    if (announcement.targetOrgs.length > 0) {
      targetUsersQuery.organizationId = {
        in: announcement.targetOrgs
      };
    }

    // Count total target users
    const totalTargetUsers = await this.prisma.user.count({
      where: targetUsersQuery
    });

    // Count total reads using raw query
    const totalReadsResult = await this.prisma.$queryRaw<Array<{count: number}>>`
      SELECT COUNT(*) as count FROM announcement_read_receipts 
      WHERE announcement_id = ${announcementId}::uuid
    `;
    const totalReads = Number(totalReadsResult[0].count);

    // Calculate read percentage
    const readPercentage = totalTargetUsers > 0 
      ? Math.round((totalReads / totalTargetUsers) * 100) 
      : 0;

    // Get recent readers using raw query
    const recentReadersResult = await this.prisma.$queryRaw<Array<{user_id: string, read_at: Date}>>`
      SELECT arr.user_id, arr.read_at 
      FROM announcement_read_receipts arr
      WHERE arr.announcement_id = ${announcementId}::uuid
      ORDER BY arr.read_at DESC
      LIMIT 10
    `;
    
    // Fetch the actual user data
    const userIds = recentReadersResult.map(r => r.user_id);
    const recentReaders = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      }
    });

    return {
      totalReads,
      totalTargetUsers,
      readPercentage,
      recentReaders
    };
  }

  /**
   * Notify targeted users about new announcement
   */
  private async notifyTargetedUsers(announcement: Announcement, creator: User): Promise<void> {
    try {
      // Build query to find target users
      const targetUsersQuery: any = {};
      
      // Filter by roles if specified
      if (announcement.targetRoles.length > 0) {
        targetUsersQuery.role = {
          in: announcement.targetRoles
        };
      }
      
      // Filter by organizations if specified
      if (announcement.targetOrgs.length > 0) {
        targetUsersQuery.organizationId = {
          in: announcement.targetOrgs
        };
      }

      // Get all target users
      const targetUsers = await this.prisma.user.findMany({
        where: targetUsersQuery,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          organizationId: true
        }
      });

      // Don't notify the creator
      const usersToNotify = targetUsers.filter(user => user.id !== creator.id);
      const userIds = usersToNotify.map(user => user.id);

      if (userIds.length > 0) {
        // Send real-time notification
        await notificationService.notifyUsers(userIds, {
          type: 'announcement',
          title: `New announcement: ${announcement.title}`,
          content: announcement.content.length > 100 
            ? `${announcement.content.substring(0, 100)}...` 
            : announcement.content,
          priority: announcement.priority === 'high' ? 'high' : 'normal',
          data: {
            announcementId: announcement.id,
            creatorName: `${creator.firstName} ${creator.lastName}`,
            priority: announcement.priority,
            targetRoles: announcement.targetRoles,
            targetOrgs: announcement.targetOrgs,
            expiresAt: announcement.expiresAt
          }
        });
      }
    } catch (error) {
      console.error('Error notifying users about announcement:', error);
      // Don't throw error - notification failure shouldn't break announcement creation
    }
  }
}