'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

type ServiceType = 
  | 'installation'
  | 'maintenance'
  | 'repair'
  | 'inspection'
  | 'meter_reading'
  | 'connection'
  | 'disconnection'
  | 'emergency'
  | 'other';

interface Customer {
  id: string;
  customer_code: string;
  contact_person: string;
  billing_address: string;
}

interface ServiceFormProps {
  onSubmitSuccess?: () => void;
  onCancel?: () => void;
  complaintId?: string; // If creating service from a complaint
}

export default function ServiceForm({ onSubmitSuccess, onCancel, complaintId }: ServiceFormProps) {
  const { userProfile } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Form fields
  const [customerId, setCustomerId] = useState('');
  const [serviceType, setServiceType] = useState<ServiceType>('maintenance');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [estimatedHours, setEstimatedHours] = useState('');

  const serviceTypeOptions = [
    { value: 'installation', label: 'Installation' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'repair', label: 'Repair' },
    { value: 'inspection', label: 'Inspection' },
    { value: 'meter_reading', label: 'Meter Reading' },
    { value: 'connection', label: 'New Connection' },
    { value: 'disconnection', label: 'Disconnection' },
    { value: 'emergency', label: 'Emergency Service' },
    { value: 'other', label: 'Other' },
  ];

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, customer_code, contact_person, billing_address')
        .eq('status', 'active')
        .order('customer_code');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error: any) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const serviceData: any = {
        customer_id: customerId,
        service_type: serviceType,
        description: description.trim(),
        estimated_hours: estimatedHours ? parseFloat(estimatedHours) : null,
      };

      // Add scheduled date if provided
      if (scheduledDate) {
        serviceData.scheduled_date = new Date(scheduledDate).toISOString();
      }

      // Link to complaint if provided
      if (complaintId) {
        serviceData.complaint_id = complaintId;
      }

      const { error: serviceError } = await supabase
        .from('services')
        .insert(serviceData);

      if (serviceError) throw serviceError;

      setSuccess(true);
      
      // Reset form
      setCustomerId('');
      setServiceType('maintenance');
      setDescription('');
      setScheduledDate('');
      setEstimatedHours('');

      if (onSubmitSuccess) {
        onSubmitSuccess();
      }

    } catch (error: any) {
      console.error('Error creating service:', error);
      setError(error.message || 'Failed to create service request');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <div className="text-green-600 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Service Request Created
          </h2>
          <p className="text-gray-600 mb-6">
            The service request has been created successfully and is ready for assignment.
          </p>
          <div className="space-y-3">
            <Button 
              onClick={() => setSuccess(false)}
              variant="primary"
              fullWidth
            >
              Create Another Service
            </Button>
            {onCancel && (
              <Button 
                onClick={onCancel}
                variant="secondary"
                fullWidth
              >
                Back to Services
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-900">
          {complaintId ? 'Create Service from Complaint' : 'Create Service Request'}
        </h2>
        <p className="text-gray-600">
          Create a new service request for a customer.
        </p>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-gray-700 mb-2">
              Customer
            </label>
            <select
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.customer_code} - {customer.contact_person}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-2">
              Service Type
            </label>
            <select
              id="serviceType"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value as ServiceType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              {serviceTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Service Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Describe the service work to be performed..."
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Scheduled Date (Optional)"
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />

            <Input
              label="Estimated Hours (Optional)"
              id="estimatedHours"
              type="number"
              step="0.5"
              min="0"
              value={estimatedHours}
              onChange={(e) => setEstimatedHours(e.target.value)}
              placeholder="e.g., 2.5"
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              {loading ? 'Creating...' : 'Create Service Request'}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                onClick={onCancel}
                variant="secondary"
                fullWidth
              >
                Cancel
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 