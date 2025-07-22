import { prisma } from '@/utils/database';
import { OnboardingStatus, FormStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/**
 * This script enhances the demo data to showcase a complete onboarding workflow:
 * 1. Manager creates a new employee and initiates onboarding
 * 2. Manager manually verifies ID and enters initial employee data
 * 3. Employee completes onboarding via tablet interface
 * 4. Manager receives notification for verification
 * 5. HR receives notification for final approval
 */
async function setupOnboardingDemo() {
    console.log('🚀 Setting up onboarding workflow demo...');

    try {
        // 1. Find the Beachside Motel and its manager
        const beachsideMotel = await prisma.organization.findFirst({
            where: { name: 'Beachside Motel' }
        });

        if (!beachsideMotel) {
            console.error('❌ Beachside Motel not found. Please run demo-seed.ts first.');
            return;
        }

        const manager = await prisma.user.findFirst({
            where: {
                organizationId: beachsideMotel.id,
                role: 'manager'
            }
        });

        if (!manager) {
            console.error('❌ Beachside Motel manager not found. Please run demo-seed.ts first.');
            return;
        }

        // 2. Find HR admin
        const hrAdmin = await prisma.user.findFirst({
            where: { role: 'hr_admin' }
        });

        if (!hrAdmin) {
            console.error('❌ HR Admin not found. Please run demo-seed.ts first.');
            return;
        }

        // 3. Find the employee in onboarding (Michael Lee)
        const employee = await prisma.employee.findFirst({
            where: { employeeId: 'EMP005' },
            include: { user: true }
        });

        if (!employee) {
            console.error('❌ Employee Michael Lee not found. Please run demo-seed.ts first.');
            return;
        }

        // 4. Create a message from manager to HR about new hire
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

        // 5. Create a message from manager to employee with access code
        await prisma.message.create({
            data: {
                senderId: manager.id,
                receiverId: employee.userId,
                subject: 'Welcome to Beachside Motel - Your Onboarding Access Code',
                content: `Hi Michael,\n\nWelcome to the Beachside Motel team! I've started your onboarding process in our system. Please use the access code ABC123 to complete your onboarding on the tablet at the front desk.\n\nI've already verified your ID and entered your basic information. You'll need to upload your SSN card, complete the I-9 and W-4 forms, and sign our policies.\n\nLet me know if you have any questions.\n\nBest regards,\n${manager.firstName}`,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        // 6. Update the onboarding session to reflect manager verification
        const onboardingSession = await prisma.onboardingSession.findFirst({
            where: { employeeId: employee.id }
        });

        if (onboardingSession) {
            await prisma.onboardingSession.update({
                where: { id: onboardingSession.id },
                data: {
                    formData: {
                        ...onboardingSession.formData as any,
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
                    }
                }
            });
        }

        // 7. Create a pending form submission for I-9 that needs manager review
        const storageDir = path.join(process.cwd(), 'storage');
        const formsDir = path.join(storageDir, 'forms');

        // Ensure directories exist
        if (!fs.existsSync(formsDir)) {
            fs.mkdirSync(formsDir, { recursive: true });
        }

        // Create a pending I-9 form submission
        await prisma.formSubmission.upsert({
            where: {
                formId: `i9-${employee.id}`
            },
            update: {},
            create: {
                id: `i9-submission-${employee.id}`,
                formId: `i9-${employee.id}`,
                employeeId: employee.id,
                formType: 'i9',
                language: 'en',
                data: {
                    personalInfo: {
                        firstName: 'Michael',
                        lastName: 'Lee',
                        address: employee.address,
                        dateOfBirth: '1995-08-12',
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
                status: 'submitted' as FormStatus,
                version: '1.0',
                submittedAt: new Date(),
                pdfPath: path.join('storage', 'forms', `${employee.employeeId}_i9.pdf`)
            }
        });

        // 8. Create a pending W-4 form submission
        await prisma.formSubmission.upsert({
            where: {
                formId: `w4-${employee.id}`
            },
            update: {},
            create: {
                id: `w4-submission-${employee.id}`,
                formId: `w4-${employee.id}`,
                employeeId: employee.id,
                formType: 'w4',
                language: 'en',
                data: {
                    personalInfo: {
                        firstName: 'Michael',
                        lastName: 'Lee',
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
                status: 'submitted' as FormStatus,
                version: '1.0',
                submittedAt: new Date(),
                pdfPath: path.join('storage', 'forms', `${employee.employeeId}_w4.pdf`)
            }
        });

        // 9. Create a notification message for the manager about form submissions
        await prisma.message.create({
            data: {
                senderId: employee.userId,
                receiverId: manager.id,
                subject: 'Onboarding Forms Completed',
                content: `Hi ${manager.firstName},\n\nI've completed my onboarding forms and uploaded my documents. Could you please review them when you have a chance?\n\nThank you,\nMichael`,
                isRead: false,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });

        console.log('✅ Onboarding workflow demo setup successfully!');
        console.log('');
        console.log('🔄 Onboarding Workflow Demo Instructions:');
        console.log('');
        console.log('1. Log in as the manager (manager3@motelchain.com / demo123)');
        console.log('   - Check messages to see notification from Michael Lee');
        console.log('   - Navigate to the Onboarding Pipeline or Employee Management section');
        console.log('   - Find Michael Lee\'s submission waiting for review');
        console.log('   - Review the I-9 and W-4 forms that were submitted');
        console.log('   - Verify all information and approve the submission');
        console.log('   - Forward to HR for final approval');
        console.log('');
        console.log('2. Log in as HR (hr@motelchain.com / demo123)');
        console.log('   - Check notifications for the forwarded onboarding submission');
        console.log('   - Review all documents and forms for compliance');
        console.log('   - Give final approval to complete the onboarding process');
        console.log('');
        console.log('3. For a complete demo from the beginning:');
        console.log('   - Log in as manager and create a new employee');
        console.log('   - Manually verify ID and enter employee information');
        console.log('   - Generate an access code for the tablet onboarding');
        console.log('   - Access the tablet interface with the code');
        console.log('   - Complete the document upload and form submission process');
        console.log('   - Follow the manager and HR approval workflow');
        console.log('');

    } catch (error) {
        console.error('❌ Error setting up onboarding workflow demo:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Run the setup function
setupOnboardingDemo();