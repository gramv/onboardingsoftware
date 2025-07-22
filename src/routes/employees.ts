import express from 'express';
import { z } from 'zod';
import { EmployeeService, CreateEmployeeRequest, UpdateEmployeeRequest, EmployeeServiceContext } from '@/services/employee/employeeService';
import { DocumentService } from '@/services/document/documentService';
import { authenticate, requirePermission } from '@/middleware/auth/authMiddleware';
import { PERMISSIONS } from '@/types/auth';
import { Prisma, DocumentType } from '@prisma/client';
import { 
  translationService, 
  EMPLOYEE_SUCCESS_KEYS, 
  EMPLOYEE_ERROR_KEYS,
  EMPLOYMENT_STATUS_KEYS,
  DEPARTMENT_KEYS,
  POSITION_KEYS 
} from '@/utils/i18n/translationService';

const router = express.Router();
const employeeService = new EmployeeService();
const documentService = new DocumentService();

// Type for Employee with User relation
type EmployeeWithUser = Prisma.EmployeeGetPayload<{
  include: {
    user: {
      include: {
        organization: true;
      };
    };
  };
}>;

// Validation schemas
const createEmployeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  languagePreference: z.enum(['en', 'es'] as const).optional(),
  employeeId: z.string().min(1, 'Employee ID is required'),
  position: z.string().optional(),
  department: z.string().optional(),
  hourlyRate: z.number().positive('Hourly rate must be positive').optional(),
  hireDate: z.string().transform((str) => new Date(str)),
  dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
  ssnEncrypted: z.string().optional(),
  emergencyContact: z.any().optional(),
  address: z.any().optional(),
  organizationId: z.string().uuid('Invalid organization ID'),
});

const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  languagePreference: z.enum(['en', 'es'] as const).optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  hourlyRate: z.number().positive().optional(),
  dateOfBirth: z.string().transform((str) => new Date(str)).optional(),
  ssnEncrypted: z.string().optional(),
  emergencyContact: z.any().optional(),
  address: z.any().optional(),
  schedule: z.any().optional(),
});

const terminateEmployeeSchema = z.object({
  terminationDate: z.string().transform((str) => new Date(str)),
  managerRating: z.number().int().min(1).max(5),
  rehireEligible: z.boolean(),
});

const listEmployeesSchema = z.object({
  page: z.string().transform((str) => parseInt(str, 10)).optional(),
  limit: z.string().transform((str) => parseInt(str, 10)).optional(),
  employmentStatus: z.enum(['active', 'terminated', 'on_leave'] as const).optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  search: z.string().optional(),
  organizationId: z.string().uuid().optional(),
});

// Helper function to extract user locale from request
const getUserLocale = (req: express.Request): string => {
  return req.user?.languagePreference || 'en';
};

// Helper function to create service context from request
const createServiceContext = (req: express.Request): EmployeeServiceContext => {
  if (!req.user || !req.permissions) {
    throw new Error(translationService.t('common.errors.authenticationRequired', {}, getUserLocale(req)));
  }
  
  return {
    userId: req.user.userId,
    role: req.user.role,
    organizationId: req.user.organizationId,
    permissions: req.permissions,
    locale: getUserLocale(req),
  };
};

// Helper function to translate employment status
const translateEmploymentStatus = (status: string, locale: string): string => {
  const statusKey = status.toUpperCase() as keyof typeof EMPLOYMENT_STATUS_KEYS;
  return translationService.t(EMPLOYMENT_STATUS_KEYS[statusKey] || status, {}, locale);
};

// Helper function to translate department
const translateDepartment = (department: string | null, locale: string): string | null => {
  if (!department) return null;
  const deptKey = department.toUpperCase().replace(/\s+/g, '_') as keyof typeof DEPARTMENT_KEYS;
  return translationService.t(DEPARTMENT_KEYS[deptKey] || department, {}, locale);
};

