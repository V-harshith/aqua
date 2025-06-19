"use client";

import React from 'react';
import { RoleGuard } from '../../components/auth/RoleGuard';
import { ServiceRequestForm } from '../../components/services/ServiceRequestForm';
import { Card } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useRouter } from 'next/navigation';

const ServicesPage: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
          <p className="text-gray-600 mt-2">
            {user?.role === 'customer' 
              ? 'Request water system services and track your service history'
              : 'Manage service requests, assignments, and technician schedules'
            }
          </p>
        </div>

        {/* Customer Service Request */}
        <RoleGuard allowedRoles={['customer']}>
          <div className="space-y-6">
            {/* Quick Service Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <div className="p-4 text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Emergency Repair</h3>
                  <p className="text-sm text-gray-600 mt-1">Immediate assistance for urgent issues</p>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-red-600">Response: 15 mins</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4 text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">System Inspection</h3>
                  <p className="text-sm text-gray-600 mt-1">Comprehensive system check and testing</p>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-green-600">₹200 - 75 mins</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4 text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">⚙️</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Regular Maintenance</h3>
                  <p className="text-sm text-gray-600 mt-1">Scheduled maintenance for your systems</p>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-purple-600">₹300 - 90 mins</span>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-4 text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🧽</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Tank Cleaning</h3>
                  <p className="text-sm text-gray-600 mt-1">Complete tank sanitization service</p>
                  <div className="mt-3">
                    <span className="text-sm font-medium text-orange-600">₹800 - 4 hours</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Service Request Form */}
            <ServiceRequestForm />

            {/* Emergency Contact */}
            <Card>
              <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-red-500 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-white text-lg font-bold">!</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-900">Emergency Service Hotline</h4>
                      <p className="text-red-800">For immediate assistance, call us 24/7</p>
                      <div className="mt-2">
                        <Button
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => window.open('tel:1800-AQUA-911', '_self')}
                        >
                          📞 Call 1800-AQUA-911
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </RoleGuard>

        {/* Service Manager Dashboard */}
        <RoleGuard allowedRoles={['admin', 'service_manager', 'dispatcher']}>
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Service Requests</h3>
                  <p className="text-sm text-gray-600 mb-4">View and manage all service requests</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard?tab=service-requests')}
                  >
                    Manage Requests
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Technician Assignments</h3>
                  <p className="text-sm text-gray-600 mb-4">Assign and track technician tasks</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard?tab=assignments')}
                  >
                    View Assignments
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Service Analytics</h3>
                  <p className="text-sm text-gray-600 mb-4">Performance metrics and reports</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard?tab=analytics')}
                  >
                    View Analytics
                  </Button>
                </div>
              </Card>

              <Card>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Emergency Protocols</h3>
                  <p className="text-sm text-gray-600 mb-4">Manage emergency response procedures</p>
                  <Button
                    size="sm"
                    onClick={() => router.push('/dashboard?tab=emergency')}
                  >
                    Emergency Setup
                  </Button>
                </div>
              </Card>
            </div>

            {/* Service Type Management */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Types & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">RO System Installation</h4>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Complete installation service</p>
                    <div className="flex justify-between text-sm">
                      <span>₹500 • 3 hours</span>
                      <span className="text-blue-600">Intermediate</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Emergency Repair</h4>
                      <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">Emergency</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Urgent repair service</p>
                    <div className="flex justify-between text-sm">
                      <span>₹600 • 1 hour</span>
                      <span className="text-orange-600">Advanced</span>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">Tank Cleaning</h4>
                      <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">Complete sanitization</p>
                    <div className="flex justify-between text-sm">
                      <span>₹800 • 4 hours</span>
                      <span className="text-blue-600">Basic</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => router.push('/admin/service-types')}
                  >
                    Manage Service Types
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </RoleGuard>

        {/* Technician Dashboard */}
        <RoleGuard allowedRoles={['technician']}>
          <div className="space-y-6">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Technician Portal</h3>
                <p className="text-gray-600 mb-4">
                  Access your assignments, update service status, and manage your schedule
                </p>
                <Button onClick={() => router.push('/dashboard?tab=technician')}>
                  Open Technician Dashboard
                </Button>
              </div>
            </Card>
          </div>
        </RoleGuard>
      </div>
    </div>
  );
};

export default ServicesPage; 