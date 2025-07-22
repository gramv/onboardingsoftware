import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { AnnouncementService } from '../services/announcement/announcementService';
import { authenticate, requireRole } from '../middleware/auth/authMiddleware';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();
const prisma = new PrismaClient();
const announcementService = new AnnouncementService(prisma);

/**
 * @route POST /announcements
 * @desc Create a new announcement
 * @access HR Admin, Manager
 */
router.post('/', authenticate, requireRole(['hr_admin', 'manager']), async (req, res, next) => {
  try {
    const { title, content, priority, targetRoles, targetOrgs, expiresAt } = req.body;
    const userId = req.user!.userId;

    const announcement = await announcementService.createAnnouncement(
      {
        title,
        content,
        priority: priority || 'normal',
        targetRoles: targetRoles || [],
        targetOrgs: targetOrgs || [],
        expiresAt: expiresAt ? new Date(expiresAt) : undefined
      },
      userId
    );

    return ApiResponseUtil.success(res, announcement, 201, { message: 'Announcement created successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /announcements
 * @desc Get all announcements with filtering and pagination
 * @access All authenticated users
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const isActive = req.query.isActive === 'true';
    const priority = req.query.priority as string;
    const search = req.query.search as string;
    const targetRoles = req.query.targetRoles 
      ? (Array.isArray(req.query.targetRoles) 
        ? req.query.targetRoles as string[] 
        : [req.query.targetRoles as string])
      : undefined;
    const targetOrgs = req.query.targetOrgs
      ? (Array.isArray(req.query.targetOrgs)
        ? req.query.targetOrgs as string[]
        : [req.query.targetOrgs as string])
      : undefined;

    const filters = {
      isActive: req.query.isActive !== undefined ? isActive : undefined,
      priority,
      targetRoles,
      targetOrgs,
      search
    };

    const { announcements, total } = await announcementService.listAnnouncements(
      filters,
      page,
      limit,
      req.user!.userId
    );

    return ApiResponseUtil.paginated(res, announcements, total, page, limit);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /announcements/active
 * @desc Get active announcements for the current user
 * @access All authenticated users
 */
router.get('/active', authenticate, async (req, res, next) => {
  try {
    const announcements = await announcementService.getActiveAnnouncementsForUser(req.user!.userId);
    return ApiResponseUtil.success(res, announcements);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /announcements/:id
 * @desc Get a specific announcement by ID
 * @access All authenticated users
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const announcement = await announcementService.getAnnouncementById(req.params.id, req.user!.userId);
    return ApiResponseUtil.success(res, announcement);
  } catch (error) {
    next(error);
  }
});

/**
 * @route PUT /announcements/:id
 * @desc Update an announcement
 * @access HR Admin, Manager
 */
router.put('/:id', authenticate, requireRole(['hr_admin', 'manager']), async (req, res, next) => {
  try {
    const { title, content, priority, targetRoles, targetOrgs, isActive, expiresAt } = req.body;
    
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (priority !== undefined) updateData.priority = priority;
    if (targetRoles !== undefined) updateData.targetRoles = targetRoles;
    if (targetOrgs !== undefined) updateData.targetOrgs = targetOrgs;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (expiresAt !== undefined) updateData.expiresAt = expiresAt ? new Date(expiresAt) : null;

    const announcement = await announcementService.updateAnnouncement(
      req.params.id,
      updateData,
      req.user!.userId
    );

    return ApiResponseUtil.success(res, announcement, 200, { message: 'Announcement updated successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /announcements/:id
 * @desc Delete an announcement
 * @access HR Admin, Manager
 */
router.delete('/:id', authenticate, requireRole(['hr_admin', 'manager']), async (req, res, next) => {
  try {
    await announcementService.deleteAnnouncement(req.params.id, req.user!.userId);
    return ApiResponseUtil.success(res, null, 200, { message: 'Announcement deleted successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /announcements/:id/read
 * @desc Mark an announcement as read by the current user
 * @access All authenticated users
 */
router.post('/:id/read', authenticate, async (req, res, next) => {
  try {
    await announcementService.markAnnouncementAsRead(req.params.id, req.user!.userId);
    return ApiResponseUtil.success(res, null, 200, { message: 'Announcement marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /announcements/:id/stats
 * @desc Get read statistics for an announcement
 * @access HR Admin, Manager
 */
router.get('/:id/stats', authenticate, requireRole(['hr_admin', 'manager']), async (req, res, next) => {
  try {
    const stats = await announcementService.getAnnouncementReadStats(req.params.id, req.user!.userId);
    return ApiResponseUtil.success(res, stats);
  } catch (error) {
    next(error);
  }
});

export default router;