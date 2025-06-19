'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { EnhancedAdminDashboard } from '@/components/dashboard/EnhancedAdminDashboard';

export default function AdminDashboardPage() {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head']}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access the admin dashboard.
            </p>
          </div>
        </div>
      }
    >
      <EnhancedAdminDashboard />
    </RoleGuard>
  );
} 