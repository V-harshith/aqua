"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { UserRole } from '@/lib/supabase';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { getAllUsers, updateUser, toggleUserStatus } from '@/lib/userService';

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  department?: string;
  employee_id?: string;
  is_active: boolean;
  created_at: string;
}

export default function UserManagement() {
  const { userProfile } = useAuthContext();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: 'admin', label: 'Administrator' },
    { value: 'dept_head', label: 'Department Head' },
    { value: 'service_manager', label: 'Service Manager' },
    { value: 'driver_manager', label: 'Driver Manager' },
    { value: 'accounts_manager', label: 'Accounts Manager' },
    { value: 'product_manager', label: 'Product Manager' },
    { value: 'technician', label: 'Technician' },
    { value: 'customer', label: 'Customer' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await getAllUsers();
      
      if (result.success && result.users) {
        setUsers(result.users);
      } else {
        throw new Error(result.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole, department?: string) => {
    try {
      const updates: any = { role: newRole };
      if (department !== undefined) {
        updates.department = department.trim() || null;
      }

      const result = await updateUser(userId, updates);
      
      if (result.success && result.user) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId 
            ? { ...user, role: newRole, department: department?.trim() || undefined }
            : user
        ));
        setEditingUser(null);
      } else {
        throw new Error(result.error || 'Failed to update user');
      }
    } catch (error: any) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role: ' + error.message);
    }
  };

  const toggleUserStatusHandler = async (userId: string) => {
    try {
      const result = await toggleUserStatus(userId);
      
      if (result.success && result.user) {
        // Update local state
        setUsers(users.map(user => 
          user.id === userId ? { ...user, is_active: result.user!.is_active } : user
        ));
      } else {
        throw new Error(result.error || 'Failed to toggle user status');
      }
    } catch (error: any) {
      console.error('Error toggling user status:', error);
      alert('Failed to toggle user status: ' + error.message);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.employee_id && user.employee_id.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'text-red-600 bg-red-100';
      case 'dept_head': return 'text-purple-600 bg-purple-100';
      case 'service_manager': return 'text-blue-600 bg-blue-100';
      case 'driver_manager': return 'text-green-600 bg-green-100';
      case 'accounts_manager': return 'text-yellow-600 bg-yellow-100';
      case 'product_manager': return 'text-indigo-600 bg-indigo-100';
      case 'technician': return 'text-orange-600 bg-orange-100';
      case 'customer': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
        Error loading users: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
          <p className="text-gray-600">Manage user roles and permissions</p>
        </div>
        <Button onClick={fetchUsers} variant="secondary">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            label="Search Users"
            id="search"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, email, or employee ID..."
          />
        </div>
        <div className="sm:w-48">
          <label htmlFor="roleFilter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Role
          </label>
          <select
            id="roleFilter"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Roles</option>
            {roleOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">
              {searchTerm || roleFilter !== 'all' 
                ? 'No users match your search criteria.'
                : 'No users have been registered yet.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {user.full_name}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                        {roleOptions.find(r => r.value === user.role)?.label || user.role}
                      </span>
                      {!user.is_active && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium text-red-600 bg-red-100">
                          INACTIVE
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Email:</span> {user.email}</p>
                      {user.phone && <p><span className="font-medium">Phone:</span> {user.phone}</p>}
                      {user.employee_id && <p><span className="font-medium">Employee ID:</span> {user.employee_id}</p>}
                      {user.department && <p><span className="font-medium">Department:</span> {user.department}</p>}
                      <p><span className="font-medium">Joined:</span> {new Date(user.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {user.id !== userProfile?.id && (
                      <>
                        <Button
                          onClick={() => setEditingUser(editingUser === user.id ? null : user.id)}
                          variant="secondary"
                          size="sm"
                        >
                          {editingUser === user.id ? 'Cancel' : 'Edit Role'}
                        </Button>
                        
                        <Button
                          onClick={() => toggleUserStatusHandler(user.id)}
                          variant={user.is_active ? "secondary" : "primary"}
                          size="sm"
                        >
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Edit Role Form */}
                {editingUser === user.id && (
                  <div className="mt-4 pt-4 border-t">
                    <RoleEditForm
                      user={user}
                      roleOptions={roleOptions}
                      onSave={(newRole, department) => updateUserRole(user.id, newRole, department)}
                      onCancel={() => setEditingUser(null)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// Role Edit Form Component
interface RoleEditFormProps {
  user: User;
  roleOptions: { value: UserRole; label: string }[];
  onSave: (role: UserRole, department?: string) => void;
  onCancel: () => void;
}

function RoleEditForm({ user, roleOptions, onSave, onCancel }: RoleEditFormProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole>(user.role);
  const [department, setDepartment] = useState(user.department || '');

  const handleSave = () => {
    onSave(selectedRole, department);
  };

  const requiresDepartment = ['technician', 'service_manager', 'driver_manager', 'accounts_manager', 'product_manager', 'dept_head', 'admin'].includes(selectedRole);

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Role
        </label>
        <select
          id="role"
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          {roleOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {requiresDepartment && (
        <div>
          <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <input
            id="department"
            type="text"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter department name"
          />
        </div>
      )}

      <div className="flex gap-2">
        <Button onClick={handleSave} variant="primary" size="sm">
          Save Changes
        </Button>
        <Button onClick={onCancel} variant="secondary" size="sm">
          Cancel
        </Button>
      </div>
    </div>
  );
} 