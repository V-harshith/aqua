'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { authenticatedGet } from '@/lib/auth-client';

interface ServiceRequest {
  id: string;
  service_number: string;
  service_type: string;
  status: string;
  priority: string;
  created_at: string;
  customer_id?: string;
  description?: string;
  estimated_cost?: number;
  assigned_technician?: string;
}

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
  description?: string;
  customer_id?: string;
}

interface CustomerStats {
  activeServices: number;
  completedServices: number;
  openComplaints: number;
  totalSpent: number;
}

export function CustomerDashboard() {
  const { userProfile } = useAuthContext();
  const { success, error: showError } = useToastContext();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'complaints'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState<CustomerStats>({
    activeServices: 0,
    completedServices: 0,
    openComplaints: 0,
    totalSpent: 0
  });

  // Load data when component mounts and every 30 seconds for real-time updates
  useEffect(() => {
    if (userProfile?.id) {
      loadCustomerData();
      const interval = setInterval(loadCustomerData, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [userProfile?.id]); // Only depend on stable userProfile.id

  const loadCustomerData = async () => {
    if (!userProfile?.id) return;

    try {
      setIsLoading(true);

      // Fetch real data from APIs in parallel using authenticated requests
      const [servicesData, complaintsData, statsData] = await Promise.all([
        authenticatedGet(`/api/services?customer_id=${userProfile.id}`).catch((error) => {
          console.error('Failed to fetch services:', error);
          return { services: [] };
        }),
        authenticatedGet(`/api/complaints?customer_id=${userProfile.id}`).catch((error) => {
          console.error('Failed to fetch complaints:', error);
          return { complaints: [] };
        }),
        authenticatedGet(`/api/dashboard/stats?customer_id=${userProfile.id}&role=${userProfile.role}`).catch((error) => {
          console.error('Failed to fetch stats:', error);
          return { overview: {} };
        })
      ]);

      // Handle services
      setServiceRequests(servicesData.services || []);

      // Handle complaints
      setComplaints(complaintsData.complaints || []);
      // Handle stats
      setStats({
        activeServices: statsData.overview?.activeServices || 0,
        completedServices: statsData.overview?.completedServices || 0,
        openComplaints: statsData.overview?.myComplaints || 0,
        totalSpent: statsData.overview?.totalSpent || 0
      });

    } catch (err: any) {
      console.error('❌ Error loading customer dashboard:', err);
      showError({ 
        title: 'Failed to load dashboard', 
        message: 'Unable to fetch real-time data. Please check your connection and try again.' 
      });

      // Set empty states on error
      setServiceRequests([]);
      setComplaints([]);
      setStats({
        activeServices: 0,
        completedServices: 0,
        openComplaints: 0,
        totalSpent: 0
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'assigned': return 'bg-purple-100 text-purple-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'open': return 'bg-red-100 text-red-800';
      case 'investigating': return 'bg-orange-100 text-orange-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
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

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      success({ title: 'Signed out successfully' });
      router.replace('/');
    } catch (err: any) {
      showError({ title: 'Sign out failed', message: err.message });
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-24 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Dashboard Header */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600">Welcome back, {userProfile?.full_name || userProfile?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadCustomerData}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="sm"
            >
              🚪 Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Real-Time Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.activeServices}</div>
            <div className="text-sm text-gray-600">Active Services</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedServices}</div>
            <div className="text-sm text-gray-600">Completed Services</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{stats.openComplaints}</div>
            <div className="text-sm text-gray-600">Open Complaints</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${stats.totalSpent}</div>
            <div className="text-sm text-gray-600">Total Spent</div>
          </div>
        </Card>
      </div>

      {/* Navigation Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'services', label: 'My Services', icon: '🔧' },
              { id: 'complaints', label: 'My Complaints', icon: '📝' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </Card>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Services */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Services</h3>
                <div className="space-y-3">
                  {serviceRequests.slice(0, 5).map(service => (
                    <div key={service.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{service.service_number}</div>
                        <div className="text-sm text-gray-600">{service.service_type}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(service.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {serviceRequests.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No services found
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Recent Complaints */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Complaints</h3>
                <div className="space-y-3">
                  {complaints.slice(0, 5).map(complaint => (
                    <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium">{complaint.complaint_number}</div>
                        <div className="text-sm text-gray-600">{complaint.title}</div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(complaint.created_at)}
                        </div>
                      </div>
                    </div>
                  ))}
                  {complaints.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No complaints found
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'services' && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">All Services ({serviceRequests.length})</h3>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  ➕ Request Service
                </Button>
              </div>
              <div className="space-y-4">
                {serviceRequests.map(service => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{service.service_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(service.priority)}`}>
                          {service.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(service.created_at)}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{service.service_type}</div>
                      {service.description && (
                        <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                      )}
                    </div>
                    {service.estimated_cost && (
                      <div className="text-sm text-gray-600">
                        Estimated Cost: ${service.estimated_cost}
                      </div>
                    )}
                  </div>
                ))}
                {serviceRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No services found. Request your first service!
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'complaints' && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">All Complaints ({complaints.length})</h3>
                <Button size="sm" className="bg-red-600 hover:bg-red-700">
                  ➕ File Complaint
                </Button>
              </div>
              <div className="space-y-4">
                {complaints.map(complaint => (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{complaint.complaint_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(complaint.created_at)}
                      </div>
                    </div>
                    <div className="mb-2">
                      <div className="font-medium text-gray-900">{complaint.title}</div>
                      {complaint.description && (
                        <div className="text-sm text-gray-600 mt-1">{complaint.description}</div>
                      )}
                    </div>
                  </div>
                ))}
                {complaints.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No complaints found. We hope everything is working well!
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 