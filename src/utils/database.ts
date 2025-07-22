import { PrismaClient, UserRole } from '@prisma/client';

// Added comment to trigger hooks - database migration hook
// Create a singleton instance of PrismaClient
const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export const connectDatabase = async (): Promise<void> => {
  try {
    await prisma.$connect();
    console.log('✅ Connected to database');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
};

/**
 * Database utility functions for common queries
 */
export class DatabaseUtils {
  /**
   * Check if user has access to organization
   */
  static async userHasOrganizationAccess(
    userId: string, 
    organizationId: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) return false;

    // HR admins have access to all organizations under their corporate parent
    if (user.role === 'hr_admin') {
      if (user.organization.type === 'corporate') {
        // Corporate HR can access all child organizations
        const targetOrg = await prisma.organization.findUnique({
          where: { id: organizationId }
        });
        return targetOrg?.parentId === user.organizationId || targetOrg?.id === user.organizationId;
      }
    }

    // Managers and employees can only access their own organization
    return user.organizationId === organizationId;
  }

  /**
   * Get user's accessible organization IDs
   */
  static async getUserAccessibleOrganizations(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!user) return [];

    // HR admins can access corporate and all child organizations
    if (user.role === 'hr_admin' && user.organization.type === 'corporate') {
      const childOrgs = await prisma.organization.findMany({
        where: { parentId: user.organizationId },
        select: { id: true }
      });
      return [user.organizationId, ...childOrgs.map(org => org.id)];
    }

    // Others can only access their own organization
    return [user.organizationId];
  }

  /**
   * Check if user can manage employee
   */
  static async userCanManageEmployee(
    userId: string, 
    employeeId: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        user: {
          include: { organization: true }
        }
      }
    });

    if (!user || !employee) return false;

    // Users cannot manage themselves
    if (user.id === employee.userId) return false;

    // HR admins can manage employees in their corporate hierarchy
    if (user.role === 'hr_admin') {
      return await this.userHasOrganizationAccess(userId, employee.user.organizationId);
    }

    // Managers can manage employees in their organization
    if (user.role === 'manager') {
      return user.organizationId === employee.user.organizationId;
    }

    // Employees cannot manage other employees
    return false;
  }

  /**
   * Get organization hierarchy
   */
  static async getOrganizationHierarchy(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        parent: true,
        children: true
      }
    });

    return organization;
  }

  /**
   * Get employee count by organization
   */
  static async getEmployeeCountByOrganization(organizationId: string): Promise<number> {
    return prisma.employee.count({
      where: {
        employmentStatus: 'active',
        user: {
          organizationId,
          isActive: true
        }
      }
    });
  }

  /**
   * Get recent activity for dashboard
   */
  static async getRecentActivity(organizationId: string, limit: number = 10) {
    const [recentEmployees, recentDocuments, recentOnboarding] = await Promise.all([
      // Recent hires
      prisma.employee.findMany({
        where: {
          user: { organizationId },
          hireDate: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        },
        include: {
          user: true
        },
        orderBy: { hireDate: 'desc' },
        take: limit
      }),

      // Recent documents
      prisma.document.findMany({
        where: {
          employee: {
            user: { organizationId }
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          employee: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      }),

      // Recent onboarding sessions
      prisma.onboardingSession.findMany({
        where: {
          employee: {
            user: { organizationId }
          },
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        },
        include: {
          employee: {
            include: { user: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit
      })
    ]);

    return {
      recentEmployees,
      recentDocuments,
      recentOnboarding
    };
  }

  /**
   * Search across all entities for a user
   */
  static async globalSearch(
    query: string, 
    userId: string, 
    limit: number = 20
  ) {
    const accessibleOrgs = await this.getUserAccessibleOrganizations(userId);

    const [employees, documents, users] = await Promise.all([
      // Search employees
      prisma.employee.findMany({
        where: {
          user: {
            organizationId: { in: accessibleOrgs }
          },
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
        include: {
          user: {
            include: { organization: true }
          }
        },
        take: limit
      }),

      // Search documents
      prisma.document.findMany({
        where: {
          employee: {
            user: {
              organizationId: { in: accessibleOrgs }
            }
          },
          OR: [
            { documentName: { contains: query, mode: 'insensitive' } },
            { documentType: { equals: query.toLowerCase() as any } }
          ]
        },
        include: {
          employee: {
            include: {
              user: {
                include: { organization: true }
              }
            }
          }
        },
        take: limit
      }),

      // Search users
      prisma.user.findMany({
        where: {
          organizationId: { in: accessibleOrgs },
          OR: [
            { firstName: { contains: query, mode: 'insensitive' } },
            { lastName: { contains: query, mode: 'insensitive' } },
            { email: { contains: query, mode: 'insensitive' } }
          ]
        },
        include: {
          organization: true,
          employee: true
        },
        take: limit
      })
    ]);

    return {
      employees,
      documents,
      users
    };
  }

  /**
   * Cleanup expired onboarding sessions
   */
  static async cleanupExpiredSessions(): Promise<number> {
    const result = await prisma.onboardingSession.updateMany({
      where: {
        status: 'in_progress',
        expiresAt: {
          lt: new Date()
        }
      },
      data: {
        status: 'expired'
      }
    });

    return result.count;
  }

  /**
   * Get system health statistics
   */
  static async getSystemHealth() {
    const [
      totalUsers,
      activeUsers,
      totalEmployees,
      activeEmployees,
      totalDocuments,
      signedDocuments,
      activeOnboardingSessions,
      expiredSessions
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.employee.count(),
      prisma.employee.count({ where: { employmentStatus: 'active' } }),
      prisma.document.count(),
      prisma.document.count({ where: { isSigned: true } }),
      prisma.onboardingSession.count({ where: { status: 'in_progress' } }),
      prisma.onboardingSession.count({ where: { status: 'expired' } })
    ]);

    return {
      users: { total: totalUsers, active: activeUsers },
      employees: { total: totalEmployees, active: activeEmployees },
      documents: { total: totalDocuments, signed: signedDocuments },
      onboarding: { active: activeOnboardingSessions, expired: expiredSessions }
    };
  }
}