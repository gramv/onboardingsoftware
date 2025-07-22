import { prisma } from '../utils/database';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { DocumentType, FormStatus, FormType, OnboardingStatus } from '@prisma/client';

/**
 * Enhanced seed script for demo purposes
 * This script creates a comprehensive set of data for demonstrating all features
 * implemented in tasks 1-14 of the motel employee management system
 */
async function main() {
  console.log('🚀 Starting enhanced demo database seed...');

  // Create organizations
  const corporateOrg = await createCorporateOrganization();
  const [motel1, motel2, motel3] = await createMotelLocations(corporateOrg.id);

  // Create users with different roles
  const hashedPassword = await bcrypt.hash('demo123', 12);
  const hrAdmin = await createHRAdmin(corporateOrg.id, hashedPassword);
  const managers = await createManagers([motel1, motel2, motel3], hashedPassword);
  const employees = await createEmployees([motel1, motel2, motel3], hashedPassword);
  
  // Create documents for employees
  await createDocuments(employees);
  
  // Create onboarding sessions
  await createOnboardingSessions(employees);
  
  // Create form submissions
  await createFormSubmissions(employees, managers[0]);
  
  // Create schedule entries
  await createScheduleEntries(employees, managers);
  
  // Create messages and announcements
  await createMessages(hrAdmin, managers, employees);
  await createAnnouncements(hrAdmin, [motel1, motel2, motel3]);

  console.log('✅ Demo database seeded successfully!');
  printDemoCredentials(hrAdmin, managers, employees);
}

/**
 * Create corporate organization
 */
async function createCorporateOrganization() {
  return prisma.organization.upsert({
    where: { name: 'Motel Chain Corporate' },
    update: {},
    create: {
      name: 'Motel Chain Corporate',
      type: 'corporate',
      address: {
        street: '123 Corporate Blvd',
        city: 'Business City',
        state: 'CA',
        zipCode: '90210',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        currency: 'USD',
        companyLogo: 'https://placehold.co/400x100?text=Motel+Chain',
        primaryColor: '#0047AB',
        secondaryColor: '#FFD700',
        employeeHandbookVersion: '2.3',
        policyVersions: {
          privacyPolicy: '1.2',
          codeOfConduct: '1.5',
          safetyGuidelines: '2.0'
        }
      }
    }
  });
}

/**
 * Create motel locations
 */
async function createMotelLocations(corporateId: string) {
  const motel1 = await prisma.organization.upsert({
    where: { name: 'Downtown Motel' },
    update: {},
    create: {
      name: 'Downtown Motel',
      type: 'motel',
      parentId: corporateId,
      address: {
        street: '456 Main St',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90211',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        maxEmployees: 25,
        roomCount: 45,
        amenities: ['Pool', 'Gym', 'Business Center'],
        yearBuilt: 2010,
        lastRenovation: 2020,
        averageOccupancy: 78
      }
    }
  });

  const motel2 = await prisma.organization.upsert({
    where: { name: 'Airport Motel' },
    update: {},
    create: {
      name: 'Airport Motel',
      type: 'motel',
      parentId: corporateId,
      address: {
        street: '789 Airport Way',
        city: 'Airport City',
        state: 'CA',
        zipCode: '90212',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        maxEmployees: 30,
        roomCount: 60,
        amenities: ['Free Shuttle', 'Restaurant', '24-Hour Front Desk'],
        yearBuilt: 2015,
        lastRenovation: 2022,
        averageOccupancy: 85
      }
    }
  });

  const motel3 = await prisma.organization.upsert({
    where: { name: 'Beachside Motel' },
    update: {},
    create: {
      name: 'Beachside Motel',
      type: 'motel',
      parentId: corporateId,
      address: {
        street: '123 Ocean Drive',
        city: 'Seaside',
        state: 'CA',
        zipCode: '90213',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        maxEmployees: 20,
        roomCount: 35,
        amenities: ['Beach Access', 'Ocean View', 'Surfboard Rental'],
        yearBuilt: 2008,
        lastRenovation: 2019,
        averageOccupancy: 92
      }
    }
  });

  return [motel1, motel2, motel3];
}

/**
 * Create HR admin user
 */
async function createHRAdmin(corporateId: string, hashedPassword: string) {
  return prisma.user.upsert({
    where: { email: 'hr@motelchain.com' },
    update: {},
    create: {
      email: 'hr@motelchain.com',
      passwordHash: hashedPassword,
      role: 'hr_admin',
      organizationId: corporateId,
      firstName: 'Emily',
      lastName: 'Rodriguez',
      phone: '+1-555-0100',
      languagePreference: 'en',
      isActive: true,
      mfaEnabled: true,
      mfaSecret: 'DEMO_MFA_SECRET_HR'
    }
  });
}

