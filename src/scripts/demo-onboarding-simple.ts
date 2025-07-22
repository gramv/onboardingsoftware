import { prisma } from '@/utils/database';
import { OnboardingStatus, FormStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/**
 * This script enhances the demo data to showcase a complete onboarding workflow
 */
async function setupOnboardingDemo() {
  console.log('🚀 Setting up onboarding workflow demo...');

  try {
    // 1. Create the Beachside Motel
    const corporateOrg = await prisma.organization.upsert({
      where: { name: 'Motel Chain Corporate' },
      update: {},
      create: {
        name: 'Motel Chain Corporate',
        type: 'corporate',
        address: JSON.stringify({
          street: '123 Corporate Blvd',
          city: 'Business City',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        }),
        settings: JSON.stringify({
          timezone: 'America/Los_Angeles',
          currency: 'USD'
        })
      }
    });

    const beachsideMotel = await prisma.organization.upsert({
      where: { name: 'Beachside Motel' },
      update: {},
      create: {
        name: 'Beachside Motel',
        type: 'motel',
        parentId: corporateOrg.id,
        address: JSON.stringify({
          street: '123 Ocean Drive',
          city: 'Seaside',
          state: 'CA',
          zipCode: '90213',
          country: 'USA'
        }),
        settings: JSON.stringify({
          timezone: 'America/Los_Angeles',
          maxEmployees: 20
        })
      }
    });

    // 2. Create HR admin
    const hashedPassword = await prisma.user.findFirst({
      where: { email: 'hr@motelchain.com' }
    }).then(user => user?.passwordHash || '$2a$12$k8Y1Ej3fUF1UOoHSGcfeAOGBJFT.SEHFTiuUTiBnKRkQgbwD.YZfG'); // fallback to demo123

    const hrAdmin = await prisma.user.upsert({
      where: { email: 'hr@motelchain.com' },
      update: {},
      create: {
        email: 'hr@motelchain.com',
        passwordHash: hashedPassword,
        role: 'hr_admin',
        organizationId: corporateOrg.id,
        firstName: 'Emily',
        lastName: 'Rodriguez',
        phone: '+1-555-0100',
        languagePreference: 'en',
        isActive: true
      }
    });

    // 3. Create manager
    const manager = await prisma.user.upsert({
      where: { email: 'manager3@motelchain.com' },
      update: {},
      create: {
        email: 'manager3@motelchain.com',
        passwordHash: hashedPassword,
        role: 'manager',
        organizationId: beachsideMotel.id,
        firstName: 'Robert',
        lastName: 'Chen',
        phone: '+1-555-0103',
        languagePreference: 'en',
        isActive: true
      }
    });

    // 4. Create employee in onboarding
    const employeeUser = await prisma.user.upsert({
      where: { email: 'michael@motelchain.com' },
      update: {},
      create: {
        email: 'michael@motelchain.com',
        passwordHash: hashedPassword,
        role: 'employee',
        organizationId: beachsideMotel.id,
        firstName: 'Michael',
        lastName: 'Lee',
        phone: '+1-555-0205',
        languagePreference: 'en',
        isActive: true
      }
    });

    const employee = await prisma.employee.upsert({
      where: { employeeId: 'EMP005' },
      update: {},
      create: {
        userId: employeeUser.id,
        employeeId: 'EMP005',
        hireDate: new Date('2024-07-01'),
        position: 'Lifeguard',
        department: 'Pool Services',
        hourlyRate: 17.50,
        employmentStatus: 'active',
        emergencyContact: JSON.stringify({
          name: 'Jennifer Lee',
          relationship: 'Mother',
          phone: '+1-555-0305'
        }),
        address: JSON.stringify({
          street: '567 Beach Rd',
          city: 'Seaside',
          state: 'CA',
          zipCode: '90213',
          country: 'USA'
        })
      }
    });

    // 5. Create onboarding session
    await prisma.onboardingSession.upsert({
      where: {
        id: employee.id
      },
      update: {
        formData: JSON.stringify({
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
          completedSteps: ['personal-info', 'employment-info'],
          managerVerification: {
            idVerified: true,
            verifiedBy: manager.firstName + ' ' + manager.lastName,
            verifiedAt: new Date().toISOString(),
            notes: "ID manually verified. Driver's license information entered manually."
          },
          idDocument: {
            documentType: "drivers_license",
            licenseNumber: "L12345678",
            issuingState: "CA",
            expirationDate: "2028-05-15",
            manuallyEntered: true
          }
        })
      },
      create: {
        id: employee.id,
        employeeId: employee.id,
        token: 'ABC123',
        languagePreference: 'en',
        currentStep: 'document-upload',
        formData: JSON.stringify({
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
          completedSteps: ['personal-info', 'employment-info'],
          managerVerification: {
            idVerified: true,
            verifiedBy: manager.firstName + ' ' + manager.lastName,
            verifiedAt: new Date().toISOString(),
            notes: "ID manually verified. Driver's license information entered manually."
          },
          idDocument: {
            documentType: "drivers_license",
            licenseNumber: "L12345678",
            issuingState: "CA",
            expirationDate: "2028-05-15",
            manuallyEntered: true
          }
        }),
        status: 'in_progress' as OnboardingStatus,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date('2024-06-15'),
        updatedAt: new Date('2024-06-15')
      }
    });

    // 6. Create messages between manager and employee
    await prisma.message.create({
      data: {
        senderId: manager.id,
        receiverId: employeeUser.id,
        subject: 'Welcome to Beachside Motel - Your Onboarding Access Code',
        content: `Hi Michael,\n\nWelcome to the Beachside Motel team! I've started your onboarding process in our system. Please use the access code ABC123 to complete your onboarding on the tablet at the front desk.\n\nI've already verified your ID and entered your basic information. You'll need to upload your SSN card, complete the I-9 and W-4 forms, and sign our policies.\n\nLet me know if you have any questions.\n\nBest regards,\n${manager.firstName}`,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 7. Create a message from manager to HR
    await prisma.message.create({
      data: {
        senderId: manager.id,
        receiverId: hrAdmin.id,
        subject: 'New Hire - Michael Lee',
        content: `Hi ${hrAdmin.firstName},\n\nI've initiated the onboarding process for our new lifeguard, Michael Lee. He'll be starting on July 1st. I've verified his ID manually and entered his basic information. He'll be completing the rest of the onboarding process on the tablet.\n\nBest regards,\n${manager.firstName}`,
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    // 8. Create storage directories if needed
    const storageDir = path.join(process.cwd(), 'storage');
    const formsDir = path.join(storageDir, 'forms');
    
    if (!fs.existsSync(formsDir)) {
      fs.mkdirSync(formsDir, { recursive: true });
    }

    console.log('✅ Onboarding workflow demo setup successfully!');
    console.log('');
    console.log('🔄 Onboarding Workflow Demo Instructions:');
    console.log('');
    console.log('1. Log in as the manager (manager3@motelchain.com / demo123)');
    console.log('   - Check messages to see notification from Michael Lee');
    console.log('   - Navigate to the Onboarding Pipeline or Employee Management section');
    console.log('   - Find Michael Lee\'s profile and see that his ID was manually verified');
    console.log('');
    console.log('2. Access the tablet onboarding experience using code ABC123');
    console.log('   - Complete the document upload (SSN card)');
    console.log('   - Fill out and sign the I-9 and W-4 forms');
    console.log('   - Submit the completed onboarding package');
    console.log('');
    console.log('3. Log back in as the manager to receive notification');
    console.log('   - Review the completed onboarding submission');
    console.log('   - Verify all documents and forms');
    console.log('   - Approve and forward to HR');
    console.log('');
    console.log('4. Log in as HR (hr@motelchain.com / demo123)');
    console.log('   - Review the onboarding submission from manager');
    console.log('   - Verify compliance with all requirements');
    console.log('   - Give final approval to complete the process');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up onboarding workflow demo:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the setup function
setupOnboardingDemo();
