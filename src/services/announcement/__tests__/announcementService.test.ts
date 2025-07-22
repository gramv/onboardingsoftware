import { PrismaClient, UserRole } from '@prisma/client';
import { AnnouncementService } from '../announcementService';
import { AnnouncementRepository } from '../../../repositories/announcement.repository';
import { ApiError } from '../../../utils/errors';

// Mock the PrismaClient and AnnouncementRepository
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    announcement: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    organization: {
      count: jest.fn(),
    },
    announcementReadReceipt: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock('../../../repositories/announcement.repository');

describe('AnnouncementService', () => {
  let announcementService: AnnouncementService;
  let prisma: any;
  let mockAnnouncementRepository: jest.Mocked<AnnouncementRepository>;

  beforeEach(() => {
    prisma = new PrismaClient();
    mockAnnouncementRepository = new AnnouncementRepository() as jest.Mocked<AnnouncementRepository>;
    (AnnouncementRepository as jest.Mock).mockImplementation(() => mockAnnouncementRepository);
    announcementService = new AnnouncementService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAnnouncement', () => {
    const mockAnnouncementData = {
      title: 'Test Announcement',
      content: 'This is a test announcement',
      priority: 'high',
      targetRoles: ['hr_admin', 'manager'],
      targetOrgs: ['org-id-1', 'org-id-2'],
      expiresAt: new Date('2023-12-31'),
    };

    const mockHrAdmin = {
      id: 'hr-admin-id',
      role: UserRole.hr_admin,
      organizationId: 'org-id-1',
    };

    const mockManager = {
      id: 'manager-id',
      role: UserRole.manager,
      organizationId: 'org-id-2',
    };

    const mockEmployee = {
      id: 'employee-id',
      role: UserRole.employee,
      organizationId: 'org-id-3',
    };

    it('should create an announcement when HR admin has permission', async () => {
      prisma.user.findUnique.mockResolvedValue(mockHrAdmin);
      prisma.organization.count.mockResolvedValue(2);
      mockAnnouncementRepository.create.mockResolvedValue({
        id: 'announcement-id',
        ...mockAnnouncementData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await announcementService.createAnnouncement(mockAnnouncementData, mockHrAdmin.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockHrAdmin.id },
      });
      expect(prisma.organization.count).toHaveBeenCalledWith({
        where: {
          id: {
            in: mockAnnouncementData.targetOrgs,
          },
        },
      });
      expect(mockAnnouncementRepository.create).toHaveBeenCalledWith(mockAnnouncementData);
      expect(result).toHaveProperty('id', 'announcement-id');
    });

    it('should create an announcement when manager targets their own organization', async () => {
      prisma.user.findUnique.mockResolvedValue(mockManager);
      prisma.organization.count.mockResolvedValue(2);
      mockAnnouncementRepository.create.mockResolvedValue({
        id: 'announcement-id',
        ...mockAnnouncementData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await announcementService.createAnnouncement(
        {
          ...mockAnnouncementData,
          targetOrgs: [mockManager.organizationId],
        },
        mockManager.id
      );

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockManager.id },
      });
      expect(mockAnnouncementRepository.create).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'announcement-id');
    });

    it('should throw error when employee tries to create announcement', async () => {
      prisma.user.findUnique.mockResolvedValue(mockEmployee);

      await expect(
        announcementService.createAnnouncement(mockAnnouncementData, mockEmployee.id)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when manager targets other organizations', async () => {
      prisma.user.findUnique.mockResolvedValue(mockManager);
      prisma.organization.count.mockResolvedValue(2);

      await expect(
        announcementService.createAnnouncement(mockAnnouncementData, mockManager.id)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getAnnouncementById', () => {
    const mockAnnouncement = {
      id: 'announcement-id',
      title: 'Test Announcement',
      content: 'This is a test announcement',
      priority: 'high',
      targetRoles: ['hr_admin', 'manager'],
      targetOrgs: ['org-id-1', 'org-id-2'],
      isActive: true,
      expiresAt: new Date('2023-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should return announcement with read status when found', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(mockAnnouncement);
      prisma.$queryRaw = jest.fn().mockResolvedValue([{ id: 'receipt-id' }]);

      const result = await announcementService.getAnnouncementById('announcement-id', 'user-id');

      expect(mockAnnouncementRepository.findById).toHaveBeenCalledWith('announcement-id');
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockAnnouncement,
        isRead: true,
      });
    });

    it('should return announcement with unread status when not read', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(mockAnnouncement);
      prisma.$queryRaw = jest.fn().mockResolvedValue([]);

      const result = await announcementService.getAnnouncementById('announcement-id', 'user-id');

      expect(mockAnnouncementRepository.findById).toHaveBeenCalledWith('announcement-id');
      expect(prisma.$queryRaw).toHaveBeenCalled();
      expect(result).toEqual({
        ...mockAnnouncement,
        isRead: false,
      });
    });

    it('should throw error when announcement not found', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(null);

      await expect(
        announcementService.getAnnouncementById('non-existent-id', 'user-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('markAnnouncementAsRead', () => {
    const mockAnnouncement = {
      id: 'announcement-id',
      title: 'Test Announcement',
      content: 'This is a test announcement',
      priority: 'high',
      targetRoles: ['hr_admin', 'manager'],
      targetOrgs: ['org-id-1', 'org-id-2'],
      isActive: true,
      expiresAt: new Date('2023-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockUser = {
      id: 'user-id',
      role: UserRole.employee,
      organizationId: 'org-id-1',
    };

    it('should create read receipt when announcement is read for the first time', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(mockAnnouncement);
      prisma.user.findUnique.mockResolvedValue(mockUser);
      prisma.$executeRaw = jest.fn().mockResolvedValue(1);

      await announcementService.markAnnouncementAsRead('announcement-id', 'user-id');

      expect(mockAnnouncementRepository.findById).toHaveBeenCalledWith('announcement-id');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-id' },
      });
      expect(prisma.$executeRaw).toHaveBeenCalled();
    });

    it('should throw error when announcement not found', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(null);

      await expect(
        announcementService.markAnnouncementAsRead('non-existent-id', 'user-id')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when user not found', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(mockAnnouncement);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        announcementService.markAnnouncementAsRead('announcement-id', 'non-existent-user')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getAnnouncementReadStats', () => {
    const mockAnnouncement = {
      id: 'announcement-id',
      title: 'Test Announcement',
      content: 'This is a test announcement',
      priority: 'high',
      targetRoles: ['hr_admin', 'manager'],
      targetOrgs: ['org-id-1', 'org-id-2'],
      isActive: true,
      expiresAt: new Date('2023-12-31'),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockHrAdmin = {
      id: 'hr-admin-id',
      role: UserRole.hr_admin,
      organizationId: 'org-id-1',
    };

    const mockManager = {
      id: 'manager-id',
      role: UserRole.manager,
      organizationId: 'org-id-2',
    };

    const mockReaders = [
      { id: 'user-1', firstName: 'John', lastName: 'Doe', role: UserRole.employee },
      { id: 'user-2', firstName: 'Jane', lastName: 'Smith', role: UserRole.manager },
    ];

    it('should return read statistics for HR admin', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue(mockAnnouncement);
      prisma.user.findUnique.mockResolvedValue(mockHrAdmin);
      prisma.user.count.mockResolvedValue(50);
      prisma.$queryRaw = jest.fn().mockImplementation((query) => {
        if (query.includes && query.includes('COUNT(*)')) {
          return Promise.resolve([{ count: 25 }]);
        } else {
          return Promise.resolve(
            mockReaders.map((user, index) => ({
              user_id: user.id,
              read_at: new Date()
            }))
          );
        }
      });
      prisma.user.findMany = jest.fn().mockResolvedValue(mockReaders);

      const result = await announcementService.getAnnouncementReadStats('announcement-id', mockHrAdmin.id);

      expect(mockAnnouncementRepository.findById).toHaveBeenCalledWith('announcement-id');
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockHrAdmin.id },
      });
      expect(prisma.user.count).toHaveBeenCalled();
      expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(prisma.user.findMany).toHaveBeenCalled();
      expect(result).toEqual({
        totalReads: 25,
        totalTargetUsers: 50,
        readPercentage: 50,
        recentReaders: mockReaders,
      });
    });

    it('should throw error when manager tries to view stats for announcement not targeting their org', async () => {
      mockAnnouncementRepository.findById.mockResolvedValue({
        ...mockAnnouncement,
        targetOrgs: ['org-id-1', 'org-id-3'], // Manager's org not included
      });
      prisma.user.findUnique.mockResolvedValue(mockManager);

      await expect(
        announcementService.getAnnouncementReadStats('announcement-id', mockManager.id)
      ).rejects.toThrow(ApiError);
    });
  });
});