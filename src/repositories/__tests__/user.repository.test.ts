import { UserRepository } from '../user.repository';
import { prisma } from '@/utils/database';
import bcrypt from 'bcryptjs';

describe('UserRepository', () => {
  let userRepository: UserRepository;
  let testOrganizationId: string;

  beforeAll(async () => {
    userRepository = new UserRepository();
    
    // Create a test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Test Organization',
        type: 'motel',
        address: {
          street: '123 Test St',
          city: 'Test City',
          state: 'CA',
          zipCode: '12345',
          country: 'USA'
        }
      }
    });
    testOrganizationId = org.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.user.deleteMany({
      where: { organizationId: testOrganizationId }
    });
    await prisma.organization.delete({
      where: { id: testOrganizationId }
    });
    await prisma.$disconnect();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee' as const,
        organizationId: testOrganizationId,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-0123'
      };

      const user = await userRepository.create(userData);

      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email);
      expect(user.firstName).toBe(userData.firstName);
      expect(user.lastName).toBe(userData.lastName);
      expect(user.role).toBe(userData.role);
      expect(user.organizationId).toBe(testOrganizationId);
      expect(user.languagePreference).toBe('en'); // Default value
      expect(user.isActive).toBe(true); // Default value
    });

    it('should set default language preference to en', async () => {
      const userData = {
        email: 'test2@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee' as const,
        organizationId: testOrganizationId,
        firstName: 'Jane',
        lastName: 'Smith'
      };

      const user = await userRepository.create(userData);
      expect(user.languagePreference).toBe('en');
    });
  });

  describe('findByEmail', () => {
    it('should find user by email', async () => {
      const email = 'findme@example.com';
      const userData = {
        email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'manager' as const,
        organizationId: testOrganizationId,
        firstName: 'Find',
        lastName: 'Me'
      };

      await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(email);
      expect(foundUser?.organizationId).toBe(testOrganizationId);
    });

    it('should return null for non-existent email', async () => {
      const foundUser = await userRepository.findByEmail('nonexistent@example.com');
      expect(foundUser).toBeNull();
    });
  });

  describe('emailExists', () => {
    it('should return true for existing email', async () => {
      const email = 'exists@example.com';
      await userRepository.create({
        email,
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee' as const,
        organizationId: testOrganizationId,
        firstName: 'Exists',
        lastName: 'User'
      });

      const exists = await userRepository.emailExists(email);
      expect(exists).toBe(true);
    });

    it('should return false for non-existent email', async () => {
      const exists = await userRepository.emailExists('doesnotexist@example.com');
      expect(exists).toBe(false);
    });
  });

  describe('list', () => {
    beforeAll(async () => {
      // Create multiple test users
      const users = [
        {
          email: 'list1@example.com',
          passwordHash: await bcrypt.hash('password123', 12),
          role: 'employee' as const,
          organizationId: testOrganizationId,
          firstName: 'List',
          lastName: 'User1'
        },
        {
          email: 'list2@example.com',
          passwordHash: await bcrypt.hash('password123', 12),
          role: 'manager' as const,
          organizationId: testOrganizationId,
          firstName: 'List',
          lastName: 'User2'
        }
      ];

      for (const userData of users) {
        await userRepository.create(userData);
      }
    });

    it('should list users with pagination', async () => {
      const result = await userRepository.list({}, { page: 1, limit: 5 });

      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.pagination).toBeDefined();
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(5);
    });

    it('should filter users by role', async () => {
      const result = await userRepository.list({ role: 'manager' });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(user => {
        expect(user.role).toBe('manager');
      });
    });

    it('should filter users by organization', async () => {
      const result = await userRepository.list({ organizationId: testOrganizationId });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(user => {
        expect(user.organizationId).toBe(testOrganizationId);
      });
    });

    it('should search users by name', async () => {
      const result = await userRepository.list({ search: 'List' });

      expect(result.data.length).toBeGreaterThan(0);
      result.data.forEach(user => {
        expect(
          user.firstName.includes('List') || 
          user.lastName.includes('List') ||
          user.email.includes('list')
        ).toBe(true);
      });
    });
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      const user = await userRepository.create({
        email: 'update@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee' as const,
        organizationId: testOrganizationId,
        firstName: 'Update',
        lastName: 'Me'
      });

      const updatedUser = await userRepository.update(user.id, {
        firstName: 'Updated',
        phone: '+1-555-9999'
      });

      expect(updatedUser.firstName).toBe('Updated');
      expect(updatedUser.phone).toBe('+1-555-9999');
      expect(updatedUser.lastName).toBe('Me'); // Unchanged
    });
  });

  describe('updatePassword', () => {
    it('should update user password', async () => {
      const user = await userRepository.create({
        email: 'password@example.com',
        passwordHash: await bcrypt.hash('oldpassword', 12),
        role: 'employee' as const,
        organizationId: testOrganizationId,
        firstName: 'Password',
        lastName: 'User'
      });

      const newPasswordHash = await bcrypt.hash('newpassword', 12);
      const updatedUser = await userRepository.updatePassword(user.id, newPasswordHash);

      expect(updatedUser.passwordHash).toBe(newPasswordHash);
      expect(updatedUser.passwordHash).not.toBe(user.passwordHash);
    });
  });
});