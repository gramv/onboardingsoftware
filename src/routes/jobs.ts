import express from 'express';
import { JobService, createJobPostingSchema, createJobApplicationSchema, updateApplicationStatusSchema } from '../services/job/jobService';
import { authenticate, requireRole } from '../middleware/auth/authMiddleware';
import { z } from 'zod';

const router = express.Router();
const jobService = new JobService();

// Helper function to create service context
const createServiceContext = (req: any) => ({
  userId: req.user.userId,
  role: req.user.role,
  organizationId: req.user.organizationId,
});

/**
 * @route GET /jobs
 * @desc Get all job postings (public endpoint)
 * @access Public
 */
router.get('/', async (req, res) => {
  try {
    const { search, department, position, organizationId } = req.query;
    
    const jobPostings = await jobService.getJobPostings({
      isActive: true, // Only show active jobs on public endpoint
      search: search as string,
      department: department as string,
      position: position as string,
      organizationId: organizationId as string,
    });

    return res.status(200).json({
      message: 'Job postings retrieved successfully',
      data: jobPostings.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        department: job.department,
        position: job.position,
        salaryRange: job.salaryRange,
        requirements: job.requirements,
        benefits: job.benefits,
        organizationName: job.organization.name,
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
        applicationCount: job._count.applications,
      })),
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return res.status(500).json({
      error: 'Failed to fetch job postings',
    });
  }
});



/**
 * @route POST /jobs/:id/apply
 * @desc Submit job application (public endpoint)
 * @access Public
 */
router.post('/:id/apply', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate application data
    const applicationData = createJobApplicationSchema.parse({
      ...req.body,
      jobPostingId: id,
    });

    const application = await jobService.submitJobApplication(applicationData);

    return res.status(201).json({
      message: 'Application submitted successfully',
      data: {
        id: application.id,
        jobTitle: application.jobPosting.title,
        organizationName: application.jobPosting.organization.name,
        submittedAt: application.appliedAt,
        status: application.status,
      },
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to submit application',
    });
  }
});

// Protected routes below (require authentication)

/**
 * @route POST /jobs
 * @desc Create a new job posting
 * @access Private (HR Admin, Manager)
 */
router.post('/', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const jobData = createJobPostingSchema.parse(req.body);
    const context = createServiceContext(req);

    const jobPosting = await jobService.createJobPosting(jobData, context);

    return res.status(201).json({
      message: 'Job posting created successfully',
      data: jobPosting,
    });
  } catch (error) {
    console.error('Error creating job posting:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to create job posting',
    });
  }
});

/**
 * @route PUT /jobs/:id
 * @desc Update a job posting
 * @access Private (HR Admin, Manager)
 */
router.put('/:id', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const context = createServiceContext(req);

    const updatedJobPosting = await jobService.updateJobPosting(id, updateData, context);

    return res.status(200).json({
      message: 'Job posting updated successfully',
      data: updatedJobPosting,
    });
  } catch (error) {
    console.error('Error updating job posting:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to update job posting',
    });
  }
});

/**
 * @route DELETE /jobs/:id
 * @desc Delete a job posting
 * @access Private (HR Admin, Manager)
 */
router.delete('/:id', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const context = createServiceContext(req);

    await jobService.deleteJobPosting(id, context);

    return res.status(200).json({
      message: 'Job posting deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting job posting:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to delete job posting',
    });
  }
});

/**
 * @route GET /jobs/manage/all
 * @desc Get all job postings for management
 * @access Private (HR Admin, Manager)
 */
router.get('/manage/all', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { search, department, position, isActive } = req.query;
    const context = createServiceContext(req);
    
    const filters: any = {
      search: search as string,
      department: department as string,
      position: position as string,
    };

    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }

    // For managers, filter by their organization
    if (context.role === 'manager') {
      filters.organizationId = context.organizationId;
    }

    const jobPostings = await jobService.getJobPostings(filters);
    console.log('🔍 Raw jobPostings:', JSON.stringify(jobPostings, null, 2));

    let mappedData;
    try {
      mappedData = jobPostings.map((job: any) => ({
        id: job.id,
        title: job.title,
        description: job.description,
        department: job.department,
        position: job.position,
        salaryRange: job.salaryRange,
        requirements: job.requirements,
        benefits: job.benefits,
        organizationName: job.organization?.name ?? '',
        createdAt: job.createdAt,
        expiresAt: job.expiresAt,
        applicationCount: job._count?.applications ?? 0,
      }));
    } catch (mapError) {
      console.error('❌ Error mapping jobPostings:', mapError);
      return res.status(500).json({ error: 'Error mapping job postings', details: mapError instanceof Error ? mapError.message : mapError });
    }

    return res.status(200).json({
      message: 'Job postings retrieved successfully',
      data: mappedData,
    });
  } catch (error) {
    console.error('Error fetching job postings:', error);
    return res.status(500).json({
      error: 'Failed to fetch job postings',
      details: error instanceof Error ? error.message : error
    });
  }
});

