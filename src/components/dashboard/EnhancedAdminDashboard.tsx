'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface DashboardStats {
  totalCustomers: number;
  activeComplaints: number;
  pendingServices: number;
  monthlyRevenue: number;
  technicianUtilization: number;
  customerSatisfaction: number;
  responseTime: number;
}

interface RecentActivity {
  id: string;
  type: 'complaint' | 'service' | 'delivery' | 'payment';
  title: string;
  description: string;
  timestamp: string;
  status: string;
  priority?: string;
}

export const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeComplaints: 0,
    pendingServices: 0,
    monthlyRevenue: 0,
    technicianUtilization: 0,
    customerSatisfaction: 0,
    responseTime: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeFrame]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadStats(),
        loadRecentActivity()
      ]);
    } catch (error: any) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      // Total customers
      const { count: customerCount } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'customer')
        .eq('is_active', true);

      // Active complaints
      const { count: complaintCount } = await supabase
        .from('complaints')
        .select('*', { count: 'exact', head: true })
        .in('status', ['open', 'assigned', 'in_progress']);

      // Technician utilization (active assignments vs total technicians)
      const { count: totalTechnicians } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'technician')
        .eq('is_active', true);

      const { count: activeTechnicians } = await supabase
        .from('complaints')
        .select('assigned_to', { count: 'exact', head: true })
        .not('assigned_to', 'is', null)
        .in('status', ['assigned', 'in_progress']);

      const technicianUtilization = totalTechnicians ? (activeTechnicians || 0) / totalTechnicians * 100 : 0;

      setStats({
        totalCustomers: customerCount || 0,
        activeComplaints: complaintCount || 0,
        pendingServices: 0, // Can be enhanced when service_requests table is available
        monthlyRevenue: 0, // Can be enhanced when invoices table is available
        technicianUtilization: Math.round(technicianUtilization),
        customerSatisfaction: 4.2, // Mock data for now
        responseTime: 2.5 // Mock data for now
      });

    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentActivity = async () => {
    try {
      const activities: RecentActivity[] = [];

      // Recent complaints
      const { data: complaints } = await supabase
        .from('complaints')
        .select('id, complaint_number, title, status, priority, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

      complaints?.forEach(complaint => {
        activities.push({
          id: complaint.id,
          type: 'complaint',
          title: `New Complaint: ${complaint.complaint_number}`,
          description: complaint.title,
          timestamp: complaint.created_at,
          status: complaint.status,
          priority: complaint.priority
        });
      });

      // Sort by timestamp and take most recent
      activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setRecentActivity(activities.slice(0, 10));

    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const exportReport = async (type: 'customers' | 'complaints' | 'services' | 'revenue') => {
    try {
      setIsLoading(true);
      
      let query;
      let filename;
      
      switch (type) {
        case 'customers':
          query = supabase
            .from('users')
            .select('full_name, email, phone, created_at')
            .eq('role', 'customer');
          filename = 'customers_report.csv';
          break;
          
        case 'complaints':
          query = supabase
            .from('complaints')
            .select('complaint_number, title, status, priority, created_at, resolved_at');
          filename = 'complaints_report.csv';
          break;
          
        default:
          query = supabase
            .from('users')
            .select('full_name, email, phone, created_at')
            .eq('role', 'customer');
          filename = 'general_report.csv';
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Convert to CSV
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => Object.values(row).join(',')).join('\n');
        const csv = headers + '\n' + rows;
        
        // Download file
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
      }
      
    } catch (error: any) {
      console.error('Error exporting report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'complaint': return '🔧';
      case 'service': return '⚙️';
      case 'delivery': return '🚚';
      case 'payment': return '💰';
      default: return '📋';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Comprehensive system overview and management</p>
        
        {/* Time Frame Selector */}
        <div className="mt-4">
          <div className="flex space-x-2">
            {(['today', 'week', 'month'] as const).map((timeFrame) => (
              <button
                key={timeFrame}
                onClick={() => setSelectedTimeFrame(timeFrame)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  selectedTimeFrame === timeFrame
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {timeFrame.charAt(0).toUpperCase() + timeFrame.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Customers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalCustomers}</p>
              </div>
              <div className="text-3xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Complaints</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeComplaints}</p>
              </div>
              <div className="text-3xl">🔧</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Technician Utilization</p>
                <p className="text-2xl font-bold text-blue-600">{stats.technicianUtilization}%</p>
              </div>
              <div className="text-3xl">👷</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-orange-600">{stats.customerSatisfaction}/5</p>
              </div>
              <div className="text-3xl">⭐</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No recent activity</p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-md">
                    <span className="text-lg">{getActivityIcon(activity.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{activity.title}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          activity.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                          activity.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {activity.status}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Reports */}
        <Card>
          <CardHeader>
            <h3 className="text-xl font-semibold text-gray-900">Quick Actions & Reports</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Export Reports</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => exportReport('customers')}
                    variant="secondary"
                    size="sm"
                    disabled={isLoading}
                  >
                    Customers CSV
                  </Button>
                  <Button
                    onClick={() => exportReport('complaints')}
                    variant="secondary"
                    size="sm"
                    disabled={isLoading}
                  >
                    Complaints CSV
                  </Button>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">System Actions</h4>
                <div className="space-y-2">
                  <Button
                    onClick={() => loadDashboardData()}
                    variant="primary"
                    size="sm"
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Refreshing...' : 'Refresh Dashboard'}
                  </Button>
                  <Button
                    onClick={() => window.open('/admin/users', '_blank')}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    Manage Users
                  </Button>
                  <Button
                    onClick={() => window.open('/complaints', '_blank')}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    View All Complaints
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}; 