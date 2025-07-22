import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { Icon, IconName } from '../ui/Icon';
import { useAuthStore } from '../../stores/authStore';
import { useLayoutStore } from '../../stores/layoutStore';
import { getFilteredNavigation } from '../../config/navigation';
import { NavigationItem } from '../../types/navigation';

interface SidebarProps {
  className?: string;
}

interface NavItemProps {
  item: NavigationItem;
  isCollapsed: boolean;
  level?: number;
}

const NavItem: React.FC<NavItemProps> = ({ item, isCollapsed, level = 0 }) => {
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const isActive = location.pathname === item.href || 
    (item.children && item.children.some(child => location.pathname === child.href));
  
  const hasChildren = item.children && item.children.length > 0;
  const shouldShowChildren = hasChildren && isExpanded && !isCollapsed;

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren && !isCollapsed) {
      e.preventDefault();
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className="w-full">
      <Link
        to={hasChildren ? '#' : item.href}
        onClick={handleClick}
        className={cn(
          'flex items-center w-full px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 group',
          'hover:bg-gray-100 dark:hover:bg-gray-800',
          isActive && 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300',
          !isActive && 'text-gray-700 dark:text-gray-300',
          level > 0 && 'ml-4',
          isCollapsed && 'justify-center px-2'
        )}
      >
        <Icon 
          name={item.icon as IconName} 
          size={18} 
          className={cn(
            'flex-shrink-0',
            isActive && 'text-primary-600 dark:text-primary-400',
            !isCollapsed && 'mr-3'
          )} 
        />
        
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">{item.label}</span>
            
            {item.badge && (
              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                {item.badge}
              </span>
            )}
            
            {hasChildren && (
              <Icon
                name={isExpanded ? 'ChevronDown' : 'ChevronRight'}
                size={16}
                className="ml-2 text-gray-400"
              />
            )}
          </>
        )}
      </Link>

      {shouldShowChildren && (
        <div className="mt-1 space-y-1">
          {item.children?.map((child) => (
            <NavItem
              key={child.id}
              item={child}
              isCollapsed={false}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const { user } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar } = useLayoutStore();
  
  const navigationItems = user ? getFilteredNavigation(user.role) : [];

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 dark:border-gray-800">
        {!sidebarCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <Icon name="Building" size={18} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Motel Manager
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user?.organizationName}
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Icon 
            name={sidebarCollapsed ? 'Menu' : 'X'} 
            size={18} 
            className="text-gray-600 dark:text-gray-400" 
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isCollapsed={sidebarCollapsed}
          />
        ))}
      </nav>

      {/* Sidebar Footer */}
      {!sidebarCollapsed && user && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <Icon name="User" size={16} className="text-gray-600 dark:text-gray-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {user.role.replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};