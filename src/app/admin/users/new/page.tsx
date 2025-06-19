'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/lib/supabase';
import Link from 'next/link';
import { createUser } from '@/lib/userService';
import { DashboardNavigation } from '@/components/ui/DashboardNavigation';

interface CreateUserForm {
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  password: string;
  confirmPassword: string;
  is_active: boolean;
  employee_id: string;
  department: string;
}

export default function NewUserPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CreateUserForm>({
    email: '',
    full_name: '',
    role: 'customer',
    phone: '',
    password: '',
    confirmPassword: '',
    is_active: true,
    employee_id: '',
    department: ''
  });

  const roleOptions: { value: UserRole; label: string; description: string }[] = [
    { value: 'admin', label: 'Administrator', description: 'Full system access and management' },
    { value: 'dept_head', label: 'Department Head', description: 'Departmental oversight and management' },
    { value: 'service_manager', label: 'Service Manager', description: 'Customer service and complaint management' },
    { value: 'accounts_manager', label: 'Accounts Manager', description: 'Financial and billing management' },
    { value: 'product_manager', label: 'Product Manager', description: 'Inventory and product management' },
    { value: 'driver_manager', label: 'Driver Manager', description: 'Fleet and delivery management' },
    { value: 'technician', label: 'Technician', description: 'Field service and maintenance' },
    { value: 'customer', label: 'Customer', description: 'End-user access to services' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Create user using Supabase service
      const result = await createUser({
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
        role: formData.role,
        phone: formData.phone || undefined,
        employee_id: formData.employee_id || undefined,
        department: formData.department || undefined,
        is_active: formData.is_active
      });

      if (result.success) {
        // Success - redirect to user management with success message
        router.push('/admin/users?created=true');
      } else {
        // Show error message
        setErrors({ submit: result.error || 'Failed to create user' });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      setErrors({ submit: 'An unexpected error occurred. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Add New User</h1>
                <p className="text-gray-600">Create a new system user account</p>
              </div>
              <Link
                href="/admin/users"
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                ← Back to Users
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNavigation />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => handleInputChange('role', e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roleOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Employee ID
                  </label>
                  <input
                    type="text"
                    value={formData.employee_id}
                    onChange={(e) => handleInputChange('employee_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter employee ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter department"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter password"
                />
              </div>

              <div className="flex justify-end space-x-4">
                {errors.submit && (
                  <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.submit}
                  </div>
                )}
                
                <Link
                  href="/admin/users"
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AdminGuard>
  );
} 