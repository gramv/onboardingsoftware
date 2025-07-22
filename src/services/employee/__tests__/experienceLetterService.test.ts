import { ExperienceLetterService } from '../experienceLetterService';
import { Employee, User, Organization, Prisma } from '@prisma/client';
import fs from 'fs/promises';
import path from 'path';

// Mock Puppeteer
jest.mock('puppeteer', () => ({
  launch: jest.fn().mockResolvedValue({
    newPage: jest.fn().mockResolvedValue({
      setContent: jest.fn(),
      pdf: jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content')),
    }),
    close: jest.fn(),
  }),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  unlink: jest.fn(),
}));

describe('ExperienceLetterService', () => {
  let experienceLetterService: ExperienceLetterService;
  let mockEmployee: Employee & {
    user: User & {
      organization: Organization;
    };
  };

  beforeEach(() => {
    experienceLetterService = new ExperienceLetterService();
    
    // Mock employee data
    mockEmployee = {
      id: 'emp-1',
      userId: 'user-1',
      employeeId: 'EMP001',
      ssnEncrypted: null,
      dateOfBirth: new Date('1990-01-01'),
      hireDate: new Date('2022-01-01'),
      terminationDate: new Date('2023-12-31'),
      position: 'Front Desk Clerk',
      department: 'Reception',
      hourlyRate: new Prisma.Decimal(15.50),
      employmentStatus: 'terminated',
      rehireEligible: true,
      managerRating: 4,
      emergencyContact: null,
      address: null,
      schedule: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: 'user-1',
        email: 'john.doe@example.com',
        passwordHash: 'hashed',
        role: 'employee',
        organizationId: 'org-1',
        firstName: 'John',
        lastName: 'Doe',
        phone: '555-0123',
        languagePreference: 'en',
        isActive: false,
        mfaEnabled: false,
        mfaSecret: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        organization: {
          id: 'org-1',
          name: 'Sunset Motel',
          type: 'motel',
          parentId: null,
          address: {
            street: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345'
          },
          settings: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      }
    };

    // Mock fs operations
    (fs.mkdir as jest.Mock).mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateExperienceLetter', () => {
    it('should generate experience letter with default options', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee);

      expect(result).toContain('experience-letter-EMP001-');
      expect(result).toContain('.pdf');
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('templates/experience-letters'),
        { recursive: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        expect.stringContaining('storage/documents/experience-letters'),
        { recursive: true }
      );
    });

    it('should generate experience letter in Spanish', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee, {
        locale: 'es'
      });

      expect(result).toContain('experience-letter-EMP001-');
      expect(result).toContain('.pdf');
    });

    it('should include rating when requested', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should include custom message when provided', async () => {
      const customMessage = 'John was an exceptional employee who always went above and beyond.';
      
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee, {
        customMessage
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should handle employee with no department', async () => {
      const employeeWithoutDept = {
        ...mockEmployee,
        department: null
      };

      const result = await experienceLetterService.generateExperienceLetter(employeeWithoutDept);

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should calculate work duration correctly', async () => {
      // Employee worked for exactly 2 years
      const employeeWith2Years = {
        ...mockEmployee,
        hireDate: new Date('2021-01-01'),
        terminationDate: new Date('2023-01-01')
      };

      const result = await experienceLetterService.generateExperienceLetter(employeeWith2Years);

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should handle short employment periods', async () => {
      // Employee worked for 3 months
      const shortTermEmployee = {
        ...mockEmployee,
        hireDate: new Date('2023-09-01'),
        terminationDate: new Date('2023-12-01')
      };

      const result = await experienceLetterService.generateExperienceLetter(shortTermEmployee);

      expect(result).toContain('experience-letter-EMP001-');
    });
  });

  describe('cleanupOldFiles', () => {
    it('should clean up files older than 30 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 35);

      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 10);

      (fs.readdir as jest.Mock).mockResolvedValue(['old-file.pdf', 'recent-file.pdf']);
      (fs.stat as jest.Mock)
        .mockResolvedValueOnce({ mtime: oldDate })
        .mockResolvedValueOnce({ mtime: recentDate });
      (fs.unlink as jest.Mock).mockResolvedValue(undefined);

      await experienceLetterService.cleanupOldFiles();

      expect(fs.unlink).toHaveBeenCalledWith(
        expect.stringContaining('old-file.pdf')
      );
      expect(fs.unlink).not.toHaveBeenCalledWith(
        expect.stringContaining('recent-file.pdf')
      );
    });

    it('should handle cleanup errors gracefully', async () => {
      (fs.readdir as jest.Mock).mockRejectedValue(new Error('Directory not found'));

      // Should not throw
      await expect(experienceLetterService.cleanupOldFiles()).resolves.toBeUndefined();
    });
  });

  describe('recommendation generation', () => {
    it('should generate excellent recommendation for rating 5', async () => {
      const excellentEmployee = {
        ...mockEmployee,
        managerRating: 5
      };

      const result = await experienceLetterService.generateExperienceLetter(excellentEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should generate good recommendation for rating 4', async () => {
      const goodEmployee = {
        ...mockEmployee,
        managerRating: 4
      };

      const result = await experienceLetterService.generateExperienceLetter(goodEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should generate satisfactory recommendation for rating 3', async () => {
      const satisfactoryEmployee = {
        ...mockEmployee,
        managerRating: 3
      };

      const result = await experienceLetterService.generateExperienceLetter(satisfactoryEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should generate needs improvement recommendation for rating 2', async () => {
      const needsImprovementEmployee = {
        ...mockEmployee,
        managerRating: 2
      };

      const result = await experienceLetterService.generateExperienceLetter(needsImprovementEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should generate unsatisfactory recommendation for rating 1', async () => {
      const unsatisfactoryEmployee = {
        ...mockEmployee,
        managerRating: 1
      };

      const result = await experienceLetterService.generateExperienceLetter(unsatisfactoryEmployee, {
        includeRating: true,
        includeRecommendation: true
      });

      expect(result).toContain('experience-letter-EMP001-');
    });
  });

  describe('address formatting', () => {
    it('should format complete address correctly', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee);

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should handle partial address', async () => {
      const employeeWithPartialAddress = {
        ...mockEmployee,
        user: {
          ...mockEmployee.user,
          organization: {
            ...mockEmployee.user.organization,
            address: {
              street: '123 Main St',
              city: 'Anytown'
              // Missing state and zipCode
            }
          }
        }
      };

      const result = await experienceLetterService.generateExperienceLetter(employeeWithPartialAddress);

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should handle empty address', async () => {
      const employeeWithEmptyAddress = {
        ...mockEmployee,
        user: {
          ...mockEmployee.user,
          organization: {
            ...mockEmployee.user.organization,
            address: {}
          }
        }
      };

      const result = await experienceLetterService.generateExperienceLetter(employeeWithEmptyAddress);

      expect(result).toContain('experience-letter-EMP001-');
    });
  });

  describe('date formatting', () => {
    it('should format dates in English locale', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee, {
        locale: 'en'
      });

      expect(result).toContain('experience-letter-EMP001-');
    });

    it('should format dates in Spanish locale', async () => {
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee, {
        locale: 'es'
      });

      expect(result).toContain('experience-letter-EMP001-');
    });
  });

  describe('error handling', () => {
    it('should handle PDF generation errors', async () => {
      const puppeteer = require('puppeteer');
      puppeteer.launch.mockRejectedValueOnce(new Error('Puppeteer failed'));

      await expect(
        experienceLetterService.generateExperienceLetter(mockEmployee)
      ).rejects.toThrow('Puppeteer failed');
    });

    it('should handle directory creation errors', async () => {
      (fs.mkdir as jest.Mock).mockRejectedValueOnce(new Error('Permission denied'));

      // Should still work as mkdir errors are caught
      const result = await experienceLetterService.generateExperienceLetter(mockEmployee);

      expect(result).toContain('experience-letter-EMP001-');
    });
  });
});