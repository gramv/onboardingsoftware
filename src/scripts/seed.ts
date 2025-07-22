import { prisma } from '@/utils/database';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create corporate organization
  const corporateOrg = await prisma.organization.upsert({
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
        currency: 'USD'
      }
    }
  });

  // Create sample motel locations
  const motel1 = await prisma.organization.upsert({
    where: { name: 'Downtown Motel' },
    update: {},
    create: {
      name: 'Downtown Motel',
      type: 'motel',
      parentId: corporateOrg.id,
      address: {
        street: '456 Main St',
        city: 'Downtown',
        state: 'CA',
        zipCode: '90211',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        maxEmployees: 25
      }
    }
  });

  const motel2 = await prisma.organization.upsert({
    where: { name: 'Airport Motel' },
    update: {},
    create: {
      name: 'Airport Motel',
      type: 'motel',
      parentId: corporateOrg.id,
      address: {
        street: '789 Airport Way',
        city: 'Airport City',
        state: 'CA',
        zipCode: '90212',
        country: 'USA'
      },
      settings: {
        timezone: 'America/Los_Angeles',
        maxEmployees: 30
      }
    }
  });

  // Create default HR admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  
  await prisma.user.upsert({
    where: { email: 'hr@motelchain.com' },
    update: {},
    create: {
      email: 'hr@motelchain.com',
      passwordHash: hashedPassword,
      role: 'hr_admin',
      organizationId: corporateOrg.id,
      firstName: 'HR',
      lastName: 'Administrator',
      phone: '+1-555-0100',
      languagePreference: 'en',
      isActive: true
    }
  });

  // Create sample manager for motel 1
  await prisma.user.upsert({
    where: { email: 'manager1@motelchain.com' },
    update: {},
    create: {
      email: 'manager1@motelchain.com',
      passwordHash: hashedPassword,
      role: 'manager',
      organizationId: motel1.id,
      firstName: 'John',
      lastName: 'Manager',
      phone: '+1-555-0101',
      languagePreference: 'en',
      isActive: true
    }
  });

  // Create sample manager for motel 2
  const manager2User = await prisma.user.upsert({
    where: { email: 'manager2@motelchain.com' },
    update: {},
    create: {
      email: 'manager2@motelchain.com',
      passwordHash: hashedPassword,
      role: 'manager',
      organizationId: motel2.id,
      firstName: 'Maria',
      lastName: 'Rodriguez',
      phone: '+1-555-0102',
      languagePreference: 'es',
      isActive: true
    }
  });

  // Create sample employees for testing different scenarios
  
  // Active employee at motel 1
  const employee1User = await prisma.user.upsert({
    where: { email: 'employee1@motelchain.com' },
    update: {},
    create: {
      email: 'employee1@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motel1.id,
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+1-555-0201',
      languagePreference: 'en',
      isActive: true
    }
  });

  await prisma.employee.upsert({
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

  // Spanish-speaking employee at motel 2
  const employee2User = await prisma.user.upsert({
    where: { email: 'employee2@motelchain.com' },
    update: {},
    create: {
      email: 'employee2@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motel2.id,
      firstName: 'Carlos',
      lastName: 'Martinez',
      phone: '+1-555-0202',
      languagePreference: 'es',
      isActive: true
    }
  });

  await prisma.employee.upsert({
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

  // Part-time employee for testing different scenarios
  const employee3User = await prisma.user.upsert({
    where: { email: 'employee3@motelchain.com' },
    update: {},
    create: {
      email: 'employee3@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motel1.id,
      firstName: 'Sarah',
      lastName: 'Wilson',
      phone: '+1-555-0203',
      languagePreference: 'en',
      isActive: true
    }
  });

  await prisma.employee.upsert({
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

  // Terminated employee for alumni testing
  const employee4User = await prisma.user.upsert({
    where: { email: 'former@motelchain.com' },
    update: {},
    create: {
      email: 'former@motelchain.com',
      passwordHash: hashedPassword,
      role: 'employee',
      organizationId: motel2.id,
      firstName: 'David',
      lastName: 'Brown',
      phone: '+1-555-0204',
      languagePreference: 'en',
      isActive: false
    }
  });

  await prisma.employee.upsert({
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

  console.log('✅ Database seeded successfully!');
  console.log('');
  console.log('🏢 Organizations created:');
  console.log('  - Motel Chain Corporate (parent)');
  console.log('  - Downtown Motel');
  console.log('  - Airport Motel');
  console.log('');
  console.log('👥 Test accounts created:');
  console.log('📧 HR Admin: hr@motelchain.com / admin123');
  console.log('📧 Manager 1: manager1@motelchain.com / admin123');
  console.log('📧 Manager 2: manager2@motelchain.com / admin123');
  console.log('📧 Employee 1: employee1@motelchain.com / admin123 (Active - Downtown)');
  console.log('📧 Employee 2: employee2@motelchain.com / admin123 (Active - Airport, Spanish)');
  console.log('📧 Employee 3: employee3@motelchain.com / admin123 (Active - Night Shift)');
  console.log('📧 Employee 4: former@motelchain.com / admin123 (Terminated - Alumni)');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });