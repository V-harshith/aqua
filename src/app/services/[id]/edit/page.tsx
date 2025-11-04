'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { authenticatedGet, authenticatedPatch } from '@/lib/auth-client';
import { validateServiceCreation } from '@/lib/validation';
import Link from 'next/link';

interface Service {
  id: string;
  service_number: string;
  customer_id: string;
  service_type: string;
  description: string;
  status: string;
  priority: string;
  scheduled_date?: string;
  estimated_hours?: number;
  customer?: {
    business_name: string;
    contact_person: string;
  };
}

interface ServiceType {
  id: string;
  type_code: string;
  type_name: string;
  category: string;
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
}

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const { userProfile } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();
  
  const [service, setService] = useState<Service | null>(null);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    service_type: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    scheduled_date: '',
    estimated_hours: '',
    assigned_technician: ''
  });

  useEffect(() => {
    if (params.id) {
      loadData();
    }
  }, [params.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const [serviceData, serviceTypesData, techniciansData] = await Promise.all([
        authenticatedGet(`/api/services/${params.id}`),
        authenticatedGet('/api/service-types'),
        authenticatedGet('/api/technicians')
      ]);

      setService(serviceData.service);
      setServiceTypes(Array.isArray(serviceTypesData) ? serviceTypesData : []);
      setTechnicians(techniciansData.technicians || []);

      // Populate form with existing data
      const svc = serviceData.service;
      setFormData({
        service_type: svc.service_type || '',
        description: svc.description || '',
        priority: svc.priority || 'medium',
        status: svc.status || 'pending',
        scheduled_date: svc.scheduled_date ? new Date(svc.scheduled_date).toISOString().slice(0, 16) : '',
        estimated_hours: svc.estimated_hours?.toString() || '',
        assigned_technician: svc.assigned_technician || ''
      });

    } catch (error) {
      console.error('Failed to load data:', error);
      showError({ title: 'Failed to load service data' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;

    // Validate form data
    const validation = validateServiceCreation({
      customer_id: service.customer_id,
      service_type: formData.service_type,
      description: formData.description,
      priority: formData.priority
    });

    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setIsSubmitting(true);
    setErrors([]);
    
    try {
      const updateData: any = {
        service_type: formData.service_type,
        description: formData.description,
        priority: formData.priority,
        status: formData.status
      };

      if (formData.scheduled_date) {
        updateData.scheduled_date = new Date(formData.scheduled_date).toISOString();
      }

      if (formData.estimated_hours) {
        updateData.estimated_hours = parseInt(formData.estimated_hours);
      }

      if (formData.assigned_technician) {
        updateData.assigned_technician = formData.assigned_technician;
        if (formData.status === 'pending') {
          updateData.status = 'assigned';
        }
      }

      await authenticatedPatch(`/api/services/${service.id}`, updateData);
      
      showSuccess({ title: 'Service updated successfully' });
      router.push(`/services/${service.id}`);

    } catch (error: any) {
      console.error('Failed to update service:', error);
      showError({ title: 'Failed to update service', message: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEdit = () => {
    if (!userProfile) return false;
    return ['admin', 'service_manager'].includes(userProfile.role);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Not Found</h2>
            <Link href="/services">
              <Button>Back to Services</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!canEdit()) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-500 text-4xl mb-4">🚫</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">You don't have permission to edit this service.</p>
            <Link href={`/services/${service.id}`}>
              <Button>View Service</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link href={`/services/${service.id}`} className="text-blue-600 hover:underline">
            ← Back to Service
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Service: {service.service_number}</h1>
        <p className="text-gray-600 mt-2">
          Customer: {service.customer?.business_name} ({service.customer?.contact_person})
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Service Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <h3 className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</h3>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map((type) => (
                    <option key={type.id} value={type.type_code}>
                      {type.type_name} - {type.category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Assigned Technician */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assigned Technician
                </label>
                <select
                  name="assigned_technician"
                  value={formData.assigned_technician}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No technician assigned</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date
                </label>
                <Input
                  type="datetime-local"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleInputChange}
                />
              </div>

              {/* Estimated Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Hours
                </label>
                <Input
                  type="number"
                  name="estimated_hours"
                  value={formData.estimated_hours}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Enter estimated hours"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the service requirements..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Updating...' : 'Update Service'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}