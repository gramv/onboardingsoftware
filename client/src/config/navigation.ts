import { NavigationItem } from '../types/navigation';

export const navigationItems: NavigationItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: 'LayoutDashboard',
    href: '/dashboard',
    roles: ['hr_admin', 'manager', 'employee'],
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: 'Users',
    href: '/employees',
    roles: ['hr_admin', 'manager'],
    children: [
      {
        id: 'employees-list',
        label: 'Employee Directory',
        icon: 'List',
        href: '/employees',
        roles: ['hr_admin', 'manager'],
      },
      {
        id: 'employees-create',
        label: 'Add Employee',
        icon: 'UserPlus',
        href: '/employees/create',
        roles: ['hr_admin', 'manager'],
      },
      {
        id: 'employees-onboarding',
        label: 'Onboarding',
        icon: 'UserCheck',
        href: '/employees/onboarding',
        roles: ['hr_admin', 'manager'],
      },
    ],
  },
  {
    id: 'scheduling',
    label: 'Scheduling',
    icon: 'Calendar',
    href: '/scheduling',
    roles: ['hr_admin', 'manager'],
    children: [
      {
        id: 'scheduling-overview',
        label: 'Schedule Overview',
        icon: 'CalendarDays',
        href: '/scheduling',
        roles: ['hr_admin', 'manager'],
      },
      {
        id: 'scheduling-templates',
        label: 'Schedule Templates',
        icon: 'CalendarRange',
        href: '/scheduling/templates',
        roles: ['hr_admin', 'manager'],
      },
    ],
  },
  {
    id: 'my-schedule',
    label: 'My Schedule',
    icon: 'Calendar',
    href: '/my-schedule',
    roles: ['employee'],
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: 'FileText',
    href: '/documents',
    roles: ['hr_admin', 'manager', 'employee'],
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: 'MessageSquare',
    href: '/messages',
    roles: ['hr_admin', 'manager', 'employee'],
  },
  {
    id: 'announcements',
    label: 'Announcements',
    icon: 'Megaphone',
    href: '/announcements',
    roles: ['hr_admin', 'manager', 'employee'],
    children: [
      {
        id: 'announcements-view',
        label: 'View Announcements',
        icon: 'Eye',
        href: '/announcements',
        roles: ['hr_admin', 'manager', 'employee'],
      },
      {
        id: 'announcements-create',
        label: 'Create Announcement',
        icon: 'Plus',
        href: '/announcements/create',
        roles: ['hr_admin', 'manager'],
      },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: 'BarChart3',
    href: '/reports',
    roles: ['hr_admin'],
    children: [
      {
        id: 'reports-overview',
        label: 'Overview',
        icon: 'TrendingUp',
        href: '/reports',
        roles: ['hr_admin'],
      },
      {
        id: 'reports-compliance',
        label: 'Compliance',
        icon: 'Shield',
        href: '/reports/compliance',
        roles: ['hr_admin'],
      },
      {
        id: 'reports-payroll',
        label: 'Payroll',
        icon: 'DollarSign',
        href: '/reports/payroll',
        roles: ['hr_admin'],
      },
    ],
  },
  {
    id: 'profile',
    label: 'My Profile',
    icon: 'User',
    href: '/profile',
    roles: ['hr_admin', 'manager', 'employee'],
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: 'Settings',
    href: '/settings',
    roles: ['hr_admin'],
    children: [
      {
        id: 'settings-organization',
        label: 'Organization',
        icon: 'Building',
        href: '/settings/organization',
        roles: ['hr_admin'],
      },
      {
        id: 'settings-users',
        label: 'User Management',
        icon: 'UserCog',
        href: '/settings/users',
        roles: ['hr_admin'],
      },
      {
        id: 'settings-system',
        label: 'System Settings',
        icon: 'Cog',
        href: '/settings/system',
        roles: ['hr_admin'],
      },
    ],
  },
];

export const getFilteredNavigation = (userRole: string): NavigationItem[] => {
  return navigationItems
    .filter((item) => item.roles.includes(userRole as any))
    .map((item) => ({
      ...item,
      children: item.children?.filter((child) => child.roles.includes(userRole as any)),
    }));
};