import { User, UserRole, LanguageCode, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResponse, PaginationOptions } from './base.repository';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
  organizationId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  languagePreference?: LanguageCode;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  languagePreference?: LanguageCode;
  isActive?: boolean;
  mfaEnabled?: boolean;
  mfaSecret?: string;
}

export interface UserFilters {
  role?: UserRole;
  organizationId?: string;
  isActive?: boolean;
  search?: string;
}

export class UserRepository extends BaseRepository {
  /**
   * Create a new user
   */
  async create(data: CreateUserData): Promise<User> {
    return this.prisma.user.create({
      data: {
        ...data,
        languagePreference: data.languagePreference || 'en'
      },
      include: {
        organization: true
      }
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        employee: true
      }
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        employee: true
      }
    });
  }

  /**
   * Update user by ID
   */
  async update(id: string, data: UpdateUserData): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true,
        employee: true
      }
    });
  }

  /**
   * Delete user by ID (soft delete by setting isActive to false)
   */
  async delete(id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: true
      }
    });
  }

  /**
   * List users with filters and pagination
   */
  async list(
    filters: UserFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<User>> {
    const { skip, take, page, limit } = this.getPaginationParams(
      pagination.page,
      pagination.limit
    );

    const where: Prisma.UserWhereInput = {
      ...(filters.role && { role: filters.role }),
      ...(filters.organizationId && { organizationId: filters.organizationId }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } }
        ]
      })
    };

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take,
        include: {
          organization: true,
          employee: true
        },
        orderBy: [
          { lastName: 'asc' },
          { firstName: 'asc' }
        ]
      }),
      this.prisma.user.count({ where })
    ]);

    return this.createPaginatedResponse(users, total, page, limit);
  }

  /**
   * Find users by organization ID
   */
  async findByOrganization(organizationId: string): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { 
        organizationId,
        isActive: true
      },
      include: {
        organization: true,
        employee: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }

  /**
   * Find users by role
   */
  async findByRole(role: UserRole): Promise<User[]> {
    return this.prisma.user.findMany({
      where: { 
        role,
        isActive: true
      },
      include: {
        organization: true,
        employee: true
      },
      orderBy: [
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    return count > 0;
  }

  /**
   * Update user password
   */
  async updatePassword(id: string, passwordHash: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash }
    });
  }

  /**
   * Enable/disable MFA for user
   */
  async updateMFA(id: string, enabled: boolean, secret?: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: {
        mfaEnabled: enabled,
        mfaSecret: enabled ? secret : null
      }
    });
  }

  /**
   * Check if a user is the employee with the given ID
   */
  async isUserEmployee(userId: string, employeeId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: {
        id: employeeId,
        userId
      }
    });
    return !!employee;
  }

  /**
   * Check if an employee belongs to a manager's organization
   */
  async isEmployeeInManagerOrganization(managerId: string, employeeId: string): Promise<boolean> {
    // Get the manager's organization
    const manager = await this.prisma.user.findUnique({
      where: { id: managerId },
      select: { organizationId: true, role: true }
    });

    if (!manager || manager.role !== 'manager') {
      return false;
    }

    // Get the employee's organization through their user record
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });

    if (!employee) {
      return false;
    }

    // Check if they belong to the same organization
    return employee.user.organizationId === manager.organizationId;
  }

  /**
   * Get user by employee ID
   */
  async getUserByEmployeeId(employeeId: string): Promise<User | null> {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true }
    });

    return employee?.user || null;
  }
}