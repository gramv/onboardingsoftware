import express from 'express';
import { z } from 'zod';
import { JobService } from '../services/job/jobService';
import { authenticate } from '../middleware/auth/authMiddleware';
import { requireRole } from '../middleware/auth/roleGuards';
import { ApplicationStatus } from '@prisma/client';

const router = express.Router();
const jobService = new JobService();

const createServiceContext = (req: any) => ({
  userId: req.user?.userId || req.user?.id,
  role: req.user?.role,
  organizationId: req.user?.organizationId
});

router.post('/:applicationId/approve', 
  authenticate, 
  requireRole(['manager', 'hr_admin']), 
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { jobDescription, payRate, benefits, startDate, notes } = req.body;
      
      const context = createServiceContext(req);
      
      const updatedApplication = await jobService.updateApplicationStatus(
        applicationId,
        {
          status: 'approved' as ApplicationStatus,
          reviewNotes: `Job Details: ${jobDescription || ''}, Pay: ${payRate || ''}, Benefits: ${benefits || ''}, Start: ${startDate || ''}, Notes: ${notes || ''}`
        } as any,
        context
      );

      return res.status(200).json({
        message: 'Application approved and onboarding email sent',
        data: updatedApplication
      });
    } catch (error) {
      console.error('Error approving application:', error);
      return res.status(500).json({
        error: 'Failed to approve application'
      });
    }
  }
);

router.post('/:applicationId/reject',
  authenticate,
  requireRole(['manager', 'hr_admin']),
  async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { reason } = req.body;
      
      const context = createServiceContext(req);
      
      const updatedApplication = await jobService.updateApplicationStatus(
        applicationId,
        {
          status: 'rejected' as ApplicationStatus,
          reviewNotes: reason
        },
        context
      );

      return res.status(200).json({
        message: 'Application rejected and notification sent',
        data: updatedApplication
      });
    } catch (error) {
      console.error('Error rejecting application:', error);
      return res.status(500).json({
        error: 'Failed to reject application'
      });
    }
  }
);

router.get('/',
  authenticate,
  requireRole(['manager', 'hr_admin']),
  async (req, res) => {
    try {
      const context = createServiceContext(req);
      const filters = {
        status: req.query.status as ApplicationStatus,
        organizationId: req.query.organizationId as string,
        search: req.query.search as string,
      };

      const applications = await jobService.getJobApplications(filters, context);

      return res.status(200).json({
        message: 'Applications retrieved successfully',
        data: applications
      });
    } catch (error) {
      console.error('Error retrieving applications:', error);
      return res.status(500).json({
        error: 'Failed to retrieve applications'
      });
    }
  }
);

export default router;
