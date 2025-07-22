import { Router } from 'express';
import { JobService } from '../services/job/jobService';
import { authenticate, requireRole } from '../middleware/auth/authMiddleware';

const router = Router();
const jobService = new JobService();

router.use(authenticate);

router.post('/generate', requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { organizationId } = req.body;
    const context = {
      userId: req.user!.userId,
      role: req.user!.role,
      organizationId: req.user!.organizationId
    };

    const qrUrl = await jobService.generatePropertyQRCode(
      organizationId || context.organizationId,
      context
    );

    res.json({
      success: true,
      data: { qrUrl }
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate QR code'
    });
  }
});

export default router;
