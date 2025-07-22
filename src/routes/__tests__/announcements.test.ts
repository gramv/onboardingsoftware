import request from 'supertest';
import express from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import announcementRoutes from '../announcements';
import { AnnouncementService } from '../../services/announcement/announcementService';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the auth middleware
jest.mock('../../middleware/auth/authMiddleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      userId: 'mock-user-id',
      role: UserRole.hr_admin,
      organizationId: 'mock-org-id',
      email: 'admin@example.com',
      languagePreference: 'en'
    };
    next();
  },
  requireRole: (roles: string[]) => (req: any, res: any, next: any) => {
    if (roles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({ error: 'Forbidden' });
    }
  }
}));

// Mock the AnnouncementService
jest.mock('../../services/announcement/announcementService');

describe('Announcement Routes', () => {
  let app: express.Application;
  let mockAnnouncementService: jest.Mocked<AnnouncementService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create a mock instance of AnnouncementService
    mockAnnouncementService = new AnnouncementService({} as PrismaClient) as jest.Mocked<AnnouncementService>;
    
    // Mock the constructor to return our mock instance
    (AnnouncementService as jest.Mock).mockImplementation(() => mockAnnouncementService);
    
    app.use('/announcements', announcementRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /announcements', () => {
    it('should create a new announcement', async () => {
      const announcementData = {
        title: 'Test Announcement',
        content: 'This is a test announcement',
        priority: 'high',
        targetRoles: ['hr_admin', 'manager'],
        targetOrgs: ['org-id-1', 'org-id-2'],
        expiresAt: '2023-12-31T00:00:00.000Z',
      };

      const createdAnnouncement = {
        id: 'announcement-id',
        ...announcementData,
        expiresAt: new Date(announcementData.expiresAt),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnnouncementService.createAnnouncement.mockResolvedValue(createdAnnouncement);

      const response = await request(app)
        .post('/announcements')
        .send(announcementData)
        .expect(200);

      expect(mockAnnouncementService.createAnnouncement).toHaveBeenCalledWith(
        {
          ...announcementData,
          expiresAt: expect.any(Date),
        },
        'mock-user-id'
      );
      expect(response.body.data).toHaveProperty('id', 'announcement-id');
    });
  });

  describe('GET /announcements', () => {
    it('should get announcements with filtering and pagination', async () => {
      const mockAnnouncements = [
        {
          id: 'announcement-1',
          title: 'Announcement 1',
          content: 'Content 1',
          priority: 'high',
          targetRoles: ['hr_admin'],
          targetOrgs: ['org-id-1'],
          isActive: true,
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRead: false,
        },
        {
          id: 'announcement-2',
          title: 'Announcement 2',
          content: 'Content 2',
          priority: 'normal',
          targetRoles: ['manager', 'employee'],
          targetOrgs: ['org-id-2'],
          isActive: true,
          expiresAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          isRead: true,
        },
      ];

      mockAnnouncementService.listAnnouncements.mockResolvedValue({
        announcements: mockAnnouncements,
        total: 2,
      });

      const response = await request(app)
        .get('/announcements')
        .query({
          page: '1',
          limit: '10',
          isActive: 'true',
          priority: 'high',
          search: 'test',
        })
        .expect(200);

      expect(mockAnnouncementService.listAnnouncements).toHaveBeenCalledWith(
        {
          isActive: true,
          priority: 'high',
          search: 'test',
          targetRoles: undefined,
          targetOrgs: undefined,
        },
        1,
        10,
        'mock-user-id'
      );
      expect(response.body.data.announcements).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      });
    });
  });

  describe('GET /announcements/active', () => {
    it('should get active announcements for the current user', async () => {
      const mockActiveAnnouncements = [
        {
          id: 'announcement-1',
          title: 'Active Announcement 1',
          content: 'Content 1',
          priority: 'high',
          targetRoles: ['hr_admin'],
          targetOrgs: ['org-id-1'],
          isActive: true,
          expiresAt: new Date('2023-12-31'),
          createdAt: new Date(),
          updatedAt: new Date(),
          isRead: false,
        },
      ];

      mockAnnouncementService.getActiveAnnouncementsForUser.mockResolvedValue(mockActiveAnnouncements);

      const response = await request(app)
        .get('/announcements/active')
        .expect(200);

      expect(mockAnnouncementService.getActiveAnnouncementsForUser).toHaveBeenCalledWith('mock-user-id');
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0]).toHaveProperty('id', 'announcement-1');
    });
  });

  describe('GET /announcements/:id', () => {
    it('should get a specific announcement by ID', async () => {
      const mockAnnouncement = {
        id: 'announcement-id',
        title: 'Test Announcement',
        content: 'This is a test announcement',
        priority: 'high',
        targetRoles: ['hr_admin'],
        targetOrgs: ['org-id-1'],
        isActive: true,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
        isRead: false,
      };

      mockAnnouncementService.getAnnouncementById.mockResolvedValue(mockAnnouncement);

      const response = await request(app)
        .get('/announcements/announcement-id')
        .expect(200);

      expect(mockAnnouncementService.getAnnouncementById).toHaveBeenCalledWith('announcement-id', 'mock-user-id');
      expect(response.body.data).toHaveProperty('id', 'announcement-id');
    });
  });

  describe('PUT /announcements/:id', () => {
    it('should update an announcement', async () => {
      const updateData = {
        title: 'Updated Announcement',
        content: 'Updated content',
        isActive: false,
      };

      const updatedAnnouncement = {
        id: 'announcement-id',
        title: 'Updated Announcement',
        content: 'Updated content',
        priority: 'high',
        targetRoles: ['hr_admin'],
        targetOrgs: ['org-id-1'],
        isActive: false,
        expiresAt: new Date('2023-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAnnouncementService.updateAnnouncement.mockResolvedValue(updatedAnnouncement);

      const response = await request(app)
        .put('/announcements/announcement-id')
        .send(updateData)
        .expect(200);

      expect(mockAnnouncementService.updateAnnouncement).toHaveBeenCalledWith(
        'announcement-id',
        updateData,
        'mock-user-id'
      );
      expect(response.body.data).toHaveProperty('title', 'Updated Announcement');
      expect(response.body.data).toHaveProperty('isActive', false);
    });
  });

  describe('DELETE /announcements/:id', () => {
    it('should delete an announcement', async () => {
      mockAnnouncementService.deleteAnnouncement.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/announcements/announcement-id')
        .expect(200);

      expect(mockAnnouncementService.deleteAnnouncement).toHaveBeenCalledWith('announcement-id', 'mock-user-id');
      expect(response.body.message).toBe('Announcement deleted successfully');
    });
  });

  describe('POST /announcements/:id/read', () => {
    it('should mark an announcement as read', async () => {
      mockAnnouncementService.markAnnouncementAsRead.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/announcements/announcement-id/read')
        .expect(200);

      expect(mockAnnouncementService.markAnnouncementAsRead).toHaveBeenCalledWith('announcement-id', 'mock-user-id');
      expect(response.body.message).toBe('Announcement marked as read');
    });
  });

  describe('GET /announcements/:id/stats', () => {
    it('should get read statistics for an announcement', async () => {
      const mockStats = {
        totalReads: 25,
        totalTargetUsers: 50,
        readPercentage: 50,
        recentReaders: [
          { 
            id: 'user-1', 
            firstName: 'John', 
            lastName: 'Doe', 
            role: UserRole.employee,
            email: 'john@example.com',
            passwordHash: 'hash',
            organizationId: 'org-1',
            phone: null,
            languagePreference: 'en',
            isActive: true,
            mfaEnabled: false,
            mfaSecret: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          { 
            id: 'user-2', 
            firstName: 'Jane', 
            lastName: 'Smith', 
            role: UserRole.manager,
            email: 'jane@example.com',
            passwordHash: 'hash',
            organizationId: 'org-2',
            phone: null,
            languagePreference: 'en',
            isActive: true,
            mfaEnabled: false,
            mfaSecret: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
        ],
      };

      mockAnnouncementService.getAnnouncementReadStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/announcements/announcement-id/stats')
        .expect(200);

      expect(mockAnnouncementService.getAnnouncementReadStats).toHaveBeenCalledWith('announcement-id', 'mock-user-id');
      expect(response.body.data).toEqual(mockStats);
    });
  });
});