'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface TechnicianStats {
  assignedJobs: number;
  completedJobs: number;
  pendingJobs: number;
  avgRating: number;
}

interface JobAssignment {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  status: string;
}

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  const [stats, setStats] = useState<TechnicianStats>({
    assignedJobs: 0,
    completedJobs: 0,
    pendingJobs: 0,
    avgRating: 0
  });
  const [recentJobs, setRecentJobs] = useState<JobAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/dashboard/overview?type=technician&userId=${user?.id}`);
      const result = await response.json();
      
      if (result.success) {
        setStats(result.data.stats);
        setRecentJobs(result.data.activities || []);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showError({ title: 'Failed to load dashboard data' });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAvailability = async () => {
    try {
      const response = await fetch('/api/technicians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicianId: user?.id,
          availability: !isAvailable
        })
      });

      const result = await response.json();
      
      if (result.success) {
        setIsAvailable(!isAvailable);
        showSuccess({ title: `Status updated to ${!isAvailable ? 'Available' : 'Busy'}` });
      } else {
        showError({ title: 'Failed to update status' });
      }
    } catch (error) {
      showError({ title: 'Failed to update status' });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'assigned': return 'text-blue-700 bg-blue-100';
      case 'completed': return 'text-green-700 bg-green-100';
      case 'in_progress': return 'text-yellow-700 bg-yellow-100';
      case 'pending': return 'text-orange-700 bg-orange-100';
      default: return 'text-gray-700 bg-gray-100';
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Technician Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {isAvailable ? 'Available' : 'Busy'}
            </span>
          </div>
          <Button
            onClick={toggleAvailability}
            variant={isAvailable ? "secondary" : "primary"}
            size="sm"
          >
            {isAvailable ? 'Mark Busy' : 'Mark Available'}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.assignedJobs}</div>
            <div className="text-sm text-gray-600">Assigned Jobs</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completedJobs}</div>
            <div className="text-sm text-gray-600">Completed Jobs</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.pendingJobs}</div>
            <div className="text-sm text-gray-600">Pending Jobs</div>
          </div>
        </Card>
        
        <Card className="p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">⭐ {stats.avgRating}/5</div>
            <div className="text-sm text-gray-600">Average Rating</div>
          </div>
        </Card>
      </div>

      {/* Recent Job Assignments */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Job Assignments</h3>
          <Button variant="secondary" size="sm" onClick={loadDashboardData}>
            Refresh
          </Button>
        </div>
        
        <div className="space-y-4">
          {recentJobs.length > 0 ? (
            recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{job.title}</h4>
                  <p className="text-sm text-gray-600">
                    {new Date(job.timestamp).toLocaleDateString()} at {new Date(job.timestamp).toLocaleTimeString()}
                  </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500">No recent job assignments</div>
              <p className="text-gray-400 text-sm mt-1">New assignments will appear here</p>
            </div>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button onClick={() => window.open('/services', '_blank')} className="w-full">
            📋 View All Jobs
          </Button>
          <Button onClick={() => window.open('/technicians', '_blank')} variant="secondary" className="w-full">
            👥 Technician Portal
          </Button>
          <Button onClick={loadDashboardData} variant="secondary" className="w-full">
            🔄 Refresh Data
          </Button>
        </div>
      </Card>
    </div>
  );
}; 