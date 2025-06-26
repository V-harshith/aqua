import { DriverDashboard } from '../../components/driver/DriverDashboard';
import { RoleGuard } from '../../components/auth/RoleGuard';
export default function DriverPage() {
  return (
    <RoleGuard allowedRoles={['driver_manager', 'admin', 'dept_head']}>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
          <p className="text-gray-600 mt-2">
            Manage water distribution operations, track routes, and handle driver activities.
          </p>
        </div>
        <DriverDashboard />
      </div>
    </RoleGuard>
  );
} 