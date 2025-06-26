"use client";
import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
interface DashboardStats {
  activeProducts: number;
  pendingServiceRequests: number;
  openComplaints: number;
  upcomingServices: number;
  totalSpent: number;
}
interface RecentActivity {
  id: string;
  type: 'service' | 'complaint' | 'product';
  title: string;
  status: string;
  date: string;
  amount?: number;
}
interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: () => void;
  urgent?: boolean;
}
export const SimpleDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    activeProducts: 0,
    pendingServiceRequests: 0,
    openComplaints: 0,
    upcomingServices: 0,
    totalSpent: 0,
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const quickActions: QuickAction[] = [
    {
      id: 'emergency',
      title: 'Emergency Service',
      description: 'Immediate help needed',
      icon: '🚨',
      urgent: true,
      action: () => setShowEmergencyModal(true)
    },
    {
      id: 'service-request',
      title: 'Request Service',
      description: 'Schedule maintenance',
      icon: '🔧',
      action: () => window.open('/services', '_blank')
    },
    {
      id: 'complaint',
      title: 'Report Issue',
      description: 'Log a complaint',
      icon: '📝',
      action: () => window.open('/complaints', '_blank')
    },
    {
      id: 'products',
      title: 'My Products',
      description: 'View your devices',
      icon: '📦',
      action: () => window.open('/products', '_blank')
    },
    {
      id: 'payment',
      title: 'Pay Bills',
      description: 'Make payments',
      icon: '💳',
      action: () => showSuccess({ title: 'Payment portal coming soon!' })
    },
    {
      id: 'support',
      title: 'Get Help',
      description: 'Contact support',
      icon: '💬',
      action: () => window.open('tel:1800-AQUA-911', '_self')
    }
  ];
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivity()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError({ title: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };
  const loadStats = async () => {
    try {
      // Get customer products
      const { data: products, error: productsError } = await supabase
        .from('customer_products')
        .select('id')
        .eq('customer_id', user?.id)
        .eq('status', 'active');
      if (productsError) throw productsError;
      // Get service requests
      const { data: serviceRequests, error: serviceError } = await supabase
        .from('service_requests')
        .select('status, estimated_cost, actual_cost')
        .eq('customer_id', user?.id);
      if (serviceError) throw serviceError;
      // Get complaints
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('status')
        .eq('customer_id', user?.id);
      if (complaintsError) throw complaintsError;
      // Get upcoming services
      const today = new Date().toISOString().split('T')[0];
      const { data: upcomingServices, error: upcomingError } = await supabase
        .from('service_assignments')
        .select(`
          id,
          scheduled_date,
          service_request!inner(customer_id)
        `)
        .eq('service_request.customer_id', user?.id)
        .gte('scheduled_date', today)
        .in('status', ['assigned', 'accepted', 'en_route']);
      if (upcomingError) throw upcomingError;
      // Calculate stats
      const pendingServiceRequests = serviceRequests.filter(s => s.status === 'pending').length;
      const openComplaints = complaints.filter(c => ['open', 'assigned', 'in_progress'].includes(c.status)).length;
      const totalSpent = serviceRequests.reduce((sum, s) => sum + (s.actual_cost || s.estimated_cost || 0), 0);
      setStats({
        activeProducts: products.length,
        pendingServiceRequests,
        openComplaints,
        upcomingServices: upcomingServices.length,
        totalSpent,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  const loadRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];
      // Get recent service requests
      const { data: services, error: serviceError } = await supabase
        .from('service_requests')
        .select(`
          id,
          request_number,
          status,
          estimated_cost,
          created_at
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!serviceError && services) {
        services.forEach(service => {
          activities.push({
            id: service.id,
            type: 'service',
            title: `Service Request ${service.request_number}`,
            status: service.status,
            date: service.created_at,
            amount: service.estimated_cost
          });
        });
      }
      // Get recent complaints
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select(`
          id,
          complaint_number,
          title,
          status,
          created_at
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(3);
      if (!complaintsError && complaints) {
        complaints.forEach(complaint => {
          activities.push({
            id: complaint.id,
            type: 'complaint',
            title: complaint.title || `Complaint ${complaint.complaint_number}`,
            status: complaint.status,
            date: complaint.created_at
          });
        });
      }
      // Get recent products
      const { data: products, error: productsError } = await supabase
        .from('customer_products')
        .select(`
          id,
          serial_number,
          status,
          created_at,
          product:product_id(product_name)
        `)
        .eq('customer_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(2);
      if (!productsError && products) {
        products.forEach(product => {
          activities.push({
            id: product.id,
            type: 'product',
            title: `Product ${product.serial_number}`,
            status: product.status,
            date: product.created_at
          });
        });
      }
      // Sort by date and take most recent 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };
  const handleEmergencyCall = () => {
    window.open('tel:1800-AQUA-911', '_self');
    setShowEmergencyModal(false);
  };
  const handleEmergencyRequest = () => {
    window.open('/services?priority=emergency', '_blank');
    setShowEmergencyModal(false);
  };
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'pending':
      case 'assigned':
        return 'text-blue-700 bg-blue-100';
      case 'in_progress':
        return 'text-yellow-700 bg-yellow-100';
      case 'open':
        return 'text-orange-700 bg-orange-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'service': return '🔧';
      case 'complaint': return '📝';
      case 'product': return '📦';
      default: return '📄';
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-blue-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Hi, {(user as any)?.full_name?.split(' ')[0] || 'Customer'}!</h1>
            <p className="text-blue-100 text-sm">Welcome to Aqua Water Management</p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold">₹{Math.round(stats.totalSpent)}</div>
            <div className="text-blue-100 text-sm">Total Spent</div>
          </div>
        </div>
      </div>
      {/* Quick Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.activeProducts}</div>
              <div className="text-sm text-gray-600">Active Products</div>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.pendingServiceRequests}</div>
              <div className="text-sm text-gray-600">Pending Services</div>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.openComplaints}</div>
              <div className="text-sm text-gray-600">Open Issues</div>
            </div>
          </Card>
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.upcomingServices}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
          </Card>
        </div>
        {/* Emergency Alert */}
        {stats.openComplaints > 0 && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <span className="text-red-500 text-2xl mr-3">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-red-900">Active Issues</h3>
                <p className="text-red-800 text-sm">You have {stats.openComplaints} open complaint(s)</p>
              </div>
              <Button
                size="sm"
                className="bg-red-600 hover:bg-red-700"
                onClick={() => window.open('/complaints', '_blank')}
              >
                View
              </Button>
            </div>
          </div>
        )}
        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map(action => (
              <div
                key={action.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  action.urgent ? 'ring-2 ring-red-200 bg-red-50' : ''
                }`}
                onClick={action.action}
              >
                <Card>
                  <div className="p-4 text-center">
                    <div className="text-3xl mb-2">{action.icon}</div>
                    <div className={`font-semibold text-sm ${
                      action.urgent ? 'text-red-700' : 'text-gray-900'
                    }`}>
                      {action.title}
                    </div>
                    <div className={`text-xs mt-1 ${
                      action.urgent ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {action.description}
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
        {/* Recent Activity */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map(activity => (
                <Card key={activity.id}>
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                        <div>
                          <div className="font-medium text-sm">{activity.title}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                          {activity.status}
                        </span>
                        {activity.amount && (
                          <div className="text-xs text-gray-500 mt-1">₹{activity.amount}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <Card>
                <div className="p-8 text-center">
                  <span className="text-4xl mb-2 block">📋</span>
                  <h3 className="font-semibold text-gray-900">No Recent Activity</h3>
                  <p className="text-gray-600 text-sm mt-1">Start by requesting a service or registering a product</p>
                </div>
              </Card>
            )}
          </div>
        </div>
        {/* Service Information */}
        <Card>
          <div className="p-4">
            <h3 className="font-semibold mb-3">Need Help?</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">Emergency Hotline</div>
                  <div className="text-xs text-gray-500">24/7 Support Available</div>
                </div>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => window.open('tel:1800-AQUA-911', '_self')}
                >
                  📞 Call
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">WhatsApp Support</div>
                  <div className="text-xs text-gray-500">Chat with our team</div>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.open('https://wa.me/918000000000', '_blank')}
                >
                  💬 Chat
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </div>
      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <div className="text-center mb-6">
              <span className="text-6xl">🚨</span>
              <h3 className="text-xl font-bold text-red-900 mt-2">Emergency Support</h3>
              <p className="text-red-700 text-sm mt-1">How can we help you right now?</p>
            </div>
            <div className="space-y-3">
              <Button
                onClick={handleEmergencyCall}
                className="w-full bg-red-600 hover:bg-red-700 py-4"
              >
                📞 Call Emergency Hotline
                <div className="text-xs text-red-100">1800-AQUA-911</div>
              </Button>
              <Button
                onClick={handleEmergencyRequest}
                variant="secondary"
                className="w-full py-4"
              >
                📝 Submit Emergency Request
                <div className="text-xs text-gray-500">Online emergency form</div>
              </Button>
              <Button
                onClick={() => setShowEmergencyModal(false)}
                variant="secondary"
                className="w-full"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 