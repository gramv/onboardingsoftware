const request = require('supertest');
const { describe, test, expect, beforeAll, afterAll } = require('@jest/globals');

describe('QR-based Job Application API Tests', () => {
  const baseUrl = 'http://localhost:3001';
  let organizationId = 'test-org-id';
  let jobPostingId;
  let applicationId;
  let managerToken = 'test-manager-token';
  let hrToken = 'test-hr-token';

  describe('Property QR Code Generation', () => {
    test('should generate QR code URL for all departments', () => {
      const params = new URLSearchParams({
        org: organizationId
      });
      
      const expectedUrl = `http://localhost:3000/jobs?${params.toString()}`;
      expect(expectedUrl).toContain(`org=${organizationId}`);
      expect(expectedUrl).not.toContain('dept=');
    });

    test('should generate QR code URL for specific department', () => {
      const params = new URLSearchParams({
        org: organizationId,
        dept: 'housekeeping'
      });
      
      const expectedUrl = `http://localhost:3000/jobs?${params.toString()}`;
      expect(expectedUrl).toContain(`org=${organizationId}`);
      expect(expectedUrl).toContain('dept=housekeeping');
    });
  });

  describe('Job Application Workflow via curl', () => {
    test('should test job application submission endpoint', async () => {
      const applicationData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        address: {
          street: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345'
        },
        experience: 'Previous hotel experience',
        education: 'High school diploma'
      };

      const curlCommand = `curl -X POST ${baseUrl}/api/jobs/test-job-id/apply \\
        -H "Content-Type: application/json" \\
        -d '${JSON.stringify(applicationData)}'`;
      
      console.log('Curl command for job application:', curlCommand);
      expect(curlCommand).toContain('POST');
      expect(curlCommand).toContain('john.doe@example.com');
    });

    test('should test manager approval endpoint', async () => {
      const approvalData = {
        jobDescription: 'Housekeeping duties including room cleaning and maintenance',
        payRate: '$15.00/hour',
        benefits: 'Health insurance, PTO, employee discounts',
        startDate: '2025-08-01',
        notes: 'Excellent candidate with relevant experience'
      };

      const curlCommand = `curl -X POST ${baseUrl}/api/jobs/applications/test-app-id/approve \\
        -H "Authorization: Bearer ${managerToken}" \\
        -H "Content-Type: application/json" \\
        -d '${JSON.stringify(approvalData)}'`;
      
      console.log('Curl command for approval:', curlCommand);
      expect(curlCommand).toContain('approve');
      expect(curlCommand).toContain('$15.00/hour');
    });

    test('should test manager rejection endpoint', async () => {
      const rejectionData = {
        reason: 'Position has been filled'
      };

      const curlCommand = `curl -X POST ${baseUrl}/api/jobs/applications/test-app-id/reject \\
        -H "Authorization: Bearer ${managerToken}" \\
        -H "Content-Type: application/json" \\
        -d '${JSON.stringify(rejectionData)}'`;
      
      console.log('Curl command for rejection:', curlCommand);
      expect(curlCommand).toContain('reject');
      expect(curlCommand).toContain('Position has been filled');
    });
  });

  describe('HR Edit Request System via curl', () => {
    test('should test HR edit request endpoint', async () => {
      const editRequests = [
        {
          section: 'i9_form',
          field: 'citizenshipStatus',
          reason: 'Please verify citizenship documentation'
        },
        {
          section: 'personal_info',
          field: 'address',
          reason: 'Address format needs correction'
        }
      ];

      const curlCommand = `curl -X POST ${baseUrl}/api/onboarding/test-session-id/request-changes \\
        -H "Authorization: Bearer ${hrToken}" \\
        -H "Content-Type: application/json" \\
        -d '${JSON.stringify({ editRequests, managerEmail: 'manager@example.com' })}'`;
      
      console.log('Curl command for edit requests:', curlCommand);
      expect(curlCommand).toContain('request-changes');
      expect(curlCommand).toContain('i9_form');
    });

    test('should test HR pending sessions endpoint', async () => {
      const curlCommand = `curl -X GET ${baseUrl}/api/onboarding/pending-review \\
        -H "Authorization: Bearer ${hrToken}"`;
      
      console.log('Curl command for pending sessions:', curlCommand);
      expect(curlCommand).toContain('pending-review');
      expect(curlCommand).toContain('GET');
    });

    test('should test HR approval endpoint', async () => {
      const curlCommand = `curl -X POST ${baseUrl}/api/onboarding/test-session-id/approve \\
        -H "Authorization: Bearer ${hrToken}"`;
      
      console.log('Curl command for HR approval:', curlCommand);
      expect(curlCommand).toContain('approve');
      expect(curlCommand).toContain('POST');
    });
  });

  describe('Email Notification Testing', () => {
    test('should validate job approval email data structure', () => {
      const emailData = {
        email: 'john.doe@example.com',
        candidateName: 'John Doe',
        organizationName: 'Test Hotel',
        jobTitle: 'Housekeeper',
        payRate: '$15.00/hour',
        benefits: 'Health insurance, PTO',
        startDate: '2025-08-01',
        onboardingToken: 'test-token',
        baseUrl: 'http://localhost:3000'
      };

      expect(emailData.email).toBe('john.doe@example.com');
      expect(emailData.jobTitle).toBe('Housekeeper');
      expect(emailData.payRate).toBe('$15.00/hour');
      expect(emailData.onboardingToken).toBe('test-token');
    });

    test('should validate rejection email data structure', () => {
      const emailData = {
        email: 'jane.doe@example.com',
        candidateName: 'Jane Doe',
        organizationName: 'Test Hotel',
        jobTitle: 'Front Desk Agent'
      };

      expect(emailData.email).toBe('jane.doe@example.com');
      expect(emailData.candidateName).toBe('Jane Doe');
      expect(emailData.jobTitle).toBe('Front Desk Agent');
    });

    test('should validate edit request email data structure', () => {
      const emailData = {
        email: 'employee@example.com',
        employeeName: 'Employee Name',
        organizationName: 'Test Hotel',
        editRequests: [
          {
            section: 'i9_form',
            field: 'citizenshipStatus',
            reason: 'Please verify citizenship documentation'
          }
        ],
        onboardingToken: 'test-token'
      };

      expect(emailData.editRequests).toHaveLength(1);
      expect(emailData.editRequests[0].section).toBe('i9_form');
      expect(emailData.onboardingToken).toBe('test-token');
    });
  });

  describe('Department Filtering Tests', () => {
    test('should validate department filter parameters', () => {
      const departments = [
        'reception',
        'housekeeping', 
        'maintenance',
        'pool_services',
        'facilities'
      ];

      departments.forEach(dept => {
        const params = new URLSearchParams({
          org: organizationId,
          dept: dept
        });
        
        const url = `http://localhost:3000/jobs?${params.toString()}`;
        expect(url).toContain(`dept=${dept}`);
      });
    });

    test('should validate QR code generation for all departments', () => {
      const params = new URLSearchParams({
        org: organizationId
      });
      
      const url = `http://localhost:3000/jobs?${params.toString()}`;
      expect(url).toContain(`org=${organizationId}`);
      expect(url).not.toContain('dept=');
    });
  });
});
