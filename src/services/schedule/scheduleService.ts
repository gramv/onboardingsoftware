import { ScheduleEntry, ScheduleType } from '@prisma/client';
import { ScheduleRepository } from '../../repositories/schedule.repository';
import { UserRepository } from '../../repositories/user.repository';
import { EmailService } from '../email/emailService';
import { TranslationService } from '../../utils/i18n/translationService';

// Types for schedule management
export interface WeeklySchedule {
  monday?: DaySchedule;
  tuesday?: DaySchedule;
  wednesday?: DaySchedule;
  thursday?: DaySchedule;
  friday?: DaySchedule;
  saturday?: DaySchedule;
  sunday?: DaySchedule;
  effectiveFrom: Date;
  effectiveUntil?: Date;
  isTemplate: boolean;
}

export interface DaySchedule {
  startTime: string; // HH:mm format
  endTime: string;
  breakDuration: number; // minutes
  isWorkDay: boolean;
}

export interface ScheduleConflict {
  date: Date;
  existingEntry: ScheduleEntry;
  conflictType: 'overlap' | 'duplicate';
}

export class ScheduleService {
  constructor(
    private scheduleRepository: ScheduleRepository,
    private userRepository: UserRepository,
    private emailService: EmailService,
    private translationService: TranslationService
  ) {}

  /**
   * Create a weekly schedule template for an employee
   */
  async createWeeklySchedule(
    employeeId: string,
    weeklySchedule: WeeklySchedule,
    createdBy: string
  ): Promise<ScheduleEntry[]> {
    const { effectiveFrom, effectiveUntil } = weeklySchedule;
    const scheduleType: ScheduleType = effectiveUntil ? 'temporary' : 'regular';
    
    // Validate the schedule for conflicts before creating
    const conflicts = await this.validateWeeklySchedule(employeeId, weeklySchedule);
    if (conflicts.length > 0) {
      throw new Error(`Schedule conflicts detected: ${JSON.stringify(conflicts)}`);
    }

    // Generate schedule entries for each day of the week
    const scheduleEntries: ScheduleEntry[] = [];
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Start from the effective date
    const startDate = new Date(effectiveFrom);
    
    // Create entries for 4 weeks (or until effectiveUntil if sooner)
    const endDate = effectiveUntil 
      ? new Date(effectiveUntil) 
      : new Date(startDate.getTime() + (28 * 24 * 60 * 60 * 1000)); // 28 days (4 weeks)
    
    // Create schedule entries for each day in the range
    for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
      const dayOfWeek = daysOfWeek[currentDate.getDay()];
      const daySchedule = weeklySchedule[dayOfWeek as keyof Omit<WeeklySchedule, 'effectiveFrom' | 'effectiveUntil' | 'isTemplate'>];
      
      if (daySchedule) {
        const entry = await this.scheduleRepository.createScheduleEntry({
          employeeId,
          date: new Date(currentDate),
          startTime: daySchedule.startTime,
          endTime: daySchedule.endTime,
          breakDuration: daySchedule.breakDuration,
          isWorkDay: daySchedule.isWorkDay,
          scheduleType,
          effectiveFrom,
          effectiveUntil,
          createdBy,
          notes: weeklySchedule.isTemplate ? 'Created from template' : undefined,
        });
        
        scheduleEntries.push(entry);
      }
    }
    
    // Store the template in the employee record if it's a template
    if (weeklySchedule.isTemplate) {
      // This would typically update the employee record with the template
      // For now, we'll just return the created entries
    }
    
    // Notify the employee about the new schedule
    await this.notifyScheduleChange(employeeId, scheduleEntries);
    
