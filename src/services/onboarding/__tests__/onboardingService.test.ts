import { OnboardingService, CreateOnboardingSessionRequest, UpdateOnboardingProgressRequest } from '../onboardingService';
import { OnboardingRepository } from '@/repositories/onboarding.repository';
import { EmployeeRepository } from '@/repositories/employee.repository';
import { OnboardingStatus, LanguageCode } from '@prisma/client';

// Mock the repositories
jest.mock('@/repositories/onboarding.repository');
jest.mock('@/repositories/employee.repository');

const mockOnboardingRepository = OnboardingRepository as jest.MockedClass<typeof OnboardingRepository>;
const mockEmployeeRepository = EmployeeRepository as jest.MockedClass<typeof EmployeeRepository>;

describe('OnboardingService', () => {
  let service: OnboardingService;
  let onboardingRepo: jest.Mocked<OnboardingRepository>;
  let employeeRepo: jest.Mocked<EmployeeRepository>;

  beforeEach(() => {
    service = new OnboardingService();
    onboardingRepo = new mockOnboardingRepository() as jest.Mocked<OnboardingRepository>;
    employeeRepo = new mockEmployeeRepository() as jest.Mocked<EmployeeRepository>;
    
    // Replace the repository instances in the service
    (service as any).onboardingRepository = onboardingRepo;
    (service as any).employeeRepository = employeeRepo;

    jest.clearAllMocks();
  });

  describe('createSession', () => {
    const mockEmployee = {
      id: 'employee-1',
      employeeId: 'EMP001',
      userId: 'user-1',
      user: {
        id: 'user-1',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        organization: {
          id: 'org-1',
          name: 'Test Motel',
          type: 'motel'
        }
      }
    };

    const mockSession = {
      id: 'session-1',
      employeeId: 'employee-1',
      accessCode: 'ABC123',
      languagePreference: 'en' as LanguageCode,
      currentStep: 'language_selection',
      formData: {},
      status: 'in_progress' as OnboardingStatus,
      expiresAt: new Date('2024-12-31'),
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: mockEmployee
    };

    it('should create a new onboarding session successfully', async () => {
      const request: CreateOnboardingSessionRequest = {
        employeeId: 'employee-1',
        languagePreference: 'en',
        expirationHours: 168
      };

      employeeRepo.findById.mockResolvedValue(mockEmployee as any);
      onboardingRepo.findActiveByEmployeeId.mockResolvedValue(null);
      onboardingRepo.accessCodeExists.mockResolvedValue(false);
      onboardingRepo.create.mockResolvedValue(mockSession as any);

      const result = await service.createSession(request, 'requester-1');

      expect(employeeRepo.findById).toHaveBeenCalledWith('employee-1');
      expect(onboardingRepo.findActiveByEmployeeId).toHaveBeenCalledWith('employee-1');
      expect(onboardingRepo.create).toHaveBeenCalledWith({
        employeeId: 'employee-1',
        accessCode: expect.any(String),
        languagePreference: 'en',
        expiresAt: expect.any(Date),
        currentStep: 'language_selection',
        formData: {}
      });

      expect(result.id).toBe('session-1');
      expect(result.accessCode).toBe('ABC123');
      expect(result.languagePreference).toBe('en');
    });

    it('should throw error if employee not found', async () => {
      const request: CreateOnboardingSessionRequest = {
        employeeId: 'invalid-employee'
      };

      employeeRepo.findById.mockResolvedValue(null);

      await expect(service.createSession(request, 'requester-1'))
        .rejects.toThrow('Employee not found');

      expect(employeeRepo.findById).toHaveBeenCalledWith('invalid-employee');
      expect(onboardingRepo.create).not.toHaveBeenCalled();
    });

    it('should throw error if active session already exists', async () => {
      const request: CreateOnboardingSessionRequest = {
        employeeId: 'employee-1'
      };

      employeeRepo.findById.mockResolvedValue(mockEmployee as any);
      onboardingRepo.findActiveByEmployeeId.mockResolvedValue(mockSession as any);

      await expect(service.createSession(request, 'requester-1'))
        .rejects.toThrow('An active onboarding session already exists for this employee');

      expect(onboardingRepo.create).not.toHaveBeenCalled();
    });

    it('should use default values for optional parameters', async () => {
      const request: CreateOnboardingSessionRequest = {
        employeeId: 'employee-1'
      };

      employeeRepo.findById.mockResolvedValue(mockEmployee as any);
      onboardingRepo.findActiveByEmployeeId.mockResolvedValue(null);
      onboardingRepo.accessCodeExists.mockResolvedValue(false);
      onboardingRepo.create.mockResolvedValue(mockSession as any);

      await service.createSession(request, 'requester-1');

      expect(onboardingRepo.create).toHaveBeenCalledWith({
        employeeId: 'employee-1',
        accessCode: expect.any(String),
        languagePreference: 'en', // default
        expiresAt: expect.any(Date), // should be 168 hours from now
        currentStep: 'language_selection', // default
        formData: {} // default
      });
    });
  });

  describe('validateAccessCode', () => {
    const mockSession = {
      id: 'session-1',
      employeeId: 'employee-1',
      accessCode: 'ABC123',
      languagePreference: 'en' as LanguageCode,
      status: 'in_progress' as OnboardingStatus,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      employee: {
        id: 'employee-1',
        employeeId: 'EMP001',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          organization: {
            id: 'org-1',
            name: 'Test Motel',
            type: 'motel'
          }
        }
      }
    };

    it('should validate valid access code successfully', async () => {
      onboardingRepo.findByAccessCode.mockResolvedValue(mockSession as any);

      const result = await service.validateAccessCode('ABC123');

      expect(onboardingRepo.findByAccessCode).toHaveBeenCalledWith('ABC123');
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.session).toEqual(mockSession);
      expect(result.error).toBeUndefined();
    });

    it('should return invalid for non-existent access code', async () => {
      onboardingRepo.findByAccessCode.mockResolvedValue(null);

      const result = await service.validateAccessCode('INVALID');

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.error).toBe('Invalid access code');
    });

    it('should return expired for expired session', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      };

      onboardingRepo.findByAccessCode.mockResolvedValue(expiredSession as any);
      onboardingRepo.update.mockResolvedValue(expiredSession as any);

      const result = await service.validateAccessCode('ABC123');

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.error).toBe('Access code has expired');
      expect(onboardingRepo.update).toHaveBeenCalledWith('session-1', { status: 'expired' });
    });

    it('should return invalid for non-active session', async () => {
      const completedSession = {
        ...mockSession,
        status: 'completed' as OnboardingStatus
      };

      onboardingRepo.findByAccessCode.mockResolvedValue(completedSession as any);

      const result = await service.validateAccessCode('ABC123');

      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.error).toBe('Onboarding session is not active');
    });
  });

  describe('updateProgress', () => {
    const mockSession = {
      id: 'session-1',
      employeeId: 'employee-1',
      accessCode: 'ABC123',
      languagePreference: 'en' as LanguageCode,
      currentStep: 'language_selection',
      formData: { step1: 'completed' },
      status: 'in_progress' as OnboardingStatus,
      expiresAt: new Date(Date.now() + 86400000), // 1 day from now
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      employee: {
        id: 'employee-1',
        employeeId: 'EMP001',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          organization: {
            id: 'org-1',
            name: 'Test Motel',
            type: 'motel'
          }
        }
      }
    };

    it('should update progress successfully', async () => {
      const updateRequest: UpdateOnboardingProgressRequest = {
        currentStep: 'document_upload',
        formData: { step2: 'in_progress' },
        languagePreference: 'es'
      };

      const updatedSession = {
        ...mockSession,
        currentStep: 'document_upload',
        formData: { step1: 'completed', step2: 'in_progress' },
        languagePreference: 'es' as LanguageCode
      };

      onboardingRepo.findById.mockResolvedValue(mockSession as any);
      onboardingRepo.update.mockResolvedValue(updatedSession as any);

      const result = await service.updateProgress('session-1', updateRequest);

      expect(onboardingRepo.findById).toHaveBeenCalledWith('session-1');
      expect(onboardingRepo.update).toHaveBeenCalledWith('session-1', {
        currentStep: 'document_upload',
        languagePreference: 'es',
        formData: { step1: 'completed', step2: 'in_progress' }
      });

      expect(result.currentStep).toBe('document_upload');
      expect(result.languagePreference).toBe('es');
    });

    it('should throw error if session not found', async () => {
      onboardingRepo.findById.mockResolvedValue(null);

      await expect(service.updateProgress('invalid-session', {}))
        .rejects.toThrow('Onboarding session not found');
    });

    it('should throw error if session is expired', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 86400000) // 1 day ago
      };

      onboardingRepo.findById.mockResolvedValue(expiredSession as any);

      await expect(service.updateProgress('session-1', {}))
        .rejects.toThrow('Onboarding session has expired');
    });

    it('should merge form data correctly', async () => {
      const updateRequest: UpdateOnboardingProgressRequest = {
        formData: { step2: 'new_data', step3: 'additional_data' }
      };

      onboardingRepo.findById.mockResolvedValue(mockSession as any);
      onboardingRepo.update.mockResolvedValue(mockSession as any);

      await service.updateProgress('session-1', updateRequest);

      expect(onboardingRepo.update).toHaveBeenCalledWith('session-1', {
        formData: {
          step1: 'completed', // existing data
          step2: 'new_data',   // new data
          step3: 'additional_data' // additional new data
        }
      });
    });
  });

  describe('completeSession', () => {
    const mockSession = {
      id: 'session-1',
      employeeId: 'employee-1',
      status: 'in_progress' as OnboardingStatus,
      employee: {
        id: 'employee-1',
        user: {
          id: 'user-1',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          organization: {
            id: 'org-1',
            name: 'Test Motel',
            type: 'motel'
          }
        }
      }
    };

    it('should complete session successfully', async () => {
      const completedSession = {
        ...mockSession,
        status: 'completed' as OnboardingStatus,
        completedAt: new Date(),
        currentStep: 'completed'
      };

      onboardingRepo.findById.mockResolvedValue(mockSession as any);
      onboardingRepo.update.mockResolvedValue(completedSession as any);

      const result = await service.completeSession('session-1');

      expect(onboardingRepo.update).toHaveBeenCalledWith('session-1', {
        status: 'completed',
        completedAt: expect.any(Date),
        currentStep: 'completed'
      });

      expect(result.status).toBe('completed');
    });

    it('should throw error if session not found', async () => {
      onboardingRepo.findById.mockResolvedValue(null);

      await expect(service.completeSession('invalid-session'))
        .rejects.toThrow('Onboarding session not found');
    });

    it('should throw error if session is not active', async () => {
      const completedSession = {
        ...mockSession,
        status: 'completed' as OnboardingStatus
      };

      onboardingRepo.findById.mockResolvedValue(completedSession as any);

      await expect(service.completeSession('session-1'))
        .rejects.toThrow('Onboarding session is not active');
    });
  });

  describe('generateUniqueAccessCode', () => {
    it('should generate unique access code', async () => {
      onboardingRepo.accessCodeExists
        .mockResolvedValueOnce(true)  // first code exists
        .mockResolvedValueOnce(false); // second code is unique

      // Access the private method for testing
      const generateUniqueAccessCode = (service as any).generateUniqueAccessCode.bind(service);
      const accessCode = await generateUniqueAccessCode();

      expect(typeof accessCode).toBe('string');
      expect(accessCode).toHaveLength(6);
      expect(onboardingRepo.accessCodeExists).toHaveBeenCalledTimes(2);
    });

    it('should throw error if unable to generate unique code after max attempts', async () => {
      onboardingRepo.accessCodeExists.mockResolvedValue(true); // always exists

      const generateUniqueAccessCode = (service as any).generateUniqueAccessCode.bind(service);

      await expect(generateUniqueAccessCode())
        .rejects.toThrow('Unable to generate unique access code');

      expect(onboardingRepo.accessCodeExists).toHaveBeenCalledTimes(10); // max attempts
    });
  });

  describe('generateAccessCode', () => {
    it('should generate 6-character alphanumeric code', () => {
      const generateAccessCode = (service as any).generateAccessCode.bind(service);
      const accessCode = generateAccessCode();

      expect(typeof accessCode).toBe('string');
      expect(accessCode).toHaveLength(6);
      expect(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/.test(accessCode)).toBe(true);
    });

    it('should not include confusing characters', () => {
      const generateAccessCode = (service as any).generateAccessCode.bind(service);
      
      // Generate multiple codes to test character exclusion
      for (let i = 0; i < 100; i++) {
        const accessCode = generateAccessCode();
        expect(accessCode).not.toMatch(/[01ILOS]/); // Should not contain confusing characters
      }
    });
  });
});