/**
 * Create manager users
 */
async function createManagers(motels: any[], hashedPassword: string) {
  const managers = [];
  
  // Manager for motel 1
  const manager1 = await prisma.user.upsert({
    where: { email: 'manager1@motelchain.com' },
    update: {},
    create: {
      email: 'manager1@motelchain.com',
      passwordHash: hashedPassword,
      role: 'manager',
      organizationId: motels[0].id,
      firstName: 'John',
      lastName: 'Manager',
      phone: '+1-555-0101',
      languagePreference: 'en',
      isActive: true
    }
  });
  managers.push(manager1);
  
  // Manager for motel 2
  const manager2 = await prisma.user.upsert({
    where: { email: 'manager2@motelchain.com' },
    update: {},
    create: {
      email: 'manager2@motelchain.com',
      passwordHash: hashedPassword,
      role: 'manager',
      organizationId: motels[1].id,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      phone: '+1-555-0102',
      languagePreference: 'es',
      isActive: true
    }
  });
  managers.push(manager2);
  
  // Manager for motel 3
  const manager3 = await prisma.user.upsert({
    where: { email: 'manager3@motelchain.com' },
    update: {},
    create: {
      email: 'manager3@motelchain.com',
      passwordHash: hashedPassword,
      role: 'manager',
      organizationId: motels[2].id,
      firstName: 'Robert',
      lastName: 'Chen',
      phone: '+1-555-0103',
      languagePreference: 'en',
      isActive: true
    }
  });
  managers.push(manager3);
  
  return managers;
}

/**
 * Create employee users
 */
