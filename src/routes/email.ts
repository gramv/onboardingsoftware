import express from 'express';
import { EmailService } from '@/services/email/emailService';
import { authenticate, requireRole } from '@/middleware/auth/authMiddleware';

const router = express.Router();
const emailService = new EmailService();

/**
 * @route GET /email/test-connection
 * @desc Test SMTP connection
 * @access Private (HR Admin only)
 */
router.get('/test-connection', authenticate, requireRole(['hr_admin']), async (req, res) => {
  try {
    const isConnected = await emailService.testConnection();
    
    return res.status(200).json({
      message: isConnected ? 'SMTP connection successful' : 'SMTP connection failed',
      connected: isConnected,
    });
  } catch (error) {
    console.error('SMTP connection test error:', error);
    return res.status(500).json({
      error: 'Failed to test SMTP connection',
      connected: false,
    });
  }
});

/**
 * @route POST /email/send-test
 * @desc Send a test email
 * @access Private (HR Admin only)
 */
router.post('/send-test', authenticate, requireRole(['hr_admin']), async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: 'Email address is required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Invalid email format',
      });
    }

    await emailService.sendTestEmail(email);
    
    return res.status(200).json({
      message: `Test email sent successfully to ${email}`,
      sent: true,
    });
  } catch (error) {
    console.error('Test email sending error:', error);
    return res.status(500).json({
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error',
      sent: false,
    });
  }
});

export default router; 