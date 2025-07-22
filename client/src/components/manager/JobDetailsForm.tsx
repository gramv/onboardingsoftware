import React, { useState, useEffect } from 'react';
import { PropertyApplication } from '../../types/application';

export interface JobDetails {
    jobTitle: string;
    startDate: string;
    startTime: string;
    payRate: number;
    payFrequency: 'weekly' | 'bi-weekly';
    department: string;
    benefitsEligible: boolean;
    directSupervisor: string;
    specialInstructions?: string;
}

interface JobDetailsFormProps {
    application: PropertyApplication;
    onSubmit: (details: JobDetails) => void;
    onCancel: () => void;
    loading?: boolean;
}

interface JobDetailsErrors {
    jobTitle?: string;
    startDate?: string;
    startTime?: string;
    payRate?: string;
    payFrequency?: string;
    directSupervisor?: string;
    specialInstructions?: string;
}

// Job details templates for common positions
interface JobTemplate {
    jobTitle: string;
    payRate: number;
    benefitsEligible: boolean;
    startTime: string;
    payFrequency: 'weekly' | 'bi-weekly';
    directSupervisor: string;
    specialInstructions?: string;
}

const JOB_TEMPLATES_BY_DEPARTMENT: Record<string, Record<string, JobTemplate>> = {
    'Housekeeping': {
        'Room Attendant': {
            jobTitle: 'Room Attendant',
            payRate: 15.00,
            benefitsEligible: false,
            startTime: '09:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Must be able to lift 25 lbs and work independently. Training provided for first week.'
        },
        'Housekeeping Supervisor': {
            jobTitle: 'Housekeeping Supervisor',
            payRate: 20.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Executive Housekeeper',
            specialInstructions: 'Leadership experience preferred. Responsible for managing team of 5-8 room attendants.'
        },
        'Laundry Attendant': {
            jobTitle: 'Laundry Attendant',
            payRate: 14.50,
            benefitsEligible: false,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Experience with commercial laundry equipment preferred but not required.'
        }
    },
    'Front Desk': {
        'Front Desk Agent': {
            jobTitle: 'Front Desk Agent',
            payRate: 16.00,
            benefitsEligible: true,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Must have excellent customer service skills and basic computer knowledge.'
        },
        'Night Auditor': {
            jobTitle: 'Night Auditor',
            payRate: 17.50,
            benefitsEligible: true,
            startTime: '23:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Previous hotel experience preferred. Must be comfortable working alone overnight.'
        },
        'Front Desk Supervisor': {
            jobTitle: 'Front Desk Supervisor',
            payRate: 22.00,
            benefitsEligible: true,
            startTime: '06:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Minimum 2 years hotel front desk experience required. Leadership skills essential.'
        }
    },
    'Maintenance': {
        'Maintenance Technician': {
            jobTitle: 'Maintenance Technician',
            payRate: 19.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Maintenance Manager',
            specialInstructions: 'Basic electrical and plumbing knowledge required. Must have own basic tools.'
        },
        'Maintenance Supervisor': {
            jobTitle: 'Maintenance Supervisor',
            payRate: 25.00,
            benefitsEligible: true,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Chief Engineer',
            specialInstructions: 'Minimum 3 years maintenance experience. HVAC certification preferred.'
        },
        'Groundskeeper': {
            jobTitle: 'Groundskeeper',
            payRate: 16.50,
            benefitsEligible: false,
            startTime: '06:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Maintenance Manager',
            specialInstructions: 'Landscaping experience preferred. Must be able to work outdoors in all weather.'
        }
    },
    'Food Service': {
        'Server': {
            jobTitle: 'Server',
            payRate: 12.00,
            benefitsEligible: false,
            startTime: '16:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Restaurant Manager',
            specialInstructions: 'Tips additional to base pay. Previous restaurant experience preferred.'
        },
        'Cook': {
            jobTitle: 'Cook',
            payRate: 17.00,
            benefitsEligible: true,
            startTime: '15:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Kitchen Manager',
            specialInstructions: 'Food safety certification required within 30 days. Experience with commercial kitchen equipment.'
        },
        'Food Service Supervisor': {
            jobTitle: 'Food Service Supervisor',
            payRate: 21.00,
            benefitsEligible: true,
            startTime: '14:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Food & Beverage Manager',
            specialInstructions: 'ServSafe certification required. Minimum 2 years food service management experience.'
        }
    },
    'Management': {
        'Assistant Manager': {
            jobTitle: 'Assistant Manager',
            payRate: 28.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'General Manager',
            specialInstructions: 'Bachelor\'s degree or equivalent experience. Must be available for flexible scheduling.'
        },
        'Shift Supervisor': {
            jobTitle: 'Shift Supervisor',
            payRate: 24.00,
            benefitsEligible: true,
            startTime: '15:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Assistant Manager',
            specialInstructions: 'Previous supervisory experience required. Must be able to handle guest complaints and staff issues.'
        }
    }
};

