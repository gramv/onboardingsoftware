import { prisma } from '../utils/database';
import { hashPassword } from '../utils/auth/password';

async function createSimpleDemoData() {
  console.log('🚀 Creating simple demo data for onboarding...');

  try {
    // 1. Create a corporate organization
    const corporate = await prisma.organization.upsert({
      where: { name: 'Lakecrest Partners' },
      update: {},
      create: {
        name: 'Lakecrest Partners',
        type: 'corporate',
        address: {
          street: '123 Business Ave',
          city: 'Los Angeles',
          state: 'CA',
          zipCode: '90210',
          country: 'USA'
        },
        settings: {}
      }
    });

    console.log('✅ Created corporate organization:', corporate.name);

    // 2. Create a motel location
    const motel = await prisma.organization.upsert({
      where: { name: 'Beachside Motel' },
      update: {},
      create: {
        name: 'Beachside Motel',
        type: 'motel',
        parentId: corporate.id,
        address: {
          street: '456 Ocean Blvd',
          city: 'Malibu',
          state: 'CA',
          zipCode: '90265',
          country: 'USA'
        },
        settings: {}
      }
    });

    console.log('✅ Created motel location:', motel.name);

    // 3. Create HR Admin user
    const hrAdminPassword = await hashPassword('admin123');
    const hrAdmin = await prisma.user.upsert({
      where: { email: 'hr@lakecrest.com' },
      update: {},
      create: {
        email: 'hr@lakecrest.com',
        passwordHash: hrAdminPassword,
        role: 'hr_admin',
        organizationId: corporate.id,
        firstName: 'Sarah',
        lastName: 'Wilson',
        phone: '+1-555-0101',
        languagePreference: 'en',
        isActive: true
      }
    });

    console.log('✅ Created HR Admin:', hrAdmin.email);

    // 4. Create Manager user
    const managerPassword = await hashPassword('manager123');
    const manager = await prisma.user.upsert({
      where: { email: 'manager@beachside.com' },
      update: {},
      create: {
        email: 'manager@beachside.com',
        passwordHash: managerPassword,
        role: 'manager',
        organizationId: motel.id,
        firstName: 'John',
        lastName: 'Smith',
        phone: '+1-555-0102',
        languagePreference: 'en',
        isActive: true
      }
    });

    console.log('✅ Created Manager:', manager.email);

    // 5. Create a demo employee for onboarding
    const employeePassword = await hashPassword('employee123');
    const employeeUser = await prisma.user.upsert({
      where: { email: 'michael@beachside.com' },
      update: {},
      create: {
        email: 'michael@beachside.com',
        passwordHash: employeePassword,
        role: 'employee',
        organizationId: motel.id,
        firstName: 'Michael',
        lastName: 'Johnson',
        phone: '+1-555-0103',
        languagePreference: 'en',
        isActive: true
      }
    });

    const employee = await prisma.employee.upsert({
      where: { employeeId: 'EMP001' },
      update: {},
      create: {
        userId: employeeUser.id,
        employeeId: 'EMP001',
        hireDate: new Date(),
        position: 'Front Desk Agent',
        department: 'Reception',
        hourlyRate: 18.00,
        employmentStatus: 'active',
        emergencyContact: {
          name: 'Mary Johnson',
          relationship: 'Mother',
          phone: '+1-555-0104'
        },
        address: {
          street: '789 Sunset Blvd',
          city: 'Malibu',
          state: 'CA',
          zipCode: '90265',
          country: 'USA'
        }
      }
    });

    console.log('✅ Created Employee:', employeeUser.email);

    // 6. Create an onboarding session
    const session = await prisma.onboardingSession.upsert({
      where: { accessCode: 'DEMO123' },
      update: {},
      create: {
        employeeId: employee.id,
        accessCode: 'DEMO123',
        languagePreference: 'en',
        currentStep: 'language_selection',
        status: 'in_progress',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        formData: {}
      }
    });

    console.log('✅ Created Onboarding Session with access code:', session.accessCode);

    console.log('\n🎉 Demo data created successfully!');
    console.log('\n📋 Demo Credentials:');
    console.log('HR Admin: hr@lakecrest.com / admin123');
    console.log('Manager: manager@beachside.com / manager123');
    console.log('Employee: michael@beachside.com / employee123');
    console.log('\n🔑 Onboarding Access Code: DEMO123');
    console.log('\n🌐 Test the onboarding at: http://localhost:3000/onboarding?code=DEMO123');

  } catch (error) {
    console.error('❌ Error creating demo data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSimpleDemoData(); 