"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

interface ServiceRequest {
  id: string;
  request_number: string;
  customer_id: string;
  customer_product_id: string | null;
  service_type_id: string;
  priority: string;
  preferred_date: string | null;
  preferred_time_slot: string;
  customer_address: string;
  contact_phone: string;
  problem_description: string;
  customer_notes: string | null;
  status: string;
  estimated_cost: number;
  created_at: string;
  customer: {
    full_name: string;
    email: string;
  };
  service_type: {
    type_name: string;
    category: string;
    estimated_duration: number;
    is_emergency: boolean;
  };
  customer_product?: {
    serial_number: string;
    product: {
      product_name: string;
      brand: string;
    };
  };
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  skills: string[];
  current_assignments: number;
  rating: number;
  is_available: boolean;
}

interface ServiceAssignment {
  id: string;
  service_request_id: string;
  assigned_technician_id: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  status: string;
  acceptance_status: string;
  service_request: {
    request_number: string;
    customer_address: string;
    priority: string;
  };
  technician: {
    full_name: string;
    phone: string;
  };
}

export const ServiceManagementDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'requests' | 'assignments' | 'analytics'>('requests');
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [assignments, setAssignments] = useState<ServiceAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('09:00');
  const [estimatedDuration, setEstimatedDuration] = useState(120);

  const [stats, setStats] = useState({
    total_requests: 0,
    pending_requests: 0,
    in_progress: 0,
    completed_today: 0,
    emergency_requests: 0,
    avg_response_time: 0,
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadServiceRequests(),
        loadTechnicians(),
        loadAssignments(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServiceRequests = async () => {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        customer:customer_id (
          full_name,
          email
        ),
        service_type:service_type_id (
          type_name,
          category,
          estimated_duration,
          is_emergency
        ),
        customer_product:customer_product_id (
          serial_number,
          product:product_id (
            product_name,
            brand
          )
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    setServiceRequests(data || []);
  };

  const loadTechnicians = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        skills,
        current_assignments,
        rating,
        is_available
      `)
      .eq('role', 'technician')
      .eq('status', 'active');

    if (error) throw error;
    setTechnicians(data || []);
  };

  const loadAssignments = async () => {
    const { data, error } = await supabase
      .from('service_assignments')
      .select(`
        *,
        service_request:service_request_id (
          request_number,
          customer_address,
          priority
        ),
        technician:assigned_technician_id (
          full_name,
          phone
        )
      `)
      .gte('scheduled_date', new Date().toISOString().split('T')[0])
      .order('scheduled_date', { ascending: true })
      .limit(30);

    if (error) throw error;
    setAssignments(data || []);
  };

  const loadStats = async () => {
    try {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Load various statistics
      const [totalReq, pendingReq, inProgressReq, completedToday, emergencyReq] = await Promise.all([
        supabase.from('service_requests').select('id', { count: 'exact', head: true }),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed').gte('updated_at', today),
        supabase.from('service_requests').select('id', { count: 'exact', head: true }).eq('priority', 'emergency'),
      ]);

      setStats({
        total_requests: totalReq.count || 0,
        pending_requests: pendingReq.count || 0,
        in_progress: inProgressReq.count || 0,
        completed_today: completedToday.count || 0,
        emergency_requests: emergencyReq.count || 0,
        avg_response_time: 24, // This would need more complex calculation
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleAssignTechnician = async () => {
    if (!selectedRequest || !selectedTechnician || !scheduledDate || !scheduledTime) {
      showError({ title: 'Please fill all required fields' });
      return;
    }

    setIsLoading(true);
    try {
      const endTime = new Date(`${scheduledDate} ${scheduledTime}`);
      endTime.setMinutes(endTime.getMinutes() + estimatedDuration);

      const assignmentData = {
        service_request_id: selectedRequest.id,
        assigned_technician_id: selectedTechnician,
        assigned_by: user?.id,
        scheduled_date: scheduledDate,
        scheduled_time_start: scheduledTime,
        scheduled_time_end: endTime.toTimeString().slice(0, 5),
        assignment_notes: `Assigned via dashboard by ${user?.email || 'Admin'}`,
        status: 'assigned',
        acceptance_status: 'pending',
      };

      const { error: assignError } = await supabase
        .from('service_assignments')
        .insert([assignmentData]);

      if (assignError) throw assignError;

      // Update service request status
      const { error: updateError } = await supabase
        .from('service_requests')
        .update({ status: 'assigned' })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      showSuccess({ title: 'Technician assigned successfully!' });
      setShowAssignModal(false);
      setSelectedRequest(null);
      setSelectedTechnician('');
      setScheduledDate('');
      setScheduledTime('09:00');
      
      loadDashboardData();
    } catch (error: any) {
      showError({ title: error.message || 'Failed to assign technician' });
    } finally {
      setIsLoading(false);
    }
  };

  const updateRequestStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('service_requests')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;

      showSuccess({ title: `Request status updated to ${newStatus}` });
      loadServiceRequests();
    } catch (error: any) {
      showError({ title: error.message || 'Failed to update status' });
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'emergency': return 'text-red-700 bg-red-100';
      case 'urgent': return 'text-orange-700 bg-orange-100';
      case 'high': return 'text-yellow-700 bg-yellow-100';
      case 'normal': return 'text-green-700 bg-green-100';
      case 'low': return 'text-gray-700 bg-gray-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-700 bg-yellow-100';
      case 'assigned': return 'text-blue-700 bg-blue-100';
      case 'in_progress': return 'text-purple-700 bg-purple-100';
      case 'completed': return 'text-green-700 bg-green-100';
      case 'cancelled': return 'text-red-700 bg-red-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Service Management</h1>
        <p className="text-gray-600">Manage service requests, assignments, and technician schedules</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total_requests}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_requests}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.in_progress}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_today}</div>
            <div className="text-sm text-gray-600">Completed Today</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{stats.emergency_requests}</div>
            <div className="text-sm text-gray-600">Emergency</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-gray-600">{stats.avg_response_time}h</div>
            <div className="text-sm text-gray-600">Avg Response</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'requests', label: 'Service Requests' },
          { key: 'assignments', label: 'Assignments' },
          { key: 'analytics', label: 'Analytics' },
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

      {/* Service Requests Tab */}
      {activeTab === 'requests' && (
        <Card>
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Service Requests</h3>
              <Button onClick={loadServiceRequests} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Request #</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Service Type</th>
                    <th className="text-left p-2">Priority</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Date</th>
                    <th className="text-left p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {serviceRequests.map(request => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{request.request_number}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-medium">{request.customer.full_name}</div>
                          <div className="text-gray-500 text-xs">{request.contact_phone}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <div>
                          <div>{request.service_type.type_name}</div>
                          <div className="text-gray-500 text-xs">{request.service_type.category}</div>
                        </div>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                          {request.priority}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        <div className="flex space-x-1">
                          {request.status === 'pending' && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setEstimatedDuration(request.service_type.estimated_duration);
                                setShowAssignModal(true);
                              }}
                            >
                              Assign
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => {/* View details */}}
                          >
                            View
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Today's Assignments</h3>
            
            <div className="space-y-4">
              {assignments.map(assignment => (
                <div key={assignment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium">{assignment.service_request.request_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.service_request.priority)}`}>
                          {assignment.service_request.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                          {assignment.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Technician:</strong> {assignment.technician.full_name} ({assignment.technician.phone})
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        <strong>Time:</strong> {assignment.scheduled_time_start} - {assignment.scheduled_time_end}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Address:</strong> {assignment.service_request.customer_address}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="secondary">
                        Edit
                      </Button>
                      <Button size="sm" variant="secondary">
                        Track
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Assign Technician</h3>
            
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Request: {selectedRequest.request_number}</div>
              <div className="text-sm text-gray-600 mb-2">Service: {selectedRequest.service_type.type_name}</div>
              <div className="text-sm text-gray-600">Priority: 
                <span className={`ml-1 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedRequest.priority)}`}>
                  {selectedRequest.priority}
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Technician
                </label>
                <select
                  value={selectedTechnician}
                  onChange={(e) => setSelectedTechnician(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose technician...</option>
                  {technicians
                    .filter(tech => tech.is_available)
                    .map(technician => (
                    <option key={technician.id} value={technician.id}>
                      {technician.full_name} - Rating: {technician.rating}/5 
                      (Assignments: {technician.current_assignments})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Duration (minutes)
                </label>
                <input
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(parseInt(e.target.value))}
                  min={30}
                  max={480}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedRequest(null);
                  setSelectedTechnician('');
                  setScheduledDate('');
                  setScheduledTime('09:00');
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAssignTechnician}
                disabled={isLoading}
              >
                {isLoading ? 'Assigning...' : 'Assign Technician'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 