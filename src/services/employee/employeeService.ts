import { Employee, User, UserRole, EmploymentStatus, Prisma, Document } from '@prisma/client';
import { EmployeeRepository, CreateEmployeeData, UpdateEmployeeData, EmployeeFilters, TerminationData } from '@/repositories/employee.repository';
import { UserRepository, CreateUserData } from '@/repositories/user.repository';
import { DocumentRepository } from '@/repositories/document.repository';
import { PaginatedResponse } from '@/repositories/base.repository';
import { hashPassword } from '@/utils/auth/password';
import { PERMISSIONS } from '@/types/auth';
import { translationService, EMPLOYEE_ERROR_KEYS, EMPLOYEE_SUCCESS_KEYS } from '@/utils/i18n/translationService';
import { ExperienceLetterService, ExperienceLetterOptions } from './experienceLetterService';

// Type for Employee with User relation
type EmployeeWithUser = Prisma.EmployeeGetPayload<{
  include: {
    user: {
      include: {
        organization: true;
      };
    };
  };
}>;

export interface CreateEmployeeRequest {
  // User information
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  languagePreference?: 'en' | 'es';

  // Employee information
  employeeId: string;
  position?: string;
  department?: string;
  hourlyRate?: number;
  hireDate: Date;

  // Personal information
  dateOfBirth?: Date;
  ssnEncrypted?: string;
  emergencyContact?: any;
  address?: any;

  // Organization assignment
  organizationId: string;
}

export interface UpdateEmployeeRequest {
  // User information
  firstName?: string;
  lastName?: string;
  phone?: string;
  languagePreference?: 'en' | 'es';

  // Employee information
  position?: string;
  department?: string;
  hourlyRate?: number;
  dateOfBirth?: Date;
  ssnEncrypted?: string;
  emergencyContact?: any;
  address?: any;
  schedule?: any;
}

export interface EmployeeSearchFilters extends EmployeeFilters {
  page?: number;
  limit?: number;
}

export interface EmployeeServiceContext {
  userId: string;
  role: UserRole;
  organizationId: string;
  permissions: string[];
  locale?: string; // Add locale for internationalization
}

export class EmployeeService {
  private employeeRepository: EmployeeRepository;
  private userRepository: UserRepository;
  private documentRepository: DocumentRepository;
  private experienceLetterService: ExperienceLetterService;

  constructor() {
    this.employeeRepository = new EmployeeRepository();
    this.userRepository = new UserRepository();
    this.documentRepository = new DocumentRepository();
    this.experienceLetterService = new ExperienceLetterService();
  }

