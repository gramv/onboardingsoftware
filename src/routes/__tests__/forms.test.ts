import request from 'supertest';
import express from 'express';
import formRoutes from '../forms';

// Mock the services and middleware
jest.mock('@/services/forms/formGenerationService');
jest.mock('@/services/forms/pdfGenerationService');
jest.mock('@/repositories/form.repository');
jest.mock('@/middleware/auth/authMiddleware');

// Mock the translation service
jest.mock('@/utils/i18n/translationService', () => ({
  translationService: {
    t: jest.fn((key: string) => key)
  }
}));

const mockTranslationService = require('@/utils/i18n/translationService').translationService;

// Mock the services
jest.mock('@/services/forms/formGenerationService', () => ({
  FormGenerationService: jest.fn().mockImplementation(() => ({
    generateForm: jest.fn().mockResolvedValue({
      id: 'form-1',
      employeeId: 'emp-1',
      formType: 'i9',
      language: 'en',
      template: {
        id: 'i9-en-v1',
        name: 'Form I-9',
        type: 'i9',
        version: '1.0',
        language: 'en',
        sections: [],
        metadata: {
          title: 'Employment Eligibility Verification',
          description: 'Form I-9',
          instructions: 'Complete this form'
        }
      },
      prefilledData: {
        firstName: 'John',
        lastName: 'Doe'
      },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    }),
    getFormTemplate: jest.fn(),
    validateFormData: jest.fn(),
    calculateCompletionPercentage: jest.fn(),
    autoCalculateW4Dependents: jest.fn(),
    getFieldSuggestions: jest.fn()
  }))
}));

jest.mock('@/services/forms/pdfGenerationService', () => ({
  PDFGenerationService: jest.fn().mockImplementation(() => ({
    generateFormPDF: jest.fn()
  }))
}));

jest.mock('@/repositories/form.repository', () => ({
  FormRepository: jest.fn().mockImplementation(() => ({
    save: jest.fn(),
    findById: jest.fn(),
    findByEmployeeId: jest.fn(),
    findByStatus: jest.fn(),
    findByType: jest.fn(),
    findAll: jest.fn(),
    delete: jest.fn(),
    updatePdfPath: jest.fn(),
    getStatistics: jest.fn()
  }))
}));

// Get the mocked services
const mockFormGenerationService = new (require('@/services/forms/formGenerationService').FormGenerationService)();
const mockPDFGenerationService = new (require('@/services/forms/pdfGenerationService').PDFGenerationService)();
const mockFormRepository = new (require('@/repositories/form.repository').FormRepository)();

// Mock middleware
jest.mock('@/middleware/auth/authMiddleware', () => ({
  authenticate: jest.fn((req: any, res: any, next: any) => {
    req.user = {
      userId: 'user-1',
      role: 'hr_admin',
      employeeId: 'emp-1',
      organizationId: 'org-1'
    };
    next();
  })
}));

const mockAuthenticate = require('@/middleware/auth/authMiddleware').authenticate;

