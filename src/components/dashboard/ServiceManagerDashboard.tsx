"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface ServiceStats {
  totalServices: number;
  pendingServices: number;
  inProgressServices: number;
  completedToday: number;
  emergencyRequests: number;
  avgServiceRating: number;
}

interface ServiceRequest {
  id: string;
  service_number: string;
  service_type: string;
  customer_name: string;
  priority: 'high' | 'medium' | 'low' | 'emergency';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  estimated_cost?: number;
  assigned_technician?: string;
  description?: string;
  customer_contact?: string;
}

interface TechnicianInfo {
  id: string;
  full_name: string;
  is_available: boolean;
  active_services: number;
  completed_today: number;
  rating: number;
}

export const ServiceManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'technicians'>('overview');
  const [stats, setStats] = useState<ServiceStats>({
    totalServices: 0,
    pendingServices: 0,
    inProgressServices: 0,
    completedToday: 0,
    emergencyRequests: 0,
    avgServiceRating: 4.5,
  });

  const [services, setServices] = useState<ServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<TechnicianInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load data when component mounts and every 30 seconds for real-time updates
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
      const interval = setInterval(loadDashboardData, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Only depend on stable user.id

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadServiceStats(),
        loadTechnicians()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError({ title: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch services data
      const servicesResponse = await fetch('/api/services');
      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        const allServices = servicesData.services || [];
        setServices(allServices);

        // Calculate real-time stats
        const pending = allServices.filter((s: ServiceRequest) => s.status === 'pending').length;
        const inProgress = allServices.filter((s: ServiceRequest) => s.status === 'in_progress').length;
        const emergency = allServices.filter((s: ServiceRequest) => s.priority === 'emergency').length;
        const completed = allServices.filter((s: ServiceRequest) => 
          s.status === 'completed' && 
          s.created_at.startsWith(today)
        ).length;

        setStats({
          totalServices: allServices.length,
          pendingServices: pending,
          inProgressServices: inProgress,
          completedToday: completed,
          emergencyRequests: emergency,
          avgServiceRating: 4.5
        });
      }

      // Fetch technicians data
      const techniciansResponse = await fetch('/api/technicians');
      if (techniciansResponse.ok) {
        const techData = await techniciansResponse.json();
        setTechnicians(techData.technicians || []);
      }

    } catch (error) {
      console.error('Error loading service manager data:', error);
      showError({ title: 'Error', message: 'Failed to load dashboard data' });
      // Ensure we have fallback data
      setServices([]);
      setTechnicians([]);
    }
  };

  const loadTechnicians = async () => {
    try {
      // Fetch technicians data
      const techniciansResponse = await fetch('/api/technicians');
      if (techniciansResponse.ok) {
        const techData = await techniciansResponse.json();
        setTechnicians(techData.technicians || []);
      }
    } catch (error) {
      console.error('Error loading technicians:', error);
      showError({ title: 'Error', message: 'Failed to load technicians' });
    }
  };

  const assignService = async (serviceId: string, technicianId: string) => {
    try {
      const response = await fetch('/api/services/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_id: serviceId,
          technician_id: technicianId
        })
      });

      if (response.ok) {
        showSuccess({ 
          title: 'Service Assigned', 
          message: 'Service has been assigned to technician successfully' 
        });
        loadDashboardData(); // Refresh data
      } else {
        throw new Error(`Failed to assign service: ${response.status}`);
      }
    } catch (error) {
      console.error('Error assigning service:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to assign service' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'emergency': return 'bg-red-200 text-red-900 font-bold';
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Header - NO BACK BUTTON (this IS the main dashboard) */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Service Manager Dashboard</h2>
            <p className="text-gray-600">Welcome back, {(user as any)?.full_name || user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadDashboardData}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalServices}</div>
            <div className="text-sm text-gray-600">Total Services</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingServices}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.inProgressServices}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.emergencyRequests}</div>
            <div className="text-sm text-gray-600">Emergency</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">⭐ {stats.avgServiceRating}/5</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </Card>
      </div>

      {/* Quick Actions - Only what service managers need */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Button 
            onClick={() => window.location.href = '/services/assignment'} 
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            👥 Assign Services
          </Button>
          <Button 
            onClick={() => window.location.href = '/technicians'} 
            variant="secondary" 
            className="w-full"
          >
            🔧 Manage Technicians
          </Button>
          <Button 
            onClick={() => window.location.href = '/services'} 
            variant="secondary" 
            className="w-full"
          >
            📋 All Services
          </Button>
          <Button 
            onClick={() => window.location.href = '/reports'} 
            variant="outline" 
            className="w-full"
          >
            📊 Service Reports
          </Button>
        </div>
      </Card>

      {/* Navigation Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { key: 'overview', label: '📊 Overview', count: null },
              { key: 'services', label: '🔧 Service Requests', count: services.length },
              { key: 'technicians', label: '👥 Technicians', count: technicians.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Priority Services */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Priority Service Requests</h3>
                <div className="space-y-3">
                  {services
                    .filter(service => ['emergency', 'high'].includes(service.priority) && service.status === 'pending')
                    .slice(0, 5)
                    .map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className="text-lg">🔧</span>
                          <div>
                            <p className="font-medium text-gray-900">{service.service_type}</p>
                            <p className="text-sm text-gray-600">
                              {service.customer_name} • {formatDate(service.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(service.priority)}`}>
                          {service.priority.toUpperCase()}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                          {service.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}

                  {services.filter(s => ['emergency', 'high'].includes(s.priority) && s.status === 'pending').length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-2">✅</div>
                      <p className="text-gray-600">No priority requests pending</p>
                      <p className="text-sm text-gray-500">All emergency and high priority services are handled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Services Tab */}
          {activeTab === 'services' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Service Requests ({services.length})</h3>
                <Button 
                  onClick={() => window.location.href = '/services/assignment'} 
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  👥 Assign Services
                </Button>
              </div>

              <div className="space-y-4">
                {services.length > 0 ? (
                  services.map((service) => (
                    <div key={service.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-semibold text-lg">{service.service_type}</h4>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(service.status)}`}>
                              {service.status.replace('_', ' ').toUpperCase()}
                            </span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(service.priority)}`}>
                              {service.priority.toUpperCase()} PRIORITY
                            </span>
                          </div>

                          {service.description && (
                            <p className="text-gray-600 mb-3">{service.description}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-gray-700">Service #:</span>
                              <p className="text-gray-600">{service.service_number}</p>
                            </div>

                            <div>
                              <span className="font-medium text-gray-700">Customer:</span>
                              <p className="text-gray-600">{service.customer_name}</p>
                            </div>

                            <div>
                              <span className="font-medium text-gray-700">Created:</span>
                              <p className="text-gray-600">{formatDate(service.created_at)}</p>
                            </div>

                            {service.estimated_cost && (
                              <div>
                                <span className="font-medium text-gray-700">Est. Cost:</span>
                                <p className="text-gray-600">${service.estimated_cost}</p>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col space-y-2">
                          {service.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => window.location.href = `/services/assignment?service_id=${service.id}`}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              👥 Assign Tech
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🔧</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No service requests</h3>
                    <p className="text-gray-600 mb-4">New service requests will appear here automatically</p>
                    <Button 
                      onClick={loadDashboardData}
                      variant="secondary"
                    >
                      🔄 Check for New Requests
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Technicians Tab */}
          {activeTab === 'technicians' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">Available Technicians ({technicians.length})</h3>
                <Button 
                  onClick={() => window.location.href = '/technicians'} 
                  variant="outline"
                  size="sm"
                >
                  👥 Manage All
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {technicians.length > 0 ? (
                  technicians.map((tech) => (
                    <Card key={tech.id} className="p-4">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900 mb-2">{tech.full_name}</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Status:</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tech.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {tech.is_available ? 'Available' : 'Busy'}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Active:</span>
                            <span className="font-medium">{tech.active_services || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Completed Today:</span>
                            <span className="font-medium">{tech.completed_today || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Rating:</span>
                            <span className="font-medium">⭐ {tech.rating || 4.5}/5</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="text-6xl mb-4">👥</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No technicians available</h3>
                    <p className="text-gray-600">Technician information will appear here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};