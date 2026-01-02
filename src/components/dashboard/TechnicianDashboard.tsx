'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { authenticatedGet } from '../../lib/auth-client';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'next/navigation';

interface TechnicianStats {
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
  avgRating: number;
}

interface ServiceJob {
  id: string;
  service_number: string;
  service_type: string;
  description: string;
  status: string;
  priority: string;
  scheduled_date: string;
  customer?: {
    business_name?: string;
    contact_person?: string;
    phone?: string;
    billing_address?: string;
  };
  created_at: string;
  estimated_hours?: number;
}

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const router = useRouter();
  const [stats, setStats] = useState<TechnicianStats>({
    assignedJobs: 0,
    inProgressJobs: 0,
    completedJobs: 0,
    avgRating: 4.5
  });
  const [assignedJobs, setAssignedJobs] = useState<ServiceJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  // Load data when component mounts and every 30 seconds for real-time updates
  useEffect(() => {
    if (user?.id) {
      loadTechnicianData();
      const interval = setInterval(loadTechnicianData, 30000); // Auto-refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [user?.id]); // Only depend on stable user.id

  const loadTechnicianData = async () => {
    try {
      setIsLoading(true);

      // Fetch assigned and in-progress services for this technician using authenticated requests
      const [servicesData, completedData] = await Promise.all([
        authenticatedGet(`/api/services?assigned_technician=${user?.id}&status=assigned,in_progress`).catch((error) => {
          console.error('Failed to fetch assigned services:', error);
          return { services: [] };
        }),
        authenticatedGet(`/api/services?assigned_technician=${user?.id}&status=completed`).catch((error) => {
          console.error('Failed to fetch completed services:', error);
          return { services: [] };
        })
      ]);
      
      const jobs = servicesData.services || [];
      setAssignedJobs(jobs);

      // Calculate real-time stats
      const assigned = jobs.filter((j: ServiceJob) => j.status === 'assigned').length;
      const inProgress = jobs.filter((j: ServiceJob) => j.status === 'in_progress').length;
      const completed = completedData.services?.length || 0;

      setStats({
        assignedJobs: assigned,
        inProgressJobs: inProgress,
        completedJobs: completed,
        avgRating: 4.5
      });
    } catch (error) {
      console.error('Error loading technician data:', error);
      showError({ title: 'Error', message: 'Failed to load dashboard data' });
      setAssignedJobs([]); // Ensure we have fallback data
    } finally {
      setIsLoading(false);
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/services', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceId: jobId,
          status: newStatus
        })
      });

      if (response.ok) {
        showSuccess({ 
          title: 'Status Updated', 
          message: `Job status changed to ${newStatus}` 
        });
        loadTechnicianData(); // Refresh data
      } else {
        throw new Error(`Failed to update status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating job status:', error);
      showError({ 
        title: 'Error', 
        message: 'Failed to update job status' 
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
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
            <h2 className="text-2xl font-bold text-gray-900">Technician Dashboard</h2>
            <p className="text-gray-600">Welcome back, {(user as any)?.full_name || user?.email}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadTechnicianData}
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.assignedJobs}</div>
            <div className="text-sm text-gray-600">Assigned Jobs</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.inProgressJobs}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">⭐ {stats.avgRating}</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </Card>
      </div>

      {/* Active Jobs */}
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">My Jobs ({assignedJobs.length})</h3>
          </div>
          <div className="space-y-4">
            {assignedJobs.map(job => (
              <div key={job.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <span className="font-medium">{job.service_number}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(job.status)}`}>
                      {job.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(job.priority)}`}>
                      {job.priority}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(job.created_at)}
                  </div>
                </div>
                <div className="mb-2">
                  <div className="font-medium text-gray-900">{job.service_type}</div>
                  <div className="text-sm text-gray-600">
                    Customer: {job.customer?.business_name || job.customer?.contact_person || 'N/A'}
                  </div>
                  {job.description && (
                    <div className="text-sm text-gray-600 mt-1">{job.description}</div>
                  )}
                </div>
                {job.customer?.phone && (
                  <div className="text-sm text-gray-600 mb-2">
                    📞 {job.customer.phone}
                  </div>
                )}
                {job.customer?.billing_address && (
                  <div className="text-sm text-gray-600 mb-2">
                    📍 {job.customer.billing_address}
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {job.estimated_hours && `Est. ${job.estimated_hours} hours`}
                  </div>
                  <div className="flex items-center space-x-2">
                    {job.status === 'assigned' && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.id, 'in_progress')}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Start Job
                      </Button>
                    )}
                    {job.status === 'in_progress' && (
                      <Button
                        size="sm"
                        onClick={() => updateJobStatus(job.id, 'completed')}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Complete Job
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {assignedJobs.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No jobs assigned. Check back later for new assignments!
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}; 