// Common job titles by department
const JOB_TITLES_BY_DEPARTMENT: Record<string, string[]> = {
    'Housekeeping': [
        'Room Attendant',
        'Housekeeping Supervisor',
        'Laundry Attendant',
        'Public Area Attendant',
        'Housekeeping Assistant'
    ],
    'Front Desk': [
        'Front Desk Agent',
        'Front Desk Supervisor',
        'Night Auditor',
        'Guest Services Representative',
        'Front Office Assistant'
    ],
    'Maintenance': [
        'Maintenance Technician',
        'Maintenance Supervisor',
        'Groundskeeper',
        'HVAC Technician',
        'Maintenance Assistant'
    ],
    'Food Service': [
        'Server',
        'Cook',
        'Bartender',
        'Food Service Supervisor',
        'Kitchen Assistant'
    ],
    'Management': [
        'Assistant Manager',
        'General Manager',
        'Department Manager',
        'Shift Supervisor',
        'Operations Manager'
    ]
};

// Enhanced supervisors by department with hierarchical structure
const SUPERVISORS_BY_DEPARTMENT: Record<string, { title: string; level: 'direct' | 'senior' | 'executive' }[]> = {
    'Housekeeping': [
        { title: 'Housekeeping Supervisor', level: 'direct' },
        { title: 'Senior Housekeeping Supervisor', level: 'direct' },
        { title: 'Housekeeping Manager', level: 'senior' },
        { title: 'Executive Housekeeper', level: 'senior' },
        { title: 'Assistant Housekeeping Manager', level: 'senior' },
        { title: 'Head Housekeeper', level: 'senior' },
        { title: 'Housekeeping Coordinator', level: 'direct' },
        { title: 'Housekeeping Lead', level: 'direct' }
    ],
    'Front Desk': [
        { title: 'Front Desk Supervisor', level: 'direct' },
        { title: 'Front Desk Lead', level: 'direct' },
        { title: 'Front Office Manager', level: 'senior' },
        { title: 'Guest Services Manager', level: 'senior' },
        { title: 'Assistant Front Office Manager', level: 'senior' },
        { title: 'Guest Relations Manager', level: 'senior' },
        { title: 'Front Office Coordinator', level: 'direct' },
        { title: 'Guest Experience Manager', level: 'senior' }
    ],
    'Maintenance': [
        { title: 'Maintenance Supervisor', level: 'direct' },
        { title: 'Maintenance Lead', level: 'direct' },
        { title: 'Maintenance Manager', level: 'senior' },
        { title: 'Chief Engineer', level: 'executive' },
        { title: 'Facilities Manager', level: 'senior' },
        { title: 'Property Engineer', level: 'senior' },
        { title: 'Assistant Chief Engineer', level: 'senior' },
        { title: 'Engineering Supervisor', level: 'direct' }
    ],
    'Food Service': [
        { title: 'Food Service Supervisor', level: 'direct' },
        { title: 'Restaurant Supervisor', level: 'direct' },
        { title: 'Kitchen Manager', level: 'senior' },
        { title: 'Restaurant Manager', level: 'senior' },
        { title: 'Food & Beverage Manager', level: 'executive' },
        { title: 'Banquet Manager', level: 'senior' },
        { title: 'Catering Manager', level: 'senior' },
        { title: 'Assistant F&B Manager', level: 'senior' }
    ],
    'Management': [
        { title: 'Shift Supervisor', level: 'direct' },
        { title: 'Department Manager', level: 'senior' },
        { title: 'Assistant Manager', level: 'senior' },
        { title: 'Operations Manager', level: 'senior' },
        { title: 'General Manager', level: 'executive' },
        { title: 'Assistant General Manager', level: 'senior' },
        { title: 'Property Manager', level: 'executive' },
        { title: 'District Manager', level: 'executive' }
    ]
};

// Helper function to get supervisor suggestions as strings for datalist
const getSupervisorTitles = (department: string): string[] => {
    return SUPERVISORS_BY_DEPARTMENT[department]?.map(sup => sup.title) || [];
};

// Quick template suggestions based on common scenarios
const QUICK_TEMPLATES = {
    'entry_level': {
        name: 'Entry Level',
        description: 'New to hospitality industry',
        payRate: 15.00,
        benefitsEligible: false,
        startTime: '09:00',
        payFrequency: 'bi-weekly' as const,
    },
    'experienced': {
        name: 'Experienced',
        description: '1-3 years experience',
        payRate: 18.00,
        benefitsEligible: true,
        startTime: '08:00',
        payFrequency: 'bi-weekly' as const,
    },
    'senior': {
        name: 'Senior/Lead',
        description: '3+ years or leadership role',
        payRate: 22.00,
        benefitsEligible: true,
        startTime: '07:00',
        payFrequency: 'bi-weekly' as const,
    },
    'part_time': {
        name: 'Part-Time',
        description: 'Less than 30 hours/week',
        payRate: 16.00,
        benefitsEligible: false,
        startTime: '10:00',
        payFrequency: 'weekly' as const,
    },
    'weekend': {
        name: 'Weekend/Evening',
        description: 'Weekend or evening shifts',
        payRate: 17.00,
        benefitsEligible: false,
        startTime: '15:00',
        payFrequency: 'bi-weekly' as const,
    },
};

