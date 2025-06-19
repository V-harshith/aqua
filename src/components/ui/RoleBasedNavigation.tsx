"use client";

import React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { useRolePermissions } from '@/components/auth/RoleGuard';
import { UserRole } from '@/lib/supabase';

interface NavItem {
  label: string;
  href: string;
  icon?: string;
  description?: string;
  roles: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: '📊',
    description: 'Overview and metrics',
    roles: ['admin', 'dept_head', 'driver_manager', 'service_manager', 'accounts_manager', 'product_manager', 'technician', 'customer']
  },
  {
    label: 'Admin Dashboard',
    href: '/admin/dashboard',
    icon: '🎛️',
    description: 'Enhanced admin control panel',
    roles: ['admin', 'dept_head']
  },
  {
    label: 'Admin Panel',
    href: '/admin',
    icon: '⚙️',
    description: 'System administration',
    roles: ['admin']
  },
  {
    label: 'User Management',
    href: '/admin/users',
    icon: '👥',
    description: 'Manage system users',
    roles: ['admin', 'dept_head']
  },
  {
    label: 'Customer Management',
    href: '/customers',
    icon: '🏢',
    description: 'Customer accounts and profiles',
    roles: ['admin', 'dept_head', 'service_manager']
  },
  {
    label: 'Complaints',
    href: '/complaints',
    icon: '📝',
    description: 'Customer complaints and issues',
    roles: ['admin', 'dept_head', 'service_manager', 'technician', 'customer']
  },
  {
    label: 'Services',
    href: '/services',
    icon: '🔧',
    description: 'Service requests and schedules',
    roles: ['admin', 'dept_head', 'service_manager', 'dispatcher', 'technician', 'customer']
  },
  {
    label: 'Service Assignment',
    href: '/services/assignment',
    icon: '📋',
    description: 'Assign technicians to service requests',
    roles: ['admin', 'dept_head', 'service_manager']
  },
  {
    label: 'Water Distribution',
    href: '/distribution',
    icon: '🚚',
    description: 'Water distribution management',
    roles: ['admin', 'dept_head', 'driver_manager']
  },
  {
    label: 'Driver Management',
    href: '/driver',
    icon: '🚛',
    description: 'Water distribution and driver operations',
    roles: ['admin', 'dept_head', 'driver_manager']
  },
  {
    label: 'Accounts & Payments',
    href: '/accounts',
    icon: '💰',
    description: 'Financial management',
    roles: ['admin', 'dept_head', 'accounts_manager']
  },
  {
    label: 'Products & Inventory',
    href: '/products',
    icon: '📦',
    description: 'Product catalog and inventory',
    roles: ['admin', 'dept_head', 'product_manager']
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: '📈',
    description: 'Analytics and reports',
    roles: ['admin', 'dept_head', 'service_manager', 'accounts_manager', 'driver_manager', 'product_manager']
  }
];

interface RoleBasedNavigationProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showIcons?: boolean;
  showDescriptions?: boolean;
}

export function RoleBasedNavigation({
  className = '',
  orientation = 'vertical',
  showIcons = true,
  showDescriptions = false
}: RoleBasedNavigationProps) {
  const { userProfile } = useAuthContext();

  if (!userProfile) {
    return null;
  }

  // Filter navigation items based on user role
  const allowedItems = navigationItems.filter(item => 
    item.roles.includes(userProfile.role)
  );

  const baseClasses = orientation === 'horizontal' 
    ? 'flex flex-wrap gap-2' 
    : 'space-y-1';

  return (
    <nav className={`${baseClasses} ${className}`}>
      {allowedItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`
            group flex items-center px-3 py-2 text-sm font-medium rounded-lg
            text-gray-700 hover:text-blue-600 hover:bg-blue-50
            transition-colors duration-200
            ${orientation === 'horizontal' ? 'flex-col text-center min-w-[80px]' : 'flex-row'}
          `}
        >
          {showIcons && item.icon && (
            <span className={`
              text-lg
              ${orientation === 'horizontal' ? 'mb-1' : 'mr-3'}
            `}>
              {item.icon}
            </span>
          )}
          <div className={orientation === 'horizontal' ? 'text-center' : ''}>
            <div className="font-medium">{item.label}</div>
            {showDescriptions && item.description && (
              <div className="text-xs text-gray-500 mt-1">
                {item.description}
              </div>
            )}
          </div>
        </Link>
      ))}
    </nav>
  );
}

// Sidebar navigation component
export function SidebarNavigation() {
  const { userProfile, signOut } = useAuthContext();
  const permissions = useRolePermissions();

  if (!userProfile) return null;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold">💧</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Aqua Management</h1>
            <p className="text-xs text-gray-500 capitalize">{userProfile.role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <RoleBasedNavigation 
          orientation="vertical" 
          showIcons={true} 
          showDescriptions={false}
        />
      </div>

      {/* User section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {userProfile.full_name || userProfile.email}
            </p>
            <p className="text-xs text-gray-500 truncate">{userProfile.email}</p>
          </div>
        </div>
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors duration-200"
        >
          <span className="mr-3">🚪</span>
          Sign Out
        </button>
      </div>
    </div>
  );
}

// Header navigation for mobile/compact layouts
export function HeaderNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userProfile, signOut } = useAuthContext();

  if (!userProfile) return null;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">💧</span>
            </div>
            <h1 className="text-lg font-bold text-gray-900">Aqua Management</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <RoleBasedNavigation 
              orientation="horizontal" 
              showIcons={true} 
              showDescriptions={false}
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
            >
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  {userProfile.full_name?.charAt(0) || userProfile.email?.charAt(0) || 'U'}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">
                {userProfile.full_name || userProfile.email}
              </span>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">
                    {userProfile.full_name || userProfile.email}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {userProfile.role.replace('_', ' ')}
                  </p>
                </div>
                
                {/* Mobile Navigation */}
                <div className="md:hidden">
                  <RoleBasedNavigation 
                    className="px-2 py-2"
                    orientation="vertical" 
                    showIcons={true} 
                    showDescriptions={false}
                  />
                </div>
                
                <div className="border-t border-gray-200 mt-2">
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
} 