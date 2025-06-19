'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { AdminGuard } from '@/components/auth/RoleGuard';
import { UserRole } from '@/lib/supabase';
import Link from 'next/link';
import { getAllUsers, toggleUserStatus, UserProfile } from '@/lib/userService';
import { DashboardNavigation } from '@/components/ui/DashboardNavigation';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  phone?: string;
  employee_id?: string;
  department?: string;
  created_at: string;
}

export default function UserManagementPage() {
  const { userProfile } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [showSuccess, setShowSuccess] = useState(false);

  // Check for success message from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('created') === 'true') {
      setShowSuccess(true);
      // Remove the parameter from URL
      window.history.replaceState({}, '', '/admin/users');
      // Hide success message after 5 seconds
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  // Real data fetching from Supabase
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const result = await getAllUsers();
        if (result.success && result.users) {
          setUsers(result.users);
        } else {
          console.error('Failed to fetch users:', result.error);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: UserRole) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      dept_head: 'bg-purple-100 text-purple-800',
      service_manager: 'bg-blue-100 text-blue-800',
      accounts_manager: 'bg-green-100 text-green-800',
      product_manager: 'bg-yellow-100 text-yellow-800',
      driver_manager: 'bg-orange-100 text-orange-800',
      technician: 'bg-cyan-100 text-cyan-800',
      customer: 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleName = (role: UserRole) => {
    const names = {
      admin: 'Administrator',
      dept_head: 'Department Head',
      service_manager: 'Service Manager',
      accounts_manager: 'Accounts Manager',
      product_manager: 'Product Manager',
      driver_manager: 'Driver Manager',
      technician: 'Technician',
      customer: 'Customer'
    };
    return names[role] || role;
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      const result = await toggleUserStatus(userId);
      if (result.success && result.user) {
        // Update the local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? result.user! : user
        ));
      } else {
        console.error('Failed to toggle user status:', result.error);
        alert('Failed to update user status. Please try again.');
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      alert('An error occurred. Please try again.');
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
                <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                <p className="text-gray-600">Manage system users and their roles</p>
              </div>
              <Link
                href="/admin/users/new"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                + Add New User
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <DashboardNavigation />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          {showSuccess && (
            <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
              <div className="flex">
                <div className="flex-shrink-0">
                  <span className="text-green-600">✅</span>
                </div>
                <div className="ml-3">
                  <p className="font-medium">User created successfully!</p>
                  <p className="text-sm">The new user has been added to the system.</p>
                </div>
                <div className="ml-auto">
                  <button
                    onClick={() => setShowSuccess(false)}
                    className="text-green-600 hover:text-green-800"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-900">{users.length}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-green-600">{users.filter(u => u.is_active).length}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-blue-600">{users.filter(u => u.role !== 'customer').length}</div>
              <div className="text-sm text-gray-600">Staff Members</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-purple-600">{users.filter(u => u.role === 'customer').length}</div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Users
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Role
                </label>
                <select
                  id="roleFilter"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrator</option>
                  <option value="dept_head">Department Head</option>
                  <option value="service_manager">Service Manager</option>
                  <option value="accounts_manager">Accounts Manager</option>
                  <option value="product_manager">Product Manager</option>
                  <option value="driver_manager">Driver Manager</option>
                  <option value="technician">Technician</option>
                  <option value="customer">Customer</option>
                </select>
              </div>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Users ({filteredUsers.length})
              </h3>
            </div>

            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading users...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee Info
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="font-medium text-gray-900">{user.full_name}</div>
                            <div className="text-sm text-gray-600">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                            {getRoleName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            {user.employee_id && (
                              <div className="text-sm font-medium text-gray-900">
                                ID: {user.employee_id}
                              </div>
                            )}
                            {user.department && (
                              <div className="text-sm text-gray-600">
                                {user.department}
                              </div>
                            )}
                            {!user.employee_id && !user.department && (
                              <div className="text-sm text-gray-400">No info</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Link
                            href={`/admin/users/${user.id}/edit`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleToggleStatus(user.id)}
                            className={`${
                              user.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                            }`}
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminGuard>
  );
} 