async function createEmployees(motels: any[], hashedPassword: string) {
  const employees = [];
  
  // Create employees for motel 1
  const employee1User = await prisma.user.upsert({
    where: { email: 'alice@motelchain.com' },
    update: {},
    create: {
      email: 'alice@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[0].id,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1-555-0201',
      languagePreference: 'en',
      isActive: true
    }
  });
  
  const employee1 = await prisma.employee.upsert({
    where: { employeeId: 'EMP001' },
    update: {},
    create: {
      userId: employee1User.id,
      employeeId: 'EMP001',
      hireDate: new Date('2024-01-15'),
      position: 'Front Desk Clerk',
      department: 'Reception',
      hourlyRate: 18.50,
      employmentStatus: 'active',
      emergencyContact: {
        name: 'Bob Johnson',
        relationship: 'Spouse',
        phone: '+1-555-0301'
      },
      address: {
        street: '123 Employee St',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90211',
        country: 'USA'
      },
      schedule: {
        monday: { startTime: '09:00', endTime: '17:00', breakDuration: 30, isWorkDay: true },
        tuesday: { startTime: '09:00', endTime: '17:00', breakDuration: 30, isWorkDay: true },
        wednesday: { startTime: '09:00', endTime: '17:00', breakDuration: 30, isWorkDay: true },
        thursday: { startTime: '09:00', endTime: '17:00', breakDuration: 30, isWorkDay: true },
        friday: { startTime: '09:00', endTime: '17:00', breakDuration: 30, isWorkDay: true },
        saturday: { isWorkDay: false },
        sunday: { isWorkDay: false }
      }
    }
  });
  (employee1 as any).user = employee1User;
  employees.push(employee1);
  
  // Spanish-speaking employee at motel 2
  const employee2User = await prisma.user.upsert({
    where: { email: 'carlos@motelchain.com' },
    update: {},
    create: {
      email: 'carlos@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[1].id,
      firstName: 'Carlos',
      lastName: 'Martinez',
      phone: '+1-555-0202',
      languagePreference: 'es',
      isActive: true
    }
  });
  
  const employee2 = await prisma.employee.upsert({
    where: { employeeId: 'EMP002' },
    update: {},
    create: {
      userId: employee2User.id,
      employeeId: 'EMP002',
      hireDate: new Date('2024-02-01'),
      position: 'Housekeeper',
      department: 'Housekeeping',
      hourlyRate: 16.00,
      employmentStatus: 'active',
      emergencyContact: {
        name: 'Ana Martinez',
        relationship: 'Sister',
        phone: '+1-555-0302'
      },
      address: {
        street: '456 Worker Ave',
        city: 'Airport City',
        state: 'CA',
        zipCode: '90212',
        country: 'USA'
      },
      schedule: {
        monday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        tuesday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        wednesday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        thursday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        friday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        saturday: { startTime: '08:00', endTime: '12:00', breakDuration: 0, isWorkDay: true },
        sunday: { isWorkDay: false }
      }
    }
  });
  (employee2 as any).user = employee2User;
  employees.push(employee2);
  
  // Part-time employee for motel 1
  const employee3User = await prisma.user.upsert({
    where: { email: 'sarah@motelchain.com' },
    update: {},
    create: {
      email: 'sarah@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[0].id,
      firstName: 'Sarah',
      lastName: 'Wilson',
      phone: '+1-555-0203',
      languagePreference: 'en',
      isActive: true
    }
  });
  
  const employee3 = await prisma.employee.upsert({
    where: { employeeId: 'EMP003' },
    update: {},
    create: {
      userId: employee3User.id,
      employeeId: 'EMP003',
      hireDate: new Date('2024-03-01'),
      position: 'Night Auditor',
      department: 'Reception',
      hourlyRate: 19.00,
      employmentStatus: 'active',
      emergencyContact: {
        name: 'Tom Wilson',
        relationship: 'Father',
        phone: '+1-555-0303'
      },
      address: {
        street: '789 Night St',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90211',
        country: 'USA'
      },
      schedule: {
        monday: { isWorkDay: false },
        tuesday: { isWorkDay: false },
        wednesday: { startTime: '23:00', endTime: '07:00', breakDuration: 60, isWorkDay: true },
        thursday: { startTime: '23:00', endTime: '07:00', breakDuration: 60, isWorkDay: true },
        friday: { startTime: '23:00', endTime: '07:00', breakDuration: 60, isWorkDay: true },
        saturday: { startTime: '23:00', endTime: '07:00', breakDuration: 60, isWorkDay: true },
        sunday: { isWorkDay: false }
      }
    }
  });
  (employee3 as any).user = employee3User;
  employees.push(employee3);
  
  // Terminated employee for alumni testing
  const employee4User = await prisma.user.upsert({
    where: { email: 'david@motelchain.com' },
    update: {},
    create: {
      email: 'david@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[1].id,
      firstName: 'David',
      lastName: 'Brown',
      phone: '+1-555-0204',
      languagePreference: 'en',
      isActive: false
    }
  });
  
  const employee4 = await prisma.employee.upsert({
    where: { employeeId: 'EMP004' },
    update: {},
    create: {
      userId: employee4User.id,
      employeeId: 'EMP004',
      hireDate: new Date('2023-06-01'),
      terminationDate: new Date('2024-01-15'),
      position: 'Maintenance',
      department: 'Facilities',
      hourlyRate: 20.00,
      employmentStatus: 'terminated',
      rehireEligible: true,
      managerRating: 4,
      emergencyContact: {
        name: 'Linda Brown',
        relationship: 'Wife',
        phone: '+1-555-0304'
      },
      address: {
        street: '321 Former Ln',
        city: 'Airport City',
        state: 'CA',
        zipCode: '90212',
        country: 'USA'
      }
    }
  });
  (employee4 as any).user = employee4User;
  employees.push(employee4);
  
  // New employee in onboarding process for motel 3
  const employee5User = await prisma.user.upsert({
    where: { email: 'michael@motelchain.com' },
    update: {},
    create: {
      email: 'michael@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[2].id,
      firstName: 'Michael',
      lastName: 'Lee',
      phone: '+1-555-0205',
      languagePreference: 'en',
      isActive: true
    }
  });
  
  const employee5 = await prisma.employee.upsert({
    where: { employeeId: 'EMP005' },
    update: {},
    create: {
      userId: employee5User.id,
      employeeId: 'EMP005',
      hireDate: new Date('2024-07-01'), // Future date for onboarding demo
      position: 'Lifeguard',
      department: 'Pool Services',
      hourlyRate: 17.50,
      employmentStatus: 'active',
      emergencyContact: {
        name: 'Jennifer Lee',
        relationship: 'Mother',
        phone: '+1-555-0305'
      },
      address: {
        street: '567 Beach Rd',
        city: 'Seaside',
        state: 'CA',
        zipCode: '90213',
        country: 'USA'
      }
    }
  });
  (employee5 as any).user = employee5User;
  employees.push(employee5);
  
  // Employee on leave for motel 3
  const employee6User = await prisma.user.upsert({
    where: { email: 'jessica@motelchain.com' },
    update: {},
    create: {
      email: 'jessica@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motels[2].id,
      firstName: 'Jessica',
      lastName: 'Taylor',
      phone: '+1-555-0206',
      languagePreference: 'en',
      isActive: true
    }
  });
  
  const employee6 = await prisma.employee.upsert({
    where: { employeeId: 'EMP006' },
    update: {},
    create: {
      userId: employee6User.id,
      employeeId: 'EMP006',
      hireDate: new Date('2023-09-15'),
      position: 'Front Desk Supervisor',
      department: 'Reception',
      hourlyRate: 22.00,
      employmentStatus: 'on_leave',
      emergencyContact: {
        name: 'Mark Taylor',
        relationship: 'Husband',
        phone: '+1-555-0306'
      },
      address: {
        street: '789 Coastal Hwy',
        city: 'Seaside',
        state: 'CA',
        zipCode: '90213',
        country: 'USA'
      },
      schedule: {
        monday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        tuesday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        wednesday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        thursday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        friday: { startTime: '08:00', endTime: '16:00', breakDuration: 30, isWorkDay: true },
        saturday: { isWorkDay: false },
        sunday: { isWorkDay: false }
      }
    }
  });
  (employee6 as any).user = employee6User;
  employees.push(employee6);
  
  return employees;
}

