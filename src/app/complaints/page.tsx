'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';
import ComplaintForm from '@/components/complaints/ComplaintForm';
import ComplaintsList from '@/components/complaints/ComplaintsList';
import Button from '@/components/ui/Button';

export default function ComplaintsPage() {
  const { userProfile, canManageComplaints } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1); // Trigger refresh of complaints list
  };

  const isCustomer = userProfile?.role === 'customer';
  const isStaff = canManageComplaints();

  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'service_manager', 'technician', 'customer']}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don&apos;t have permission to access the complaints system.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {isCustomer ? 'My Complaints' : 'Complaints Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isCustomer 
                    ? 'Submit and track your service complaints'
                    : 'Manage and resolve customer complaints'
                  }
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {isCustomer && (
                  <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? "secondary" : "primary"}
                  >
                    {showForm ? 'Cancel' : 'New Complaint'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Complaint Form (for customers or when staff needs to add) */}
            {showForm && (
              <div className="mb-8">
                <ComplaintForm 
                  onSubmitSuccess={handleFormSuccess}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Complaints List */}
            {!showForm && (
              <div>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {isCustomer ? 'Your Complaints' : 'All Complaints'}
                  </h2>
                  <p className="text-gray-600">
                    {isCustomer 
                      ? 'Track the status of your submitted complaints'
                      : 'View and manage customer complaints'
                    }
                  </p>
                </div>
                
                <ComplaintsList 
                  key={refreshKey}
                  showActions={isStaff}
                />
              </div>
            )}
          </div>

          {/* Quick Stats for Staff */}
          {isStaff && !showForm && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    📋
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Open</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    👤
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    🔄
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    ✅
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Resolved</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
} 