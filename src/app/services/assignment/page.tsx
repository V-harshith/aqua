'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  specialization: string;
  availability_status: string;
  current_workload: number;
}

interface Service {
  id: string;
  service_type: string;
  description: string;
  priority: string;
  customer_id: string;
  status: string;
  address: string;
  contact_phone: string;
  created_at: string;
}

export default function ServiceAssignmentPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceId = searchParams.get('service_id');

  const [service, setService] = useState<Service | null>(null);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);

  useEffect(() => {
    if (serviceId) {
      loadServiceDetails();
      loadAvailableTechnicians();
    }
  }, [serviceId]);

  const loadServiceDetails = async () => {
    try {
      const response = await fetch(`/api/services/${serviceId}`);
      if (!response.ok) throw new Error('Failed to load service details');
      const data = await response.json();
      setService(data);
    } catch (err: any) {
      error({ title: 'Error', message: err.message });
    }
  };

  const loadAvailableTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      if (!response.ok) throw new Error('Failed to load technicians');
      const data = await response.json();
      setTechnicians(data || []);
    } catch (err: any) {
      error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAssignment = async () => {
    if (!selectedTechnician || !scheduledDate) {
      error({ title: 'Error', message: 'Please select a technician and schedule date' });
      return;
    }

    setAssigning(true);
    try {
      const response = await fetch('/api/services/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: serviceId,
          technician_id: selectedTechnician,
          scheduled_date: scheduledDate,
          assignment_notes: notes,
        }),
      });

      if (!response.ok) throw new Error('Failed to assign technician');

      success({ title: 'Success', message: 'Technician assigned successfully!' });
      router.push('/services');
    } catch (err: any) {
      error({ title: 'Error', message: err.message });
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading assignment details...</p>
        </div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <div className="p-6 text-center">
            <div className="text-6xl mb-4">❌</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Service Not Found</h2>
            <p className="text-gray-600 mb-4">The requested service could not be found.</p>
            <Link href="/services">
              <Button>Back to Services</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
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
              <span className="text-gray-900 font-medium">Assign Technician</span>
            </nav>
          </div>
        </Card>

        {/* Header */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Assign Technician</h1>
              <p className="text-gray-600">Assign a qualified technician to service request</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/services')}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                ⬅️ Back to Services
              </Button>
            </div>
          </div>
        </Card>

        {/* Service Details */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Service Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Service Type</p>
                <p className="font-medium">{service.service_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Priority</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  service.priority === 'high' ? 'bg-red-100 text-red-800' :
                  service.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {service.priority.toUpperCase()}
                </span>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Description</p>
                <p className="font-medium">{service.description}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Contact Phone</p>
                <p className="font-medium">{service.contact_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Status</p>
                <p className="font-medium">{service.status}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Assignment Form */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Assignment Details</h2>
            <form onSubmit={(e) => { e.preventDefault(); handleAssignment(); }} className="space-y-4">
              {/* Technician Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Technician *
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Choose a technician...</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} - {tech.specialization} ({tech.availability_status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Scheduled Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Assignment Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assignment Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any special instructions or notes for the technician..."
                />
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/services')}
                  disabled={assigning}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={assigning || !selectedTechnician || !scheduledDate}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {assigning ? 'Assigning...' : 'Assign Technician'}
                </Button>
              </div>
            </form>
          </div>
        </Card>

        {/* Available Technicians List */}
        <Card>
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Available Technicians ({technicians.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {technicians.map((tech) => (
                <div key={tech.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{tech.full_name}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tech.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                      tech.availability_status === 'busy' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tech.availability_status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Specialization:</strong> {tech.specialization}
                  </p>
                  <p className="text-sm text-gray-600 mb-1">
                    <strong>Phone:</strong> {tech.phone}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Current Workload:</strong> {tech.current_workload} active jobs
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 