/**
 * Create documents for employees
 */
async function createDocuments(employees: any[]) {
  // Create storage directories if they don't exist
  const storageDir = path.join(process.cwd(), 'storage', 'documents');
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }
  
  const documentTypes = ['drivers_license', 'ssn', 'i9', 'w4', 'handbook', 'policy'];
  for (const dir of documentTypes) {
    const typeDir = path.join(storageDir, dir);
    if (!fs.existsSync(typeDir)) {
      fs.mkdirSync(typeDir, { recursive: true });
    }
  }
  
  // Create documents for each employee
  for (const employee of employees) {
    // Skip the employee in onboarding process
    if (employee.employeeId === 'EMP005') continue;
    
    // Driver's license
    await prisma.document.create({
      data: {
        employeeId: employee.id,
        documentType: 'drivers_license' as DocumentType,
        documentName: `${employee.employeeId}_drivers_license.jpg`,
        filePath: path.join(storageDir, 'drivers_license', `${employee.employeeId}_dl.jpg`),
        fileSize: 250000,
        mimeType: 'image/jpeg',
        isSigned: false,
        version: 1,
        ocrData: employee.employeeId === 'EMP001' ? {
          extractedData: {
            fullName: 'Alice Johnson',
            licenseNumber: 'D12345678',
            dateOfBirth: '05/15/1990',
            expirationDate: '05/15/2028',
            address: '123 Employee St, Downtown, CA 90211'
          },
          confidence: 85.5,
          fieldConfidences: {
            fullName: 90,
            licenseNumber: 85,
            dateOfBirth: 80,
            expirationDate: 75,
            address: 70
          },
          rawText: 'NAME: ALICE JOHNSON\nLICENSE: D12345678\nDOB: 05/15/1990\nEXP: 05/15/2028\nADDRESS: 123 Employee St, Downtown, CA 90211',
          processingStatus: 'completed'
        } : undefined
      }
    });
    
    // SSN card
    await prisma.document.create({
      data: {
        employeeId: employee.id,
        documentType: 'ssn' as DocumentType,
        documentName: `${employee.employeeId}_ssn.jpg`,
        filePath: path.join(storageDir, 'ssn', `${employee.employeeId}_ssn.jpg`),
        fileSize: 150000,
        mimeType: 'image/jpeg',
        isSigned: false,
        version: 1,
        ocrData: employee.employeeId === 'EMP001' ? {
          extractedData: {
            ssnNumber: '123456789',
            fullName: 'Alice Johnson'
          },
          confidence: 82.0,
          fieldConfidences: {
            ssnNumber: 85,
            fullName: 79
          },
          rawText: 'SOCIAL SECURITY\n123-45-6789\nALICE JOHNSON',
          processingStatus: 'completed'
        } : undefined
      }
    });
    
    // I-9 form
    await prisma.document.create({
      data: {
        employeeId: employee.id,
        documentType: 'i9' as DocumentType,
        documentName: `${employee.employeeId}_i9.pdf`,
        filePath: path.join(storageDir, 'i9', `${employee.employeeId}_i9.pdf`),
        fileSize: 350000,
        mimeType: 'application/pdf',
        isSigned: true,
        signedAt: new Date(employee.hireDate),
        signatureData: JSON.stringify({
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8xNS8yMqTBFRIAAA==',
          timestamp: new Date(employee.hireDate).toISOString(),
          ip: '192.168.1.100'
        }),
        version: 1
      }
    });
    
    // W-4 form
    await prisma.document.create({
      data: {
        employeeId: employee.id,
        documentType: 'w4' as DocumentType,
        documentName: `${employee.employeeId}_w4.pdf`,
        filePath: path.join(storageDir, 'w4', `${employee.employeeId}_w4.pdf`),
        fileSize: 320000,
        mimeType: 'application/pdf',
        isSigned: true,
        signedAt: new Date(employee.hireDate),
        signatureData: JSON.stringify({
          signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAADICAYAAABS39xVAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABh0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzT7MfTgAAABZ0RVh0Q3JlYXRpb24gVGltZQAwNi8xNS8yMqTBFRIAAA==',
          timestamp: new Date(employee.hireDate).toISOString(),
          ip: '192.168.1.100'
        }),
        version: 1
      }
    });
  }
}

