import { EmployeeService, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeServiceContext } from '../employeeService';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { UserRepository } from '@/repositories/user.repository';
import { DocumentRepository } from '@/repositories/document.repository';
import { ExperienceLetterService } from '../experienceLetterService';
import { hashPassword } from '@/utils/auth/password';
import { PERMISSIONS } from '@/types/auth';

// Mock the repositories and services
jest.mock('@/repositories/employee.repository');
jest.mock('@/repositories/user.repository');
jest.mock('@/repositories/document.repository');
jest.mock('../experienceLetterService');
jest.mock('@/utils/auth/password');

const MockedEmployeeRepository = EmployeeRepository as jest.MockedClass<typeof EmployeeRepository>;
const MockedUserRepository = UserRepository as jest.MockedClass<typeof UserRepository>;
const MockedDocumentRepository = DocumentRepository as jest.MockedClass<typeof DocumentRepository>;
const MockedExperienceLetterService = ExperienceLetterService as jest.MockedClass<typeof ExperienceLetterService>;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;

describe('EmployeeService', () => {
  let employeeService: EmployeeService;
  let mockEmployeeRepo: jest.Mocked<EmployeeRepository>;
  let mockUserRepo: jest.Mocked<UserRepository>;
  let mockDocumentRepo: jest.Mocked<DocumentRepository>;
  let mockExperienceLetterService: jest.Mocked<ExperienceLetterService>;

  const mockHRContext: EmployeeServiceContext = {
    userId: 'hr-user-id',
    role: 'hr_admin',
    organizationId: 'corporate-org-id',
    permissions: [PERMISSIONS.MANAGE_ALL_EMPLOYEES, PERMISSIONS.VIEW_ALL_EMPLOYEES]
  };

  const mockManagerContext: EmployeeServiceContext = {
    userId: 'manager-user-id',
    role: 'manager',
    organizationId: 'motel-org-id',
    permissions: [PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]
  };

  const mockEmployeeContext: EmployeeServiceContext = {
    userId: 'employee-user-id',
    role: 'employee',
    organizationId: 'motel-org-id',
    permissions: [PERMISSIONS.VIEW_PROFILE, PERMISSIONS.EDIT_PROFILE]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockEmployeeRepo = {
      employeeIdExists: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      list: jest.fn(),
      searchGlobal: jest.fn(),
      terminate: jest.fn(),
      getOrganizationStats: jest.fn(),
      findAlumni: jest.fn(),
      findAlumniWithFilters: jest.fn(),
      searchAlumni: jest.fn(),
      findEmploymentHistoryByEmployee: jest.fn(),
    } as any;

    mockUserRepo = {
      emailExists: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as any;

    mockDocumentRepo = {
      create: jest.fn(),
      findByEmployeeAndType: jest.fn(),
      update: jest.fn(),
    } as any;

    mockExperienceLetterService = {
      generateExperienceLetter: jest.fn(),
    } as any;

    MockedEmployeeRepository.mockImplementation(() => mockEmployeeRepo);
    MockedUserRepository.mockImplementation(() => mockUserRepo);
    MockedDocumentRepository.mockImplementation(() => mockDocumentRepo);
    MockedExperienceLetterService.mockImplementation(() => mockExperienceLetterService);

    employeeService = new EmployeeService();
  });

  describe('createEmployee', () => {
    const createEmployeeRequest: CreateEmployeeRequest = {
      email: 'john.doe@example.com',
      password: 'password123',
      firstName: 'John',
      lastName: 'Doe',
      employeeId: 'EMP001',
      position: 'Front Desk',
      department: 'Operations',
      hourlyRate: 15.00,
      hireDate: new Date('2024-01-15'),
      organizationId: 'motel-org-id'
    };

    it('should create employee successfully with HR admin permissions', async () => {
      const mockUser = {
        id: 'user-id',
        email: 'john.doe@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'employee',
        organizationId: 'motel-org-id'
      };

      const mockEmployee = {
        id: 'employee-id',
        userId: 'user-id',
        employeeId: 'EMP001',
        user: mockUser
      };

      mockEmployeeRepo.employeeIdExists.mockResolvedValue(false);
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashed-password');
      mockUserRepo.create.mockResolvedValue(mockUser as any);
      mockEmployeeRepo.create.mockResolvedValue(mockEmployee as any);

      const result = await employeeService.createEmployee(createEmployeeRequest, mockHRContext);

      expect(mockEmployeeRepo.employeeIdExists).toHaveBeenCalledWith('EMP001');
      expect(mockUserRepo.emailExists).toHaveBeenCalledWith('john.doe@example.com');
      expect(mockedHashPassword).toHaveBeenCalledWith('password123');
      expect(mockUserRepo.create).toHaveBeenCalledWith({
        email: 'john.doe@example.com',
        passwordHash: 'hashed-password',
        role: 'employee',
        organizationId: 'motel-org-id',
        firstName: 'John',
        lastName: 'Doe',
        phone: undefined,
        languagePreference: 'en'
      });
      expect(result).toEqual(mockEmployee);
    });

    it('should allow manager to create employee in their organization', async () => {
      const mockUser = { id: 'user-id' };
      const mockEmployee = { id: 'employee-id', userId: 'user-id' };

      mockEmployeeRepo.employeeIdExists.mockResolvedValue(false);
      mockUserRepo.emailExists.mockResolvedValue(false);
      mockedHashPassword.mockResolvedValue('hashed-password');
      mockUserRepo.create.mockResolvedValue(mockUser as any);
      mockEmployeeRepo.create.mockResolvedValue(mockEmployee as any);

      await employeeService.createEmployee(createEmployeeRequest, mockManagerContext);

      expect(mockUserRepo.create).toHaveBeenCalled();
      expect(mockEmployeeRepo.create).toHaveBeenCalled();
    });

    it('should reject manager creating employee in different organization', async () => {
      const requestWithDifferentOrg = {
        ...createEmployeeRequest,
        organizationId: 'different-org-id'
      };

      await expect(
        employeeService.createEmployee(requestWithDifferentOrg, mockManagerContext)
      ).rejects.toThrow('Cannot create employee in different organization');
    });

    it('should reject duplicate employee ID', async () => {
      mockEmployeeRepo.employeeIdExists.mockResolvedValue(true);

      await expect(
        employeeService.createEmployee(createEmployeeRequest, mockHRContext)
      ).rejects.toThrow('Employee ID already exists');
    });

    it('should reject duplicate email', async () => {
      mockEmployeeRepo.employeeIdExists.mockResolvedValue(false);
      mockUserRepo.emailExists.mockResolvedValue(true);

      await expect(
        employeeService.createEmployee(createEmployeeRequest, mockHRContext)
      ).rejects.toThrow('Email already exists');
    });

    it('should reject employee role trying to create employee', async () => {
      await expect(
        employeeService.createEmployee(createEmployeeRequest, mockEmployeeContext)
      ).rejects.toThrow('Insufficient permissions to create employee');
    });
  });

  describe('getEmployee', () => {
    const mockEmployee = {
      id: 'employee-id',
      userId: 'employee-user-id',
      employeeId: 'EMP001',
      user: {
        id: 'employee-user-id',
        organizationId: 'motel-org-id'
      }
    };

    it('should allow HR admin to view any employee', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);

      const result = await employeeService.getEmployee('employee-id', mockHRContext);

      expect(mockEmployeeRepo.findById).toHaveBeenCalledWith('employee-id');
      expect(result).toEqual(mockEmployee);
    });

    it('should allow manager to view employee in their organization', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);

      const result = await employeeService.getEmployee('employee-id', mockManagerContext);

      expect(result).toEqual(mockEmployee);
    });

    it('should allow employee to view their own profile', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);

      const result = await employeeService.getEmployee('employee-id', mockEmployeeContext);

      expect(result).toEqual(mockEmployee);
    });

    it('should reject manager viewing employee from different organization', async () => {
      const employeeFromDifferentOrg = {
        ...mockEmployee,
        user: { ...mockEmployee.user, organizationId: 'different-org-id' }
      };
      mockEmployeeRepo.findById.mockResolvedValue(employeeFromDifferentOrg as any);

      await expect(
        employeeService.getEmployee('employee-id', mockManagerContext)
      ).rejects.toThrow('Insufficient permissions to view employee');
    });

    it('should reject employee viewing other employee profile', async () => {
      const otherEmployee = {
        ...mockEmployee,
        userId: 'other-user-id'
      };
      mockEmployeeRepo.findById.mockResolvedValue(otherEmployee as any);

      await expect(
        employeeService.getEmployee('employee-id', mockEmployeeContext)
      ).rejects.toThrow('Insufficient permissions to view employee');
    });

    it('should throw error when employee not found', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(null);

      await expect(
        employeeService.getEmployee('non-existent-id', mockHRContext)
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('updateEmployee', () => {
    const mockEmployee = {
      id: 'employee-id',
      userId: 'employee-user-id',
      user: {
        id: 'employee-user-id',
        organizationId: 'motel-org-id'
      }
    };

    const updateRequest: UpdateEmployeeRequest = {
      firstName: 'John',
      lastName: 'Smith',
      position: 'Senior Front Desk',
      hourlyRate: 16.00
    };

    it('should update employee successfully with HR admin permissions', async () => {
      const updatedEmployee = { ...mockEmployee, ...updateRequest };
      
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockUserRepo.update.mockResolvedValue({} as any);
      mockEmployeeRepo.update.mockResolvedValue(updatedEmployee as any);

      const result = await employeeService.updateEmployee('employee-id', updateRequest, mockHRContext);

      expect(mockUserRepo.update).toHaveBeenCalledWith('employee-user-id', {
        firstName: 'John',
        lastName: 'Smith',
        phone: undefined,
        languagePreference: undefined
      });
      expect(mockEmployeeRepo.update).toHaveBeenCalledWith('employee-id', {
        position: 'Senior Front Desk',
        department: undefined,
        hourlyRate: 16.00,
        dateOfBirth: undefined,
        ssnEncrypted: undefined,
        emergencyContact: undefined,
        address: undefined,
        schedule: undefined
      });
      expect(result).toEqual(updatedEmployee);
    });

    it('should allow manager to update employee in their organization', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockUserRepo.update.mockResolvedValue({} as any);
      mockEmployeeRepo.update.mockResolvedValue(mockEmployee as any);

      await employeeService.updateEmployee('employee-id', updateRequest, mockManagerContext);

      expect(mockEmployeeRepo.update).toHaveBeenCalled();
    });

    it('should allow employee to update their own profile', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockUserRepo.update.mockResolvedValue({} as any);
      mockEmployeeRepo.update.mockResolvedValue(mockEmployee as any);

      await employeeService.updateEmployee('employee-id', updateRequest, mockEmployeeContext);

      expect(mockEmployeeRepo.update).toHaveBeenCalled();
    });

    it('should throw error when employee not found', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(null);

      await expect(
        employeeService.updateEmployee('non-existent-id', updateRequest, mockHRContext)
      ).rejects.toThrow('Employee not found');
    });
  });

  describe('listEmployees', () => {
    const mockEmployeeList = {
      data: [
        { id: 'emp1', employeeId: 'EMP001' },
        { id: 'emp2', employeeId: 'EMP002' }
      ],
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1
    };

    it('should list all employees for HR admin', async () => {
      mockEmployeeRepo.list.mockResolvedValue(mockEmployeeList as any);

      const result = await employeeService.listEmployees({ page: 1, limit: 10 }, mockHRContext);

      expect(mockEmployeeRepo.list).toHaveBeenCalledWith(
        { page: 1, limit: 10 },
        { page: 1, limit: 10 }
      );
      expect(result).toEqual(mockEmployeeList);
    });

    it('should filter employees by organization for manager', async () => {
      mockEmployeeRepo.list.mockResolvedValue(mockEmployeeList as any);

      await employeeService.listEmployees({ page: 1, limit: 10 }, mockManagerContext);

      expect(mockEmployeeRepo.list).toHaveBeenCalledWith(
        { page: 1, limit: 10, organizationId: 'motel-org-id' },
        { page: 1, limit: 10 }
      );
    });
  });

  describe('terminateEmployee', () => {
    const mockEmployee = {
      id: 'employee-id',
      userId: 'employee-user-id',
      user: {
        organizationId: 'motel-org-id'
      }
    };

    const terminationData = {
      terminationDate: new Date('2024-02-01'),
      managerRating: 4,
      rehireEligible: true
    };

    it('should terminate employee successfully with HR admin permissions', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockEmployeeRepo.terminate.mockResolvedValue(mockEmployee as any);

      const result = await employeeService.terminateEmployee('employee-id', terminationData, mockHRContext);

      expect(mockEmployeeRepo.terminate).toHaveBeenCalledWith('employee-id', terminationData);
      expect(result).toEqual(mockEmployee);
    });

    it('should allow manager to terminate employee in their organization', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockEmployeeRepo.terminate.mockResolvedValue(mockEmployee as any);

      await employeeService.terminateEmployee('employee-id', terminationData, mockManagerContext);

      expect(mockEmployeeRepo.terminate).toHaveBeenCalled();
    });

    it('should reject invalid manager rating', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);

      const invalidTerminationData = { ...terminationData, managerRating: 6 };

      await expect(
        employeeService.terminateEmployee('employee-id', invalidTerminationData, mockHRContext)
      ).rejects.toThrow('Manager rating must be between 1 and 5');
    });

    it('should reject employee role trying to terminate', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);

      await expect(
        employeeService.terminateEmployee('employee-id', terminationData, mockEmployeeContext)
      ).rejects.toThrow('Insufficient permissions to terminate employee');
    });
  });

  describe('searchEmployees', () => {
    it('should allow HR admin to search globally', async () => {
      const mockResults = [{ id: 'emp1' }, { id: 'emp2' }];
      mockEmployeeRepo.searchGlobal.mockResolvedValue(mockResults as any);

      const result = await employeeService.searchEmployees('john', mockHRContext, 10);

      expect(mockEmployeeRepo.searchGlobal).toHaveBeenCalledWith('john', 10);
      expect(result).toEqual(mockResults);
    });

    it('should restrict manager search to their organization', async () => {
      const mockResults = { data: [{ id: 'emp1' }] };
      mockEmployeeRepo.list.mockResolvedValue(mockResults as any);

      const result = await employeeService.searchEmployees('john', mockManagerContext, 10);

      expect(mockEmployeeRepo.list).toHaveBeenCalledWith(
        { organizationId: 'motel-org-id', search: 'john' },
        { limit: 10 }
      );
      expect(result).toEqual(mockResults.data);
    });
  });

  describe('terminateEmployeeWithExperienceLetter', () => {
    const mockEmployee = {
      id: 'employee-id',
      userId: 'employee-user-id',
      employeeId: 'EMP001',
      employmentStatus: 'active',
      user: {
        id: 'employee-user-id',
        organizationId: 'motel-org-id',
        firstName: 'John',
        lastName: 'Doe',
        languagePreference: 'en'
      }
    };

    const terminationData = {
      terminationDate: new Date('2024-02-01'),
      managerRating: 4,
      rehireEligible: true,
      generateExperienceLetter: true
    };

    it('should terminate employee and generate experience letter', async () => {
      const terminatedEmployee = { ...mockEmployee, employmentStatus: 'terminated' };
      const experienceLetterPath = '/path/to/experience-letter.pdf';

      mockEmployeeRepo.findById
        .mockResolvedValueOnce(mockEmployee as any) // First call for validation
        .mockResolvedValueOnce(terminatedEmployee as any); // Second call for experience letter
      mockEmployeeRepo.terminate.mockResolvedValue(terminatedEmployee as any);
      mockExperienceLetterService.generateExperienceLetter.mockResolvedValue(experienceLetterPath);
      mockDocumentRepo.create.mockResolvedValue({} as any);

      const result = await employeeService.terminateEmployeeWithExperienceLetter(
        'employee-id',
        terminationData,
        mockHRContext,
        { includeRating: true, includeRecommendation: true }
      );

      expect(mockEmployeeRepo.terminate).toHaveBeenCalledWith('employee-id', terminationData);
      expect(mockExperienceLetterService.generateExperienceLetter).toHaveBeenCalledWith(
        terminatedEmployee,
        expect.objectContaining({
          includeRating: true,
          includeRecommendation: true,
          locale: 'en'
        })
      );
      expect(mockDocumentRepo.create).toHaveBeenCalledWith({
        employeeId: 'employee-id',
        documentType: 'experience_letter',
        documentName: 'Experience Letter - John Doe',
        filePath: experienceLetterPath,
        fileSize: 0,
        mimeType: 'application/pdf'
      });
      expect(result.employee).toEqual(terminatedEmployee);
      expect(result.experienceLetterPath).toEqual(experienceLetterPath);
    });

    it('should terminate employee without experience letter when disabled', async () => {
      const terminatedEmployee = { ...mockEmployee, employmentStatus: 'terminated' };
      const terminationDataNoLetter = { ...terminationData, generateExperienceLetter: false };

      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockEmployeeRepo.terminate.mockResolvedValue(terminatedEmployee as any);

      const result = await employeeService.terminateEmployeeWithExperienceLetter(
        'employee-id',
        terminationDataNoLetter,
        mockHRContext
      );

      expect(mockEmployeeRepo.terminate).toHaveBeenCalled();
      expect(mockExperienceLetterService.generateExperienceLetter).not.toHaveBeenCalled();
      expect(result.employee).toEqual(terminatedEmployee);
      expect(result.experienceLetterPath).toBeUndefined();
    });

    it('should reject terminating already terminated employee', async () => {
      const alreadyTerminatedEmployee = { ...mockEmployee, employmentStatus: 'terminated' };
      mockEmployeeRepo.findById.mockResolvedValue(alreadyTerminatedEmployee as any);

      await expect(
        employeeService.terminateEmployeeWithExperienceLetter('employee-id', terminationData, mockHRContext)
      ).rejects.toThrow('Employee is already terminated');
    });

    it('should continue termination even if experience letter generation fails', async () => {
      const terminatedEmployee = { ...mockEmployee, employmentStatus: 'terminated' };

      mockEmployeeRepo.findById
        .mockResolvedValueOnce(mockEmployee as any) // First call for validation
        .mockResolvedValueOnce(terminatedEmployee as any); // Second call for experience letter
      mockEmployeeRepo.terminate.mockResolvedValue(terminatedEmployee as any);
      mockExperienceLetterService.generateExperienceLetter.mockRejectedValue(new Error('PDF generation failed'));

      const result = await employeeService.terminateEmployeeWithExperienceLetter(
        'employee-id',
        terminationData,
        mockHRContext
      );

      expect(result.employee).toEqual(terminatedEmployee);
      expect(result.experienceLetterPath).toBeUndefined();
    });
  });

  describe('generateExperienceLetterForEmployee', () => {
    const mockTerminatedEmployee = {
      id: 'employee-id',
      employeeId: 'EMP001',
      employmentStatus: 'terminated',
      user: {
        firstName: 'John',
        lastName: 'Doe',
        languagePreference: 'en'
      }
    };

    it('should generate experience letter for terminated employee', async () => {
      const experienceLetterPath = '/path/to/experience-letter.pdf';

      mockEmployeeRepo.findById.mockResolvedValue(mockTerminatedEmployee as any);
      mockExperienceLetterService.generateExperienceLetter.mockResolvedValue(experienceLetterPath);
      mockDocumentRepo.findByEmployeeAndType.mockResolvedValue(null);
      mockDocumentRepo.create.mockResolvedValue({} as any);

      const result = await employeeService.generateExperienceLetterForEmployee(
        'employee-id',
        mockHRContext,
        { includeRating: true }
      );

      expect(mockExperienceLetterService.generateExperienceLetter).toHaveBeenCalledWith(
        mockTerminatedEmployee,
        expect.objectContaining({
          includeRating: true,
          includeRecommendation: true,
          locale: 'en'
        })
      );
      expect(mockDocumentRepo.create).toHaveBeenCalled();
      expect(result).toEqual(experienceLetterPath);
    });

    it('should update existing experience letter document', async () => {
      const experienceLetterPath = '/path/to/new-experience-letter.pdf';
      const existingDoc = { id: 'doc-id', version: 1 };

      mockEmployeeRepo.findById.mockResolvedValue(mockTerminatedEmployee as any);
      mockExperienceLetterService.generateExperienceLetter.mockResolvedValue(experienceLetterPath);
      mockDocumentRepo.findByEmployeeAndType.mockResolvedValue(existingDoc as any);
      mockDocumentRepo.update.mockResolvedValue({} as any);

      const result = await employeeService.generateExperienceLetterForEmployee(
        'employee-id',
        mockHRContext
      );

      expect(mockDocumentRepo.update).toHaveBeenCalledWith('doc-id', {
        filePath: experienceLetterPath,
        version: 2
      });
      expect(result).toEqual(experienceLetterPath);
    });

    it('should reject generating letter for active employee', async () => {
      const activeEmployee = { ...mockTerminatedEmployee, employmentStatus: 'active' };
      mockEmployeeRepo.findById.mockResolvedValue(activeEmployee as any);

      await expect(
        employeeService.generateExperienceLetterForEmployee('employee-id', mockHRContext)
      ).rejects.toThrow('Employee is not terminated');
    });
  });

  describe('getAlumni', () => {
    const mockAlumni = [
      {
        id: 'emp1',
        employeeId: 'EMP001',
        employmentStatus: 'terminated',
        managerRating: 4,
        rehireEligible: true
      },
      {
        id: 'emp2',
        employeeId: 'EMP002',
        employmentStatus: 'terminated',
        managerRating: 2,
        rehireEligible: false
      }
    ];

    it('should get alumni with filters for HR admin', async () => {
      mockEmployeeRepo.findAlumniWithFilters.mockResolvedValue(mockAlumni as any);

      const result = await employeeService.getAlumni(mockHRContext, {
        minRating: 3,
        rehireEligibleOnly: true
      });

      expect(mockEmployeeRepo.findAlumniWithFilters).toHaveBeenCalledWith({
        minRating: 3,
        rehireEligibleOnly: true
      });
      expect(result).toEqual(mockAlumni);
    });

    it('should restrict alumni to organization for manager', async () => {
      mockEmployeeRepo.findAlumniWithFilters.mockResolvedValue(mockAlumni as any);

      await employeeService.getAlumni(mockManagerContext, {
        organizationId: 'different-org-id' // Should be ignored
      });

      expect(mockEmployeeRepo.findAlumniWithFilters).toHaveBeenCalledWith({
        organizationId: 'motel-org-id' // Should use manager's org, ignoring the requested different org
      });
    });

    it('should reject employee trying to view alumni', async () => {
      await expect(
        employeeService.getAlumni(mockEmployeeContext)
      ).rejects.toThrow('Insufficient permissions to view alumni');
    });
  });

  describe('getAlumniEmploymentHistory', () => {
    const mockEmployee = {
      id: 'employee-id',
      employeeId: 'EMP001',
      user: {
        email: 'john.doe@example.com',
        organizationId: 'motel-org-id'
      },
      ssnEncrypted: 'encrypted-ssn'
    };

    const mockEmploymentHistory = [
      {
        id: 'emp-history-1',
        hireDate: new Date('2020-01-01'),
        terminationDate: new Date('2021-12-31'),
        position: 'Front Desk Clerk',
        department: 'Reception',
        managerRating: 4,
        rehireEligible: true
      },
      {
        id: 'emp-history-2',
        hireDate: new Date('2022-06-01'),
        terminationDate: new Date('2023-12-31'),
        position: 'Night Auditor',
        department: 'Reception',
        managerRating: 5,
        rehireEligible: true
      }
    ];

    it('should get employment history with rehire recommendation', async () => {
      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockEmployeeRepo.findEmploymentHistoryByEmployee.mockResolvedValue(mockEmploymentHistory as any);

      const result = await employeeService.getAlumniEmploymentHistory('employee-id', mockHRContext);

      expect(mockEmployeeRepo.findEmploymentHistoryByEmployee).toHaveBeenCalledWith(
        'john.doe@example.com',
        'encrypted-ssn'
      );
      expect(result.employee).toEqual(mockEmployee);
      expect(result.previousEmployments).toHaveLength(2);
      expect(result.rehireRecommendation.eligible).toBe(true);
      expect(result.rehireRecommendation.averageRating).toBe(4.5);
      expect(result.rehireRecommendation.totalEmployments).toBe(2);
      expect(result.rehireRecommendation.reasons).toContain('High performance ratings');
      expect(result.rehireRecommendation.reasons).toContain('Eligible for rehire from all previous positions');
    });

    it('should recommend against rehire for poor performance', async () => {
      const poorPerformanceHistory = [
        {
          ...mockEmploymentHistory[0],
          managerRating: 2,
          rehireEligible: false
        }
      ];

      mockEmployeeRepo.findById.mockResolvedValue(mockEmployee as any);
      mockEmployeeRepo.findEmploymentHistoryByEmployee.mockResolvedValue(poorPerformanceHistory as any);

      const result = await employeeService.getAlumniEmploymentHistory('employee-id', mockHRContext);

      expect(result.rehireRecommendation.eligible).toBe(false);
      expect(result.rehireRecommendation.averageRating).toBe(2);
      expect(result.rehireRecommendation.reasons).toContain('Below average performance in previous roles');
      expect(result.rehireRecommendation.reasons).toContain('Marked as not eligible for rehire in previous positions');
    });
  });

  describe('searchAlumni', () => {
    const mockAlumniResults = [
      {
        id: 'emp1',
        employeeId: 'EMP001',
        employmentStatus: 'terminated',
        managerRating: 4
      }
    ];

    it('should search alumni for HR admin', async () => {
      mockEmployeeRepo.searchAlumni.mockResolvedValue(mockAlumniResults as any);

      const result = await employeeService.searchAlumni('john', mockHRContext, {
        minRating: 3,
        rehireEligibleOnly: true
      });

      expect(mockEmployeeRepo.searchAlumni).toHaveBeenCalledWith('john', {
        minRating: 3,
        rehireEligibleOnly: true
      });
      expect(result).toEqual(mockAlumniResults);
    });

    it('should restrict alumni search to organization for manager', async () => {
      mockEmployeeRepo.searchAlumni.mockResolvedValue(mockAlumniResults as any);

      await employeeService.searchAlumni('john', mockManagerContext);

      expect(mockEmployeeRepo.searchAlumni).toHaveBeenCalledWith('john', {
        organizationId: 'motel-org-id'
      });
    });

    it('should reject employee trying to search alumni', async () => {
      await expect(
        employeeService.searchAlumni('john', mockEmployeeContext)
      ).rejects.toThrow('Insufficient permissions to view alumni');
    });
  });
});