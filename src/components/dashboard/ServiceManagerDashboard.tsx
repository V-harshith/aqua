import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase, ComplaintStatus } from '../../lib/supabase';

interface ServiceStats {
  totalComplaints: number;
  openComplaints: number;
  assignedComplaints: number;
  resolvedToday: number;
  avgResolutionTime: number;
  activeTechnicians: number;
}

interface RecentComplaint {
  id: string;
  complaint_number: string;
  title: string;
  priority: string;
  status: ComplaintStatus;
  customer?: { business_name?: string; contact_person?: string };
  assigned_user?: { full_name: string };
  created_at: string;
}

interface TechnicianWorkload {
  id: string;
  full_name: string;
  activeComplaints: number;
  resolvedToday: number;
  avgRating: number;
}

export const ServiceManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stats, setStats] = useState<ServiceStats>({
    totalComplaints: 0,
    openComplaints: 0,
    assignedComplaints: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    activeTechnicians: 0
  });
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [technicianWorkloads, setTechnicianWorkloads] = useState<TechnicianWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'service_manager') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadServiceStats(),
        loadRecentComplaints(),
        loadTechnicianWorkloads()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Get complaint statistics
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('status, created_at, resolved_at');

      if (complaintsError) throw complaintsError;

      // Get technician count
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'technician')
        .eq('is_active', true);

      if (techError) throw techError;

      // Calculate statistics
      const totalComplaints = complaints.length;
      const openComplaints = complaints.filter(c => c.status === 'open').length;
      const assignedComplaints = complaints.filter(c => c.status === 'assigned').length;
      const resolvedToday = complaints.filter(c => 
        c.status === 'resolved' && 
        c.resolved_at?.startsWith(today)
      ).length;

      // Calculate average resolution time (in hours)
      const resolvedComplaints = complaints.filter(c => c.resolved_at);
      const avgResolutionTime = resolvedComplaints.length > 0 
        ? resolvedComplaints.reduce((acc, c) => {
            const created = new Date(c.created_at);
            const resolved = new Date(c.resolved_at!);
            return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          }, 0) / resolvedComplaints.length
        : 0;

      setStats({
        totalComplaints,
        openComplaints,
        assignedComplaints,
        resolvedToday,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        activeTechnicians: technicians.length
      });
    } catch (error) {
      console.error('Error loading service stats:', error);
    }
  };

  const loadRecentComplaints = async () => {
    try {
      const { data, error } = await supabase
        .from('complaints')
        .select(`
          id,
          complaint_number,
          title,
          priority,
          status,
          created_at,
          customer:customers(business_name, contact_person),
          assigned_user:users(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setRecentComplaints(data || []);
    } catch (error) {
      console.error('Error loading recent complaints:', error);
    }
  };

  const loadTechnicianWorkloads = async () => {
    try {
      // Get technicians with their complaint counts
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          complaints_assigned:complaints!assigned_to(id, status, resolved_at)
        `)
        .eq('role', 'technician')
        .eq('is_active', true);

      if (techError) throw techError;

      const today = new Date().toISOString().split('T')[0];

      const workloads = technicians.map(tech => {
        const complaints = tech.complaints_assigned || [];
        const activeComplaints = complaints.filter(c => 
          ['assigned', 'in_progress'].includes(c.status)
        ).length;
        
        const resolvedToday = complaints.filter(c => 
          c.status === 'resolved' && 
          c.resolved_at?.startsWith(today)
        ).length;

        return {
          id: tech.id,
          full_name: tech.full_name,
          activeComplaints,
          resolvedToday,
          avgRating: 4.2 // This would come from customer feedback in a real system
        };
      });

      setTechnicianWorkloads(workloads);
    } catch (error) {
      console.error('Error loading technician workloads:', error);
    }
  };

  const assignComplaint = async (complaintId: string, technicianId: string) => {
    try {
      const { error } = await supabase
        .from('complaints')
        .update({ 
          assigned_to: technicianId,
          status: 'assigned'
        })
        .eq('id', complaintId);

      if (error) throw error;

      showToast('Complaint assigned successfully', 'success');
      loadDashboardData();
    } catch (error: any) {
      console.error('Error assigning complaint:', error);
      showToast(error.message || 'Failed to assign complaint', 'error');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-blue-600 bg-blue-100';
      case 'assigned': return 'text-yellow-600 bg-yellow-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (user?.role !== 'service_manager') {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
        <p>You don't have permission to access the service manager dashboard.</p>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Total Complaints</h3>
          <p className="text-2xl font-bold text-blue-600">{stats.totalComplaints}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Open</h3>
          <p className="text-2xl font-bold text-red-600">{stats.openComplaints}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Assigned</h3>
          <p className="text-2xl font-bold text-yellow-600">{stats.assignedComplaints}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Resolved Today</h3>
          <p className="text-2xl font-bold text-green-600">{stats.resolvedToday}</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Avg Resolution</h3>
          <p className="text-2xl font-bold text-purple-600">{stats.avgResolutionTime}h</p>
        </Card>
        <Card className="p-4">
          <h3 className="text-sm font-medium text-gray-600">Active Techs</h3>
          <p className="text-2xl font-bold text-indigo-600">{stats.activeTechnicians}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Complaints */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Recent Complaints</h2>
            <Button
              onClick={loadDashboardData}
              className="bg-blue-600 hover:bg-blue-700 text-sm"
            >
              Refresh
            </Button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentComplaints.map((complaint) => (
              <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{complaint.complaint_number}</h4>
                    <p className="text-sm text-gray-600">{complaint.title}</p>
                    {complaint.customer && (
                      <p className="text-xs text-gray-500">
                        {complaint.customer.business_name || complaint.customer.contact_person}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(complaint.priority)}`}>
                      {complaint.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(complaint.status)}`}>
                      {complaint.status}
                    </span>
                  </div>
                </div>
                {complaint.assigned_user && (
                  <p className="text-xs text-blue-600">
                    Assigned to: {complaint.assigned_user.full_name}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(complaint.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </Card>

        {/* Technician Workloads */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Technician Workloads</h2>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {technicianWorkloads.map((tech) => (
              <div key={tech.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-medium text-gray-900">{tech.full_name}</h4>
                    <div className="flex gap-4 text-sm text-gray-600 mt-1">
                      <span>Active: {tech.activeComplaints}</span>
                      <span>Resolved Today: {tech.resolvedToday}</span>
                      <span>Rating: ⭐ {tech.avgRating}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${
                      tech.activeComplaints > 5 
                        ? 'text-red-600' 
                        : tech.activeComplaints > 3 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {tech.activeComplaints > 5 ? 'Overloaded' : 
                       tech.activeComplaints > 3 ? 'Busy' : 'Available'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.href = '/complaints'}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              📝 View All Complaints
            </Button>
            <Button 
              onClick={() => window.location.href = '/services'}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              🔧 Manage Services
            </Button>
            <Button 
              onClick={() => window.location.href = '/admin/users?role=technician'}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              👥 Manage Technicians
            </Button>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">SLA Monitoring</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Critical (2h)</span>
              <span className="text-sm font-medium text-green-600">98% On Time</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">High (4h)</span>
              <span className="text-sm font-medium text-green-600">95% On Time</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Medium (8h)</span>
              <span className="text-sm font-medium text-yellow-600">87% On Time</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Low (24h)</span>
              <span className="text-sm font-medium text-red-600">72% On Time</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance Trends</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Week</span>
              <span className="text-sm font-medium text-green-600">+12% ↗</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">This Month</span>
              <span className="text-sm font-medium text-green-600">+8% ↗</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Customer Satisfaction</span>
              <span className="text-sm font-medium text-green-600">4.2/5 ⭐</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">First Call Resolution</span>
              <span className="text-sm font-medium text-yellow-600">78%</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};