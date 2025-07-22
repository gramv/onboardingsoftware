import { OnboardingSession, OnboardingStatus, LanguageCode, Prisma } from '@prisma/client';
import { BaseRepository, PaginatedResponse, PaginationOptions } from './base.repository';

export interface CreateOnboardingSessionData {
  employeeId: string;
  token: string;
  languagePreference?: LanguageCode;
  expiresAt: Date;
  currentStep?: string;
  formData?: any;
}

export interface UpdateOnboardingSessionData {
  currentStep?: string;
  formData?: any;
  status?: OnboardingStatus;
  languagePreference?: LanguageCode;
  completedAt?: Date;
  expiresAt?: Date;
}

export interface OnboardingSessionFilters {
  employeeId?: string;
  status?: OnboardingStatus;
  organizationId?: string;
  expired?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
}

// Type for OnboardingSession with optional Employee relation
export type OnboardingSessionWithEmployee = Prisma.OnboardingSessionGetPayload<{
  include: {
    employee: {
      include: {
        user: {
          include: {
            organization: true;
          };
        };
      };
    };
  };
}> & {
  // Additional fields for walk-in sessions
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  jobTitle?: string | null;
  organizationId?: string | null;
  organizationName?: string | null;
};

export class OnboardingRepository extends BaseRepository {
  /**
   * Create a new onboarding session
   */
  async create(data: CreateOnboardingSessionData): Promise<OnboardingSessionWithEmployee> {
    return this.prisma.onboardingSession.create({
      data,
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find onboarding session by ID
   */
  async findById(id: string): Promise<OnboardingSessionWithEmployee | null> {
    return this.prisma.onboardingSession.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Find onboarding session by token
   */
  async findByToken(token: string): Promise<OnboardingSessionWithEmployee | null> {
    return this.prisma.onboardingSession.findUnique({
      where: { token },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    }) as Promise<OnboardingSessionWithEmployee | null>;
  }

  /**
   * Find onboarding sessions by employee ID
   */
  async findByEmployeeId(employeeId: string): Promise<OnboardingSessionWithEmployee[]> {
    return this.prisma.onboardingSession.findMany({
      where: { employeeId },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Update onboarding session by ID
   */
  async update(id: string, data: UpdateOnboardingSessionData): Promise<OnboardingSessionWithEmployee> {
    return this.prisma.onboardingSession.update({
      where: { id },
      data,
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * List onboarding sessions with filters and pagination
   */
  async list(
    filters: OnboardingSessionFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<PaginatedResponse<OnboardingSessionWithEmployee>> {
    const { skip, take, page, limit } = this.getPaginationParams(
      pagination.page,
      pagination.limit
    );

    const now = new Date();
    const where: Prisma.OnboardingSessionWhereInput = {
      ...(filters.employeeId && { employeeId: filters.employeeId }),
      ...(filters.status && { status: filters.status }),
      ...(filters.organizationId && {
        employee: {
          user: {
            organizationId: filters.organizationId
          }
        }
      }),
      ...(filters.expired !== undefined && {
        ...(filters.expired 
          ? { expiresAt: { lt: now } }
          : { expiresAt: { gte: now } }
        )
      }),
      ...(filters.createdAfter && { createdAt: { gte: filters.createdAfter } }),
      ...(filters.createdBefore && { createdAt: { lte: filters.createdBefore } })
    };

    const [sessions, total] = await Promise.all([
      this.prisma.onboardingSession.findMany({
        where,
        skip,
        take,
        include: {
          employee: {
            include: {
              user: {
                include: {
                  organization: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.onboardingSession.count({ where })
    ]);

    return this.createPaginatedResponse(sessions, total, page, limit);
  }

  /**
   * Find active onboarding session for employee
   */
  async findActiveByEmployeeId(employeeId: string): Promise<OnboardingSessionWithEmployee | null> {
    const now = new Date();
    
    return this.prisma.onboardingSession.findFirst({
      where: {
        employeeId,
        status: 'in_progress',
        expiresAt: { gte: now }
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Check if token exists
   */
  async tokenExists(token: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.onboardingSession.count({
      where: {
        token,
        ...(excludeId && { id: { not: excludeId } })
      }
    });
    return count > 0;
  }

  /**
   * Mark expired sessions
   */
  async markExpiredSessions(): Promise<number> {
    const now = new Date();
    
    const result = await this.prisma.onboardingSession.updateMany({
      where: {
        status: 'in_progress',
        expiresAt: { lt: now }
      },
      data: {
        status: 'expired'
      }
    });

    return result.count;
  }

  /**
   * Delete onboarding session
   */
  async delete(id: string): Promise<void> {
    await this.prisma.onboardingSession.delete({
      where: { id }
    });
  }

  /**
   * Find sessions by organization
   */
  async findByOrganization(organizationId: string): Promise<OnboardingSessionWithEmployee[]> {
    return this.prisma.onboardingSession.findMany({
      where: {
        employee: {
          user: {
            organizationId
          }
        }
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Get onboarding statistics for organization
   */
  async getOrganizationStats(organizationId: string) {
    const now = new Date();
    
    const [total, inProgress, completed, expired, cancelled] = await Promise.all([
      this.prisma.onboardingSession.count({
        where: {
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.onboardingSession.count({
        where: {
          status: 'in_progress',
          expiresAt: { gte: now },
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.onboardingSession.count({
        where: {
          status: 'completed',
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.onboardingSession.count({
        where: {
          OR: [
            { status: 'expired' },
            { 
              status: 'in_progress',
              expiresAt: { lt: now }
            }
          ],
          employee: {
            user: { organizationId }
          }
        }
      }),
      this.prisma.onboardingSession.count({
        where: {
          status: 'cancelled',
          employee: {
            user: { organizationId }
          }
        }
      })
    ]);

    return {
      total,
      inProgress,
      completed,
      expired,
      cancelled,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }

  /**
   * Find sessions expiring soon
   */
  async findExpiringSoon(hoursFromNow: number = 24): Promise<OnboardingSessionWithEmployee[]> {
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + (hoursFromNow * 60 * 60 * 1000));

    return this.prisma.onboardingSession.findMany({
      where: {
        status: 'in_progress',
        expiresAt: {
          gte: now,
          lte: expiryThreshold
        }
      },
      include: {
        employee: {
          include: {
            user: {
              include: {
                organization: true
              }
            }
          }
        }
      },
      orderBy: { expiresAt: 'asc' }
    });
  }
}