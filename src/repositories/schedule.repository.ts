import { PrismaClient, ScheduleEntry, ScheduleType } from '@prisma/client';
import { BaseRepository } from './base.repository';

export class ScheduleRepository extends BaseRepository {
  constructor() {
    super();
  }

  /**
   * Create a new schedule entry
   */
  async createScheduleEntry(data: {
    employeeId: string;
    date: Date;
    startTime: string;
    endTime: string;
    breakDuration?: number;
    isWorkDay: boolean;
    scheduleType: ScheduleType;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    createdBy: string;
    notes?: string;
  }): Promise<ScheduleEntry> {
    return this.prisma.scheduleEntry.create({
      data: {
        ...data,
        breakDuration: data.breakDuration || 0,
      },
    });
  }

  /**
   * Create multiple schedule entries in a batch
   */
  async createManyScheduleEntries(entries: {
    employeeId: string;
    date: Date;
    startTime: string;
    endTime: string;
    breakDuration?: number;
    isWorkDay: boolean;
    scheduleType: ScheduleType;
    effectiveFrom: Date;
    effectiveUntil?: Date;
    createdBy: string;
    notes?: string;
  }[]): Promise<{ count: number }> {
    return this.prisma.scheduleEntry.createMany({
      data: entries.map(entry => ({
        ...entry,
        breakDuration: entry.breakDuration || 0,
      })),
    });
  }

  /**
   * Get a schedule entry by ID
   */
  async getScheduleEntryById(id: string): Promise<ScheduleEntry | null> {
    return this.prisma.scheduleEntry.findUnique({
      where: { id },
    });
  }

  /**
   * Update a schedule entry
   */
  async updateScheduleEntry(
    id: string,
    data: Partial<Omit<ScheduleEntry, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<ScheduleEntry> {
    return this.prisma.scheduleEntry.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a schedule entry
   */
  async deleteScheduleEntry(id: string): Promise<ScheduleEntry> {
    return this.prisma.scheduleEntry.delete({
      where: { id },
    });
  }

  /**
   * Get schedule entries for an employee within a date range
   */
  async getEmployeeSchedule(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduleEntry[]> {
    return this.prisma.scheduleEntry.findMany({
      where: {
        employeeId,
        date: {
          gte: startDate,
          lte: endDate,
        },
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: startDate } },
        ],
        effectiveFrom: { lte: endDate },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Get all active schedule entries for an employee
   */
  async getActiveScheduleEntries(employeeId: string): Promise<ScheduleEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.scheduleEntry.findMany({
      where: {
        employeeId,
        OR: [
          { effectiveUntil: null },
          { effectiveUntil: { gte: today } },
        ],
        effectiveFrom: { lte: today },
      },
      orderBy: { date: 'asc' },
    });
  }

  /**
   * Find overlapping schedule entries for conflict detection
   */
  async findOverlappingSchedules(
    employeeId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ScheduleEntry[]> {
    // Convert times to comparable format (assuming HH:mm format)
    const queryStartTime = startTime;
    const queryEndTime = endTime;

    return this.prisma.scheduleEntry.findMany({
      where: {
        employeeId,
        date,
        isWorkDay: true,
        id: excludeId ? { not: excludeId } : undefined,
        OR: [
          // Case 1: New schedule starts during an existing schedule
          {
            AND: [
              { startTime: { lte: queryStartTime } },
              { endTime: { gt: queryStartTime } },
            ],
          },
          // Case 2: New schedule ends during an existing schedule
          {
            AND: [
              { startTime: { lt: queryEndTime } },
              { endTime: { gte: queryEndTime } },
            ],
          },
          // Case 3: New schedule completely contains an existing schedule
          {
            AND: [
              { startTime: { gte: queryStartTime } },
              { endTime: { lte: queryEndTime } },
            ],
          },
        ],
      },
    });
  }

  /**
   * Get schedule entries that need to be reverted (temporary schedules past their effective date)
   */
  async getExpiredTemporarySchedules(): Promise<ScheduleEntry[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.prisma.scheduleEntry.findMany({
      where: {
        scheduleType: 'temporary',
        effectiveUntil: {
          lt: today,
        },
      },
    });
  }
}