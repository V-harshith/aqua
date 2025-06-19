'use client';

import UserManagement from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head']}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">User Management</h1>
        <UserManagement />
      </div>
    </RoleGuard>
  );
} 