import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Icon } from '../ui/Icon';
import { useLayoutStore } from '../../stores/layoutStore';
import { Breadcrumb } from '../../types/navigation';

interface BreadcrumbsProps {
  className?: string;
  items?: Breadcrumb[];
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ className, items }) => {
  const { breadcrumbs } = useLayoutStore();
  const breadcrumbItems = items || breadcrumbs;

  if (!breadcrumbItems || breadcrumbItems.length === 0) {
    return null;
  }

  return (
    <nav className={cn('flex items-center space-x-2 text-sm', className)} aria-label="Breadcrumb">
      <Link
        to="/dashboard"
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
      >
        <Icon name="Home" size={16} className="mr-1" />
        <span className="sr-only">Home</span>
      </Link>

      {breadcrumbItems.map((item, index) => (
        <React.Fragment key={index}>
          <Icon name="ChevronRight" size={14} className="text-gray-400 dark:text-gray-500" />
          
          {item.href && index < breadcrumbItems.length - 1 ? (
            <Link
              to={item.href}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-gray-900 dark:text-white font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};