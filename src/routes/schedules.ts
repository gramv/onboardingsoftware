import { Router, Request, Response } from 'express';
import { body, param, query } from 'express-validator';
import { ScheduleService } from '../services/schedule/scheduleService';
import { ScheduleRepository } from '../repositories/schedule.repository';
import { UserRepository } from '../repositories/user.repository';
import { EmailService } from '../services/email/emailService';
import { TranslationService } from '../utils/i18n/translationService';
import { handleValidationErrors } from '../middleware/validation';
import { authenticate } from '../middleware/auth/authMiddleware';
import { roleGuard } from '../middleware/auth/roleGuards';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

// Initialize repositories and services
const scheduleRepository = new ScheduleRepository();
const userRepository = new UserRepository();
const emailService = new EmailService();
const translationService = new TranslationService();
const scheduleService = new ScheduleService(
  scheduleRepository,
  userRepository,
  emailService,
  translationService
);

/**
 * @route POST /schedules/weekly
 * @desc Create a weekly schedule for an employee
 * @access Private - HR Admin, Manager
 */
router.post(
  '/weekly',
  authenticate,
  roleGuard(['hr_admin', 'manager']),
  [
    body('employeeId').isUUID().withMessage('Valid employee ID is required'),
    body('weeklySchedule').isObject().withMessage('Weekly schedule is required'),
    body('weeklySchedule.effectiveFrom').isISO8601().withMessage('Valid effective from date is required'),
    body('weeklySchedule.effectiveUntil').optional().isISO8601().withMessage('Valid effective until date is required'),
    body('weeklySchedule.isTemplate').isBoolean().withMessage('isTemplate flag is required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { employeeId, weeklySchedule } = req.body;
      const userId = req.user!.userId;

      // Check if user has permission to manage this employee's schedule
      if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to manage this employee\'s schedule');
        }
      }

      // Parse dates
      const parsedSchedule = {
        ...weeklySchedule,
        effectiveFrom: new Date(weeklySchedule.effectiveFrom),
        effectiveUntil: weeklySchedule.effectiveUntil ? new Date(weeklySchedule.effectiveUntil) : undefined,
      };

      const scheduleEntries = await scheduleService.createWeeklySchedule(
        employeeId,
        parsedSchedule,
        userId
      );

      return ApiResponseUtil.success(res, {
        message: 'Weekly schedule created successfully',
        data: {
          scheduleEntries,
        },
      });
    } catch (error: any) {
      if (error.message.includes('Schedule conflicts detected')) {
        return ApiResponseUtil.validationError(res, { schedule: error.message });
      }
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

/**
 * @route POST /schedules/temporary
 * @desc Create temporary schedule overrides for an employee
 * @access Private - HR Admin, Manager
 */
router.post(
  '/temporary',
  authenticate,
  roleGuard(['hr_admin', 'manager']),
  [
    body('employeeId').isUUID().withMessage('Valid employee ID is required'),
    body('scheduleEntries').isArray().withMessage('Schedule entries are required'),
    body('scheduleEntries.*.date').isISO8601().withMessage('Valid date is required for each entry'),
    body('scheduleEntries.*.startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time is required (HH:MM format)'),
    body('scheduleEntries.*.endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time is required (HH:MM format)'),
    body('scheduleEntries.*.isWorkDay').isBoolean().withMessage('isWorkDay flag is required'),
    body('effectiveFrom').isISO8601().withMessage('Valid effective from date is required'),
    body('effectiveUntil').isISO8601().withMessage('Valid effective until date is required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { employeeId, scheduleEntries, effectiveFrom, effectiveUntil } = req.body;
      const userId = req.user!.userId;

      // Check if user has permission to manage this employee's schedule
      if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to manage this employee\'s schedule');
        }
      }

      // Parse dates
      const parsedEntries = scheduleEntries.map((entry: any) => ({
        ...entry,
        date: new Date(entry.date),
      }));

      const createdEntries = await scheduleService.createTemporarySchedule(
        employeeId,
        parsedEntries,
        new Date(effectiveFrom),
        new Date(effectiveUntil),
        userId
      );

      return ApiResponseUtil.success(res, {
        message: 'Temporary schedule created successfully',
        data: {
          scheduleEntries: createdEntries,
        },
      });
    } catch (error: any) {
      if (error.message.includes('Schedule conflicts detected')) {
        return ApiResponseUtil.validationError(res, { schedule: error.message });
      }
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

/**
 * @route GET /schedules/employee/:employeeId
 * @desc Get an employee's schedule for a date range
 * @access Private - HR Admin, Manager, Self
 */
router.get(
  '/employee/:employeeId',
  authenticate,
  [
    param('employeeId').isUUID().withMessage('Valid employee ID is required'),
    query('startDate').isISO8601().withMessage('Valid start date is required'),
    query('endDate').isISO8601().withMessage('Valid end date is required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const { startDate, endDate } = req.query;
      const userId = req.user!.userId;

      // Check if user has permission to view this employee's schedule
      if (req.user!.role === 'employee') {
        const isOwnSchedule = await userRepository.isUserEmployee(userId, employeeId);
        if (!isOwnSchedule) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to view this schedule');
        }
      } else if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to view this schedule');
        }
      }

      const scheduleEntries = await scheduleService.getEmployeeSchedule(
        employeeId,
        new Date(startDate as string),
        new Date(endDate as string)
      );

      return ApiResponseUtil.success(res, {
        data: {
          scheduleEntries,
        },
      });
    } catch (error: any) {
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

/**
 * @route GET /schedules/employee/:employeeId/current
 * @desc Get an employee's current and upcoming schedule
 * @access Private - HR Admin, Manager, Self
 */
router.get(
  '/employee/:employeeId/current',
  authenticate,
  [
    param('employeeId').isUUID().withMessage('Valid employee ID is required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.params;
      const userId = req.user!.userId;

      // Check if user has permission to view this employee's schedule
      if (req.user!.role === 'employee') {
        const isOwnSchedule = await userRepository.isUserEmployee(userId, employeeId);
        if (!isOwnSchedule) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to view this schedule');
        }
      } else if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to view this schedule');
        }
      }

      const schedule = await scheduleService.getCurrentAndUpcomingSchedule(employeeId);

      return ApiResponseUtil.success(res, {
        data: schedule,
      });
    } catch (error: any) {
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

/**
 * @route PUT /schedules/:scheduleId
 * @desc Update a schedule entry
 * @access Private - HR Admin, Manager
 */
router.put(
  '/:scheduleId',
  authenticate,
  roleGuard(['hr_admin', 'manager']),
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    body('startTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid start time is required (HH:MM format)'),
    body('endTime').optional().matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('Valid end time is required (HH:MM format)'),
    body('breakDuration').optional().isInt({ min: 0 }).withMessage('Break duration must be a non-negative integer'),
    body('isWorkDay').optional().isBoolean().withMessage('isWorkDay must be a boolean'),
    body('effectiveUntil').optional().isISO8601().withMessage('Valid effective until date is required'),
    body('notes').optional().isString().withMessage('Notes must be a string'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const updates = req.body;
      const userId = req.user!.userId;

      // Get the schedule entry to check permissions
      const scheduleEntry = await scheduleRepository.getScheduleEntryById(scheduleId);
      if (!scheduleEntry) {
        return ApiResponseUtil.notFound(res, 'Schedule entry not found');
      }

      // Check if user has permission to update this schedule
      if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, scheduleEntry.employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to update this schedule');
        }
      }

      // Parse dates if provided
      const parsedUpdates = {
        ...updates,
        effectiveUntil: updates.effectiveUntil ? new Date(updates.effectiveUntil) : undefined,
      };

      const updatedEntry = await scheduleService.updateScheduleEntry(
        scheduleId,
        parsedUpdates,
        userId
      );

      return ApiResponseUtil.success(res, {
        message: 'Schedule entry updated successfully',
        data: {
          scheduleEntry: updatedEntry,
        },
      });
    } catch (error: any) {
      if (error.message.includes('Schedule conflict detected')) {
        return ApiResponseUtil.validationError(res, { schedule: error.message });
      }
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

/**
 * @route DELETE /schedules/:scheduleId
 * @desc Delete a schedule entry
 * @access Private - HR Admin, Manager
 */
router.delete(
  '/:scheduleId',
  authenticate,
  roleGuard(['hr_admin', 'manager']),
  [
    param('scheduleId').isUUID().withMessage('Valid schedule ID is required'),
    handleValidationErrors,
  ],
  async (req: Request, res: Response) => {
    try {
      const { scheduleId } = req.params;
      const userId = req.user!.userId;

      // Get the schedule entry to check permissions
      const scheduleEntry = await scheduleRepository.getScheduleEntryById(scheduleId);
      if (!scheduleEntry) {
        return ApiResponseUtil.notFound(res, 'Schedule entry not found');
      }

      // Check if user has permission to delete this schedule
      if (req.user!.role === 'manager') {
        const hasAccess = await userRepository.isEmployeeInManagerOrganization(userId, scheduleEntry.employeeId);
        if (!hasAccess) {
          return ApiResponseUtil.forbidden(res, 'You do not have permission to delete this schedule');
        }
      }

      // Delete the schedule entry
      await scheduleRepository.deleteScheduleEntry(scheduleId);

      // Notify the employee about the schedule change
      // This would typically be handled by the service, but we're deleting the entry
      // so we need to handle notification separately

      return ApiResponseUtil.success(res, {
        message: 'Schedule entry deleted successfully',
      });
    } catch (error: any) {
      return ApiResponseUtil.internalError(res, error);
    }
  }
);

export default router;