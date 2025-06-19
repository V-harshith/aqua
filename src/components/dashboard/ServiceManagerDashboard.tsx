"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
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
  // New service management stats
  pendingServiceRequests: number;
  todaysServiceJobs: number;
  emergencyRequests: number;
  completedServicesToday: number;
  avgServiceRating: number;
  totalRevenue: number;
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

interface ServiceRequest {
  id: string;
  request_number: string;
  priority: string;
  status: string;
  customer: { full_name: string };
  service_type: { type_name: string };
  estimated_cost: number;
  created_at: string;
}

interface TechnicianWorkload {
  id: string;
  full_name: string;
  activeComplaints: number;
  resolvedToday: number;
  activeServiceJobs: number;
  completedServicesToday: number;
  avgRating: number;
}

export const ServiceManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'services' | 'technicians'>('overview');
  const [stats, setStats] = useState<ServiceStats>({
    totalComplaints: 0,
    openComplaints: 0,
    assignedComplaints: 0,
    resolvedToday: 0,
    avgResolutionTime: 0,
    activeTechnicians: 0,
    pendingServiceRequests: 0,
    todaysServiceJobs: 0,
    emergencyRequests: 0,
    completedServicesToday: 0,
    avgServiceRating: 0,
    totalRevenue: 0,
  });
  
  const [recentComplaints, setRecentComplaints] = useState<RecentComplaint[]>([]);
  const [recentServiceRequests, setRecentServiceRequests] = useState<ServiceRequest[]>([]);
  const [technicianWorkloads, setTechnicianWorkloads] = useState<TechnicianWorkload[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'service_manager' || user?.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadServiceStats(),
        loadRecentComplaints(),
        loadRecentServiceRequests(),
        loadTechnicianWorkloads()
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
      
      // Get complaint statistics
      const { data: complaints, error: complaintsError } = await supabase
        .from('complaints')
        .select('status, created_at, resolved_at');

      if (complaintsError) throw complaintsError;

      // Get service request statistics
      const { data: serviceRequests, error: serviceError } = await supabase
        .from('service_requests')
        .select('status, priority, created_at, estimated_cost, actual_cost');

      if (serviceError) throw serviceError;

      // Get service assignments for today
      const { data: todaysAssignments, error: assignmentsError } = await supabase
        .from('service_assignments')
        .select('status, scheduled_date')
        .eq('scheduled_date', today);

      if (assignmentsError) throw assignmentsError;

      // Get service executions for today
      const { data: todaysExecutions, error: executionsError } = await supabase
        .from('service_executions')
        .select('total_service_cost, service_quality, created_at')
        .gte('created_at', today);

      if (executionsError) throw executionsError;

      // Get technician count
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'technician')
        .eq('is_available', true);

      if (techError) throw techError;

      // Calculate complaint statistics
      const totalComplaints = complaints.length;
      const openComplaints = complaints.filter(c => c.status === 'open').length;
      const assignedComplaints = complaints.filter(c => c.status === 'assigned').length;
      const resolvedToday = complaints.filter(c => 
        c.status === 'resolved' && 
        c.resolved_at?.startsWith(today)
      ).length;

      // Calculate service request statistics
      const pendingServiceRequests = serviceRequests.filter(s => s.status === 'pending').length;
      const todaysServiceJobs = todaysAssignments.length;
      const emergencyRequests = serviceRequests.filter(s => s.priority === 'emergency').length;
      const completedServicesToday = todaysExecutions.length;

      // Calculate average resolution time (in hours)
      const resolvedComplaints = complaints.filter(c => c.resolved_at);
      const avgResolutionTime = resolvedComplaints.length > 0 
        ? resolvedComplaints.reduce((acc, c) => {
            const created = new Date(c.created_at);
            const resolved = new Date(c.resolved_at!);
            return acc + (resolved.getTime() - created.getTime()) / (1000 * 60 * 60);
          }, 0) / resolvedComplaints.length
        : 0;

      // Calculate service statistics
      const avgServiceRating = todaysExecutions.length > 0
        ? todaysExecutions.reduce((acc, e) => acc + (e.service_quality || 0), 0) / todaysExecutions.length
        : 0;

      const totalRevenue = todaysExecutions.reduce((acc, e) => acc + (e.total_service_cost || 0), 0);

      setStats({
        totalComplaints,
        openComplaints,
        assignedComplaints,
        resolvedToday,
        avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
        activeTechnicians: technicians.length,
        pendingServiceRequests,
        todaysServiceJobs,
        emergencyRequests,
        completedServicesToday,
        avgServiceRating: Math.round(avgServiceRating * 10) / 10,
        totalRevenue,
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
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Format the data to match our interface
      const formattedData = (data || []).map(complaint => ({
        ...complaint,
        customer: { business_name: 'Customer', contact_person: 'Contact' },
        assigned_user: { full_name: 'Unassigned' }
      }));
      
      setRecentComplaints(formattedData);
    } catch (error) {
      console.error('Error loading recent complaints:', error);
    }
  };

  const loadRecentServiceRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .select(`
          id,
          request_number,
          priority,
          status,
          estimated_cost,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      
      // Format the data to match our interface
      const formattedData = (data || []).map(request => ({
        ...request,
        customer: { full_name: 'Customer' },
        service_type: { type_name: 'Service' }
      }));
      
      setRecentServiceRequests(formattedData);
    } catch (error) {
      console.error('Error loading recent service requests:', error);
    }
  };

  const loadTechnicianWorkloads = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get technicians with their workloads
      const { data: technicians, error: techError } = await supabase
        .from('users')
        .select(`
          id,
          full_name,
          rating
        `)
        .eq('role', 'technician')
        .eq('is_available', true);

      if (techError) throw techError;

      // Get complaint assignments
      const { data: complaintAssignments, error: complaintError } = await supabase
        .from('complaints')
        .select('assigned_to, status, resolved_at')
        .in('assigned_to', technicians.map(t => t.id));

      if (complaintError) throw complaintError;

      // Get service assignments
      const { data: serviceAssignments, error: serviceError } = await supabase
        .from('service_assignments')
        .select('assigned_technician_id, status, scheduled_date, completed_at')
        .in('assigned_technician_id', technicians.map(t => t.id));

      if (serviceError) throw serviceError;

      const workloads = technicians.map(tech => {
        const complaints = complaintAssignments.filter(c => c.assigned_to === tech.id);
        const services = serviceAssignments.filter(s => s.assigned_technician_id === tech.id);

        const activeComplaints = complaints.filter(c => 
          ['assigned', 'in_progress'].includes(c.status)
        ).length;
        
        const resolvedToday = complaints.filter(c => 
          c.status === 'resolved' && 
          c.resolved_at?.startsWith(today)
        ).length;

        const activeServiceJobs = services.filter(s => 
          ['assigned', 'accepted', 'en_route', 'arrived', 'in_progress'].includes(s.status)
        ).length;

        const completedServicesToday = services.filter(s => 
          s.status === 'completed' && 
          s.completed_at?.startsWith(today)
        ).length;

        return {
          id: tech.id,
          full_name: tech.full_name,
          activeComplaints,
          resolvedToday,
          activeServiceJobs,
          completedServicesToday,
          avgRating: tech.rating || 4.0
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
      showSuccess({ title: 'Complaint assigned successfully' });
      loadDashboardData();
    } catch (error: any) {
      showError({ title: error.message || 'Failed to assign complaint' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'emergency':
        return 'text-red-700 bg-red-100';
      case 'high':
      case 'urgent':
        return 'text-orange-700 bg-orange-100';
      case 'medium':
      case 'normal':
        return 'text-yellow-700 bg-yellow-100';
      case 'low':
        return 'text-green-700 bg-green-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
      case 'pending':
        return 'text-blue-700 bg-blue-100';
      case 'assigned':
        return 'text-purple-700 bg-purple-100';
      case 'in_progress':
        return 'text-yellow-700 bg-yellow-100';
      case 'resolved':
      case 'completed':
        return 'text-green-700 bg-green-100';
      case 'closed':
      case 'cancelled':
        return 'text-gray-700 bg-gray-100';
      default:
        return 'text-gray-700 bg-gray-100';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading service management dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Service Management Dashboard</h2>
          <p className="text-gray-600">Manage complaints, service requests, and technician assignments</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={() => window.open('/services', '_blank')}>
            Service Portal
          </Button>
          <Button variant="secondary" onClick={loadDashboardData}>
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.pendingServiceRequests}</div>
            <div className="text-sm text-gray-600">Pending Requests</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.todaysServiceJobs}</div>
            <div className="text-sm text-gray-600">Today's Jobs</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.emergencyRequests}</div>
            <div className="text-sm text-gray-600">Emergency</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedServicesToday}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.avgServiceRating}/5</div>
            <div className="text-sm text-gray-600">Avg Rating</div>
          </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">₹{Math.round(stats.totalRevenue)}</div>
            <div className="text-sm text-gray-600">Revenue Today</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'complaints', label: 'Complaints' },
          { key: 'services', label: 'Service Requests' },
          { key: 'technicians', label: 'Technicians' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Service Requests */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Service Requests</h3>
              <div className="space-y-3">
                {recentServiceRequests.map(request => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{request.request_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {request.customer.full_name} • {request.service_type.type_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        ₹{request.estimated_cost} • {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Recent Complaints */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Complaints</h3>
              <div className="space-y-3">
                {recentComplaints.map(complaint => (
                  <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{complaint.complaint_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                          {complaint.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{complaint.title}</div>
                      <div className="text-sm text-gray-500">
                        {complaint.customer?.business_name || complaint.customer?.contact_person} • 
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Technicians Tab */}
      {activeTab === 'technicians' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Technician Workloads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Technician</th>
                    <th className="text-left p-2">Active Complaints</th>
                    <th className="text-left p-2">Resolved Today</th>
                    <th className="text-left p-2">Active Services</th>
                    <th className="text-left p-2">Completed Today</th>
                    <th className="text-left p-2">Rating</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {technicianWorkloads.map(tech => (
                    <tr key={tech.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{tech.full_name}</td>
                      <td className="p-2">{tech.activeComplaints}</td>
                      <td className="p-2">{tech.resolvedToday}</td>
                      <td className="p-2">{tech.activeServiceJobs}</td>
                      <td className="p-2">{tech.completedServicesToday}</td>
                      <td className="p-2">{tech.avgRating}/5</td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tech.activeServiceJobs + tech.activeComplaints > 3
                            ? 'text-red-700 bg-red-100'
                            : tech.activeServiceJobs + tech.activeComplaints > 1
                            ? 'text-yellow-700 bg-yellow-100'
                            : 'text-green-700 bg-green-100'
                        }`}>
                          {tech.activeServiceJobs + tech.activeComplaints > 3 
                            ? 'Overloaded'
                            : tech.activeServiceJobs + tech.activeComplaints > 1
                            ? 'Busy'
                            : 'Available'
                          }
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => window.open('/services?action=new-request', '_blank')}
              className="w-full"
            >
              📋 New Service Request
            </Button>
            <Button
              onClick={() => window.open('/complaints?action=new', '_blank')}
              variant="secondary"
              className="w-full"
            >
              📝 New Complaint
            </Button>
            <Button
              onClick={() => window.open('/admin/users?role=technician', '_blank')}
              variant="secondary"
              className="w-full"
            >
              👥 Manage Technicians
            </Button>
            <Button
              onClick={() => window.open('/reports/service-analytics', '_blank')}
              variant="secondary"
              className="w-full"
            >
              📊 Service Reports
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};