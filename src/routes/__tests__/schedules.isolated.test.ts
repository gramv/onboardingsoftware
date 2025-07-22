import request from 'supertest';
import { PrismaClient, ScheduleEntry } from '@prisma/client';
import express from 'express';
import jwt from 'jsonwebtoken';
import { ScheduleService } from '../../services/schedule/scheduleService';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { UserRepository } from '../../repositories/user.repository';
import { EmailService } from '../../services/email/emailService';
import { TranslationService } from '../../utils/i18n/translationService';
import scheduleRoutes from '../../routes/schedules';

// Mock dependencies
jest.mock('../../repositories/schedule.repository');
jest.mock('../../repositories/user.repository');
jest.mock('../../services/email/emailService');
jest.mock('../../utils/i18n/translationService');
jest.mock('../../utils/database', () => ({
  prisma: {
    scheduleEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  }
}));
jest.mock('@prisma/client', () => {
  const mockPrisma = {
    scheduleEntry: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    employee: {
      findUnique: jest.fn(),
    },
    $disconnect: jest.fn(),
  };
  return {
    PrismaClient: jest.fn(() => mockPrisma),
  };
});

// Create a test app with only the schedule routes
const app = express();
app.use(express.json());
app.use('/api/schedules', scheduleRoutes);

// Helper function to generate auth token for testing
const generateAuthToken = (payload: { id: string; role: string; organizationId: string }): string => {
  return jwt.sign(payload, 'test-secret', {
    expiresIn: '1h',
  });
};

