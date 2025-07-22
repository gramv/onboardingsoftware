import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Sidebar } from './Sidebar';
import { TopNavigation } from './TopNavigation';
import { Breadcrumbs } from './Breadcrumbs';
import { useLayoutStore } from '../../stores/layoutStore';
import { useAuthStore } from '../../stores/authStore';

interface LayoutProps {
  className?: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ className, children }) => {
  const location = useLocation();
  const { sidebarCollapsed, setBreadcrumbs } = useLayoutStore();
  const { isAuthenticated } = useAuthStore();

  // Update breadcrumbs based on current route
  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/');
      const label = segment.charAt(0).toUpperCase() + segment.slice(1).replace('-', ' ');
      
      return {
        label,
        href: index < pathSegments.length - 1 ? href : undefined,
      };
    });

    setBreadcrumbs(breadcrumbs);
  }, [location.pathname, setBreadcrumbs]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gray-50 dark:bg-gray-900', className)}>
      <Sidebar />
      <TopNavigation />
      
      {/* Main Content */}
      <main
        className={cn(
          'pt-16 transition-all duration-300',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Breadcrumbs */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Breadcrumbs />
        </div>

        {/* Page Content */}
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
};