// Helper function to translate position
const translatePosition = (position: string | null, locale: string): string | null => {
  if (!position) return null;
  const posKey = position.toUpperCase().replace(/\s+/g, '_') as keyof typeof POSITION_KEYS;
  return translationService.t(POSITION_KEYS[posKey] || position, {}, locale);
};

/**
 * @route POST /employees
 * @desc Create a new employee
 * @access Private (HR Admin, Manager)
 */
router.post('/', 
  authenticate,
  requirePermission([PERMISSIONS.MANAGE_ALL_EMPLOYEES, PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      // Get user locale
      const locale = getUserLocale(req);
      
      // Validate request body
      const validatedData = createEmployeeSchema.parse(req.body);
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Create employee
      const employee = await employeeService.createEmployee(validatedData, context);
      
      return res.status(201).json({
        message: translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_CREATED, {}, locale),
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hireDate: employee.hireDate,
          employmentStatus: translateEmploymentStatus(employee.employmentStatus, locale),
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message, // Error messages from service are already translated
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees
 * @desc List employees with pagination and filtering
 * @access Private (HR Admin, Manager, Employee - with restrictions)
 */
router.get('/',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      // Get user locale
      const locale = getUserLocale(req);
      
      // Validate query parameters
      const validatedQuery = listEmployeesSchema.parse(req.query);
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // List employees
      const result = await employeeService.listEmployees(validatedQuery, context);
      
      return res.status(200).json({
        employees: result.data.map(employee => ({
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hireDate: employee.hireDate,
          employmentStatus: translateEmploymentStatus(employee.employmentStatus, locale),
          organizationName: (employee as any).user?.organization?.name,
        })),
        pagination: result.pagination,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/search
 * @desc Search employees
 * @access Private (HR Admin, Manager, Employee - with restrictions)
 */
router.get('/search',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const query = req.query.q as string;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      
      if (!query) {
        return res.status(400).json({
          error: translationService.t('common.errors.searchQueryRequired', {}, locale),
        });
      }
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Search employees
      const employees = await employeeService.searchEmployees(query, context, limit);
      
      return res.status(200).json({
        employees: employees.map(employee => ({
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          organizationName: (employee as any).user?.organization?.name,
        })),
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/alumni
 * @desc Get terminated employees (alumni) for rehire evaluation
 * @access Private (HR Admin, Manager)
 */
router.get('/alumni',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const organizationId = req.query.organizationId as string;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined;
      const maxRating = req.query.maxRating ? parseInt(req.query.maxRating as string, 10) : undefined;
      const rehireEligibleOnly = req.query.rehireEligibleOnly === 'true';
      const terminatedAfter = req.query.terminatedAfter ? new Date(req.query.terminatedAfter as string) : undefined;
      const terminatedBefore = req.query.terminatedBefore ? new Date(req.query.terminatedBefore as string) : undefined;
      const search = req.query.search as string;
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Get alumni with filters
      const alumni = await employeeService.getAlumni(context, {
        organizationId,
        minRating,
        maxRating,
        rehireEligibleOnly,
        terminatedAfter,
        terminatedBefore,
        search,
      });
      
      return res.status(200).json({
        alumni: alumni.map(employee => ({
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hireDate: employee.hireDate,
          terminationDate: employee.terminationDate,
          managerRating: employee.managerRating,
          rehireEligible: employee.rehireEligible,
          organizationName: (employee as any).user?.organization?.name,
        })),
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/stats/:organizationId
 * @desc Get employee statistics for an organization
 * @access Private (HR Admin, Manager)
 */
router.get('/stats/:organizationId',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { organizationId } = req.params;
      
      if (!organizationId) {
        return res.status(400).json({
          error: translationService.t('common.errors.organizationIdRequired', {}, locale),
        });
      }
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Get employee statistics
      const stats = await employeeService.getEmployeeStats(organizationId, context);
      
      return res.status(200).json({
        stats,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/:id/documents
 * @desc Get all documents for a specific employee
 * @access Private (HR Admin, Manager, Employee - with restrictions)
 */
router.get('/:id/documents',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES, PERMISSIONS.VIEW_PROFILE]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      const documentType = req.query.documentType ? z.nativeEnum(DocumentType).parse(req.query.documentType) : undefined;

      // Get documents for the employee
      const documents = await documentService.listDocuments({
        employeeId: id,
        documentType,
        requesterId: req.user!.userId,
        requesterRole: req.user!.role,
        requesterOrgId: req.user!.organizationId
      });

      return res.status(200).json({
        data: documents.map(doc => ({
          id: doc.id,
          documentType: doc.documentType,
          documentName: doc.documentName,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          isSigned: doc.isSigned,
          signedAt: doc.signedAt,
          version: doc.version,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt
        })),
        count: documents.length
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/:id
 * @desc Get employee by ID
 * @access Private (HR Admin, Manager, Employee - with restrictions)
 */
router.get('/:id',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES, PERMISSIONS.VIEW_PROFILE]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Get employee
      const employee = await employeeService.getEmployee(id, context);
      
      return res.status(200).json({
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: employee.user?.firstName,
          lastName: employee.user?.lastName,
          email: employee.user?.email,
          phone: employee.user?.phone,
          languagePreference: employee.user?.languagePreference,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hourlyRate: employee.hourlyRate,
          hireDate: employee.hireDate,
          dateOfBirth: employee.dateOfBirth,
          employmentStatus: translateEmploymentStatus(employee.employmentStatus, locale),
          emergencyContact: employee.emergencyContact,
          address: employee.address,
          schedule: employee.schedule,
          organizationName: employee.user?.organization?.name,
          terminationDate: employee.terminationDate,
          managerRating: employee.managerRating,
          rehireEligible: employee.rehireEligible,
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route PUT /employees/:id
 * @desc Update employee information
 * @access Private (HR Admin, Manager, Employee - with restrictions)
 */
router.put('/:id',
  authenticate,
  requirePermission([PERMISSIONS.MANAGE_ALL_EMPLOYEES, PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES, PERMISSIONS.EDIT_PROFILE]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      // Validate request body
      const validatedData = updateEmployeeSchema.parse(req.body);
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Update employee
      const employee = await employeeService.updateEmployee(id, validatedData, context);
      
      return res.status(200).json({
        message: translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_UPDATED, {}, locale),
        employee: {
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          phone: (employee as any).user?.phone,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hourlyRate: employee.hourlyRate,
          employmentStatus: translateEmploymentStatus(employee.employmentStatus, locale),
        },
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /employees/:id/terminate
 * @desc Terminate an employee with experience letter generation
 * @access Private (HR Admin, Manager)
 */
router.post('/:id/terminate',
  authenticate,
  requirePermission([PERMISSIONS.MANAGE_ALL_EMPLOYEES, PERMISSIONS.MANAGE_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      // Enhanced termination schema with experience letter options
      const enhancedTerminateSchema = z.object({
        terminationDate: z.string().transform((str) => new Date(str)),
        managerRating: z.number().int().min(1).max(5),
        rehireEligible: z.boolean(),
        generateExperienceLetter: z.boolean().optional().default(true),
        includeRating: z.boolean().optional().default(true),
        includeRecommendation: z.boolean().optional().default(true),
        customMessage: z.string().optional(),
      });
      
      // Validate request body
      const validatedData = enhancedTerminateSchema.parse(req.body);
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Terminate employee with experience letter
      const result = await employeeService.terminateEmployeeWithExperienceLetter(
        id, 
        validatedData, 
        context,
        {
          includeRating: validatedData.includeRating,
          includeRecommendation: validatedData.includeRecommendation,
          customMessage: validatedData.customMessage,
          locale: locale
        }
      );
      
      return res.status(200).json({
        message: translationService.t(EMPLOYEE_SUCCESS_KEYS.EMPLOYEE_TERMINATED, {}, locale),
        employee: {
          id: result.employee.id,
          employeeId: result.employee.employeeId,
          firstName: (result.employee as any).user?.firstName,
          lastName: (result.employee as any).user?.lastName,
          terminationDate: result.employee.terminationDate,
          managerRating: result.employee.managerRating,
          rehireEligible: result.employee.rehireEligible,
          employmentStatus: translateEmploymentStatus(result.employee.employmentStatus, locale),
        },
        experienceLetterGenerated: !!result.experienceLetterPath,
        experienceLetterPath: result.experienceLetterPath,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route POST /employees/:id/experience-letter
 * @desc Generate experience letter for terminated employee
 * @access Private (HR Admin, Manager)
 */
router.post('/:id/experience-letter',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      const experienceLetterSchema = z.object({
        includeRating: z.boolean().optional().default(true),
        includeRecommendation: z.boolean().optional().default(true),
        customMessage: z.string().optional(),
      });
      
      // Validate request body
      const validatedData = experienceLetterSchema.parse(req.body);
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Generate experience letter
      const experienceLetterPath = await employeeService.generateExperienceLetterForEmployee(
        id,
        context,
        {
          ...validatedData,
          locale: locale
        }
      );
      
      return res.status(200).json({
        message: translationService.t(EMPLOYEE_SUCCESS_KEYS.EXPERIENCE_LETTER_GENERATED, {}, locale),
        experienceLetterPath,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: translationService.t('common.errors.validation', {}, locale),
          details: error.errors,
        });
      } else if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/alumni/search
 * @desc Search alumni with filters
 * @access Private (HR Admin, Manager)
 */
router.get('/alumni/search',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const query = req.query.q as string;
      const minRating = req.query.minRating ? parseInt(req.query.minRating as string, 10) : undefined;
      const rehireEligibleOnly = req.query.rehireEligibleOnly === 'true';
      
      if (!query) {
        return res.status(400).json({
          error: translationService.t('common.errors.searchQueryRequired', {}, locale),
        });
      }
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Search alumni
      const alumni = await employeeService.searchAlumni(query, context, {
        minRating,
        rehireEligibleOnly,
      });
      
      return res.status(200).json({
        alumni: alumni.map(employee => ({
          id: employee.id,
          employeeId: employee.employeeId,
          firstName: (employee as any).user?.firstName,
          lastName: (employee as any).user?.lastName,
          email: (employee as any).user?.email,
          position: translatePosition(employee.position, locale),
          department: translateDepartment(employee.department, locale),
          hireDate: employee.hireDate,
          terminationDate: employee.terminationDate,
          managerRating: employee.managerRating,
          rehireEligible: employee.rehireEligible,
          organizationName: (employee as any).user?.organization?.name,
        })),
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

/**
 * @route GET /employees/:id/employment-history
 * @desc Get employment history for rehire evaluation
 * @access Private (HR Admin, Manager)
 */
router.get('/:id/employment-history',
  authenticate,
  requirePermission([PERMISSIONS.VIEW_ALL_EMPLOYEES, PERMISSIONS.VIEW_ORGANIZATION_EMPLOYEES]),
  async (req, res) => {
    try {
      const locale = getUserLocale(req);
      const { id } = req.params;
      
      // Create service context with locale
      const context = createServiceContext(req);
      
      // Get employment history
      const history = await employeeService.getAlumniEmploymentHistory(id, context);
      
      return res.status(200).json({
        employee: {
          id: history.employee.id,
          employeeId: history.employee.employeeId,
          firstName: history.employee.user?.firstName,
          lastName: history.employee.user?.lastName,
          email: history.employee.user?.email,
        },
        previousEmployments: history.previousEmployments.map(emp => ({
          ...emp,
          position: translatePosition(emp.position || null, locale),
          department: translateDepartment(emp.department || null, locale),
        })),
        rehireRecommendation: history.rehireRecommendation,
      });
    } catch (error) {
      const locale = getUserLocale(req);
      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      } else {
        return res.status(500).json({
          error: translationService.t('common.errors.unexpected', {}, locale),
        });
      }
    }
  }
);

export default router;