/**
 * Create onboarding sessions
 */
async function createOnboardingSessions(employees: any[]) {
  // Create onboarding session for the new employee
  const newEmployee = employees.find(e => e.employeeId === 'EMP005');
  if (newEmployee) {
    await prisma.onboardingSession.create({
      data: {
        employeeId: newEmployee.id,
        accessCode: 'NEW001',
        languagePreference: 'en',
        currentStep: 'document-upload',
        formData: {
          personalInfo: {
            firstName: 'Michael',
            lastName: 'Lee',
            email: 'michael@motelchain.com',
            phone: '+1-555-0205',
            address: {
              street: '567 Beach Rd',
              city: 'Seaside',
              state: 'CA',
              zipCode: '90213',
              country: 'USA'
            }
          },
          employmentInfo: {
            position: 'Lifeguard',
            department: 'Pool Services',
            startDate: '2024-07-01'
          },
          completedSteps: ['personal-info', 'employment-info']
        },
        status: 'in_progress' as OnboardingStatus,
        expiresAt: new Date('2024-07-15'),
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
      }
    });
    
    // Create a completed onboarding session for an existing employee
    const existingEmployee = employees.find(e => e.employeeId === 'EMP001');
    if (existingEmployee) {
      await prisma.onboardingSession.create({
        data: {
          employeeId: existingEmployee.id,
          accessCode: 'DONE001',
          languagePreference: 'en',
          currentStep: 'completed',
          formData: {
            personalInfo: {
              firstName: 'Alice',
              lastName: 'Johnson',
              email: 'alice@motelchain.com',
              phone: '+1-555-0201',
              address: {
                street: '123 Employee St',
                city: 'Downtown',
                state: 'CA',
                zipCode: '90211',
                country: 'USA'
              }
            },
            employmentInfo: {
              position: 'Front Desk Clerk',
              department: 'Reception',
              startDate: '2024-01-15'
            },
            completedSteps: ['personal-info', 'employment-info', 'document-upload', 'form-completion', 'review', 'submission']
          },
          status: 'completed' as OnboardingStatus,
          expiresAt: new Date('2024-01-30'),
          completedAt: new Date('2024-01-14'),
          createdAt: new Date('2024-01-10'),
          updatedAt: new Date('2024-01-14')
        }
      });
    }
  }
}

/**
 * Create form submissions
 */
