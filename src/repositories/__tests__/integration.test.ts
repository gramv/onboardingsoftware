import { userRepository, employeeRepository, documentRepository } from '../index';
import { DatabaseUtils, prisma } from '@/utils/database';
import bcrypt from 'bcryptjs';

describe('Repository Integration Tests', () => {
  let testOrganizationId: string;
  let testUserId: string;
  let testEmployeeId: string;

  beforeAll(async () => {
    // Create test organization
    const org = await prisma.organization.create({
      data: {
        name: 'Integration Test Organization',
        type: 'motel',
        address: {
          street: '123 Integration St',
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
    await prisma.document.deleteMany({
      where: { employee: { user: { organizationId: testOrganizationId } } }
    });
    await prisma.employee.deleteMany({
      where: { user: { organizationId: testOrganizationId } }
    });
    await prisma.user.deleteMany({
      where: { organizationId: testOrganizationId }
    });
    await prisma.organization.delete({
      where: { id: testOrganizationId }
    });
    await prisma.$disconnect();
  });

  describe('Full Employee Onboarding Flow', () => {
    it('should create user, employee, and documents in sequence', async () => {
      // Step 1: Create user
      const user = await userRepository.create({
        email: 'integration@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        organizationId: testOrganizationId,
        firstName: 'Integration',
        lastName: 'Test'
      });
      testUserId = user.id;

      expect(user).toBeDefined();
      expect(user.email).toBe('integration@example.com');

      // Step 2: Create employee record
      const employee = await employeeRepository.create({
        userId: user.id,
        employeeId: 'EMP-INT-001',
        hireDate: new Date('2024-01-01'),
        position: 'Integration Tester',
        department: 'QA',
        hourlyRate: 25.00
      });
      testEmployeeId = employee.id;

      expect(employee).toBeDefined();
      expect(employee.employeeId).toBe('EMP-INT-001');
      expect(employee.userId).toBe(user.id);

      // Step 3: Create documents for employee
      const documents = [
        {
          employeeId: employee.id,
          documentType: 'handbook' as const,
          documentName: 'Employee Handbook'
        },
        {
          employeeId: employee.id,
          documentType: 'w4' as const,
          documentName: 'W-4 Tax Form'
        },
        {
          employeeId: employee.id,
          documentType: 'i9' as const,
          documentName: 'I-9 Employment Verification'
        }
      ];

      const createdDocs = [];
      for (const docData of documents) {
        const doc = await documentRepository.create(docData);
        createdDocs.push(doc);
      }

      expect(createdDocs).toHaveLength(3);
      createdDocs.forEach(doc => {
        expect(doc.employeeId).toBe(employee.id);
      });

      // Step 4: Verify relationships work
      const employeeWithDocs = await employeeRepository.findById(employee.id);
      expect(employeeWithDocs).toBeDefined();
      expect(employeeWithDocs?.userId).toBe(user.id);

      const employeeDocs = await documentRepository.findByEmployee(employee.id);
      expect(employeeDocs).toHaveLength(3);
    });
  });

  describe('DatabaseUtils Integration', () => {
    it('should check user organization access correctly', async () => {
      const hasAccess = await DatabaseUtils.userHasOrganizationAccess(
        testUserId,
        testOrganizationId
      );
      expect(hasAccess).toBe(true);

      // Test with non-existent organization
      const noAccess = await DatabaseUtils.userHasOrganizationAccess(
        testUserId,
        'non-existent-org-id'
      );
      expect(noAccess).toBe(false);
    });

    it('should get user accessible organizations', async () => {
      const accessibleOrgs = await DatabaseUtils.getUserAccessibleOrganizations(testUserId);
      expect(accessibleOrgs).toContain(testOrganizationId);
    });

    it('should get employee count by organization', async () => {
      const count = await DatabaseUtils.getEmployeeCountByOrganization(testOrganizationId);
      expect(count).toBeGreaterThan(0);
    });

    it('should get system health statistics', async () => {
      const health = await DatabaseUtils.getSystemHealth();
      
      expect(health).toBeDefined();
      expect(health.users).toBeDefined();
      expect(health.employees).toBeDefined();
      expect(health.documents).toBeDefined();
      expect(health.onboarding).toBeDefined();
      
      expect(typeof health.users.total).toBe('number');
      expect(typeof health.employees.total).toBe('number');
      expect(typeof health.documents.total).toBe('number');
    });
  });

  describe('Repository Singleton Pattern', () => {
    it('should use the same repository instances', async () => {
      // Import repositories again to test singleton pattern
      const { userRepository: userRepo2, employeeRepository: empRepo2 } = await import('../index');
      
      expect(userRepository).toBe(userRepo2);
      expect(employeeRepository).toBe(empRepo2);
    });
  });

  describe('Transaction Support', () => {
    it('should handle transactions correctly', async () => {
      // Create a user that we'll use for transaction testing
      const user = await userRepository.create({
        email: 'transaction@example.com',
        passwordHash: await bcrypt.hash('password123', 12),
        role: 'employee',
        organizationId: testOrganizationId,
        firstName: 'Transaction',
        lastName: 'Test'
      });

      const employee = await employeeRepository.create({
        userId: user.id,
        employeeId: 'EMP-TRANS-001',
        hireDate: new Date('2024-01-01'),
        position: 'Transaction Tester'
      });

      // Test termination transaction (which updates both employee and user)
      const terminationData = {
        terminationDate: new Date('2024-06-01'),
        managerRating: 4,
        rehireEligible: true
      };

      const terminatedEmployee = await employeeRepository.terminate(employee.id, terminationData);
      
      expect(terminatedEmployee.employmentStatus).toBe('terminated');
      
      // Verify user was also deactivated
      const deactivatedUser = await userRepository.findById(user.id);
      expect(deactivatedUser?.isActive).toBe(false);
    });
  });
});