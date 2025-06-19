'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { RoleGuard } from '@/components/auth/RoleGuard';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

export default function ServicesPage() {
  const { userProfile, canManageServices } = useAuthContext();
  const [showForm, setShowForm] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFormSuccess = () => {
    setShowForm(false);
    setRefreshKey(prev => prev + 1);
  };

  const isStaff = canManageServices();
  const isTechnician = userProfile?.role === 'technician';

  return (
    <RoleGuard 
      allowedRoles={['admin', 'dept_head', 'service_manager', 'technician']}
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600">
              You don't have permission to access the services system.
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
                  {isTechnician ? 'My Service Tasks' : 'Service Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                  {isTechnician 
                    ? 'View and update your assigned service tasks'
                    : 'Manage service requests and work orders'
                  }
                </p>
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-3">
                {isStaff && (
                  <Button
                    onClick={() => setShowForm(!showForm)}
                    variant={showForm ? "secondary" : "primary"}
                  >
                    {showForm ? 'Cancel' : 'New Service Request'}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Service Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    📋
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                    👤
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Assigned</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                    🔄
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">In Progress</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    ✅
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">-</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="space-y-8">
            {/* Service Form */}
            {showForm && (
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">Create Service Request</h2>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-blue-800">
                      Service form component will be implemented here. 
                      This will allow creating new service requests with customer selection,
                      service type, description, scheduling, and technician assignment.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Services List */}
            {!showForm && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {isTechnician ? 'My Assigned Tasks' : 'All Service Requests'}
                    </h2>
                    <div className="flex gap-2">
                      <button className="px-3 py-1 rounded-md text-sm font-medium bg-blue-600 text-white">
                        All
                      </button>
                      <button className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300">
                        Pending
                      </button>
                      <button className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300">
                        Assigned
                      </button>
                      <button className="px-3 py-1 rounded-md text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300">
                        In Progress
                      </button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-8 text-center">
                    <div className="text-gray-400 text-4xl mb-4">🔧</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Service Management System
                    </h3>
                    <p className="text-gray-600 mb-4">
                      This section will display and manage service requests. Features include:
                    </p>
                    <div className="text-left max-w-md mx-auto space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Service request creation and assignment</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Technician task management</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Status tracking and updates</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Material usage tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-green-600">✓</span>
                        <span>Time and cost management</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Actions for Technicians */}
          {isTechnician && (
            <div className="mt-8">
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="secondary" fullWidth>
                      Clock In/Out
                    </Button>
                    <Button variant="secondary" fullWidth>
                      Update Task Status
                    </Button>
                    <Button variant="secondary" fullWidth>
                      Report Materials Used
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
} 