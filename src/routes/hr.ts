import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth/authMiddleware';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.use(authenticate);
router.use(requireRole(['hr_admin']));

router.get('/pending-approvals', async (req, res) => {
  try {
    const pendingApprovals = await prisma.onboardingSession.findMany({
      where: {
        status: 'manager_approved'
      },
      include: {
        employee: {
          include: {
            user: true
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    const formattedApprovals = pendingApprovals.map(session => ({
      id: session.id,
      employee: {
        firstName: session.employee?.user?.firstName || '',
        lastName: session.employee?.user?.lastName || '',
        email: session.employee?.user?.email || ''
      },
      jobDetails: session.formData || {},
      manager: {
        firstName: 'Manager',
        lastName: 'Name'
      },
      documents: [],
      onboardingSession: session,
      submittedAt: session.updatedAt
    }));

    res.json({
      success: true,
      data: formattedApprovals
    });
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch pending approvals'
    });
  }
});

router.post('/final-approval/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await prisma.onboardingSession.update({
      where: { id },
      data: {
        status: 'completed',
        completedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Final approval completed'
    });
  } catch (error) {
    console.error('Error processing final approval:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process final approval'
    });
  }
});

router.post('/request-edit/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { formType, comments, ccManager } = req.body;

    await prisma.onboardingSession.update({
      where: { id },
      data: {
        status: 'in_progress',
        formData: {
          editRequest: {
            formType,
            comments,
            requestedAt: new Date(),
            requestedBy: req.user!.userId
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Edit request sent'
    });
  } catch (error) {
    console.error('Error requesting edit:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to request edit'
    });
  }
});

export default router;
