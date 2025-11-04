'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Customer {
  id: string;
  customer_code: string;
  business_name: string;
  contact_person: string;
}

interface ServiceType {
  id: string;
  type_code: string;
  type_name: string;
  category: string;
  estimated_duration: number;
  base_price: number;
}

export default function NewServicePage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customer_id: '',
    service_type: '',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    estimated_hours: ''
  });

  useEffect(() => {
    loadCustomers();
    loadServiceTypes();
  }, []);

  const loadCustomers = async () => {
    try {
      const response = await fetch('/api/customers');
      const result = await response.json();
      if (response.ok) {
        setCustomers(result.customers || []);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const loadServiceTypes = async () => {
    try {
      const response = await fetch('/api/service-types');
      const result = await response.json();
      if (response.ok) {
        setServiceTypes(Array.isArray(result) ? result : []);
      }
    } catch (error) {
      console.error('Failed to load service types:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customer_id || !formData.service_type || !formData.description) {
      showError({ title: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          estimated_hours: formData.estimated_hours ? parseInt(formData.estimated_hours) : null
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess({ title: 'Service created successfully' });
        router.push('/services');
      } else {
        showError({ title: result.error || 'Failed to create service' });
      }
    } catch (error) {
      showError({ title: 'Failed to create service' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Create New Service</h1>
        <p className="text-gray-600 mt-2">Fill in the details to create a new service request</p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Service Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Customer Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Customer *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.business_name} ({customer.customer_code})
                  </option>
                ))}
              </select>
            </div>

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

            {/* Form Actions */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creating...' : 'Create Service'}
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