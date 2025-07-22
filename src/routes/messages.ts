import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { MessageService } from '../services/messaging/messageService';
import { authenticate } from '../middleware/auth/authMiddleware';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();
const prisma = new PrismaClient();
const messageService = new MessageService(prisma);

/**
 * @route POST /messages
 * @desc Send a new message
 * @access All authenticated users
 */
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { receiverId, subject, content } = req.body;
    const senderId = req.user!.userId;

    if (!content || content.trim() === '') {
      return ApiResponseUtil.validationError(res, { content: 'Message content is required' });
    }

    const message = await messageService.sendMessage(
      {
        receiverId,
        subject,
        content
      },
      senderId
    );

    return ApiResponseUtil.success(res, message, 201, { message: 'Message sent successfully' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /messages/inbox
 * @desc Get user's inbox messages
 * @access All authenticated users
 */
router.get('/inbox', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userId = req.user!.userId;

    const { messages, total } = await messageService.getInbox(userId, page, limit, search);

    return ApiResponseUtil.paginated(res, messages, total, page, limit);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /messages/outbox
 * @desc Get user's sent messages
 * @access All authenticated users
 */
router.get('/outbox', authenticate, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const userId = req.user!.userId;

    const { messages, total } = await messageService.getOutbox(userId, page, limit, search);

    return ApiResponseUtil.paginated(res, messages, total, page, limit);
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /messages/unread-count
 * @desc Get count of unread messages
 * @access All authenticated users
 */
router.get('/unread-count', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const count = await messageService.getUnreadCount(userId);

    return ApiResponseUtil.success(res, { count });
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /messages/:id
 * @desc Get a specific message
 * @access Message sender or receiver
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const message = await messageService.getMessageById(req.params.id, userId);

    return ApiResponseUtil.success(res, message);
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /messages/:id/read
 * @desc Mark a message as read
 * @access Message receiver
 */
router.post('/:id/read', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    await messageService.markMessageAsRead(req.params.id, userId);

    return ApiResponseUtil.success(res, null, 200, { message: 'Message marked as read' });
  } catch (error) {
    next(error);
  }
});

/**
 * @route DELETE /messages/:id
 * @desc Delete a message
 * @access Message sender or receiver
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    await messageService.deleteMessage(req.params.id, userId);

    return ApiResponseUtil.success(res, null, 200, { message: 'Message deleted successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;