// Enhanced job templates with more positions and comprehensive coverage
const ENHANCED_JOB_TEMPLATES: Record<string, Record<string, JobTemplate & { description?: string }>> = {
    'Housekeeping': {
        'Room Attendant': {
            jobTitle: 'Room Attendant',
            payRate: 15.00,
            benefitsEligible: false,
            startTime: '09:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Must be able to lift 25 lbs and work independently. Training provided for first week. Room cleaning quota: 12-15 rooms per shift.',
            description: 'Entry-level position responsible for cleaning guest rooms'
        },
        'Senior Room Attendant': {
            jobTitle: 'Senior Room Attendant',
            payRate: 17.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Experienced room attendant with training responsibilities. May assist with new hire orientation. Expected to handle VIP rooms and special requests.',
            description: 'Experienced position with mentoring responsibilities'
        },
        'Housekeeping Supervisor': {
            jobTitle: 'Housekeeping Supervisor',
            payRate: 22.00,
            benefitsEligible: true,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Executive Housekeeper',
            specialInstructions: 'Leadership experience required. Responsible for managing team of 8-12 room attendants. Must conduct quality inspections and handle guest complaints.',
            description: 'Supervisory role managing housekeeping staff'
        },
        'Laundry Attendant': {
            jobTitle: 'Laundry Attendant',
            payRate: 14.50,
            benefitsEligible: false,
            startTime: '06:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Experience with commercial laundry equipment preferred. Must be able to lift 50 lbs and work in hot environment. Safety training provided.',
            description: 'Responsible for hotel laundry operations'
        },
        'Public Area Attendant': {
            jobTitle: 'Public Area Attendant',
            payRate: 15.50,
            benefitsEligible: false,
            startTime: '05:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Housekeeping Supervisor',
            specialInstructions: 'Responsible for lobby, hallways, and common areas. Must maintain professional appearance as you interact with guests.',
            description: 'Maintains cleanliness of public spaces'
        }
    },
    'Front Desk': {
        'Front Desk Agent': {
            jobTitle: 'Front Desk Agent',
            payRate: 16.00,
            benefitsEligible: true,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Must have excellent customer service skills and basic computer knowledge. PMS training provided. Bilingual (English/Spanish) preferred.',
            description: 'Customer-facing role handling check-ins and guest services'
        },
        'Senior Front Desk Agent': {
            jobTitle: 'Senior Front Desk Agent',
            payRate: 18.50,
            benefitsEligible: true,
            startTime: '06:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Advanced PMS knowledge required. Handle VIP guests, group reservations, and complex billing issues. May train new agents.',
            description: 'Experienced agent handling complex guest services'
        },
        'Night Auditor': {
            jobTitle: 'Night Auditor',
            payRate: 17.50,
            benefitsEligible: true,
            startTime: '23:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Previous hotel experience preferred. Must be comfortable working alone overnight. Responsible for daily audit and security monitoring.',
            description: 'Overnight front desk operations and audit duties'
        },
        'Guest Services Representative': {
            jobTitle: 'Guest Services Representative',
            payRate: 16.50,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Front Office Manager',
            specialInstructions: 'Focus on guest satisfaction and problem resolution. Handle special requests, concierge services, and guest feedback.',
            description: 'Specialized guest service and concierge duties'
        }
    },
    'Maintenance': {
        'Maintenance Technician': {
            jobTitle: 'Maintenance Technician',
            payRate: 19.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Maintenance Manager',
            specialInstructions: 'Basic electrical and plumbing knowledge required. Must have own basic tools. On-call rotation required. HVAC experience a plus.',
            description: 'General maintenance and repair duties'
        },
        'Maintenance Supervisor': {
            jobTitle: 'Maintenance Supervisor',
            payRate: 25.00,
            benefitsEligible: true,
            startTime: '07:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Chief Engineer',
            specialInstructions: 'Minimum 3 years maintenance experience. HVAC certification preferred. Manage team of 3-5 technicians and coordinate with contractors.',
            description: 'Supervisory role managing maintenance operations'
        },
        'Groundskeeper': {
            jobTitle: 'Groundskeeper',
            payRate: 16.50,
            benefitsEligible: false,
            startTime: '06:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Maintenance Manager',
            specialInstructions: 'Landscaping experience preferred. Must be able to work outdoors in all weather. Pool maintenance certification a plus.',
            description: 'Exterior grounds and landscaping maintenance'
        },
        'HVAC Technician': {
            jobTitle: 'HVAC Technician',
            payRate: 23.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Chief Engineer',
            specialInstructions: 'HVAC certification required. EPA certification preferred. On-call availability required for emergency repairs.',
            description: 'Specialized HVAC system maintenance and repair'
        }
    },
    'Food Service': {
        'Server': {
            jobTitle: 'Server',
            payRate: 12.00,
            benefitsEligible: false,
            startTime: '16:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Restaurant Manager',
            specialInstructions: 'Tips additional to base pay. Previous restaurant experience preferred. Food safety training provided. Must be available weekends.',
            description: 'Restaurant service and customer interaction'
        },
        'Cook': {
            jobTitle: 'Cook',
            payRate: 17.00,
            benefitsEligible: true,
            startTime: '15:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Kitchen Manager',
            specialInstructions: 'Food safety certification required within 30 days. Experience with commercial kitchen equipment. Must be able to work in fast-paced environment.',
            description: 'Food preparation and kitchen operations'
        },
        'Bartender': {
            jobTitle: 'Bartender',
            payRate: 14.00,
            benefitsEligible: false,
            startTime: '17:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Restaurant Manager',
            specialInstructions: 'Bartending experience required. Must obtain alcohol service certification. Tips additional to base pay. Evening and weekend availability required.',
            description: 'Bar service and beverage preparation'
        },
        'Food Service Supervisor': {
            jobTitle: 'Food Service Supervisor',
            payRate: 21.00,
            benefitsEligible: true,
            startTime: '14:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Food & Beverage Manager',
            specialInstructions: 'ServSafe certification required. Minimum 2 years food service management experience. Responsible for staff scheduling and inventory management.',
            description: 'Supervisory role in food service operations'
        }
    },
    'Management': {
        'Assistant Manager': {
            jobTitle: 'Assistant Manager',
            payRate: 28.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'General Manager',
            specialInstructions: 'Bachelor\'s degree or equivalent experience required. Must be available for flexible scheduling including weekends and holidays. Leadership training provided.',
            description: 'Management support and operations oversight'
        },
        'Shift Supervisor': {
            jobTitle: 'Shift Supervisor',
            payRate: 24.00,
            benefitsEligible: true,
            startTime: '15:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'Assistant Manager',
            specialInstructions: 'Previous supervisory experience required. Must handle guest complaints, staff issues, and emergency situations. Available for rotating shifts.',
            description: 'Shift-level management and supervision'
        },
        'Department Manager': {
            jobTitle: 'Department Manager',
            payRate: 26.00,
            benefitsEligible: true,
            startTime: '08:00',
            payFrequency: 'bi-weekly',
            directSupervisor: 'General Manager',
            specialInstructions: 'Department-specific experience required. Responsible for budget management, staff development, and operational excellence in assigned department.',
            description: 'Departmental management and leadership'
        }
    }
};

