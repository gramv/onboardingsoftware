import { prisma } from '../utils/database';
import { OnboardingStatus, FormStatus } from '@prisma/client';
import path from 'path';
import fs from 'fs';

/**
 * This script demonstrates a complete onboarding workflow:
 * 1. Manager manually verifies employee ID and SSN
 * 2. Manager enters initial employee information
 * 3. Manager generates access code for employee
 * 4. Employee completes onboarding via tablet (uploads documents, fills forms)
 * 5. Manager receives notification for verification
 * 6. Manager approves and forwards to HR
 * 7. HR gives final approval
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

        // 3. Create a new employee record (Michael Lee) - this represents the manager's initial entry
        // First, check if the employee already exists and delete if needed
        const existingEmployee = await prisma.employee.findFirst({
            where: { employeeId: 'EMP005' },
            include: { user: true }
        });

        if (existingEmployee) {
            // Delete existing onboarding session if it exists
            const existingSession = await prisma.onboardingSession.findFirst({
                where: { employeeId: existingEmployee.id }
            });

            if (existingSession) {
                await prisma.onboardingSession.delete({
                    where: { id: existingSession.id }
                });
            }

            // Delete existing messages
            await prisma.message.deleteMany({
                where: {
                    OR: [
                        { senderId: existingEmployee.userId },
                        { receiverId: existingEmployee.userId }
                    ]
                }
            });

            // Delete existing form submissions
            await prisma.formSubmission.deleteMany({
                where: { employeeId: existingEmployee.id }
            });

            // Delete existing documents
            await prisma.document.deleteMany({
                where: { employeeId: existingEmployee.id }
            });

            // Delete employee
            await prisma.employee.delete({
                where: { id: existingEmployee.id }
            });

            // Delete user
            await prisma.user.delete({
                where: { id: existingEmployee.userId }
            });
        }

        // Create new employee user
        const employeeUser = await prisma.user.create({
            data: {
                email: 'michael@motelchain.com',
                passwordHash: '$2a$12$k8Y1Ej3fUF1UOoHSGcfeAOGBJFT.SEHFTiuUTiBnKRkQgbwD.YZfG', // demo123
                role: 'employee',
                organizationId: beachsideMotel.id,
                firstName: 'Michael',
                lastName: 'Lee',
                phone: '+1-555-0205',
                languagePreference: 'en',
                isActive: true
            }
        });

        // Create employee record
        const employee = await prisma.employee.create({
            data: {
                userId: employeeUser.id,
                employeeId: 'EMP005',
                hireDate: new Date('2024-07-01'), // Future date for onboarding demo
                position: 'Lifeguard',
                department: 'Pool Services',
                hourlyRate: 17.50,
                employmentStatus: 'active',
                employmentType: 'full_time', // Now properly defined in the schema
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

        // 4. Create onboarding session with manager verification
        await prisma.onboardingSession.create({
            data: {
                id: employee.id,
                employeeId: employee.id,
                accessCode: 'ABC123',
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
                        },
                        dateOfBirth: '1995-08-12',
                        gender: 'Male',
                        maritalStatus: 'Single',
                        dependents: 0
                    },
                    employmentInfo: {
                        position: 'Lifeguard',
                        department: 'Pool Services',
                        startDate: '2024-07-01',
                        employmentType: 'full_time',
                        hourlyRate: 17.50,
                        healthInsurance: 'UHC HRA Base Plan',
                        healthInsuranceCopay: 25.00
                    },
                    bankInfo: {
                        directDeposit: true,
                        accountType: 'checking',
                        routingNumber: '123456789',
                        accountNumber: 'XXXX5678'
                    },
                    completedSteps: ['personal-info', 'employment-info', 'bank-info'],
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
                    },
                    policyAcknowledgments: {
                        atWillEmployment: true,
                        equalEmploymentOpportunity: true,
                        sexualHarassmentPolicy: true,
                        workplaceViolencePolicy: true,
                        surveillancePolicy: true,
                        fraternizationPolicy: true,
                        mediaContactPolicy: true,
                        itemRemovalPolicy: true,
                        accessPolicy: true,
                        emailPolicy: true,
                        hazardCommunicationPlan: true,
                        ptoPolicy: true,
                        acknowledgedAt: new Date().toISOString()
                    }
                },
                status: 'in_progress' as OnboardingStatus,
                expiresAt: new Date('2024-07-15'),
                createdAt: new Date('2024-06-15'),
                updatedAt: new Date('2024-06-15')
            }
        });

        // 5. Create a message from manager to employee with access code
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

        // 6. Create a message from manager to HR about new hire
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

        // 7. Create storage directories if needed
        const storageDir = path.join(process.cwd(), 'storage');
        const formsDir = path.join(storageDir, 'forms');
        const documentsDir = path.join(storageDir, 'documents');
        const ssnDir = path.join(documentsDir, 'ssn');

        if (!fs.existsSync(formsDir)) {
            fs.mkdirSync(formsDir, { recursive: true });
        }

        if (!fs.existsSync(ssnDir)) {
            fs.mkdirSync(ssnDir, { recursive: true });
        }

        // 8. Create a dummy SSN document (representing what the employee uploaded)
        const ssnDocPath = path.join(ssnDir, `${employee.employeeId}_ssn.jpg`);

        // Create an empty file if it doesn't exist
        if (!fs.existsSync(ssnDocPath)) {
            fs.writeFileSync(ssnDocPath, '');
        }

        // Generate a proper UUID for the document
        const crypto = require('crypto');
        const documentId = crypto.randomUUID();

        await prisma.document.create({
            data: {
                id: documentId,
                employeeId: employee.id,
                documentType: 'ssn',
                documentName: `${employee.employeeId}_ssn.jpg`,
                filePath: path.join('storage', 'documents', 'ssn', `${employee.employeeId}_ssn.jpg`),
                fileSize: 150000,
                mimeType: 'image/jpeg',
                isSigned: false,
                version: 1,
                ocrData: {
                    extractedData: {
                        ssnNumber: '123-45-6789',
                        fullName: 'Michael Lee'
                    },
                    confidence: 82.0,
                    fieldConfidences: {
                        ssnNumber: 85,
                        fullName: 79
                    },
                    rawText: 'SOCIAL SECURITY\n123-45-6789\nMICHAEL LEE',
                    processingStatus: 'completed'
                }
            }
        });

        // 9. Create pending I-9 and W-4 form submissions (representing what the employee filled out)
        // Generate a proper UUID for the I-9 form submission
        const i9SubmissionId = crypto.randomUUID();

        await prisma.formSubmission.create({
            data: {
                id: i9SubmissionId,
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

        // Generate a proper UUID for the W-4 form submission
        const w4SubmissionId = crypto.randomUUID();

        await prisma.formSubmission.create({
            data: {
                id: w4SubmissionId,
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

        // 10. Create a notification message for the manager about form submissions
        await prisma.message.create({
            data: {
                senderId: employeeUser.id,
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