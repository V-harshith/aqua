'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/lib/supabase';
import Link from 'next/link';
import { createUser } from '@/lib/userService';
import { DashboardNavigation } from '@/components/ui/DashboardNavigation';

// Force dynamic rendering for this page
export const dynamic = 'force-dynamic';

interface CreateUserForm {
  email: string;
  full_name: string;
  role: UserRole;
  phone: string;
  password: string;
  confirmPassword: string;
  is_active: boolean;
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

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setErrors({ confirmPassword: 'Passwords do not match' });
      setLoading(false);
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setErrors({ password: 'Password must be at least 6 characters' });
      setLoading(false);
      return;
    }

    try {
      // Create user using API endpoint
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.role,
          phone: formData.phone || undefined,
          department: formData.department || undefined,
          is_active: formData.is_active
        }),
      });

      const result = await response.json();

      if (response.ok && result.user) {
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
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
                  required
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
                  required
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
                  required
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
                <p className="text-sm text-gray-600 mt-1">
                  {roleOptions.find(r => r.value === formData.role)?.description}
                </p>
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
                  placeholder="Enter department (optional)"
                />
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
                  placeholder="Enter phone number (optional)"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter password"
                    minLength={6}
                  />
                  {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Confirm password"
                  />
                  {errors.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
                  Active User (can login immediately)
                </label>
              </div>

              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                  <p className="text-red-600 text-sm">{errors.submit}</p>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <Link
                  href="/admin/users"
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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