// Enhanced validation function with comprehensive business rules
export const validateJobDetails = (details: JobDetails): { isValid: boolean; errors: JobDetailsErrors } => {
    const errors: JobDetailsErrors = {};

    // Job title validation with business rules
    if (!details.jobTitle.trim()) {
        errors.jobTitle = 'Job title is required';
    } else if (details.jobTitle.trim().length < 2) {
        errors.jobTitle = 'Job title must be at least 2 characters';
    } else if (details.jobTitle.trim().length > 100) {
        errors.jobTitle = 'Job title cannot exceed 100 characters';
    } else if (!/^[a-zA-Z0-9\s\-&/().,]+$/.test(details.jobTitle.trim())) {
        errors.jobTitle = 'Job title contains invalid characters';
    }

    // Check for common job title patterns and suggest corrections
    const commonTitleMistakes: Record<string, string> = {
        'housekeeper': 'Room Attendant',
        'cleaner': 'Room Attendant',
        'maid': 'Room Attendant',
        'receptionist': 'Front Desk Agent',
        'desk clerk': 'Front Desk Agent',
        'janitor': 'Maintenance Technician',
        'handyman': 'Maintenance Technician',
        'waiter': 'Server',
        'waitress': 'Server',
    };

    const lowerTitle = details.jobTitle.toLowerCase().trim();
    if (commonTitleMistakes[lowerTitle]) {
        errors.jobTitle = `Consider using "${commonTitleMistakes[lowerTitle]}" instead of "${details.jobTitle}"`;
    }

    // Start date validation with business constraints
    if (!details.startDate) {
        errors.startDate = 'Start date is required';
    } else {
        const startDate = new Date(details.startDate);
        const today = new Date();
        const minDate = new Date();
        const maxDate = new Date();

        today.setHours(0, 0, 0, 0);
        minDate.setDate(today.getDate() + 1); // Minimum tomorrow
        maxDate.setFullYear(maxDate.getFullYear() + 1); // Max 1 year in future

        if (isNaN(startDate.getTime())) {
            errors.startDate = 'Please enter a valid date';
        } else if (startDate < minDate) {
            errors.startDate = 'Start date must be at least tomorrow';
        } else if (startDate > maxDate) {
            errors.startDate = 'Start date cannot be more than 1 year in the future';
        }

        // Check if start date is on a weekend for certain positions
        const dayOfWeek = startDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const officePositions = ['Front Office Manager', 'Assistant Manager', 'HR Coordinator'];

        if (isWeekend && officePositions.some(pos => details.jobTitle.includes(pos))) {
            errors.startDate = 'Office positions typically start on weekdays';
        }
    }

    // Start time validation with shift-based rules
    if (!details.startTime) {
        errors.startTime = 'Start time is required';
    } else {
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (!timeRegex.test(details.startTime)) {
            errors.startTime = 'Please enter a valid time format (HH:MM)';
        } else {
            const [hours, minutes] = details.startTime.split(':').map(Number);
            const timeInMinutes = hours * 60 + minutes;

            // Validate reasonable start times based on department
            const departmentTimeRules: Record<string, { min: number; max: number; name: string }> = {
                'Housekeeping': { min: 5 * 60, max: 11 * 60, name: 'Housekeeping (5:00 AM - 11:00 AM)' },
                'Front Desk': { min: 6 * 60, max: 23 * 60, name: 'Front Desk (6:00 AM - 11:00 PM)' },
                'Maintenance': { min: 6 * 60, max: 18 * 60, name: 'Maintenance (6:00 AM - 6:00 PM)' },
                'Food Service': { min: 5 * 60, max: 23 * 60, name: 'Food Service (5:00 AM - 11:00 PM)' },
                'Management': { min: 6 * 60, max: 22 * 60, name: 'Management (6:00 AM - 10:00 PM)' }
            };

            const rule = departmentTimeRules[details.department];
            if (rule && (timeInMinutes < rule.min || timeInMinutes > rule.max)) {
                errors.startTime = `Start time should be within typical ${rule.name} hours`;
            }
        }
    }

    // Enhanced pay rate validation with department-specific rules
    if (!details.payRate || details.payRate <= 0) {
        errors.payRate = 'Pay rate must be greater than 0';
    } else if (details.payRate < 7.25) {
        errors.payRate = 'Pay rate cannot be below federal minimum wage ($7.25)';
    } else if (details.payRate > 150) {
        errors.payRate = 'Pay rate exceeds maximum allowed ($150/hour)';
    } else if (!/^\d+(\.\d{1,2})?$/.test(details.payRate.toString())) {
        errors.payRate = 'Pay rate can have at most 2 decimal places';
    } else {
        // Department-specific pay rate validation
        const departmentPayRanges: Record<string, { min: number; max: number }> = {
            'Housekeeping': { min: 12.00, max: 25.00 },
            'Front Desk': { min: 14.00, max: 30.00 },
            'Maintenance': { min: 16.00, max: 35.00 },
            'Food Service': { min: 10.00, max: 28.00 },
            'Management': { min: 20.00, max: 50.00 }
        };

        const range = departmentPayRanges[details.department];
        if (range && (details.payRate < range.min || details.payRate > range.max)) {
            errors.payRate = `${details.department} pay rate typically ranges from $${range.min} - $${range.max}/hour`;
        }
    }

    // Pay frequency validation
    if (!details.payFrequency || !['weekly', 'bi-weekly'].includes(details.payFrequency)) {
        errors.payFrequency = 'Please select a valid pay frequency';
    }

    // Enhanced supervisor validation
    if (!details.directSupervisor.trim()) {
        errors.directSupervisor = 'Direct supervisor is required';
    } else if (details.directSupervisor.trim().length < 2) {
        errors.directSupervisor = 'Supervisor name must be at least 2 characters';
    } else if (details.directSupervisor.trim().length > 100) {
        errors.directSupervisor = 'Supervisor name cannot exceed 100 characters';
    } else if (!/^[a-zA-Z\s\-&.]+$/.test(details.directSupervisor.trim())) {
        errors.directSupervisor = 'Supervisor name contains invalid characters';
    }

    // Enhanced special instructions validation
    if (details.specialInstructions) {
        if (details.specialInstructions.length > 1000) {
            errors.specialInstructions = 'Special instructions cannot exceed 1000 characters';
        } else if (details.specialInstructions.trim().length < 10 && details.specialInstructions.trim().length > 0) {
            errors.specialInstructions = 'Special instructions should be at least 10 characters if provided';
        }

        // Check for potentially problematic content
        const problematicWords = ['discriminat', 'illegal', 'under the table', 'cash only'];
        const hasProblematicContent = problematicWords.some(word =>
            details.specialInstructions!.toLowerCase().includes(word)
        );

        if (hasProblematicContent) {
            errors.specialInstructions = 'Special instructions contain potentially problematic content';
        }
    }

    // Cross-field validation
    if (details.jobTitle.toLowerCase().includes('supervisor') || details.jobTitle.toLowerCase().includes('manager')) {
        if (details.payRate < 18.00) {
            errors.payRate = 'Supervisory positions typically require minimum $18/hour';
        }
        if (!details.benefitsEligible) {
            // This is a warning, not an error, so we'll add it to a warnings array if we had one
            // For now, we'll leave this as a comment for future enhancement
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
};

export const JobDetailsForm: React.FC<JobDetailsFormProps> = ({
    application,
    onSubmit,
    onCancel,
    loading = false,
}) => {
    const [formData, setFormData] = useState<JobDetails>({
        jobTitle: application.position,
        startDate: '',
        startTime: '09:00',
        payRate: 15.00,
        payFrequency: 'bi-weekly',
        department: application.department,
        benefitsEligible: true,
        directSupervisor: '',
        specialInstructions: '',
    });

    const [errors, setErrors] = useState<JobDetailsErrors>({});
    const [useTemplate, setUseTemplate] = useState(false);

    // Set minimum start date to tomorrow
    useEffect(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const minDate = tomorrow.toISOString().split('T')[0];

        if (!formData.startDate) {
            setFormData(prev => ({ ...prev, startDate: minDate }));
        }
    }, []);

    const validateForm = (): boolean => {
        const newErrors: JobDetailsErrors = {};

        // Job title validation
        if (!formData.jobTitle.trim()) {
            newErrors.jobTitle = 'Job title is required';
        } else if (formData.jobTitle.trim().length < 2) {
            newErrors.jobTitle = 'Job title must be at least 2 characters';
        } else if (formData.jobTitle.trim().length > 100) {
            newErrors.jobTitle = 'Job title cannot exceed 100 characters';
        }

        // Start date validation
        if (!formData.startDate) {
            newErrors.startDate = 'Start date is required';
        } else {
            const startDate = new Date(formData.startDate);
            const today = new Date();
            const maxDate = new Date();
            today.setHours(0, 0, 0, 0);
            maxDate.setFullYear(maxDate.getFullYear() + 1); // Max 1 year in future

            if (startDate <= today) {
                newErrors.startDate = 'Start date must be in the future';
            } else if (startDate > maxDate) {
                newErrors.startDate = 'Start date cannot be more than 1 year in the future';
            }
        }

        // Start time validation
        if (!formData.startTime) {
            newErrors.startTime = 'Start time is required';
        } else {
            const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
            if (!timeRegex.test(formData.startTime)) {
                newErrors.startTime = 'Please enter a valid time format (HH:MM)';
            }
        }

        // Pay rate validation with enhanced checks
        if (!formData.payRate || formData.payRate <= 0) {
            newErrors.payRate = 'Pay rate must be greater than 0';
        } else if (formData.payRate < 7.25) {
            newErrors.payRate = 'Pay rate cannot be below federal minimum wage ($7.25)';
        } else if (formData.payRate > 100) {
            newErrors.payRate = 'Pay rate seems unusually high, please verify';
        } else if (!/^\d+(\.\d{1,2})?$/.test(formData.payRate.toString())) {
            newErrors.payRate = 'Pay rate can have at most 2 decimal places';
        }

        // Pay frequency validation
        if (!formData.payFrequency || !['weekly', 'bi-weekly'].includes(formData.payFrequency)) {
            newErrors.payFrequency = 'Please select a valid pay frequency';
        }

        // Direct supervisor validation with enhanced checks
        if (!formData.directSupervisor.trim()) {
            newErrors.directSupervisor = 'Direct supervisor is required';
        } else if (formData.directSupervisor.trim().length < 2) {
            newErrors.directSupervisor = 'Supervisor name must be at least 2 characters';
        } else if (formData.directSupervisor.trim().length > 100) {
            newErrors.directSupervisor = 'Supervisor name cannot exceed 100 characters';
        }

        // Special instructions validation (optional but if provided, check length)
        if (formData.specialInstructions && formData.specialInstructions.length > 500) {
            newErrors.specialInstructions = 'Special instructions cannot exceed 500 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };



    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    const handleInputChange = (field: keyof JobDetails, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));

        // Clear error when user starts typing
        if (errors[field as keyof JobDetailsErrors]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const applyTemplate = (templateType: 'entry-level' | 'experienced' | 'supervisor' | 'position-specific' | keyof typeof QUICK_TEMPLATES) => {
        let template: Partial<JobDetails> = {};

        if (templateType === 'position-specific') {
            // Use position-specific template if available
            const departmentTemplates = JOB_TEMPLATES_BY_DEPARTMENT[application.department];
            const positionTemplate = departmentTemplates?.[application.position];

            if (positionTemplate) {
                template = {
                    ...positionTemplate,
                    department: application.department, // Keep the department
                };
            } else {
                // Check enhanced templates
                const enhancedTemplate = ENHANCED_JOB_TEMPLATES[application.department]?.[application.position];
                if (enhancedTemplate) {
                    template = {
                        ...enhancedTemplate,
                        department: application.department,
                    };
                } else {
                    // Fallback to experienced template
                    template = {
                        payRate: 18.00,
                        benefitsEligible: true,
                        startTime: '08:00',
                    };
                }
            }
        } else if (templateType in QUICK_TEMPLATES) {
            // Use quick templates
            const quickTemplate = QUICK_TEMPLATES[templateType as keyof typeof QUICK_TEMPLATES];
            template = {
                payRate: quickTemplate.payRate,
                benefitsEligible: quickTemplate.benefitsEligible,
                startTime: quickTemplate.startTime,
                payFrequency: quickTemplate.payFrequency,
            };

            // Adjust pay rate based on applicant's experience and department
            const experienceBonus = getExperienceBonus(application.yearsExperience);
            const departmentMultiplier = getDepartmentMultiplier(application.department);

            template.payRate = Math.round(((template.payRate || 15) + experienceBonus) * departmentMultiplier * 100) / 100;

            // Hotel experience bonus
            if (application.hotelExperience) {
                template.payRate = Math.round((template.payRate + 1.00) * 100) / 100;
            }
        } else {
            // Use legacy generic templates with experience-based adjustments
            const baseTemplates = {
                'entry-level': {
                    payRate: 15.00,
                    benefitsEligible: false,
                    startTime: '09:00',
                },
                'experienced': {
                    payRate: 18.00,
                    benefitsEligible: true,
                    startTime: '08:00',
                },
                'supervisor': {
                    payRate: 22.00,
                    benefitsEligible: true,
                    startTime: '07:00',
                },
            };

            template = baseTemplates[templateType as keyof typeof baseTemplates];

            // Adjust pay rate based on applicant's experience
            if (application.hotelExperience && templateType !== 'supervisor') {
                template.payRate = (template.payRate || 15) + 1.00; // $1 bonus for hotel experience
            }

            // Adjust for years of experience
            const experienceBonus = getExperienceBonus(application.yearsExperience);
            template.payRate = (template.payRate || 15) + experienceBonus;
        }

        setFormData(prev => ({ ...prev, ...template }));
        setUseTemplate(false);
    };

    const getDepartmentMultiplier = (department: string): number => {
        const multipliers: Record<string, number> = {
            'Housekeeping': 1.0,
            'Front Desk': 1.1,
            'Maintenance': 1.25,
            'Food Service': 1.05,
            'Management': 1.4,
        };
        return multipliers[department] || 1.0;
    };

    const getExperienceBonus = (yearsExperience: string): number => {
        switch (yearsExperience) {
            case 'zero_to_one':
                return 0;
            case 'one_to_three':
                return 0.50;
            case 'three_to_five':
                return 1.00;
            case 'five_plus':
                return 1.50;
            default:
                return 0;
        }
    };

    const getSuggestedPayRate = (): { min: number; max: number; recommended: number } => {
        const basePay = 15.00;
        let min = basePay;
        let max = basePay + 5.00;
        let recommended = basePay + 1.00;

        // Adjust based on department
        const departmentMultipliers: Record<string, number> = {
            'Housekeeping': 1.0,
            'Front Desk': 1.1,
            'Maintenance': 1.2,
            'Food Service': 1.05,
            'Management': 1.5,
        };

        const multiplier = departmentMultipliers[application.department] || 1.0;
        min *= multiplier;
        max *= multiplier;
        recommended *= multiplier;

        // Adjust for experience
        const experienceBonus = getExperienceBonus(application.yearsExperience);
        recommended += experienceBonus;

        // Hotel experience bonus
        if (application.hotelExperience) {
            recommended += 1.00;
        }

        return {
            min: Math.round(min * 100) / 100,
            max: Math.round(max * 100) / 100,
            recommended: Math.round(recommended * 100) / 100,
        };
    };

    const getJobTitles = () => {
        return JOB_TITLES_BY_DEPARTMENT[application.department] || [];
    };

    const getSupervisors = () => {
        return getSupervisorTitles(application.department);
    };

    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Job Details for {application.firstName} {application.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">
                                {application.position} - {application.department}
                            </p>
                        </div>

                        {/* Template Dropdown */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setUseTemplate(!useTemplate)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                Use Template
                                <svg className="ml-2 -mr-0.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {useTemplate && (
                                <div className="absolute right-0 mt-2 w-64 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                                    <div className="py-1">
                                        {/* Position-specific template */}
                                        {(JOB_TEMPLATES_BY_DEPARTMENT[application.department]?.[application.position] ||
                                            ENHANCED_JOB_TEMPLATES[application.department]?.[application.position]) && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => applyTemplate('position-specific')}
                                                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-medium"
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <span>{application.position} Template</span>
                                                            <span className="text-xs text-green-600">Recommended</span>
                                                        </div>
                                                    </button>
                                                    <div className="border-t border-gray-100"></div>
                                                </>
                                            )}

                                        {/* Quick templates */}
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Quick Templates
                                        </div>
                                        {Object.entries(QUICK_TEMPLATES).map(([key, template]) => (
                                            <button
                                                key={key}
                                                type="button"
                                                onClick={() => applyTemplate(key as keyof typeof QUICK_TEMPLATES)}
                                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                            >
                                                <div>
                                                    <div className="font-medium">{template.name}</div>
                                                    <div className="text-xs text-gray-500">{template.description}</div>
                                                </div>
                                            </button>
                                        ))}

                                        <div className="border-t border-gray-100"></div>

                                        {/* Legacy templates */}
                                        <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                            Experience Level
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => applyTemplate('entry-level')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Entry Level ($15/hr)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyTemplate('experienced')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Experienced ($18/hr)
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applyTemplate('supervisor')}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                            Supervisor ($22/hr)
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Job Title */}
                        <div>
                            <label htmlFor="jobTitle" className="block text-sm font-medium text-gray-700">
                                Job Title *
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="jobTitle"
                                    list="jobTitles"
                                    value={formData.jobTitle}
                                    onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.jobTitle ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter job title"
                                />
                                <datalist id="jobTitles">
                                    {getJobTitles().map(title => (
                                        <option key={title} value={title} />
                                    ))}
                                </datalist>
                            </div>
                            {errors.jobTitle && (
                                <p className="mt-1 text-sm text-red-600">{errors.jobTitle}</p>
                            )}
                        </div>

                        {/* Department (readonly) */}
                        <div>
                            <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                                Department
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="department"
                                    value={formData.department}
                                    readOnly
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500"
                                />
                            </div>
                        </div>

                        {/* Start Date */}
                        <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                                Start Date *
                            </label>
                            <div className="mt-1">
                                <input
                                    type="date"
                                    id="startDate"
                                    value={formData.startDate}
                                    min={getTomorrowDate()}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.startDate ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.startDate && (
                                <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                            )}
                        </div>

                        {/* Start Time */}
                        <div>
                            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                                Start Time *
                            </label>
                            <div className="mt-1">
                                <input
                                    type="time"
                                    id="startTime"
                                    value={formData.startTime}
                                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.startTime ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                />
                            </div>
                            {errors.startTime && (
                                <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>
                            )}
                        </div>

                        {/* Pay Rate */}
                        <div>
                            <label htmlFor="payRate" className="block text-sm font-medium text-gray-700">
                                Pay Rate (per hour) *
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <input
                                    type="number"
                                    id="payRate"
                                    step="0.25"
                                    min="7.25"
                                    max="100"
                                    value={formData.payRate}
                                    onChange={(e) => handleInputChange('payRate', parseFloat(e.target.value))}
                                    className={`block w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.payRate ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="15.00"
                                />
                            </div>
                            {/* Pay Rate Suggestion */}
                            <div className="mt-1 text-xs text-gray-600">
                                {(() => {
                                    const suggestion = getSuggestedPayRate();
                                    return (
                                        <span>
                                            Suggested range: ${suggestion.min.toFixed(2)} - ${suggestion.max.toFixed(2)}
                                            <button
                                                type="button"
                                                onClick={() => handleInputChange('payRate', suggestion.recommended)}
                                                className="ml-2 text-blue-600 hover:text-blue-800 underline"
                                            >
                                                Use ${suggestion.recommended.toFixed(2)}
                                            </button>
                                        </span>
                                    );
                                })()}
                            </div>
                            {errors.payRate && (
                                <p className="mt-1 text-sm text-red-600">{errors.payRate}</p>
                            )}
                        </div>

                        {/* Pay Frequency */}
                        <div>
                            <label htmlFor="payFrequency" className="block text-sm font-medium text-gray-700">
                                Pay Frequency *
                            </label>
                            <div className="mt-1">
                                <select
                                    id="payFrequency"
                                    value={formData.payFrequency}
                                    onChange={(e) => handleInputChange('payFrequency', e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="weekly">Weekly</option>
                                    <option value="bi-weekly">Bi-weekly</option>
                                </select>
                            </div>
                        </div>

                        {/* Direct Supervisor */}
                        <div className="md:col-span-2">
                            <label htmlFor="directSupervisor" className="block text-sm font-medium text-gray-700">
                                Direct Supervisor *
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    id="directSupervisor"
                                    list="supervisors"
                                    value={formData.directSupervisor}
                                    onChange={(e) => handleInputChange('directSupervisor', e.target.value)}
                                    className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.directSupervisor ? 'border-red-300' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter supervisor name"
                                />
                                <datalist id="supervisors">
                                    {getSupervisors().map(supervisor => (
                                        <option key={supervisor} value={supervisor} />
                                    ))}
                                </datalist>
                            </div>
                            {errors.directSupervisor && (
                                <p className="mt-1 text-sm text-red-600">{errors.directSupervisor}</p>
                            )}
                        </div>
                    </div>

                    {/* Benefits Eligible */}
                    <div className="flex items-center">
                        <input
                            id="benefitsEligible"
                            type="checkbox"
                            checked={formData.benefitsEligible}
                            onChange={(e) => handleInputChange('benefitsEligible', e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <label htmlFor="benefitsEligible" className="ml-2 block text-sm text-gray-900">
                            Benefits Eligible
                        </label>
                    </div>

                    {/* Special Instructions */}
                    <div>
                        <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700">
                            Special Instructions
                            <span className={`text-xs ml-2 ${(formData.specialInstructions?.length || 0) > 450 ? 'text-orange-600' :
                                    (formData.specialInstructions?.length || 0) > 400 ? 'text-yellow-600' : 'text-gray-500'
                                }`}>
                                ({formData.specialInstructions?.length || 0}/500 characters)
                            </span>
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="specialInstructions"
                                rows={4}
                                maxLength={500}
                                value={formData.specialInstructions}
                                onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                                className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${errors.specialInstructions ? 'border-red-300' : 'border-gray-300'
                                    }`}
                                placeholder="Any special instructions for the new employee (e.g., training requirements, equipment needs, schedule notes)..."
                            />
                        </div>

                        {/* Helpful suggestions */}
                        <div className="mt-2 text-xs text-gray-600">
                            <div className="flex flex-wrap gap-2">
                                <span className="text-gray-500">Suggestions:</span>
                                {[
                                    'Training provided for first week',
                                    'Must have own transportation',
                                    'Flexible scheduling available',
                                    'Uniform provided',
                                    'Background check required'
                                ].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            const current = formData.specialInstructions || '';
                                            const newText = current ? `${current}. ${suggestion}` : suggestion;
                                            if (newText.length <= 500) {
                                                handleInputChange('specialInstructions', newText);
                                            }
                                        }}
                                        className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                                    >
                                        + {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {errors.specialInstructions && (
                            <p className="mt-1 text-sm text-red-600">{errors.specialInstructions}</p>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {loading && (
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            )}
                            Approve & Send Offer
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};