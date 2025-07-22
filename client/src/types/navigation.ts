export interface NavigationItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  roles: ('hr_admin' | 'manager' | 'employee')[];
  children?: NavigationItem[];
  badge?: string | number;
}

export interface Breadcrumb {
  label: string;
  href?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

export type Theme = 'light' | 'dark' | 'system';

export interface LayoutState {
  sidebarCollapsed: boolean;
  theme: Theme;
  notifications: Notification[];
  unreadCount: number;
  breadcrumbs: Breadcrumb[];
}