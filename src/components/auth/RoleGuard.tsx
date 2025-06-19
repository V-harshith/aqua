'use client';

import { ReactNode } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
  requiredRole?: UserRole;
  requireAny?: boolean; // If true, user needs ANY of the allowedRoles, if false needs ALL
  fallback?: ReactNode;
  showUnauthorized?: boolean;
}

export function RoleGuard({
  children,
  allowedRoles,
  requiredRole,
  requireAny = true,
  fallback = null,
  showUnauthorized = false
}: RoleGuardProps) {
  const { userProfile, loading } = useAuthContext();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!userProfile) {
    return showUnauthorized ? (
      <div className="text-center p-4 text-gray-500">
        Please sign in to access this content.
      </div>
    ) : fallback;
  }

  // Check specific role requirement
  if (requiredRole && userProfile.role !== requiredRole) {
    return showUnauthorized ? (
      <div className="text-center p-4 text-red-500">
        Access denied. Required role: {requiredRole}
      </div>
    ) : fallback;
  }

  // Check allowed roles
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = requireAny 
      ? allowedRoles.includes(userProfile.role)
      : allowedRoles.every(role => role === userProfile.role);

    if (!hasPermission) {
      return showUnauthorized ? (
        <div className="text-center p-4 text-red-500">
          Access denied. You don't have permission to view this content.
        </div>
      ) : fallback;
    }
  }

  // User has permission, render children
  return <>{children}</>;
}

// Specific role guards for common use cases
export function AdminGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole="admin" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function ManagerGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'service_manager', 'accounts_manager', 'product_manager', 'driver_manager']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function TechnicianGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'service_manager', 'technician']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

export function CustomerGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard requiredRole="customer" fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

export function StaffGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'driver_manager', 'service_manager', 'accounts_manager', 'product_manager', 'technician']} 
      fallback={fallback}
    >
      {children}
    </RoleGuard>
  );
}

// Role-based navigation helpers
export function useRolePermissions() {
  const { userProfile } = useAuthContext();

  if (!userProfile) {
    return {
      canViewAdmin: false,
      canManageUsers: false,
      canManageCustomers: false,
      canManageComplaints: false,
      canManageServices: false,
      canManageDrivers: false,
      canManageAccounts: false,
      canManageProducts: false,
      canViewReports: false,
      isCustomer: false,
      isStaff: false
    };
  }

  const role = userProfile.role;

  return {
    canViewAdmin: role === 'admin',
    canManageUsers: ['admin', 'dept_head'].includes(role),
    canManageCustomers: ['admin', 'dept_head', 'service_manager'].includes(role),
    canManageComplaints: ['admin', 'dept_head', 'service_manager', 'technician'].includes(role),
    canManageServices: ['admin', 'dept_head', 'service_manager', 'technician'].includes(role),
    canManageDrivers: ['admin', 'dept_head', 'driver_manager'].includes(role),
    canManageAccounts: ['admin', 'dept_head', 'accounts_manager'].includes(role),
    canManageProducts: ['admin', 'dept_head', 'product_manager'].includes(role),
    canViewReports: ['admin', 'dept_head', 'service_manager', 'accounts_manager', 'driver_manager', 'product_manager'].includes(role),
    isCustomer: role === 'customer',
    isStaff: ['admin', 'dept_head', 'driver_manager', 'service_manager', 'accounts_manager', 'product_manager', 'technician'].includes(role)
  };
} 