  /**
   * Create a new employee with user account
   */
  async createEmployee(
    data: CreateEmployeeRequest,
    context: EmployeeServiceContext
  ): Promise<Employee> {
    // Validate permissions
    this.validateCreatePermissions(context, data.organizationId);

    // Validate employee ID uniqueness
    const employeeIdExists = await this.employeeRepository.employeeIdExists(data.employeeId);
    if (employeeIdExists) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_ID_EXISTS, {}, context.locale));
    }

    // Validate email uniqueness
    const emailExists = await this.userRepository.emailExists(data.email);
    if (emailExists) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMAIL_EXISTS, {}, context.locale));
    }

    // Hash password
    const passwordHash = await hashPassword(data.password);

    // Create user data
    const userData: CreateUserData = {
      email: data.email,
      passwordHash,
      role: 'employee',
      organizationId: data.organizationId,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      languagePreference: data.languagePreference || 'en'
    };

    // Create user first
    const user = await this.userRepository.create(userData);

    // Create employee data
    const employeeData: CreateEmployeeData = {
      userId: user.id,
      employeeId: data.employeeId,
      hireDate: data.hireDate,
      position: data.position,
      department: data.department,
      hourlyRate: data.hourlyRate,
      dateOfBirth: data.dateOfBirth,
      ssnEncrypted: data.ssnEncrypted,
      emergencyContact: data.emergencyContact,
      address: data.address
    };

    // Create employee
    const employee = await this.employeeRepository.create(employeeData);

    // Log success message for audit/notification purposes
    console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {
      employeeId: employee.employeeId,
      name: `${data.firstName} ${data.lastName}`
    }, context.locale));

    return employee;
  }

  /**
   * Get employee by ID with role-based access control
   */
  async getEmployee(
    employeeId: string,
    context: EmployeeServiceContext
  ): Promise<EmployeeWithUser> {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate access permissions
    this.validateViewPermissions(context, employee as EmployeeWithUser);

    return employee as EmployeeWithUser;
  }

  /**
   * Update employee information
   */
  async updateEmployee(
    employeeId: string,
    data: UpdateEmployeeRequest,
    context: EmployeeServiceContext
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate update permissions
    this.validateUpdatePermissions(context, employee as EmployeeWithUser);

    // Update user information if provided
    if (data.firstName || data.lastName || data.phone || data.languagePreference) {
      const userUpdateData = {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        languagePreference: data.languagePreference
      };

      await this.userRepository.update(employee.userId, userUpdateData);
    }

    // Update employee information
    const employeeUpdateData: UpdateEmployeeData = {
      position: data.position,
      department: data.department,
      hourlyRate: data.hourlyRate,
      dateOfBirth: data.dateOfBirth,
      ssnEncrypted: data.ssnEncrypted,
      emergencyContact: data.emergencyContact,
      address: data.address,
      schedule: data.schedule
    };

    const updatedEmployee = await this.employeeRepository.update(employeeId, employeeUpdateData);

    // Log success message for audit/notification purposes
    console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_UPDATED, {
      employeeId: employee.employeeId,
      name: `${data.firstName || (employee as any).user?.firstName} ${data.lastName || (employee as any).user?.lastName}`
    }, context.locale));

    return updatedEmployee;
  }

  /**
   * List employees with organization filtering based on role
   */
  async listEmployees(
    filters: EmployeeSearchFilters,
    context: EmployeeServiceContext
  ): Promise<PaginatedResponse<Employee>> {
    // Apply organization filtering based on role
    const effectiveFilters = this.applyOrganizationFiltering(filters, context);

    const paginationOptions = {
      page: filters.page,
      limit: filters.limit
    };

    return this.employeeRepository.list(effectiveFilters, paginationOptions);
  }

  /**
   * Search employees with role-based filtering
   */
  async searchEmployees(
    query: string,
    context: EmployeeServiceContext,
    limit: number = 20
  ): Promise<Employee[]> {
    // HR Admin can search globally
    if (context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES)) {
      return this.employeeRepository.searchGlobal(query, limit);
    }

    // Managers and employees search within their organization
    const filters: EmployeeFilters = {
      organizationId: context.organizationId,
      search: query
    };

    const result = await this.employeeRepository.list(filters, { limit });
    return result.data;
  }

  /**
   * Terminate employee
   */
  async terminateEmployee(
    employeeId: string,
    terminationData: TerminationData,
    context: EmployeeServiceContext
  ): Promise<Employee> {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate termination permissions
    this.validateTerminationPermissions(context, employee as EmployeeWithUser);

    // Validate termination data
    if (terminationData.managerRating < 1 || terminationData.managerRating > 5) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INVALID_MANAGER_RATING, {}, context.locale));
    }

    const terminatedEmployee = await this.employeeRepository.terminate(employeeId, terminationData);

    // Log success message for audit/notification purposes
    console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_TERMINATED, {
      employeeId: employee.employeeId,
      name: `${(employee as any).user?.firstName} ${(employee as any).user?.lastName}`
    }, context.locale));

    return terminatedEmployee;
  }

  /**
   * Get employee statistics for organization
   */
  async getEmployeeStats(
    organizationId: string,
    context: EmployeeServiceContext
  ) {
    // Validate access to organization stats
    this.validateStatsPermissions(context, organizationId);

    return this.employeeRepository.getOrganizationStats(organizationId);
  }

  /**
   * Enhanced termination with comprehensive off-boarding workflow
   */
  async terminateEmployeeWithExperienceLetter(
    employeeId: string,
    terminationData: TerminationData & { 
      generateExperienceLetter?: boolean;
      terminationReason?: string;
      finalWorkDate?: Date;
      exitInterviewCompleted?: boolean;
      equipmentReturned?: boolean;
      accessRevoked?: boolean;
    },
    context: EmployeeServiceContext,
    experienceLetterOptions?: ExperienceLetterOptions
  ): Promise<{ 
    employee: Employee; 
    experienceLetterPath?: string;
    offboardingChecklist: {
      terminationProcessed: boolean;
      experienceLetterGenerated: boolean;
      userAccountDeactivated: boolean;
      documentsArchived: boolean;
    };
  }> {
    const employee = await this.employeeRepository.findById(employeeId);

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate termination permissions
    this.validateTerminationPermissions(context, employee as EmployeeWithUser);

    // Validate termination data
    if (terminationData.managerRating < 1 || terminationData.managerRating > 5) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INVALID_MANAGER_RATING, {}, context.locale));
    }

    // Check if employee is already terminated
    if (employee.employmentStatus === 'terminated') {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_ALREADY_TERMINATED, {}, context.locale));
    }

    // Terminate employee
    const terminatedEmployee = await this.employeeRepository.terminate(employeeId, terminationData);

    let experienceLetterPath: string | undefined;

    // Generate experience letter if requested
    if (terminationData.generateExperienceLetter !== false) {
      try {
        const employeeWithDetails = await this.employeeRepository.findById(employeeId) as EmployeeWithUser;
        
        const letterOptions: ExperienceLetterOptions = {
          includeRating: true,
          includeRecommendation: true,
          locale: context.locale || employeeWithDetails.user.languagePreference,
          ...experienceLetterOptions
        };

        experienceLetterPath = await this.experienceLetterService.generateExperienceLetter(
          employeeWithDetails,
          letterOptions
        );

        // Create document record for the experience letter
        await this.documentRepository.create({
          employeeId: employeeId,
          documentType: 'experience_letter',
          documentName: `Experience Letter - ${employeeWithDetails.user.firstName} ${employeeWithDetails.user.lastName}`,
          filePath: experienceLetterPath,
          fileSize: 0, // Will be updated when file is accessed
          mimeType: 'application/pdf'
        });

        console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EXPERIENCE_LETTER_GENERATED, {
          employeeId: employee.employeeId,
          path: experienceLetterPath
        }, context.locale));

      } catch (error) {
        console.error('Error generating experience letter:', error);
        // Don't fail the termination if experience letter generation fails
      }
    }

    // Create comprehensive off-boarding checklist
    const offboardingChecklist = {
      terminationProcessed: true,
      experienceLetterGenerated: !!experienceLetterPath,
      userAccountDeactivated: true, // This is handled by the terminate method
      documentsArchived: true // Documents are preserved in the system
    };

    // Log success message for audit/notification purposes
    console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_TERMINATED, {
      employeeId: employee.employeeId,
      name: `${(employee as any).user?.firstName} ${(employee as any).user?.lastName}`
    }, context.locale));

    // Log off-boarding completion
    console.log(`Off-boarding completed for ${employee.employeeId}:`, {
      terminationProcessed: offboardingChecklist.terminationProcessed,
      experienceLetterGenerated: offboardingChecklist.experienceLetterGenerated,
      userAccountDeactivated: offboardingChecklist.userAccountDeactivated,
      documentsArchived: offboardingChecklist.documentsArchived,
      terminationReason: terminationData.terminationReason,
      finalWorkDate: terminationData.finalWorkDate,
      exitInterviewCompleted: terminationData.exitInterviewCompleted,
      equipmentReturned: terminationData.equipmentReturned,
      accessRevoked: terminationData.accessRevoked
    });

    return {
      employee: terminatedEmployee,
      experienceLetterPath,
      offboardingChecklist
    };
  }

  /**
   * Generate experience letter for existing terminated employee
   */
  async generateExperienceLetterForEmployee(
    employeeId: string,
    context: EmployeeServiceContext,
    options?: ExperienceLetterOptions
  ): Promise<string> {
    const employee = await this.employeeRepository.findById(employeeId) as EmployeeWithUser;

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate permissions
    this.validateViewPermissions(context, employee);

    // Check if employee is terminated
    if (employee.employmentStatus !== 'terminated') {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_TERMINATED, {}, context.locale));
    }

    const letterOptions: ExperienceLetterOptions = {
      includeRating: true,
      includeRecommendation: true,
      locale: context.locale || employee.user.languagePreference,
      ...options
    };

    const experienceLetterPath = await this.experienceLetterService.generateExperienceLetter(
      employee,
      letterOptions
    );

    // Create or update document record
    const existingDoc = await this.documentRepository.findByEmployeeAndType(employeeId, 'experience_letter');
    
    if (existingDoc) {
      await this.documentRepository.update(existingDoc.id, {
        filePath: experienceLetterPath,
        version: existingDoc.version + 1
      });
    } else {
      await this.documentRepository.create({
        employeeId: employeeId,
        documentType: 'experience_letter',
        documentName: `Experience Letter - ${employee.user.firstName} ${employee.user.lastName}`,
        filePath: experienceLetterPath,
        fileSize: 0,
        mimeType: 'application/pdf'
      });
    }

    console.log(translationService.t(EMPLOYEE_SUCCESS_KEYS.EXPERIENCE_LETTER_GENERATED, {
      employeeId: employee.employeeId,
      path: experienceLetterPath
    }, context.locale));

    return experienceLetterPath;
  }

  /**
   * Get alumni (terminated employees) for rehire evaluation with enhanced filtering
   */
  async getAlumni(
    context: EmployeeServiceContext,
    filters?: {
      organizationId?: string;
      minRating?: number;
      maxRating?: number;
      rehireEligibleOnly?: boolean;
      terminatedAfter?: Date;
      terminatedBefore?: Date;
      search?: string;
    }
  ): Promise<Employee[]> {
    // Validate permissions
    if (!context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES) && 
        !context.permissions.includes(PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES)) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_ALUMNI, {}, context.locale));
    }

    // Determine organization scope
    let organizationId = filters?.organizationId;
    if (!context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES)) {
      organizationId = context.organizationId;
    }

    return this.employeeRepository.findAlumniWithFilters({
      organizationId,
      minRating: filters?.minRating,
      maxRating: filters?.maxRating,
      rehireEligibleOnly: filters?.rehireEligibleOnly,
      terminatedAfter: filters?.terminatedAfter,
      terminatedBefore: filters?.terminatedBefore,
      search: filters?.search
    });
  }

  /**
   * Get alumni employment history for rehire evaluation
   */
  async getAlumniEmploymentHistory(
    employeeId: string,
    context: EmployeeServiceContext
  ): Promise<{
    employee: EmployeeWithUser;
    previousEmployments: Array<{
      hireDate: Date;
      terminationDate: Date;
      position: string;
      department?: string;
      managerRating?: number;
      rehireEligible: boolean;
      workDuration: string;
    }>;
    rehireRecommendation: {
      eligible: boolean;
      averageRating: number;
      totalEmployments: number;
      reasons: string[];
    };
  }> {
    const employee = await this.employeeRepository.findById(employeeId) as EmployeeWithUser;

    if (!employee) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.EMPLOYEE_NOT_FOUND, {}, context.locale));
    }

    // Validate permissions
    this.validateViewPermissions(context, employee);

    // Get all employment records for this person (by email or SSN)
    const employmentHistory = await this.employeeRepository.findEmploymentHistoryByEmployee(
      employee.user.email,
      employee.ssnEncrypted
    );

    const previousEmployments = employmentHistory.map(emp => ({
      hireDate: emp.hireDate,
      terminationDate: emp.terminationDate || new Date(),
      position: emp.position || 'Employee',
      department: emp.department || undefined,
      managerRating: emp.managerRating || undefined,
      rehireEligible: emp.rehireEligible,
      workDuration: this.calculateWorkDuration(emp.hireDate, emp.terminationDate || new Date())
    }));

    // Calculate rehire recommendation
    const ratings = employmentHistory.filter(emp => emp.managerRating).map(emp => emp.managerRating!);
    const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
    const allEligible = employmentHistory.every(emp => emp.rehireEligible);
    
    const reasons: string[] = [];
    if (averageRating >= 4) reasons.push('High performance ratings');
    if (allEligible) reasons.push('Eligible for rehire from all previous positions');
    if (employmentHistory.length === 1) reasons.push('First-time employee');
    if (averageRating < 3) reasons.push('Below average performance in previous roles');
    if (!allEligible) reasons.push('Marked as not eligible for rehire in previous positions');

    return {
      employee,
      previousEmployments,
      rehireRecommendation: {
        eligible: allEligible && averageRating >= 3,
        averageRating,
        totalEmployments: employmentHistory.length,
        reasons
      }
    };
  }

  /**
   * Search alumni by various criteria
   */
  async searchAlumni(
    query: string,
    context: EmployeeServiceContext,
    filters?: {
      minRating?: number;
      rehireEligibleOnly?: boolean;
    }
  ): Promise<Employee[]> {
    // Validate permissions
    if (!context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES) && 
        !context.permissions.includes(PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES)) {
      throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_ALUMNI, {}, context.locale));
    }

    const organizationId = context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES) 
      ? undefined 
      : context.organizationId;

    return this.employeeRepository.searchAlumni(query, {
      organizationId,
      minRating: filters?.minRating,
      rehireEligibleOnly: filters?.rehireEligibleOnly
    });
  }

  /**
   * Calculate work duration in human-readable format
   */
  private calculateWorkDuration(hireDate: Date, terminationDate: Date): string {
    const diffTime = Math.abs(terminationDate.getTime() - hireDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    let duration = '';
    if (years > 0) {
      duration += `${years} year${years === 1 ? '' : 's'}`;
    }
    if (months > 0) {
      if (duration) duration += ', ';
      duration += `${months} month${months === 1 ? '' : 's'}`;
    }

    return duration || '1 month';
  }

  // Private helper methods for permission validation

  private validateCreatePermissions(context: EmployeeServiceContext, targetOrgId: string): void {
    // HR Admin can create employees in any organization
    if (context.permissions.includes(PERMISSIONS.MANAGE_ALL_EMPLOYEES)) {
      return;
    }

    // Managers can only create employees in their organization
    if (context.permissions.includes(PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES)) {
      if (context.organizationId !== targetOrgId) {
        throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.CANNOT_CREATE_DIFFERENT_ORG, {}, context.locale));
      }
      return;
    }

    throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_CREATE, {}, context.locale));
  }

  private validateViewPermissions(context: EmployeeServiceContext, employee: EmployeeWithUser): void {
    // HR Admin can view all employees
    if (context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES)) {
      return;
    }

    // Managers can view employees in their organization
    if (context.permissions.includes(PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES)) {
      if (employee.user?.organizationId === context.organizationId) {
        return;
      }
    }

    // Employees can view their own profile
    if (context.permissions.includes(PERMISSIONS.VIEW_PROFILE)) {
      if (employee.userId === context.userId) {
        return;
      }
    }

    throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_VIEW, {}, context.locale));
  }

  private validateUpdatePermissions(context: EmployeeServiceContext, employee: EmployeeWithUser): void {
    // HR Admin can update all employees
    if (context.permissions.includes(PERMISSIONS.MANAGE_ALL_EMPLOYEES)) {
      return;
    }

    // Managers can update employees in their organization
    if (context.permissions.includes(PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES)) {
      if (employee.user?.organizationId === context.organizationId) {
        return;
      }
    }

    // Employees can update their own profile (limited fields)
    if (context.permissions.includes(PERMISSIONS.EDIT_PROFILE)) {
      if (employee.userId === context.userId) {
        return;
      }
    }

    throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_UPDATE, {}, context.locale));
  }

  private validateTerminationPermissions(context: EmployeeServiceContext, employee: EmployeeWithUser): void {
    // HR Admin can terminate all employees
    if (context.permissions.includes(PERMISSIONS.MANAGE_ALL_EMPLOYEES)) {
      return;
    }

    // Managers can terminate employees in their organization
    if (context.permissions.includes(PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES)) {
      if (employee.user?.organizationId === context.organizationId) {
        return;
      }
    }

    throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_TERMINATE, {}, context.locale));
  }

  private validateStatsPermissions(context: EmployeeServiceContext, organizationId: string): void {
    // HR Admin can view stats for all organizations
    if (context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES)) {
      return;
    }

    // Managers can view stats for their organization
    if (context.permissions.includes(PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES)) {
      if (context.organizationId === organizationId) {
        return;
      }
    }

    throw new Error(translationService.t(EMPLOYEE_ERROR_KEYS.INSUFFICIENT_PERMISSIONS_STATS, {}, context.locale));
  }

  private applyOrganizationFiltering(
    filters: EmployeeSearchFilters,
    context: EmployeeServiceContext
  ): EmployeeFilters {
    // HR Admin can see all employees (no additional filtering)
    if (context.permissions.includes(PERMISSIONS.VIEW_ALL_EMPLOYEES)) {
      return filters;
    }

    // Managers and employees are restricted to their organization
    return {
      ...filters,
      organizationId: context.organizationId
    };
  }
}