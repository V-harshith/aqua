'use client';

import UserManagement from '@/components/admin/UserManagement';
import { RoleGuard } from '@/components/auth/RoleGuard';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
          {/* Navigation Breadcrumbs */}
          <Card>
            <div className="p-4">
              <nav className="flex items-center space-x-2 text-sm text-gray-600">
                <Link href="/dashboard" className="hover:text-blue-600 flex items-center transition-colors">
                  <span className="mr-1">🏠</span>
                  Main Dashboard
                </Link>
                <span>›</span>
                <Link href="/admin" className="hover:text-blue-600 transition-colors">
                  Admin Panel
                </Link>
                <span>›</span>
                <span className="text-gray-900 font-medium">User Management</span>
              </nav>
            </div>
          </Card>

          {/* Header */}
          <Card>
            <div className="flex items-center justify-between p-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage all system users, roles, and permissions</p>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => window.location.href = '/admin'}
                  variant="outline"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50"
                >
                  ⬅️ Back to Admin
                </Button>
                <Link href="/admin/users/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    ➕ Add New User
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          {/* User Management Content */}
          <UserManagement />
        </div>
      </div>
    </RoleGuard>
  );
} 