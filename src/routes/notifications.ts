import { Router } from 'express';
import { authenticate } from '../middleware/auth/authMiddleware';
import { notificationService } from '../services/notification/notificationService';
import { ApiResponseUtil } from '../utils/apiResponse';

const router = Router();

/**
 * @route GET /notifications/stream
 * @desc Establish SSE connection for real-time notifications
 * @access All authenticated users
 */
router.get('/stream', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const language = req.user!.languagePreference || 'en';
    
    // Set up SSE connection
    notificationService.addConnection(userId, res, language);
    
    // Connection will be managed by the notification service
    // No need to send response here as SSE connection is established
  } catch (error) {
    next(error);
  }
});

/**
 * @route GET /notifications/status
 * @desc Get notification system status
 * @access All authenticated users
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const activeConnections = notificationService.getActiveConnectionCount();
    const connectedUsers = notificationService.getConnectedUsers();
    const isUserConnected = connectedUsers.includes(userId);
    
    return ApiResponseUtil.success(res, {
      isConnected: isUserConnected,
      activeConnections,
      connectedUsers: connectedUsers.length,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route POST /notifications/test
 * @desc Send test notification (for development/testing)
 * @access All authenticated users
 */
router.post('/test', authenticate, async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const { title, content, type = 'system', priority = 'normal' } = req.body;
    
    if (!title || !content) {
      return ApiResponseUtil.validationError(res, { 
        title: 'Title is required',
        content: 'Content is required'
      });
    }
    
    await notificationService.notifyUser(userId, {
      type,
      title,
      content,
      priority
    });
    
    return ApiResponseUtil.success(res, {
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    next(error);
  }
});

export default router;