describe('Schedule Routes (Isolated)', () => {
  let hrAdminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeeId: string;
  let managerId: string;
  let hrAdminId: string;
  let organizationId: string;
  let prisma: PrismaClient;
  let mockScheduleRepository: jest.Mocked<ScheduleRepository>;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeAll(() => {
    // Set up test data
    employeeId = 'employee-123';
    managerId = 'manager-456';
    hrAdminId = 'hradmin-789';
    organizationId = 'org-123';
    
    // Generate tokens
    hrAdminToken = generateAuthToken({
      id: hrAdminId,
      role: 'hr_admin',
      organizationId: 'corporate-123',
    });
    
    managerToken = generateAuthToken({
      id: managerId,
      role: 'manager',
      organizationId,
    });
    
    employeeToken = generateAuthToken({
      id: employeeId,
      role: 'employee',
      organizationId,
    });

    // Set up mocks
    prisma = new PrismaClient();
    mockScheduleRepository = new ScheduleRepository(prisma) as jest.Mocked<ScheduleRepository>;
    mockUserRepository = new UserRepository() as jest.Mocked<UserRepository>;

    // Mock the JWT verification
    jest.spyOn(jwt, 'verify').mockImplementation((token, secret, options) => {
      if (token === hrAdminToken) {
        return { id: hrAdminId, role: 'hr_admin', organizationId: 'corporate-123' };
      } else if (token === managerToken) {
        return { id: managerId, role: 'manager', organizationId };
      } else if (token === employeeToken) {
        return { id: employeeId, role: 'employee', organizationId };
      }
      throw new Error('Invalid token');
    });

    // Mock user repository methods
    mockUserRepository.isUserEmployee = jest.fn().mockImplementation((userId, empId) => {
      return Promise.resolve(userId === employeeId && empId === employeeId);
    });

    mockUserRepository.isEmployeeInManagerOrganization = jest.fn().mockImplementation((mgrId, empId) => {
      return Promise.resolve(mgrId === managerId && empId === employeeId);
    });

    // Mock schedule repository methods
    const mockScheduleEntry: ScheduleEntry = {
      id: 'schedule-123',
      employeeId,
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      breakDuration: 60,
      isWorkDay: true,
      scheduleType: 'regular',
      effectiveFrom: new Date(),
      effectiveUntil: null,
      createdBy: managerId,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockScheduleRepository.createScheduleEntry = jest.fn().mockResolvedValue(mockScheduleEntry);
    mockScheduleRepository.getScheduleEntryById = jest.fn().mockResolvedValue(mockScheduleEntry);
    mockScheduleRepository.updateScheduleEntry = jest.fn().mockImplementation((id, data) => {
      return Promise.resolve({
        ...mockScheduleEntry,
        ...data,
      });
    });
    mockScheduleRepository.deleteScheduleEntry = jest.fn().mockResolvedValue(mockScheduleEntry);
    mockScheduleRepository.getEmployeeSchedule = jest.fn().mockResolvedValue([mockScheduleEntry]);
    mockScheduleRepository.findOverlappingSchedules = jest.fn().mockResolvedValue([]);
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/schedules/weekly', () => {
    const weeklyScheduleData = {
      employeeId: 'employee-123',
      weeklySchedule: {
        monday: {
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
        },
        tuesday: {
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
        },
        wednesday: {
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
        },
        thursday: {
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
        },
        friday: {
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
        },
        saturday: {
          startTime: '10:00',
          endTime: '15:00',
          breakDuration: 30,
          isWorkDay: false,
        },
        sunday: {
          startTime: '00:00',
          endTime: '00:00',
          breakDuration: 0,
          isWorkDay: false,
        },
        effectiveFrom: new Date().toISOString().split('T')[0], // Today's date
        isTemplate: true,
      },
    };

    it('should create a weekly schedule as HR admin', async () => {
      // Mock the service to return a successful response
      jest.spyOn(ScheduleService.prototype, 'createWeeklySchedule').mockResolvedValue([
        {
          id: 'schedule-123',
          employeeId: 'employee-123',
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
          scheduleType: 'regular',
          effectiveFrom: new Date(),
          effectiveUntil: null,
          createdBy: hrAdminId,
          notes: 'Created from template',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const response = await request(app)
        .post('/api/schedules/weekly')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(weeklyScheduleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });
  });

  describe('GET /api/schedules/employee/:employeeId', () => {
    it('should get employee schedule as HR admin', async () => {
      // Mock the service to return a successful response
      jest.spyOn(ScheduleService.prototype, 'getEmployeeSchedule').mockResolvedValue([
        {
          id: 'schedule-123',
          employeeId: 'employee-123',
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
          scheduleType: 'regular',
          effectiveFrom: new Date(),
          effectiveUntil: null,
          createdBy: hrAdminId,
          notes: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Two weeks from now

      const response = await request(app)
        .get(`/api/schedules/employee/${employeeId}`)
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${hrAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });
  });

  describe('GET /api/schedules/employee/:employeeId/current', () => {
    it('should get current and upcoming schedule', async () => {
      // Mock the service to return a successful response
      jest.spyOn(ScheduleService.prototype, 'getCurrentAndUpcomingSchedule').mockResolvedValue({
        currentWeek: [
          {
            id: 'schedule-123',
            employeeId: 'employee-123',
            date: new Date(),
            startTime: '09:00',
            endTime: '17:00',
            breakDuration: 60,
            isWorkDay: true,
            scheduleType: 'regular',
            effectiveFrom: new Date(),
            effectiveUntil: null,
            createdBy: hrAdminId,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        nextWeek: [
          {
            id: 'schedule-456',
            employeeId: 'employee-123',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
            startTime: '09:00',
            endTime: '17:00',
            breakDuration: 60,
            isWorkDay: true,
            scheduleType: 'regular',
            effectiveFrom: new Date(),
            effectiveUntil: null,
            createdBy: hrAdminId,
            notes: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get(`/api/schedules/employee/${employeeId}/current`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentWeek).toBeDefined();
      expect(response.body.data.nextWeek).toBeDefined();
      expect(Array.isArray(response.body.data.currentWeek)).toBe(true);
      expect(Array.isArray(response.body.data.nextWeek)).toBe(true);
    });
  });

  describe('PUT /api/schedules/:scheduleId', () => {
    it('should update a schedule entry as HR admin', async () => {
      // Mock the service to return a successful response
      jest.spyOn(ScheduleService.prototype, 'updateScheduleEntry').mockResolvedValue({
        id: 'schedule-123',
        employeeId: 'employee-123',
        date: new Date(),
        startTime: '10:00', // Updated
        endTime: '18:00', // Updated
        breakDuration: 60,
        isWorkDay: true,
        scheduleType: 'regular',
        effectiveFrom: new Date(),
        effectiveUntil: null,
        createdBy: hrAdminId,
        notes: 'Updated schedule',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated schedule',
      };

      const response = await request(app)
        .put('/api/schedules/schedule-123')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntry).toBeDefined();
      expect(response.body.data.scheduleEntry.startTime).toBe('10:00');
      expect(response.body.data.scheduleEntry.endTime).toBe('18:00');
    });
  });

  describe('DELETE /api/schedules/:scheduleId', () => {
    it('should delete a schedule entry as HR admin', async () => {
      // Mock the repository to return a successful response
      mockScheduleRepository.deleteScheduleEntry.mockResolvedValue({
        id: 'schedule-123',
        employeeId: 'employee-123',
        date: new Date(),
        startTime: '09:00',
        endTime: '17:00',
        breakDuration: 60,
        isWorkDay: true,
        scheduleType: 'regular',
        effectiveFrom: new Date(),
        effectiveUntil: null,
        createdBy: hrAdminId,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const response = await request(app)
        .delete('/api/schedules/schedule-123')
        .set('Authorization', `Bearer ${hrAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});