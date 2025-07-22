import { Employee, EmploymentStatus, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResponse, PaginationOptions } from './base.repository';

export interface CreateEmployeeData {
  userId: string;
  employeeId: string;
  ssnEncrypted?: string;
  dateOfBirth?: Date;
  hireDate: Date;
  position?: string;
  department?: string;
  hourlyRate?: number;
  emergencyContact?: any;
  address?: any;
  schedule?: any;
}

export interface UpdateEmployeeData {
  ssnEncrypted?: string;
  dateOfBirth?: Date;
  position?: string;
  department?: string;
  hourlyRate?: number;
  employmentStatus?: EmploymentStatus;
  rehireEligible?: boolean;
  managerRating?: number;
  emergencyContact?: any;
  address?: any;
  schedule?: any;
}

export interface EmployeeFilters {
  organizationId?: string;
  employmentStatus?: EmploymentStatus;
  department?: string;
  position?: string;
  search?: string;
  hiredAfter?: Date;
  hiredBefore?: Date;
}

export interface TerminationData {
  terminationDate: Date;
  managerRating: number;
  rehireEligible: boolean;
}

export class EmployeeRepository extends BaseRepository {
  /**
   * Create a new employee
   */
  async create(data: CreateEmployeeData): Promise<Employee> {
    return this.prisma.employee.create({
      data,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      }
    });
  }

  /**
   * Find employee by ID
   */
  async findById(id: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          include: {
            organization: true
          }
        },
        documents: true,
        scheduleEntries: {
          orderBy: { date: 'desc' },
          take: 30 // Last 30 days
        }
      }
    });
  }

  /**
   * Find employee by employee ID
   */
  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { employeeId },
      include: {
        user: {
          include: {
            organization: true
          }
        },
        documents: true
      }
    });
  }

  /**
   * Find employee by user ID
   */
  async findByUserId(userId: string): Promise<Employee | null> {
    return this.prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          include: {
            organization: true
          }
        },
        documents: true
      }
    });
  }

  /**
   * Update employee by ID
   */
  async update(id: string, data: UpdateEmployeeData): Promise<Employee> {
    return this.prisma.employee.update({
      where: { id },
      data,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      }
    });
  }

  /**
   * List employees with filters and pagination
   */
  async list(
    filters: EmployeeFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<Employee>> {
    const { skip, take, page, limit } = this.getPaginationParams(
      pagination.page,
      pagination.limit
    );

    const where: Prisma.EmployeeWhereInput = {
      ...(filters.employmentStatus && { employmentStatus: filters.employmentStatus }),
      ...(filters.department && { department: filters.department }),
      ...(filters.position && { position: filters.position }),
      ...(filters.hiredAfter && { hireDate: { gte: filters.hiredAfter } }),
      ...(filters.hiredBefore && { hireDate: { lte: filters.hiredBefore } }),
      ...(filters.organizationId && {
        user: {
          organizationId: filters.organizationId
        }
      }),
      ...(filters.search && {
        OR: [
          { employeeId: { contains: filters.search, mode: 'insensitive' } },
          { position: { contains: filters.search, mode: 'insensitive' } },
          { department: { contains: filters.search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          }
        ]
      })
    };

    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            include: {
              organization: true
            }
          }
        },
        orderBy: [
          { user: { lastName: 'asc' } },
          { user: { firstName: 'asc' } }
        ]
      }),
      this.prisma.employee.count({ where })
    ]);

    return this.createPaginatedResponse(employees, total, page, limit);
  }

  /**
   * Find employees by organization
   */
  async findByOrganization(organizationId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        user: {
          organizationId
        }
      },
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    });
  }

  /**
   * Find active employees by organization
   */
  async findActiveByOrganization(organizationId: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        employmentStatus: 'active',
        user: {
          organizationId,
          isActive: true
        }
      },
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    });
  }

  /**
   * Find terminated employees (alumni)
   */
  async findAlumni(organizationId?: string): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        employmentStatus: 'terminated',
        ...(organizationId && {
          user: {
            organizationId
          }
        })
      },
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { terminationDate: 'desc' },
        { user: { lastName: 'asc' } }
      ]
    });
  }

  /**
   * Terminate employee
   */
  async terminate(id: string, terminationData: TerminationData): Promise<Employee> {
    return this.transaction(async (tx) => {
      // Update employee record
      const employee = await tx.employee.update({
        where: { id },
        data: {
          employmentStatus: 'terminated',
          terminationDate: terminationData.terminationDate,
          managerRating: terminationData.managerRating,
          rehireEligible: terminationData.rehireEligible
        },
        include: {
          user: true
        }
      });

      // Deactivate user account
      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: false }
      });

      return employee;
    });
  }

  /**
   * Check if employee ID exists
   */
  async employeeIdExists(employeeId: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.employee.count({
      where: {
        employeeId,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    return count > 0;
  }

  /**
   * Get employee statistics for organization
   */
  async getOrganizationStats(organizationId: string) {
    const [total, active, terminated, onLeave] = await Promise.all([
      this.prisma.employee.count({
        where: {
          user: { organizationId }
        }
      }),
      this.prisma.employee.count({
        where: {
          employmentStatus: 'active',
          user: { organizationId }
        }
      }),
      this.prisma.employee.count({
        where: {
          employmentStatus: 'terminated',
          user: { organizationId }
        }
      }),
      this.prisma.employee.count({
        where: {
          employmentStatus: 'on_leave',
          user: { organizationId }
        }
      })
    ]);

    return {
      total,
      active,
      terminated,
      onLeave,
      activePercentage: total > 0 ? Math.round((active / total) * 100) : 0
    };
  }

  /**
   * Search employees across organizations (for HR admin)
   */
  async searchGlobal(query: string, limit: number = 20): Promise<Employee[]> {
    return this.prisma.employee.findMany({
      where: {
        OR: [
          { employeeId: { contains: query, mode: 'insensitive' } },
          { position: { contains: query, mode: 'insensitive' } },
          { department: { contains: query, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: query, mode: 'insensitive' } },
                { lastName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } }
              ]
            }
          }
        ]
      },
      take: limit,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { user: { lastName: 'asc' } },
        { user: { firstName: 'asc' } }
      ]
    });
  }

  /**
   * Find alumni with enhanced filtering
   */
  async findAlumniWithFilters(filters: {
    organizationId?: string;
    minRating?: number;
    maxRating?: number;
    rehireEligibleOnly?: boolean;
    terminatedAfter?: Date;
    terminatedBefore?: Date;
    search?: string;
  }): Promise<Employee[]> {
    const where: Prisma.EmployeeWhereInput = {
      employmentStatus: 'terminated',
      ...(filters.organizationId && {
        user: {
          organizationId: filters.organizationId
        }
      }),
      ...(filters.minRating && {
        managerRating: { gte: filters.minRating }
      }),
      ...(filters.maxRating && {
        managerRating: { lte: filters.maxRating }
      }),
      ...(filters.rehireEligibleOnly && {
        rehireEligible: true
      }),
      ...(filters.terminatedAfter && {
        terminationDate: { gte: filters.terminatedAfter }
      }),
      ...(filters.terminatedBefore && {
        terminationDate: { lte: filters.terminatedBefore }
      }),
      ...(filters.search && {
        OR: [
          { employeeId: { contains: filters.search, mode: 'insensitive' } },
          { position: { contains: filters.search, mode: 'insensitive' } },
          { department: { contains: filters.search, mode: 'insensitive' } },
          {
            user: {
              OR: [
                { firstName: { contains: filters.search, mode: 'insensitive' } },
                { lastName: { contains: filters.search, mode: 'insensitive' } },
                { email: { contains: filters.search, mode: 'insensitive' } }
              ]
            }
          }
        ]
      })
    };

    return this.prisma.employee.findMany({
      where,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { terminationDate: 'desc' },
        { user: { lastName: 'asc' } }
      ]
    });
  }

  /**
   * Search alumni by query with filters
   */
  async searchAlumni(
    query: string,
    filters: {
      organizationId?: string;
      minRating?: number;
      rehireEligibleOnly?: boolean;
    }
  ): Promise<Employee[]> {
    const where: Prisma.EmployeeWhereInput = {
      employmentStatus: 'terminated',
      ...(filters.organizationId && {
        user: {
          organizationId: filters.organizationId
        }
      }),
      ...(filters.minRating && {
        managerRating: { gte: filters.minRating }
      }),
      ...(filters.rehireEligibleOnly && {
        rehireEligible: true
      }),
      OR: [
        { employeeId: { contains: query, mode: 'insensitive' } },
        { position: { contains: query, mode: 'insensitive' } },
        { department: { contains: query, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { firstName: { contains: query, mode: 'insensitive' } },
              { lastName: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        }
      ]
    };

    return this.prisma.employee.findMany({
      where,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { terminationDate: 'desc' },
        { user: { lastName: 'asc' } }
      ],
      take: 50
    });
  }

  /**
   * Find employment history by employee email or SSN
   */
  async findEmploymentHistoryByEmployee(
    email: string,
    ssnEncrypted?: string | null
  ): Promise<Employee[]> {
    const where: Prisma.EmployeeWhereInput = {
      OR: [
        {
          user: {
            email: email
          }
        },
        ...(ssnEncrypted ? [{
          ssnEncrypted: ssnEncrypted
        }] : [])
      ]
    };

    return this.prisma.employee.findMany({
      where,
      include: {
        user: {
          include: {
            organization: true
          }
        }
      },
      orderBy: [
        { hireDate: 'desc' }
      ]
    });
  }
}