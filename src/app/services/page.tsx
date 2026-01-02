'use client';

export const dynamic = 'force-dynamic';

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/ui/DashboardLayout';
import { EmptyState } from '@/components/ui/EmptyState';

interface Service {
  id: string;
  service_number: string;
  customer_id: string;
  service_type: string;
  description: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  scheduled_date?: string;
  created_at: string;
  customer?: {
    business_name: string;
    contact_person: string;
  };
  technician?: {
    full_name: string;
  };
}

export default function ServicesPage() {
  const { user } = useAuthContext();
  const { success: showSuccess, error: showError } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const response = await fetch('/api/services');
      const result = await response.json();

      if (response.ok) {
        setServices(result.services || []);
      } else {
        showError({ title: 'Failed to load services' });
      }
    } catch (error) {
      showError({ title: 'Failed to load services' });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = service.service_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.customer?.business_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || service.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
    <DashboardLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Services</h1>
          <Link href="/services/new">
            <Button className="w-full sm:w-auto">Create New Service</Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <div className="flex-1">
                <Input
                  placeholder="Search services..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0 sm:min-w-[150px]"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Services List */}
        <div className="space-y-4">
          {filteredServices.length === 0 ? (
            <Card>
              <CardContent className="p-8">
                <EmptyState
                  title="No services found"
                  description={searchTerm || statusFilter !== 'all' ? "Try adjusting your filters" : "Create your first service request to get started"}
                  action={{
                    label: "Create Service",
                    onClick: () => window.location.href = '/services/new'
                  }}
                />
              </CardContent>
            </Card>
          ) : (
            filteredServices.map((service) => (
              <Card key={service.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {service.service_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status || '')}`}>
                          {(service.status || 'pending').replace('_', ' ').toUpperCase()}
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
                        <div>
                          <span className="font-medium">Technician:</span> {service.technician?.full_name || 'Unassigned'}
                        </div>
                        <div>
                          <span className="font-medium">Created:</span> {new Date(service.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/services/${service.id}`}>
                        <Button variant="outline" size="sm">View</Button>
                      </Link>
                      {(user?.role === 'admin' || user?.role === 'service_manager') && (
                        <Link href={`/services/${service.id}/edit`}>
                          <Button variant="outline" size="sm">Edit</Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}