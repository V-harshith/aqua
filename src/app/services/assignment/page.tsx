'use client';

import { RoleGuard } from '@/components/auth/RoleGuard';
import { ServiceAssignmentWorkflow } from '@/components/services/ServiceAssignmentWorkflow';

export default function ServiceAssignmentPage() {
  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'service_manager']}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access service assignment.
            </p>
          </div>
        </div>
      }
    >
      <ServiceAssignmentWorkflow />
    </RoleGuard>
  );
} 