async function createFormSubmissions(employees: any[], manager: any) {
  // Create form submissions for each employee
  for (const employee of employees) {
    // Skip the employee in onboarding process and terminated employee
    if (employee.employeeId === 'EMP005' || employee.employeeId === 'EMP004') continue;
    
    // I-9 form submission
    await prisma.formSubmission.create({
      data: {
        formId: `i9-${employee.id}`,
        employeeId: employee.id,
        formType: 'i9' as FormType,
        language: employee.employeeId === 'EMP002' ? 'es' : 'en',
        data: {
          personalInfo: {
            firstName: employee.employeeId === 'EMP001' ? 'Alice' : 
                      employee.employeeId === 'EMP002' ? 'Carlos' : 
                      employee.employeeId === 'EMP003' ? 'Sarah' : 'Jessica',
            lastName: employee.employeeId === 'EMP001' ? 'Johnson' : 
                     employee.employeeId === 'EMP002' ? 'Martinez' : 
                     employee.employeeId === 'EMP003' ? 'Wilson' : 'Taylor',
            address: employee.address,
            dateOfBirth: employee.employeeId === 'EMP001' ? '1990-05-15' : 
                        employee.employeeId === 'EMP002' ? '1988-07-22' : 
                        employee.employeeId === 'EMP003' ? '1992-03-10' : '1985-11-28',
            ssn: '123-45-6789',
            citizenship: 'U.S. Citizen'
          },
          employerInfo: {
            businessName: 'Motel Chain Inc.',
            employerAddress: {
              street: '123 Corporate Blvd',
              city: 'Business City',
              state: 'CA',
              zipCode: '90210'
            },
            employerId: '12-3456789'
          },
          documentVerification: {
            listA: {
              documentTitle: 'U.S. Passport',
              issuingAuthority: 'U.S. Department of State',
              documentNumber: 'P12345678',
              expirationDate: '2030-01-01'
            }
          }
        },
        status: 'approved' as FormStatus,
        version: '1.0',
        submittedAt: new Date(employee.hireDate),
        reviewedAt: new Date(new Date(employee.hireDate).getTime() + 24 * 60 * 60 * 1000),
        reviewedBy: manager.id,
        pdfPath: path.join('storage', 'forms', `${employee.employeeId}_i9.pdf`)
      }
    });
    
    // W-4 form submission
    await prisma.formSubmission.create({
      data: {
        formId: `w4-${employee.id}`,
        employeeId: employee.id,
        formType: 'w4' as FormType,
        language: employee.employeeId === 'EMP002' ? 'es' : 'en',
        data: {
          personalInfo: {
            firstName: employee.employeeId === 'EMP001' ? 'Alice' : 
                      employee.employeeId === 'EMP002' ? 'Carlos' : 
                      employee.employeeId === 'EMP003' ? 'Sarah' : 'Jessica',
            lastName: employee.employeeId === 'EMP001' ? 'Johnson' : 
                     employee.employeeId === 'EMP002' ? 'Martinez' : 
                     employee.employeeId === 'EMP003' ? 'Wilson' : 'Taylor',
            address: employee.address,
            ssn: '123-45-6789'
          },
          taxInfo: {
            filingStatus: 'Single',
            multipleJobs: false,
            dependents: 0,
            otherIncome: 0,
            deductions: 0,
            extraWithholding: 0
          }
        },
        status: 'approved' as FormStatus,
        version: '1.0',
        submittedAt: new Date(employee.hireDate),
        reviewedAt: new Date(new Date(employee.hireDate).getTime() + 24 * 60 * 60 * 1000),
        reviewedBy: manager.id,
        pdfPath: path.join('storage', 'forms', `${employee.employeeId}_w4.pdf`)
      }
    });
    
    // Handbook acknowledgment
    await prisma.formSubmission.create({
      data: {
        formId: `handbook-${employee.id}`,
        employeeId: employee.id,
        formType: 'handbook_acknowledgment' as FormType,
        language: employee.employeeId === 'EMP002' ? 'es' : 'en',
        data: {
          acknowledgment: true,
          version: '2.3',
          readTime: 1200, // seconds
          viewedPages: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        },
        status: 'approved' as FormStatus,
        version: '1.0',
        submittedAt: new Date(employee.hireDate),
        reviewedAt: new Date(new Date(employee.hireDate).getTime() + 24 * 60 * 60 * 1000),
        reviewedBy: manager.id
      }
    });
  }
}

/**
 * Create schedule entries
 */
async function createScheduleEntries(employees: any[], managers: any[]) {
  // Get current date
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();
  
  // Create schedule entries for each employee
  for (const employee of employees) {
    // Skip the employee in onboarding process
    if (employee.employeeId === 'EMP005') continue;
    
    // Get the manager for this employee's organization
    const manager = managers.find(m => m.organizationId === employee.user.organizationId);
    if (!manager) continue;
    
    // Create schedule entries for the next 14 days
    for (let i = 0; i < 14; i++) {
      const date = new Date(currentYear, currentMonth, currentDay + i);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      // Skip if not a work day according to employee's schedule
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek];
      const scheduleDay = employee.schedule?.[dayName];
      if (!scheduleDay || !scheduleDay.isWorkDay) continue;
      
      // Create schedule entry
      await prisma.scheduleEntry.upsert({
        where: {
          employeeId_date_effectiveFrom: {
            employeeId: employee.id,
            date: date,
            effectiveFrom: new Date(currentYear, currentMonth, 1)
          }
        },
        update: {},
        create: {
          employeeId: employee.id,
          date: date,
          startTime: scheduleDay.startTime,
          endTime: scheduleDay.endTime,
          breakDuration: scheduleDay.breakDuration || 0,
          isWorkDay: true,
          scheduleType: 'regular',
          effectiveFrom: new Date(currentYear, currentMonth, 1),
          createdBy: manager.id,
          notes: i === 0 ? 'First shift of the month' : undefined
        }
      });
    }
    
    // Create a temporary schedule override for one employee
    if (employee.employeeId === 'EMP001') {
      const overrideDate = new Date(currentYear, currentMonth, currentDay + 5);
      await prisma.scheduleEntry.upsert({
        where: {
          employeeId_date_effectiveFrom: {
            employeeId: employee.id,
            date: overrideDate,
            effectiveFrom: new Date(currentYear, currentMonth, currentDay + 5)
          }
        },
        update: {},
        create: {
          employeeId: employee.id,
          date: overrideDate,
          startTime: '12:00',
          endTime: '20:00',
          breakDuration: 30,
          isWorkDay: true,
          scheduleType: 'temporary',
          effectiveFrom: new Date(currentYear, currentMonth, currentDay + 5),
          effectiveUntil: new Date(currentYear, currentMonth, currentDay + 5),
          createdBy: manager.id,
          notes: 'Temporary schedule change for special event'
        }
      });
    }
  }
}

