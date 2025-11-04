'use client';

export const dynamic = 'force-dynamic';

import { EnhancedAdminDashboard } from '@/components/dashboard/EnhancedAdminDashboard';
import { RoleGuard } from '@/components/auth/RoleGuard';
export default function AdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive system overview and management tools
            </p>
          </div>
          <EnhancedAdminDashboard />
        </div>
      </div>
    </RoleGuard>
  );
} 