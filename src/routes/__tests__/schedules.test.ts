import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import app from '../../server';
import jwt from 'jsonwebtoken';
import { config } from '../../config/environment';
import { dbHelper } from '../../test/database-helper';

// Helper function to generate auth token for testing
const generateAuthToken = (payload: { id: string; role: string; organizationId: string }): string => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: '1h',
  });
};
const prisma = new PrismaClient();

describe('Schedule Routes', () => {
  let hrAdminToken: string;
  let managerToken: string;
  let employeeToken: string;
  let employeeId: string;
  let managerId: string;
  let hrAdminId: string;
  let organizationId: string;

  beforeAll(async () => {
    await dbHelper.cleanup();
    
    // Create test data manually since we don't have seedTestData
    const corporate = await prisma.organization.create({
      data: {
        name: 'Corporate HQ',
        type: 'corporate',
        address: { street: '123 Main St', city: 'Anytown', state: 'CA', zip: '12345' }
      }
    });
    
    const motel = await prisma.organization.create({
      data: {
        name: 'Test Motel',
        type: 'motel',
        parentId: corporate.id,
        address: { street: '456 Hotel Ave', city: 'Anytown', state: 'CA', zip: '12345' }
      }
    });
    
    const hrAdmin = await prisma.user.create({
      data: {
        email: 'hradmin@example.com',
        passwordHash: 'hashed_password',
        role: 'hr_admin',
        organizationId: corporate.id,
        firstName: 'HR',
        lastName: 'Admin'
      }
    });
    
    const manager = await prisma.user.create({
      data: {
        email: 'manager@example.com',
        passwordHash: 'hashed_password',
        role: 'manager',
        organizationId: motel.id,
        firstName: 'Motel',
        lastName: 'Manager'
      }
    });
    
    const employeeUser = await prisma.user.create({
      data: {
        email: 'employee@example.com',
        passwordHash: 'hashed_password',
        role: 'employee',
        organizationId: motel.id,
        firstName: 'Test',
        lastName: 'Employee'
      }
    });
    
    const employee = await prisma.employee.create({
      data: {
        userId: employeeUser.id,
        employeeId: 'EMP-001',
        hireDate: new Date(),
      }
    });
    
    const testData = {
      corporate,
      motel,
      hrAdmin,
      manager,
      employee: {
        ...employee,
        id: employee.id
      }
    };
    
    // Set up test data
    hrAdminId = testData.hrAdmin.id;
    managerId = testData.manager.id;
    employeeId = testData.employee.id;
    organizationId = testData.motel.id;
    
    // Generate tokens
    hrAdminToken = generateAuthToken({
      id: hrAdminId,
      role: 'hr_admin',
      organizationId: testData.corporate.id,
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
  });

  afterAll(async () => {
    await dbHelper.cleanup();
    await prisma.$disconnect();
  });

  describe('POST /schedules/weekly', () => {
    const weeklyScheduleData = {
      employeeId: '',
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

    beforeEach(() => {
      weeklyScheduleData.employeeId = employeeId;
    });

    it('should create a weekly schedule as HR admin', async () => {
      const response = await request(app)
        .post('/schedules/weekly')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(weeklyScheduleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });

    it('should create a weekly schedule as manager', async () => {
      const response = await request(app)
        .post('/schedules/weekly')
        .set('Authorization', `Bearer ${managerToken}`)
        .send(weeklyScheduleData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });

    it('should reject creation by employee', async () => {
      const response = await request(app)
        .post('/schedules/weekly')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(weeklyScheduleData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid schedule data', async () => {
      const invalidData = {
        ...weeklyScheduleData,
        weeklySchedule: {
          ...weeklyScheduleData.weeklySchedule,
          monday: {
            ...weeklyScheduleData.weeklySchedule.monday,
            startTime: 'invalid-time', // Invalid time format
          },
        },
      };

      const response = await request(app)
        .post('/schedules/weekly')
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /schedules/employee/:employeeId', () => {
    it('should get employee schedule as HR admin', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Two weeks from now

      const response = await request(app)
        .get(`/schedules/employee/${employeeId}`)
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

    it('should get employee schedule as manager', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Two weeks from now

      const response = await request(app)
        .get(`/schedules/employee/${employeeId}`)
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });

    it('should get own schedule as employee', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Two weeks from now

      const response = await request(app)
        .get(`/schedules/employee/${employeeId}`)
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntries).toBeDefined();
      expect(Array.isArray(response.body.data.scheduleEntries)).toBe(true);
    });

    it('should reject employee accessing another employee\'s schedule', async () => {
      // Create another employee
      const anotherEmployee = await prisma.employee.create({
        data: {
          user: {
            create: {
              email: 'another.employee@example.com',
              passwordHash: 'hashed_password',
              role: 'employee',
              organizationId,
              firstName: 'Another',
              lastName: 'Employee',
            },
          },
          employeeId: 'EMP-002',
          hireDate: new Date(),
        },
      });

      const anotherEmployeeToken = generateAuthToken({
        id: anotherEmployee.userId,
        role: 'employee',
        organizationId,
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 14); // Two weeks from now

      const response = await request(app)
        .get(`/schedules/employee/${employeeId}`)
        .query({
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
        })
        .set('Authorization', `Bearer ${anotherEmployeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /schedules/employee/:employeeId/current', () => {
    it('should get current and upcoming schedule', async () => {
      const response = await request(app)
        .get(`/schedules/employee/${employeeId}/current`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.currentWeek).toBeDefined();
      expect(response.body.data.nextWeek).toBeDefined();
      expect(Array.isArray(response.body.data.currentWeek)).toBe(true);
      expect(Array.isArray(response.body.data.nextWeek)).toBe(true);
    });
  });

  describe('PUT /schedules/:scheduleId', () => {
    let scheduleId: string;

    beforeEach(async () => {
      // Create a schedule entry to update
      const scheduleEntry = await prisma.scheduleEntry.create({
        data: {
          employeeId,
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
          scheduleType: 'regular',
          effectiveFrom: new Date(),
          createdBy: hrAdminId,
        },
      });

      scheduleId = scheduleEntry.id;
    });

    it('should update a schedule entry as HR admin', async () => {
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated schedule',
      };

      const response = await request(app)
        .put(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntry).toBeDefined();
      expect(response.body.data.scheduleEntry.startTime).toBe('10:00');
      expect(response.body.data.scheduleEntry.endTime).toBe('18:00');
    });

    it('should update a schedule entry as manager', async () => {
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
        notes: 'Updated schedule',
      };

      const response = await request(app)
        .put(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.scheduleEntry).toBeDefined();
      expect(response.body.data.scheduleEntry.startTime).toBe('10:00');
      expect(response.body.data.scheduleEntry.endTime).toBe('18:00');
    });

    it('should reject update by employee', async () => {
      const updateData = {
        startTime: '10:00',
        endTime: '18:00',
      };

      const response = await request(app)
        .put(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send(updateData);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid update data', async () => {
      const invalidData = {
        startTime: 'invalid-time', // Invalid time format
      };

      const response = await request(app)
        .put(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${hrAdminToken}`)
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /schedules/:scheduleId', () => {
    let scheduleId: string;

    beforeEach(async () => {
      // Create a schedule entry to delete
      const scheduleEntry = await prisma.scheduleEntry.create({
        data: {
          employeeId,
          date: new Date(),
          startTime: '09:00',
          endTime: '17:00',
          breakDuration: 60,
          isWorkDay: true,
          scheduleType: 'regular',
          effectiveFrom: new Date(),
          createdBy: hrAdminId,
        },
      });

      scheduleId = scheduleEntry.id;
    });

    it('should delete a schedule entry as HR admin', async () => {
      const response = await request(app)
        .delete(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${hrAdminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the entry was deleted
      const deletedEntry = await prisma.scheduleEntry.findUnique({
        where: { id: scheduleId },
      });
      expect(deletedEntry).toBeNull();
    });

    it('should delete a schedule entry as manager', async () => {
      const response = await request(app)
        .delete(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the entry was deleted
      const deletedEntry = await prisma.scheduleEntry.findUnique({
        where: { id: scheduleId },
      });
      expect(deletedEntry).toBeNull();
    });

    it('should reject deletion by employee', async () => {
      const response = await request(app)
        .delete(`/schedules/${scheduleId}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);

      // Verify the entry was not deleted
      const entry = await prisma.scheduleEntry.findUnique({
        where: { id: scheduleId },
      });
      expect(entry).not.toBeNull();
    });
  });
});