describe('Forms API', () => {
  let app: express.Application;
  let mockUser: any;
  let mockGeneratedForm: any;
  let mockTemplate: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/forms', formRoutes);

    mockUser = {
      userId: 'user-1',
      role: 'hr_admin',
      employeeId: 'emp-1',
      organizationId: 'org-1'
    };

    mockGeneratedForm = {
      id: 'form-1',
      employeeId: 'emp-1',
      formType: 'i9',
      language: 'en',
      template: {
        id: 'i9-en-v1',
        name: 'Form I-9',
        type: 'i9',
        version: '1.0',
        language: 'en',
        sections: [],
        metadata: {
          title: 'Employment Eligibility Verification',
          description: 'Form I-9',
          instructions: 'Complete this form'
        }
      },
      prefilledData: {
        firstName: 'John',
        lastName: 'Doe'
      },
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    mockTemplate = {
      id: 'i9-en-v1',
      name: 'Form I-9',
      type: 'i9',
      version: '1.0',
      language: 'en',
      sections: [
        {
          id: 'section1',
          title: 'Section 1',
          fields: [
            { name: 'firstName', label: 'First Name', type: 'text', required: true },
            { name: 'lastName', label: 'Last Name', type: 'text', required: true }
          ]
        }
      ],
      metadata: {
        title: 'Employment Eligibility Verification',
        description: 'Form I-9',
        instructions: 'Complete this form'
      }
    };

    // Mock middleware to pass through
    mockAuthenticate.mockImplementation((req: any, res: any, next: any) => {
      req.user = mockUser;
      next();
    });

    // Reset service mocks
    jest.clearAllMocks();
    
    // Set up mock implementations
    mockFormGenerationService.generateForm.mockResolvedValue(mockGeneratedForm);
    mockFormGenerationService.getFormTemplate.mockReturnValue(mockTemplate);
    mockFormGenerationService.validateFormData.mockReturnValue({
      isValid: true,
      errors: {},
      warnings: {},
      completionPercentage: 75,
      requiredFieldsMissing: []
    });
    mockFormGenerationService.calculateCompletionPercentage.mockReturnValue(75);
    mockFormGenerationService.autoCalculateW4Dependents.mockImplementation((data: any) => data);
    mockFormGenerationService.getFieldSuggestions.mockReturnValue(['CA', 'CO', 'CT']);
    
    mockPDFGenerationService.generateFormPDF.mockResolvedValue('/path/to/form.pdf');
    
    // Set up form repository mocks
    mockFormRepository.save.mockResolvedValue({});
    mockFormRepository.findById.mockResolvedValue(null);
    mockFormRepository.findByEmployeeId.mockResolvedValue([]);
    mockFormRepository.findByStatus.mockResolvedValue([]);
    mockFormRepository.findByType.mockResolvedValue([]);
    mockFormRepository.findAll.mockResolvedValue({ forms: [], total: 0, page: 1, limit: 10 });
    mockFormRepository.delete.mockResolvedValue(true);
    mockFormRepository.updatePdfPath.mockResolvedValue({});
    mockFormRepository.getStatistics.mockResolvedValue({ total: 0, byStatus: {}, byType: {} });
  });

  describe('POST /forms/generate', () => {
    beforeEach(() => {
      mockFormGenerationService.generateForm.mockResolvedValue(mockGeneratedForm);
    });

    it('should generate a new form successfully', async () => {
      const requestBody = {
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        prefillFromOCR: false
      };

      // Debug the mock translation service
      console.log('Translation service mock:', mockTranslationService);
      console.log('Translation service t function:', mockTranslationService.t);
      
      // Test the translation service directly
      const testKey = 'forms.messages.validationError';
      console.log(`Translation for ${testKey}:`, mockTranslationService.t(testKey));

      const response = await request(app)
        .post('/forms/generate')
        .send(requestBody);

      // Debug the actual response
      console.error('Unexpected status:', response.status);
      console.error('Response body:', JSON.stringify(response.body, null, 2));
      console.error('Response text:', response.text);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.form).toBeDefined();
      expect(response.body.data.formData).toBeDefined();
      expect(response.body.data.formData.formId).toBe('form-1');
      expect(response.body.data.formData.status).toBe('draft');
    });

    it('should generate form with OCR prefill', async () => {
      const requestBody = {
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        prefillFromOCR: true,
        ocrDocumentIds: ['doc-1', 'doc-2']
      };

      const response = await request(app)
        .post('/forms/generate')
        .send(requestBody)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(mockFormGenerationService.generateForm).toHaveBeenCalledWith({
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en',
        prefillFromOCR: true,
        ocrDocumentIds: ['doc-1', 'doc-2']
      });
    });

    it('should return validation error for invalid request', async () => {
      const requestBody = {
        employeeId: 'invalid-uuid',
        formType: 'invalid-type'
      };

      const response = await request(app)
        .post('/forms/generate')
        .send(requestBody)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.messages.validationError');
    });

    it('should handle service errors', async () => {
      mockFormGenerationService.generateForm.mockRejectedValue(new Error('Employee not found'));

      const requestBody = {
        employeeId: 'emp-1',
        formType: 'i9',
        language: 'en'
      };

      const response = await request(app)
        .post('/forms/generate')
        .send(requestBody)
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.generationFailed');
    });
  });

  describe('GET /forms/:id', () => {
    beforeEach(() => {
      mockFormGenerationService.getFormTemplate.mockReturnValue(mockTemplate);
      mockFormGenerationService.validateFormData.mockReturnValue({
        isValid: true,
        errors: {},
        warnings: {},
        completionPercentage: 75,
        requiredFieldsMissing: []
      });
      mockFormGenerationService.calculateCompletionPercentage.mockReturnValue(75);
    });

    it('should retrieve form successfully', async () => {
      // First generate a form to have it in storage
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .get('/forms/form-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.formData).toBeDefined();
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.validation).toBeDefined();
      expect(response.body.data.completionPercentage).toBe(75);
    });

    it('should return 404 for non-existent form', async () => {
      const response = await request(app)
        .get('/forms/non-existent')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.notFound');
    });

    it('should deny access for unauthorized employee', async () => {
      mockUser.role = 'employee';
      mockUser.employeeId = 'different-emp';

      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .get('/forms/form-1')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.accessDenied');
    });
  });

  describe('PUT /forms/:id', () => {
    beforeEach(() => {
      mockFormGenerationService.autoCalculateW4Dependents.mockImplementation((data: any) => data);
      mockFormGenerationService.validateFormData.mockReturnValue({
        isValid: true,
        errors: {},
        warnings: {},
        completionPercentage: 85,
        requiredFieldsMissing: []
      });
      mockFormGenerationService.calculateCompletionPercentage.mockReturnValue(85);
    });

    it('should update form data successfully', async () => {
      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const updateData = {
        data: {
          firstName: 'Jane',
          lastName: 'Smith',
          address: '456 Oak St'
        },
        status: 'in_progress'
      };

      const response = await request(app)
        .put('/forms/form-1')
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.formData.data.firstName).toBe('Jane');
      expect(response.body.data.formData.status).toBe('in_progress');
      expect(response.body.data.completionPercentage).toBe(85);
    });

    it('should auto-calculate W-4 dependents', async () => {
      mockGeneratedForm.formType = 'w4';
      
      // First generate a W-4 form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'w4',
          language: 'en'
        });

      const updateData = {
        data: {
          qualifyingChildren: 4000,
          otherDependents: 1000
        }
      };

      await request(app)
        .put('/forms/form-1')
        .send(updateData)
        .expect(200);

      expect(mockFormGenerationService.autoCalculateW4Dependents).toHaveBeenCalled();
    });

    it('should return 404 for non-existent form', async () => {
      const response = await request(app)
        .put('/forms/non-existent')
        .send({ data: {} })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.notFound');
    });
  });

  describe('POST /forms/:id/validate', () => {
    beforeEach(() => {
      mockFormGenerationService.autoCalculateW4Dependents.mockImplementation((data: any) => ({
        ...data,
        totalDependentAmount: 5000
      }));
      mockFormGenerationService.validateFormData.mockReturnValue({
        isValid: false,
        errors: { firstName: 'First name is required' },
        warnings: {},
        completionPercentage: 50,
        requiredFieldsMissing: ['firstName']
      });
      mockFormGenerationService.calculateCompletionPercentage.mockReturnValue(50);
    });

    it('should validate form data without saving', async () => {
      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const validateData = {
        data: {
          lastName: 'Smith'
        }
      };

      const response = await request(app)
        .post('/forms/form-1/validate')
        .send(validateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.validation).toBeDefined();
      expect(response.body.data.validation.isValid).toBe(false);
      expect(response.body.data.validation.errors.firstName).toBeDefined();
      expect(response.body.data.completionPercentage).toBe(50);
    });
  });

  describe('POST /forms/:id/submit', () => {
    beforeEach(() => {
      mockFormGenerationService.validateFormData.mockReturnValue({
        isValid: true,
        errors: {},
        warnings: {},
        completionPercentage: 100,
        requiredFieldsMissing: []
      });
    });

    it('should submit valid form successfully', async () => {
      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .post('/forms/form-1/submit')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.formData.status).toBe('submitted');
      expect(response.body.data.formData.submittedAt).toBeDefined();
    });

    it('should reject submission of invalid form', async () => {
      mockFormGenerationService.validateFormData.mockReturnValue({
        isValid: false,
        errors: { firstName: 'Required' },
        warnings: {},
        completionPercentage: 50,
        requiredFieldsMissing: ['firstName']
      });

      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .post('/forms/form-1/submit')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.validationFailed');
      expect(response.body.details.errors).toBeDefined();
    });
  });

  describe('POST /forms/:id/approve', () => {
    it('should approve submitted form', async () => {
      // First generate and submit a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      // Update form status to submitted
      await request(app)
        .put('/forms/form-1')
        .send({ status: 'submitted' });

      const response = await request(app)
        .post('/forms/form-1/approve')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.formData.status).toBe('approved');
      expect(response.body.data.formData.reviewedBy).toBe('user-1');
    });

    it('should reject approval of non-submitted form', async () => {
      // First generate a form (status: draft)
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .post('/forms/form-1/approve')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.mustBeSubmittedForApproval');
    });
  });

  describe('POST /forms/:id/reject', () => {
    it('should reject submitted form with comments', async () => {
      // First generate and submit a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      await request(app)
        .put('/forms/form-1')
        .send({ status: 'submitted' });

      const response = await request(app)
        .post('/forms/form-1/reject')
        .send({ comments: 'Missing required documents' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.formData.status).toBe('rejected');
      expect(response.body.data.formData.validationErrors.general).toBe('Missing required documents');
    });
  });

  describe('GET /forms/:id/pdf', () => {
    beforeEach(() => {
      mockFormGenerationService.getFormTemplate.mockReturnValue(mockTemplate);
      mockPDFGenerationService.generateFormPDF.mockResolvedValue('/path/to/form.pdf');
    });

    it('should generate PDF successfully', async () => {
      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      // Mock res.sendFile
      const mockSendFile = jest.fn();
      app.use('/forms/:id/pdf', (req, res) => {
        res.sendFile = mockSendFile;
        res.setHeader = jest.fn();
      });

      const response = await request(app)
        .get('/forms/form-1/pdf');

      expect(mockPDFGenerationService.generateFormPDF).toHaveBeenCalled();
    });
  });

  describe('GET /forms/employee/:employeeId', () => {
    it('should retrieve all forms for employee', async () => {
      mockFormGenerationService.calculateCompletionPercentage.mockReturnValue(75);

      // First generate some forms
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'w4',
          language: 'en'
        });

      const response = await request(app)
        .get('/forms/employee/emp-1')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.forms).toHaveLength(2);
      expect(response.body.data.count).toBe(2);
    });

    it('should deny access for unauthorized employee', async () => {
      mockUser.role = 'employee';
      mockUser.employeeId = 'different-emp';

      const response = await request(app)
        .get('/forms/employee/emp-1')
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('forms.errors.accessDenied');
    });
  });

  describe('GET /forms/templates/:formType', () => {
    beforeEach(() => {
      mockFormGenerationService.getFormTemplate.mockReturnValue(mockTemplate);
    });

    it('should retrieve form template', async () => {
      const response = await request(app)
        .get('/forms/templates/i9')
        .query({ language: 'en' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.template).toBeDefined();
      expect(response.body.data.template.type).toBe('i9');
    });

    it('should handle unsupported form type', async () => {
      mockFormGenerationService.getFormTemplate.mockImplementation(() => {
        throw new Error('Unsupported form type: invalid');
      });

      const response = await request(app)
        .get('/forms/templates/invalid')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Unsupported form type: invalid');
    });
  });

  describe('GET /forms/:id/suggestions/:fieldName', () => {
    beforeEach(() => {
      mockFormGenerationService.getFieldSuggestions.mockReturnValue(['CA', 'CO', 'CT']);
    });

    it('should provide field suggestions', async () => {
      // First generate a form
      await request(app)
        .post('/forms/generate')
        .send({
          employeeId: 'emp-1',
          formType: 'i9',
          language: 'en'
        });

      const response = await request(app)
        .get('/forms/form-1/suggestions/state')
        .query({ q: 'C' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.suggestions).toEqual(['CA', 'CO', 'CT']);
      expect(mockFormGenerationService.getFieldSuggestions).toHaveBeenCalledWith('i9', 'state', 'C');
    });
  });
});