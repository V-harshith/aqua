'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NewServicePage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    service_type: '',
    priority: 'medium',
    description: '',
    scheduled_date: '',
    address: '',
    contact_phone: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create service request');
      }

      success({ title: 'Success', message: 'Service request created successfully!' });
      router.push('/services');
    } catch (err: any) {
      error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <Card>
          <div className="p-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600 flex items-center transition-colors">
                <span className="mr-1">🏠</span>
                Main Dashboard
              </Link>
              <span>›</span>
              <Link href="/services" className="hover:text-blue-600 transition-colors">
                Services
              </Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">New Service Request</span>
            </nav>
          </div>
        </Card>

        {/* Header */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">New Service Request</h1>
              <p className="text-gray-600">Create a new service request for water system maintenance</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.back()}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                ⬅️ Go Back
              </Button>
            </div>
          </div>
        </Card>

        {/* Form */}
        <Card>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Service Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type *
                </label>
                <select
                  name="service_type"
                  value={formData.service_type}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Service Type</option>
                  <option value="installation">Installation</option>
                  <option value="repair">Repair</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inspection">Inspection</option>
                  <option value="water_testing">Water Testing</option>
                  <option value="pump_service">Pump Service</option>
                  <option value="pipe_cleaning">Pipe Cleaning</option>
                  <option value="emergency">Emergency Service</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority *
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
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
                  Preferred Date
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_date"
                  value={formData.scheduled_date}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Contact Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  name="contact_phone"
                  value={formData.contact_phone}
                  onChange={handleChange}
                  required
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe the service request in detail..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Address *
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                rows={3}
                placeholder="Enter the complete address where service is needed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Service Request'
                )}
              </Button>
            </div>
          </form>
        </Card>

        {/* Help Text */}
        <Card>
          <div className="p-4 bg-blue-50">
            <div className="flex items-start">
              <div className="text-blue-500 text-xl mr-3">💡</div>
              <div>
                <h3 className="text-blue-900 font-medium mb-2">Service Request Tips</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• Provide detailed description for faster service</li>
                  <li>• Emergency requests will be prioritized</li>
                  <li>• You'll receive SMS/email updates on progress</li>
                  <li>• Our technicians will contact you before arrival</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
