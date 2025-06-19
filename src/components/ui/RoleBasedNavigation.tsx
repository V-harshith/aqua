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
      {/* User info */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-semibold text-lg">
              {userProfile.full_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">
              {userProfile.full_name}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {userProfile.role.replace('_', ' ')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 px-4 py-4">
        <RoleBasedNavigation 
          orientation="vertical" 
          showIcons={true} 
          showDescriptions={false}
        />
      </div>

      {/* Sign out */}
      <div className="p-4 border-t border-gray-200">
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

// Header navigation component
export function HeaderNavigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { userProfile, signOut } = useAuthContext();

  if (!userProfile) return null;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl mr-2">💧</span>
              <span className="text-xl font-bold text-blue-600">Project Aqua</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <RoleBasedNavigation 
              orientation="horizontal" 
              showIcons={false} 
              showDescriptions={false}
              className="items-center"
            />
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-semibold">
                  {userProfile.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="ml-2 text-gray-700 hidden sm:block">
                {userProfile.full_name}
              </span>
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">
                      {userProfile.full_name}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {userProfile.role.replace('_', ' ')}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      signOut();
                      setIsMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 pt-4 pb-4">
            <RoleBasedNavigation 
              orientation="vertical" 
              showIcons={true} 
              showDescriptions={false}
            />
          </div>
        )}
      </div>
    </header>
  );
} 