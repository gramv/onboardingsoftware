import { PrismaClient } from '@prisma/client';
import { prisma } from '@/utils/database';

/**
 * Base repository class providing common database operations
 */
export abstract class BaseRepository {
  protected readonly prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Execute a database transaction
   */
  protected async transaction<T>(
    callback: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(callback);
  }

  /**
   * Check if a record exists by ID
   */
  protected async exists(model: any, id: string): Promise<boolean> {
    const count = await model.count({
      where: { id }
    });
    return count > 0;
  }

  /**
   * Get pagination parameters
   */
  protected getPaginationParams(page?: number, limit?: number) {
    const pageNum = Math.max(1, page || 1);
    const limitNum = Math.min(100, Math.max(1, limit || 10));
    
    return {
      skip: (pageNum - 1) * limitNum,
      take: limitNum,
      page: pageNum,
      limit: limitNum
    };
  }

  /**
   * Create paginated response
   */
  protected createPaginatedResponse<T>(
    data: T[],
    total: number,
    page: number,
    limit: number
  ) {
    const totalPages = Math.ceil(total / limit);
    
    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
}