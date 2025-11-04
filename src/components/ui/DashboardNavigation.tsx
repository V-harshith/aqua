'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { NotificationDropdown } from './NotificationDropdown';
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
      href: '/services',
      label: 'Services',
      icon: '🔧',
      description: 'Service management',
      requiredRoles: ['admin', 'dept_head', 'service_manager', 'technician', 'customer']
    },
    {
      href: '/complaints',
      label: 'Complaints',
      icon: '📝',
      description: 'Manage complaints',
      requiredRoles: ['admin', 'dept_head', 'service_manager', 'technician', 'customer']
    },
    {
      href: '/notifications',
      label: 'Notifications',
      icon: '🔔',
      description: 'View notifications'
    },
    {
      href: '/profile',
      label: 'Profile',
      icon: '👤',
      description: 'Manage your profile'
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: '⚙️',
      description: 'Application settings'
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
    }
  ];
  const filteredNavItems = navItems.filter(item => {
    if (!item.requiredRoles) return true;
    return userProfile && item.requiredRoles.includes(userProfile.role);
  });
  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4 md:space-x-8 overflow-x-auto scrollbar-hide">
          {filteredNavItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  group inline-flex items-center px-2 md:px-1 py-4 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap min-w-0 flex-shrink-0
                  ${isActive 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-1 md:mr-2 text-base md:text-sm">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          </div>
          
          {/* Right side - Notifications and User Menu */}
          <div className="flex items-center space-x-4">
            <NotificationDropdown />
            
            <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600">
              <span className="font-medium">{userProfile?.full_name}</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                {userProfile?.role?.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 