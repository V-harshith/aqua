'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import Link from 'next/link';

interface Service {
  id: string;
  service_type: string;
  status: string;
  priority: string;
  description: string;
  scheduled_date: string;
  customer_id: string;
  technician_id: string;
  created_at: string;
  updated_at: string;
  customer?: {
    business_name: string;
    contact_person: string;
  };
  technician?: {
    full_name: string;
    email: string;
    phone: string;
  };
}

export default function ServicesPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/services');
      if (!response.ok) {
        throw new Error('Failed to load services');
      }
      const data = await response.json();
      setServices(data || []);
    } catch (err: any) {
      error({ title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    return service.status === filter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Navigation Breadcrumbs */}
        <Card>
          <div className="p-4">
            <nav className="flex items-center space-x-2 text-sm text-gray-600">
              <Link href="/dashboard" className="hover:text-blue-600 flex items-center transition-colors">
                <span className="mr-1">🏠</span>
                Main Dashboard
              </Link>
              <span>›</span>
              <span className="text-gray-900 font-medium">Services</span>
            </nav>
          </div>
        </Card>

        {/* Header */}
        <Card>
          <div className="flex items-center justify-between p-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
              <p className="text-gray-600">Manage all service requests and assignments</p>
            </div>
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => window.location.href = '/dashboard'}
                variant="outline"
                className="border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                ⬅️ Back to Dashboard
              </Button>
              <Link href="/services/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  ➕ New Service Request
                </Button>
              </Link>
              <Button
                onClick={loadServices}
                variant="secondary"
                disabled={loading}
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Filters */}
        <Card>
          <div className="p-4">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">Filter by status:</span>
              {['all', 'pending', 'in_progress', 'completed', 'cancelled'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filter === status
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? 'All' : status.replace('_', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Services List */}
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Service Requests ({filteredServices.length})</h2>
              <div className="text-sm text-gray-600">
                Showing {filteredServices.length} of {services.length} services
              </div>
            </div>

            {filteredServices.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🔧</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
                <p className="text-gray-600 mb-4">
                  {filter === 'all' 
                    ? 'No service requests have been created yet.' 
                    : `No services with status "${filter}" found.`}
                </p>
                <Link href="/services/new">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Create First Service Request
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredServices.map(service => (
                  <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">{service.service_type}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                            {service.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(service.priority)}`}>
                            {service.priority.toUpperCase()} PRIORITY
                          </span>
                        </div>
                        
                        <p className="text-gray-600 mb-3">{service.description}</p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">Customer:</span>
                            <p className="text-gray-600">
                              {service.customer?.business_name || 'Unknown'}
                              {service.customer?.contact_person && (
                                <span className="block">{service.customer.contact_person}</span>
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Technician:</span>
                            <p className="text-gray-600">
                              {service.technician?.full_name || 'Unassigned'}
                              {service.technician?.phone && (
                                <span className="block">{service.technician.phone}</span>
                              )}
                            </p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Scheduled:</span>
                            <p className="text-gray-600">
                              {service.scheduled_date 
                                ? formatDate(service.scheduled_date)
                                : 'Not scheduled'
                              }
                            </p>
                          </div>
                          
                          <div>
                            <span className="font-medium text-gray-700">Created:</span>
                            <p className="text-gray-600">{formatDate(service.created_at)}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex flex-col space-y-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.location.href = `/services/${service.id}`}
                        >
                          View Details
                        </Button>
                        {service.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => window.location.href = `/services/assignment?service_id=${service.id}`}
                          >
                            Assign Technician
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {services.filter(s => s.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {services.filter(s => s.status === 'in_progress').length}
              </div>
              <div className="text-sm text-gray-600">In Progress</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {services.filter(s => s.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-600">
                {services.length}
              </div>
              <div className="text-sm text-gray-600">Total Services</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