    return scheduleEntries;
  }

  /**
   * Create a temporary schedule override for specific dates
   */
  async createTemporarySchedule(
    employeeId: string,
    scheduleEntries: {
      date: Date;
      startTime: string;
      endTime: string;
      breakDuration?: number;
      isWorkDay: boolean;
      notes?: string;
    }[],
    effectiveFrom: Date,
    effectiveUntil: Date,
    createdBy: string
  ): Promise<ScheduleEntry[]> {
    // Validate each entry for conflicts
    const conflicts: ScheduleConflict[] = [];
    
    for (const entry of scheduleEntries) {
      const overlaps = await this.scheduleRepository.findOverlappingSchedules(
        employeeId,
        entry.date,
        entry.startTime,
        entry.endTime
      );
      
      if (overlaps.length > 0) {
        conflicts.push({
          date: entry.date,
          existingEntry: overlaps[0],
          conflictType: 'overlap'
        });
      }
    }
    
    if (conflicts.length > 0) {
      throw new Error(`Schedule conflicts detected: ${JSON.stringify(conflicts)}`);
    }
    
    // Create temporary schedule entries
    const createdEntries: ScheduleEntry[] = [];
    
    for (const entry of scheduleEntries) {
      const scheduleEntry = await this.scheduleRepository.createScheduleEntry({
        employeeId,
        date: entry.date,
        startTime: entry.startTime,
        endTime: entry.endTime,
        breakDuration: entry.breakDuration || 0,
        isWorkDay: entry.isWorkDay,
        scheduleType: 'temporary',
        effectiveFrom,
        effectiveUntil,
        createdBy,
        notes: entry.notes,
      });
      
      createdEntries.push(scheduleEntry);
    }
    
    // Notify the employee about the schedule change
    await this.notifyScheduleChange(employeeId, createdEntries);
    
    return createdEntries;
  }

  /**
   * Update an existing schedule entry
   */
  async updateScheduleEntry(
    scheduleId: string,
    updates: {
      startTime?: string;
      endTime?: string;
      breakDuration?: number;
      isWorkDay?: boolean;
      effectiveUntil?: Date;
      notes?: string;
    },
    updatedBy: string
  ): Promise<ScheduleEntry> {
    // Get the existing entry
    const existingEntry = await this.scheduleRepository.getScheduleEntryById(scheduleId);
    if (!existingEntry) {
      throw new Error(`Schedule entry with ID ${scheduleId} not found`);
    }
    
    // Check for conflicts if time is being updated
    if (updates.startTime || updates.endTime) {
      const startTime = updates.startTime || existingEntry.startTime;
      const endTime = updates.endTime || existingEntry.endTime;
      
      const overlaps = await this.scheduleRepository.findOverlappingSchedules(
        existingEntry.employeeId,
        existingEntry.date,
        startTime,
        endTime,
        scheduleId // Exclude the current entry from conflict check
      );
      
      if (overlaps.length > 0) {
        throw new Error(`Schedule conflict detected with existing entry: ${overlaps[0].id}`);
      }
    }
    
    // Update the entry
    const updatedEntry = await this.scheduleRepository.updateScheduleEntry(scheduleId, {
      ...updates,
      // Add audit trail
      notes: updates.notes 
        ? `${updates.notes}\nUpdated by ${updatedBy} on ${new Date().toISOString()}`
        : `Updated by ${updatedBy} on ${new Date().toISOString()}`,
    });
    
    // Notify the employee about the schedule change
    await this.notifyScheduleChange(existingEntry.employeeId, [updatedEntry]);
    
    return updatedEntry;
  }

  /**
   * Get an employee's schedule for a specific date range
   */
  async getEmployeeSchedule(
    employeeId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ScheduleEntry[]> {
    return this.scheduleRepository.getEmployeeSchedule(employeeId, startDate, endDate);
  }

  /**
   * Get an employee's current and upcoming schedule
   */
  async getCurrentAndUpcomingSchedule(employeeId: string): Promise<{
    currentWeek: ScheduleEntry[];
    nextWeek: ScheduleEntry[];
  }> {
    // Get today's date and set to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate start of current week (Sunday)
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    currentWeekStart.setDate(today.getDate() - dayOfWeek);
    
    // Calculate end of next week (Saturday)
    const nextWeekEnd = new Date(currentWeekStart);
    nextWeekEnd.setDate(currentWeekStart.getDate() + 13); // 2 weeks - 1 day
    
    // Calculate start of next week
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);
    
    // Get all schedule entries for the two-week period
    const allEntries = await this.scheduleRepository.getEmployeeSchedule(
      employeeId,
      currentWeekStart,
      nextWeekEnd
    );
    
    // Split into current week and next week
    const currentWeek = allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= currentWeekStart && entryDate < nextWeekStart;
    });
    
    const nextWeek = allEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= nextWeekStart && entryDate <= nextWeekEnd;
    });
    
    return {
      currentWeek,
      nextWeek,
    };
  }

  /**
   * Detect and resolve schedule conflicts
   */
  async detectScheduleConflicts(
    employeeId: string,
    date: Date,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<ScheduleConflict[]> {
    const overlappingEntries = await this.scheduleRepository.findOverlappingSchedules(
      employeeId,
      date,
      startTime,
      endTime,
      excludeId
    );
    
    return overlappingEntries.map(entry => ({
      date,
      existingEntry: entry,
      conflictType: 'overlap',
    }));
  }

  /**
   * Validate a weekly schedule for conflicts
   */
  private async validateWeeklySchedule(
    employeeId: string,
    weeklySchedule: WeeklySchedule
  ): Promise<ScheduleConflict[]> {
    const conflicts: ScheduleConflict[] = [];
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Start from the effective date
    const startDate = new Date(weeklySchedule.effectiveFrom);
    
    // Check first week for conflicts
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      const dayOfWeek = daysOfWeek[currentDate.getDay()];
      const daySchedule = weeklySchedule[dayOfWeek as keyof Omit<WeeklySchedule, 'effectiveFrom' | 'effectiveUntil' | 'isTemplate'>];
      
      if (daySchedule && daySchedule.isWorkDay) {
        const overlappingEntries = await this.scheduleRepository.findOverlappingSchedules(
          employeeId,
          currentDate,
          daySchedule.startTime,
          daySchedule.endTime
        );
        
        if (overlappingEntries.length > 0) {
          conflicts.push({
            date: currentDate,
            existingEntry: overlappingEntries[0],
            conflictType: 'overlap',
          });
        }
      }
    }
    
    return conflicts;
  }

  /**
   * Process expired temporary schedules and revert to regular schedules
   */
  async processExpiredTemporarySchedules(): Promise<void> {
    const expiredEntries = await this.scheduleRepository.getExpiredTemporarySchedules();
    
    // Group by employee for notifications
    const entriesByEmployee: Record<string, ScheduleEntry[]> = {};
    
    for (const entry of expiredEntries) {
      // Delete the expired temporary entry
      await this.scheduleRepository.deleteScheduleEntry(entry.id);
      
      // Group for notifications
      if (!entriesByEmployee[entry.employeeId]) {
        entriesByEmployee[entry.employeeId] = [];
      }
      entriesByEmployee[entry.employeeId].push(entry);
    }
    
    // Send notifications about reverting to regular schedules
    for (const [employeeId, entries] of Object.entries(entriesByEmployee)) {
      await this.notifyScheduleReversion(employeeId, entries);
    }
  }

  /**
   * Notify employee about schedule changes
   */
  private async notifyScheduleChange(employeeId: string, scheduleEntries: ScheduleEntry[]): Promise<void> {
    try {
      // Get employee and associated user
      const user = await this.userRepository.getUserByEmployeeId(employeeId);
      if (!user) {
        console.error(`User not found for employee ID: ${employeeId}`);
        return;
      }
      
      // Get user's language preference
      const language = user.languagePreference;
      
      // Format dates for display
      const formattedEntries = scheduleEntries.map(entry => {
        const date = new Date(entry.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
        
        return {
          date,
          startTime: entry.startTime,
          endTime: entry.endTime,
          isWorkDay: entry.isWorkDay,
        };
      });
      
      // Translate notification message
      const subject = this.translationService.t(
        'schedule.notification.subject',
        {},
        language
      );
      
      const message = this.translationService.t(
        'schedule.notification.scheduleChanged',
        {
          count: scheduleEntries.length,
        },
        language
      );
      
      // Send email notification
      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html: `
          <h2>${message}</h2>
          <p>${this.translationService.t('schedule.notification.details', {}, language)}</p>
          <ul>
            ${formattedEntries.map(entry => `
              <li>
                <strong>${entry.date}</strong>: 
                ${entry.isWorkDay 
                  ? `${entry.startTime} - ${entry.endTime}` 
                  : this.translationService.t('schedule.dayOff', {}, language)}
              </li>
            `).join('')}
          </ul>
          <p>${this.translationService.t('schedule.notification.loginToView', {}, language)}</p>
        `,
      });
      
      // TODO: Send in-app notification when that system is implemented
    } catch (error) {
      console.error('Failed to send schedule change notification:', error);
    }
  }

  /**
   * Notify employee about schedule reversion (temporary to regular)
   */
  private async notifyScheduleReversion(employeeId: string, expiredEntries: ScheduleEntry[]): Promise<void> {
    try {
      // Get employee and associated user
      const user = await this.userRepository.getUserByEmployeeId(employeeId);
      if (!user) {
        console.error(`User not found for employee ID: ${employeeId}`);
        return;
      }
      
      // Get user's language preference
      const language = user.languagePreference;
      
      // Format dates for display
      const formattedDates = expiredEntries.map(entry => {
        return new Date(entry.date).toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      });
      
      // Translate notification message
      const subject = this.translationService.t(
        'schedule.notification.reversion.subject',
        {},
        language
      );
      
      const message = this.translationService.t(
        'schedule.notification.reversion.message',
        {},
        language
      );
      
      // Send email notification
      await this.emailService.sendEmail({
        to: user.email,
        subject,
        html: `
          <h2>${message}</h2>
          <p>${this.translationService.t('schedule.notification.reversion.details', {}, language)}</p>
          <ul>
            ${formattedDates.map(date => `<li>${date}</li>`).join('')}
          </ul>
          <p>${this.translationService.t('schedule.notification.loginToView', {}, language)}</p>
        `,
      });
      
      // TODO: Send in-app notification when that system is implemented
    } catch (error) {
      console.error('Failed to send schedule reversion notification:', error);
    }
  }
}