/**
 * @route GET /jobs/applications
 * @desc Get job applications
 * @access Private (HR Admin, Manager)
 */
router.get('/applications', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { jobPostingId, status, search } = req.query;
    const context = createServiceContext(req);
    
    console.log('🔍 Applications endpoint called by user:', context.userId, 'role:', context.role, 'org:', context.organizationId);

    const filters: any = {
      jobPostingId: jobPostingId as string,
      status: status as any,
      search: search as string,
    };

    const applications = await jobService.getJobApplications(filters, context);

    console.log('✅ Applications endpoint returning:', applications.length, 'applications');
    return res.status(200).json({
      message: 'Applications retrieved successfully',
      data: applications.map((application: any) => ({
        id: application.id,
        jobPostingId: application.jobPosting?.id ?? '',
        firstName: application.firstName,
        lastName: application.lastName,
        email: application.email,
        phone: application.phone,
        address: application.address,
        resumeText: application.resumeText,
        experience: application.experience,
        education: application.education,
        additionalInfo: application.additionalInfo,
        status: application.status,
        appliedAt: application.appliedAt,
        reviewedAt: application.reviewedAt,
        reviewedBy: application.reviewedBy,
        createdAt: application.createdAt,
        updatedAt: application.updatedAt,
        jobPosting: application.jobPosting ? {
          id: application.jobPosting.id,
          title: application.jobPosting.title,
          department: application.jobPosting.department,
          position: application.jobPosting.position,
          organization: application.jobPosting.organization ? {
            name: application.jobPosting.organization.name
          } : { name: '' }
        } : null,
        reviewer: application.reviewer ? {
          firstName: application.reviewer.firstName,
          lastName: application.reviewer.lastName
        } : null
      })),
    });
  } catch (error) {
    console.error('❌ Error fetching applications:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch applications',
    });
  }
});

/**
 * @route GET /jobs/applications/:id
 * @desc Get a specific job application
 * @access Private (HR Admin, Manager)
 */
router.get('/applications/:id', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const { id } = req.params;
    const context = createServiceContext(req);

    const application = await jobService.getJobApplicationById(id, context);

    return res.status(200).json({
      message: 'Application retrieved successfully',
      data: application,
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch application',
    });
  }
});

/**
 * @route PUT /jobs/applications/:id/status
 * @desc Update application status
 * @access Private (HR Admin, Manager)
 */
router.put('/applications/:id/status', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    console.log('🚀 PUT /applications/:id/status called');
    console.log('📋 Application ID:', req.params.id);
    console.log('📊 Status Data:', req.body);
    
    const { id } = req.params;
    const statusData = updateApplicationStatusSchema.parse(req.body);
    const context = createServiceContext(req);
    
    console.log('✅ Calling jobService.updateApplicationStatus...');
    const updatedApplication = await jobService.updateApplicationStatus(id, statusData, context);

    return res.status(200).json({
      message: 'Application status updated successfully',
      data: updatedApplication,
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.errors,
      });
    }
    if (error instanceof Error) {
      return res.status(400).json({
        error: error.message,
      });
    }
    return res.status(500).json({
      error: 'Failed to update application status',
    });
  }
});

/**
 * @route GET /jobs/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (HR Admin, Manager)
 */
router.get('/dashboard/stats', authenticate, requireRole(['hr_admin', 'manager']), async (req, res) => {
  try {
    const context = createServiceContext(req);
    const stats = await jobService.getJobDashboardStats(context);

    return res.status(200).json({
      message: 'Dashboard stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({
      error: 'Failed to fetch dashboard stats',
    });
  }
});

/**
 * @route GET /jobs/:id
 * @desc Get a specific job posting (public endpoint)
 * @access Public
 * NOTE: This route MUST be last to avoid catching other specific routes
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const jobPosting = await jobService.getJobPostingById(id);

    return res.status(200).json({
      message: 'Job posting retrieved successfully',
      data: {
        id: jobPosting.id,
        title: jobPosting.title,
        description: jobPosting.description,
        department: jobPosting.department,
        position: jobPosting.position,
        salaryRange: jobPosting.salaryRange,
        requirements: jobPosting.requirements,
        benefits: jobPosting.benefits,
        organizationName: jobPosting.organization.name,
        organizationAddress: jobPosting.organization.address,
        createdAt: jobPosting.createdAt,
        expiresAt: jobPosting.expiresAt,
        isActive: jobPosting.isActive,
      },
    });
  } catch (error) {
    console.error('Error fetching job posting:', error);
    if (error instanceof Error && error.message === 'Job posting not found') {
      return res.status(404).json({
        error: 'Job posting not found',
      });
    }
    return res.status(500).json({
      error: 'Failed to fetch job posting',
    });
  }
});

export default router; 