/**
 * Create messages
 */
async function createMessages(hrAdmin: any, managers: any[], employees: any[]) {
  // Create welcome messages for each employee
  for (const employee of employees) {
    // Skip the terminated employee
    if (employee.employeeId === 'EMP004') continue;
    
    // Get the manager for this employee's organization
    const manager = managers.find(m => m.organizationId === employee.user.organizationId);
    if (!manager) continue;
    
    // Welcome message from manager
    await prisma.message.create({
      data: {
        senderId: manager.id,
        receiverId: employee.userId,
        subject: 'Welcome to the team!',
        content: `Hi ${employee.user.firstName},\n\nWelcome to the team! We're excited to have you join us. Please let me know if you have any questions as you get settled in.\n\nBest regards,\n${manager.firstName} ${manager.lastName}`,
        isRead: employee.employeeId !== 'EMP005',
        readAt: employee.employeeId !== 'EMP005' ? new Date(employee.hireDate) : null,
        createdAt: new Date(employee.hireDate),
        updatedAt: new Date(employee.hireDate)
      }
    });
    
    // HR welcome message
    await prisma.message.create({
      data: {
        senderId: hrAdmin.id,
        receiverId: employee.userId,
        subject: 'Welcome to Motel Chain Inc.',
        content: `Dear ${employee.user.firstName},\n\nOn behalf of the HR department, welcome to Motel Chain Inc.! We're delighted to have you as part of our team.\n\nPlease complete your onboarding tasks at your earliest convenience. If you have any questions about benefits, policies, or other HR matters, don't hesitate to reach out.\n\nBest regards,\n${hrAdmin.firstName} ${hrAdmin.lastName}\nHR Administrator`,
        isRead: employee.employeeId !== 'EMP005',
        readAt: employee.employeeId !== 'EMP005' ? new Date(new Date(employee.hireDate).getTime() + 2 * 60 * 60 * 1000) : null,
        createdAt: new Date(employee.hireDate),
        updatedAt: new Date(employee.hireDate)
      }
    });
    
    // Employee response to manager (except for new employee)
    if (employee.employeeId !== 'EMP005') {
      await prisma.message.create({
        data: {
          senderId: employee.userId,
          receiverId: manager.id,
          subject: 'Re: Welcome to the team!',
          content: `Hi ${manager.firstName},\n\nThank you for the warm welcome! I'm excited to be part of the team and looking forward to contributing.\n\nBest regards,\n${employee.user.firstName}`,
          isRead: true,
          readAt: new Date(new Date(employee.hireDate).getTime() + 4 * 60 * 60 * 1000),
          createdAt: new Date(new Date(employee.hireDate).getTime() + 3 * 60 * 60 * 1000),
          updatedAt: new Date(new Date(employee.hireDate).getTime() + 3 * 60 * 60 * 1000)
        }
      });
    }
  }
  
  // Create a message thread between managers and HR
  for (const manager of managers) {
    await prisma.message.create({
      data: {
        senderId: manager.id,
        receiverId: hrAdmin.id,
        subject: 'Quarterly Staff Review',
        content: `Hi ${hrAdmin.firstName},\n\nI've completed the quarterly staff reviews for my team. All evaluations have been uploaded to the system.\n\nBest regards,\n${manager.firstName}`,
        isRead: true,
        readAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(new Date().getTime() - 4 * 24 * 60 * 60 * 1000)
      }
    });
    
    await prisma.message.create({
      data: {
        senderId: hrAdmin.id,
        receiverId: manager.id,
        subject: 'Re: Quarterly Staff Review',
        content: `Hi ${manager.firstName},\n\nThank you for completing the reviews on time. I'll review them this week and let you know if I have any questions.\n\nBest regards,\n${hrAdmin.firstName}`,
        isRead: true,
        readAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000)
      }
    });
  }
}/**

 * Create announcements
 */
