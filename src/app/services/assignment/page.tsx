'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface Service {
  id: string;
  service_number: string;
  customer_id: string;
  service_type: string;
  description: string;
  status: string;
  priority: string;
  customer?: {
    business_name: string;
    contact_person: string;
  };
  technician?: {
    full_name: string;
    id: string;
  };
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  specialization?: string;
}

export default function ServiceAssignmentPage() {
  const { user } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedTechnician, setSelectedTechnician] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    loadServices();
    loadTechnicians();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services?status=pending');
      const result = await response.json();

      if (response.ok) {
        setServices(result.services || []);
      } else {
        showError({ title: 'Failed to load services' });
      }
    } catch (error) {
      showError({ title: 'Failed to load services' });
    }
  };

  const loadTechnicians = async () => {
    try {
      const response = await fetch('/api/technicians');
      const result = await response.json();

      if (response.ok) {
        setTechnicians(result.technicians || []);
      } else {
        showError({ title: 'Failed to load technicians' });
      }
    } catch (error) {
      showError({ title: 'Failed to load technicians' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignment = async () => {
    if (!selectedService || !selectedTechnician) {
      showError({ title: 'Please select both service and technician' });
      return;
    }

    setIsAssigning(true);

    try {
      const response = await fetch(`/api/services?id=${selectedService}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assigned_technician: selectedTechnician,
          status: 'assigned'
        }),
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess({ title: 'Service assigned successfully' });
        setSelectedService('');
        setSelectedTechnician('');
        loadServices(); // Reload to update the list
      } else {
        showError({ title: result.error || 'Failed to assign service' });
      }
    } catch (error) {
      showError({ title: 'Failed to assign service' });
    } finally {
      setIsAssigning(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Service Assignment</h1>
        <p className="text-gray-600 mt-2">Assign pending services to available technicians</p>
      </div>

      {/* Assignment Form */}
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">Quick Assignment</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a service</option>
                {services.filter(s => s.status === 'pending').map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.service_number} - {service.customer?.business_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Technician
              </label>
              <select
                value={selectedTechnician}
                onChange={(e) => setSelectedTechnician(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Choose a technician</option>
                {technicians.map((technician) => (
                  <option key={technician.id} value={technician.id}>
                    {technician.full_name} {technician.specialization && `(${technician.specialization})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            onClick={handleAssignment}
            disabled={isAssigning || !selectedService || !selectedTechnician}
            className="w-full"
          >
            {isAssigning ? 'Assigning...' : 'Assign Service'}
          </Button>
        </CardContent>
      </Card>

      {/* Pending Services */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Pending Services ({services.filter(s => s.status === 'pending').length})</h2>
        <div className="space-y-4">
          {services.filter(s => s.status === 'pending').length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">No pending services to assign</p>
              </CardContent>
            </Card>
          ) : (
            services.filter(s => s.status === 'pending').map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.service_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(service.priority)}`}>
                          {(service.priority || 'medium').toUpperCase()}
                        </span>
                      </div>

                      <p className="text-gray-600 mb-2">{service.description}</p>

                      <div className="grid grid-cols-2 gap-4 text-sm text-gray-500">
                        <div>
                          <span className="font-medium">Customer:</span> {service.customer?.business_name || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Service Type:</span> {service.service_type}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedService(service.id)}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Available Technicians */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Available Technicians ({technicians.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((technician) => (
            <Card key={technician.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900">{technician.full_name}</h3>
                <p className="text-sm text-gray-600">{technician.email}</p>
                {technician.phone && (
                  <p className="text-sm text-gray-600">{technician.phone}</p>
                )}
                {technician.specialization && (
                  <p className="text-sm text-blue-600 mt-2">{technician.specialization}</p>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-3"
                  onClick={() => setSelectedTechnician(technician.id)}
                >
                  Select
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}