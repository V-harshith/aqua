'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';

interface NavItem {
  href: string;
  label: string;
  icon: string;
  description: string;
  requiredRoles?: string[];
}

export function DashboardNavigation() {
  const pathname = usePathname();
  const { userProfile } = useAuthContext();

  const navItems: NavItem[] = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: '🏠',
      description: 'Main dashboard overview'
    },
    {
      href: '/admin',
      label: 'Admin Panel',
      icon: '⚙️',
      description: 'System administration',
      requiredRoles: ['admin', 'dept_head']
    },
    {
      href: '/admin/users',
      label: 'User Management',
      icon: '👥',
      description: 'Manage system users',
      requiredRoles: ['admin', 'dept_head']
    },
    {
      href: '/admin/users/new',
      label: 'Add User',
      icon: '➕',
      description: 'Create new user',
      requiredRoles: ['admin', 'dept_head']
    },
    {
      href: '/complaints',
      label: 'Complaints',
      icon: '📝',
      description: 'Manage complaints',
      requiredRoles: ['admin', 'dept_head', 'service_manager', 'technician', 'customer']
    },
    {
      href: '/services',
      label: 'Services',
      icon: '🔧',
      description: 'Service management',
      requiredRoles: ['admin', 'dept_head', 'service_manager', 'technician']
    }
  ];

  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRoles) return true;
    return userProfile && item.requiredRoles.includes(userProfile.role);
  });

  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8 overflow-x-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group inline-flex items-center px-1 py-4 border-b-2 font-medium text-sm whitespace-nowrap
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
} 