async function createAnnouncements(hrAdmin: any, motels: any[]) {
  // Company-wide announcement
  await prisma.announcement.create({
    data: {
      title: 'New Employee Handbook Released',
      content: 'We are pleased to announce that the updated Employee Handbook (version 2.3) is now available. All employees are required to review and acknowledge the updated policies by the end of the month. Key changes include updated PTO policies and remote work guidelines.',
      priority: 'high',
      targetRoles: ['hr_admin', 'manager', 'employee'],
      targetOrgs: [motels[0].id, motels[1].id, motels[2].id],
      isActive: true,
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000)
    }
  });
  
  // Location-specific announcements
  for (let i = 0; i < motels.length; i++) {
    const motel = motels[i];
    await prisma.announcement.create({
      data: {
        title: `${motel.name} Staff Meeting`,
        content: `There will be a mandatory staff meeting for all ${motel.name} employees on ${new Date(new Date().getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toLocaleDateString()} at 2:00 PM. We will discuss upcoming renovations and operational changes.`,
        priority: 'normal',
        targetRoles: ['manager', 'employee'],
        targetOrgs: [motel.id],
        isActive: true,
        expiresAt: new Date(new Date().getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000),
        createdAt: new Date(new Date().getTime() - (i + 1) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(new Date().getTime() - (i + 1) * 24 * 60 * 60 * 1000)
      }
    });
  }
  
  // Role-specific announcement
  await prisma.announcement.create({
    data: {
      title: 'Manager Training Session',
      content: 'All managers are required to attend a virtual training session on the new performance evaluation system. The session will be held next Tuesday at 10:00 AM. Please check your email for the meeting link and pre-work materials.',
      priority: 'normal',
      targetRoles: ['manager'],
      targetOrgs: [motels[0].id, motels[1].id, motels[2].id],
      isActive: true,
      expiresAt: new Date(new Date().getTime() + 10 * 24 * 60 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 3 * 24 * 60 * 60 * 1000)
    }
  });
  
  // Urgent announcement
  await prisma.announcement.create({
    data: {
      title: 'System Maintenance Notice',
      content: 'The employee portal will be unavailable for scheduled maintenance this Saturday from 2:00 AM to 6:00 AM. Please plan accordingly and complete any urgent tasks before this time.',
      priority: 'urgent',
      targetRoles: ['hr_admin', 'manager', 'employee'],
      targetOrgs: [motels[0].id, motels[1].id, motels[2].id],
      isActive: true,
      expiresAt: new Date(new Date().getTime() + 5 * 24 * 60 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 1 * 24 * 60 * 60 * 1000)
    }
  });
}

/**
 * Print demo credentials
 */
function printDemoCredentials(hrAdmin: any, managers: any[], employees: any[]) {
  console.log('');
  console.log('🏢 Organizations created:');
  console.log('  - Motel Chain Corporate (parent)');
  console.log('  - Downtown Motel');
  console.log('  - Airport Motel');
  console.log('  - Beachside Motel');
  console.log('');
  console.log('👥 Demo accounts created:');
  console.log('📧 HR Admin: hr@motelchain.com / demo123');
  console.log('📧 Manager 1: manager1@motelchain.com / demo123 (Downtown Motel)');
  console.log('📧 Manager 2: manager2@motelchain.com / demo123 (Airport Motel, Spanish)');
  console.log('📧 Manager 3: manager3@motelchain.com / demo123 (Beachside Motel)');
  console.log('📧 Employee 1: alice@motelchain.com / demo123 (Active - Downtown)');
  console.log('📧 Employee 2: carlos@motelchain.com / demo123 (Active - Airport, Spanish)');
  console.log('📧 Employee 3: sarah@motelchain.com / demo123 (Active - Night Shift)');
  console.log('📧 Employee 4: david@motelchain.com / demo123 (Terminated - Alumni)');
  console.log('📧 Employee 5: michael@motelchain.com / demo123 (Onboarding - Beachside)');
  console.log('📧 Employee 6: jessica@motelchain.com / demo123 (On Leave - Beachside)');
  console.log('');
  console.log('🔑 Onboarding Access Codes:');
  console.log('  - Michael Lee (New Employee): ABC123');
  console.log('  - Alice Johnson (Completed): XYZ789');
}

// Run the seed function
main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });