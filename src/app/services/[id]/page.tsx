'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { authenticatedGet, authenticatedPatch } from '@/lib/auth-client';
import Link from 'next/link';

interface Service {
  id: string;
  service_number: string;
  customer_id: string;
  service_type: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  completed_date?: string;
  estimated_hours?: number;
  actual_hours?: number;
  created_at: string;
  updated_at: string;
  customer?: {
    customer_code: string;
    business_name: string;
    contact_person: string;
    billing_address: string;
  };
  technician?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  complaint?: {
    complaint_number: string;
    title: string;
    priority: string;
  };
}

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (params.id) {
      loadServiceDetails();
    }
  }, [params.id]);

  const loadServiceDetails = async () => {
    try {
      setIsLoading(true);
      const data = await authenticatedGet(`/api/services/${params.id}`);
      setService(data.service);
    } catch (error) {
      console.error('Failed to load service details:', error);
      showError({ title: 'Failed to load service details' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateServiceStatus = async (newStatus: string) => {
    if (!service) return;

    try {
      setIsUpdating(true);
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }

      const data = await authenticatedPatch(`/api/services/${service.id}`, updateData);
      setService(data.service);
      showSuccess({ title: `Service ${newStatus.replace('_', ' ')} successfully` });
    } catch (error) {
      console.error('Failed to update service status:', error);
      showError({ title: 'Failed to update service status' });
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const canUpdateStatus = () => {
    if (!userProfile || !service) return false;
    
    // Admin and service managers can always update
    if (['admin', 'service_manager'].includes(userProfile.role)) return true;
    
    // Technicians can update their assigned services
    if (userProfile.role === 'technician' && service.technician?.id === userProfile.id) return true;
    
    return false;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">🔍</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Not Found</h2>
            <p className="text-gray-600 mb-4">The service you're looking for doesn't exist or you don't have permission to view it.</p>
            <Link href="/services">
              <Button>Back to Services</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/services" className="text-blue-600 hover:underline">
              ← Back to Services
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{service.service_number}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(service.status)}`}>
              {service.status.replace('_', ' ').toUpperCase()}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPriorityColor(service.priority)}`}>
              {service.priority.toUpperCase()} PRIORITY
            </span>
          </div>
        </div>
        
        {canUpdateStatus() && (
          <div className="flex gap-2">
            {service.status === 'assigned' && (
              <Button
                onClick={() => updateServiceStatus('in_progress')}
                disabled={isUpdating}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Start Work
              </Button>
            )}
            {service.status === 'in_progress' && (
              <Button
                onClick={() => updateServiceStatus('completed')}
                disabled={isUpdating}
                className="bg-green-600 hover:bg-green-700"
              >
                Mark Complete
              </Button>
            )}
            {['admin', 'service_manager'].includes(userProfile?.role || '') && (
              <Link href={`/services/${service.id}/edit`}>
                <Button variant="outline">Edit Service</Button>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Service Information</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Service Type</label>
              <p className="text-gray-900">{service.service_type}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="text-gray-900">{service.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <p className="text-gray-900">{new Date(service.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <p className="text-gray-900">{new Date(service.updated_at).toLocaleDateString()}</p>
              </div>
            </div>

            {service.scheduled_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Scheduled Date</label>
                <p className="text-gray-900">{new Date(service.scheduled_date).toLocaleString()}</p>
              </div>
            )}

            {service.completed_date && (
              <div>
                <label className="text-sm font-medium text-gray-500">Completed Date</label>
                <p className="text-gray-900">{new Date(service.completed_date).toLocaleString()}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Customer Details</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {service.customer ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Customer Code</label>
                  <p className="text-gray-900">{service.customer.customer_code}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Business Name</label>
                  <p className="text-gray-900">{service.customer.business_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Contact Person</label>
                  <p className="text-gray-900">{service.customer.contact_person}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900">{service.customer.billing_address}</p>
                </div>
              </>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </CardContent>
        </Card>

        {/* Technician Information */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Assigned Technician</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {service.technician ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500">Name</label>
                  <p className="text-gray-900">{service.technician.full_name}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Email</label>
                  <p className="text-gray-900">{service.technician.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-500">Phone</label>
                  <p className="text-gray-900">{service.technician.phone}</p>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">No technician assigned</p>
                {['admin', 'service_manager'].includes(userProfile?.role || '') && (
                  <Link href={`/services/assignment?service=${service.id}`}>
                    <Button size="sm">Assign Technician</Button>
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Time Tracking */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Time Tracking</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Estimated Hours</label>
                <p className="text-gray-900">{service.estimated_hours || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Actual Hours</label>
                <p className="text-gray-900">{service.actual_hours || 'Not recorded'}</p>
              </div>
            </div>

            {service.complaint && (
              <div className="border-t pt-4">
                <label className="text-sm font-medium text-gray-500">Related Complaint</label>
                <div className="mt-1">
                  <p className="font-medium">{service.complaint.complaint_number}</p>
                  <p className="text-gray-600">{service.complaint.title}</p>
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${getPriorityColor(service.complaint.priority)}`}>
                    {service.complaint.priority.toUpperCase()}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}