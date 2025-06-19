'use client';

import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { RoleGuard } from '@/components/auth/RoleGuard';

export default function AdminPage() {
  return (
    <RoleGuard allowedRoles={['admin', 'dept_head']}>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Admin Panel</h1>
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">
              Welcome to the Admin Dashboard
            </h2>
            <p className="text-gray-600">
              Select a section from the navigation to manage system components.
            </p>
          </CardContent>
        </Card>
      </div>
    </RoleGuard>
  );
} 