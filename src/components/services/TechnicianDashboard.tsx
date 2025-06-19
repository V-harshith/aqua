"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';

interface Assignment {
  id: string;
  service_request_id: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  status: string;
  acceptance_status: string;
  assignment_notes: string;
  service_request: {
    request_number: string;
    customer_address: string;
    contact_phone: string;
    priority: string;
    problem_description: string;
    customer: {
      full_name: string;
    };
    service_type: {
      type_name: string;
      category: string;
    };
  };
}

interface ServiceExecution {
  work_performed: string;
  root_cause_analysis: string;
  solution_provided: string;
  parts_used: Array<{
    part_name: string;
    quantity: number;
    cost: number;
  }>;
  labor_hours: number;
  materials_cost: number;
  service_quality: number;
  additional_notes: string;
  follow_up_required: boolean;
  follow_up_date: string;
}

export const TechnicianDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success: showSuccess, error: showError } = useToast();
  
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'history'>('today');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [showExecutionModal, setShowExecutionModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);

  const [executionData, setExecutionData] = useState<ServiceExecution>({
    work_performed: '',
    root_cause_analysis: '',
    solution_provided: '',
    parts_used: [],
    labor_hours: 0,
    materials_cost: 0,
    service_quality: 5,
    additional_notes: '',
    follow_up_required: false,
    follow_up_date: '',
  });

  const [stats, setStats] = useState({
    todays_assignments: 0,
    completed_today: 0,
    pending_assignments: 0,
    average_rating: 0,
  });

  useEffect(() => {
    loadTechnicianData();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  };

  const loadTechnicianData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadAssignments(),
        loadStats(),
      ]);
    } catch (error) {
      console.error('Error loading technician data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAssignments = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('service_assignments')
      .select(`
        *,
        service_request:service_request_id (
          request_number,
          customer_address,
          contact_phone,
          priority,
          problem_description,
          customer:customer_id (
            full_name
          ),
          service_type:service_type_id (
            type_name,
            category
          )
        )
      `)
      .eq('assigned_technician_id', user?.id)
      .gte('scheduled_date', today)
      .order('scheduled_date', { ascending: true })
      .order('scheduled_time_start', { ascending: true });

    if (error) throw error;
    setAssignments(data || []);
  };

  const loadStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const [todaysAssignments, completedToday, pendingAssignments] = await Promise.all([
        supabase
          .from('service_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_technician_id', user?.id)
          .eq('scheduled_date', today),
        supabase
          .from('service_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_technician_id', user?.id)
          .eq('status', 'completed')
          .eq('scheduled_date', today),
        supabase
          .from('service_assignments')
          .select('id', { count: 'exact', head: true })
          .eq('assigned_technician_id', user?.id)
          .eq('acceptance_status', 'pending'),
      ]);

      setStats({
        todays_assignments: todaysAssignments.count || 0,
        completed_today: completedToday.count || 0,
        pending_assignments: pendingAssignments.count || 0,
        average_rating: 4.5, // This would come from service_feedback
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const updateAssignmentStatus = async (assignmentId: string, status: string, acceptance_status?: string) => {
    try {
      const updateData: any = { status };
      if (acceptance_status) {
        updateData.acceptance_status = acceptance_status;
      }
      
      // Add timestamps based on status
      if (status === 'accepted') {
        updateData.accepted_at = new Date().toISOString();
      } else if (status === 'en_route') {
        updateData.started_at = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('service_assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      showSuccess({ title: `Assignment ${status} successfully!` });
      loadAssignments();
    } catch (error: any) {
      showError({ title: error.message || 'Failed to update assignment' });
    }
  };

  const completeService = async () => {
    if (!selectedAssignment || !executionData.work_performed) {
      showError({ title: 'Please fill in the work performed field' });
      return;
    }

    setIsLoading(true);
    try {
      // Calculate total service cost
      const totalCost = executionData.materials_cost + (executionData.labor_hours * 100); // Assuming ₹100/hour

      const serviceExecutionData = {
        service_assignment_id: selectedAssignment.id,
        actual_start_time: new Date().toISOString(),
        actual_end_time: new Date().toISOString(),
        work_performed: executionData.work_performed,
        root_cause_analysis: executionData.root_cause_analysis,
        solution_provided: executionData.solution_provided,
        parts_used: executionData.parts_used,
        labor_hours: executionData.labor_hours,
        materials_cost: executionData.materials_cost,
        total_service_cost: totalCost,
        service_quality: executionData.service_quality,
        additional_notes: executionData.additional_notes,
        follow_up_required: executionData.follow_up_required,
        follow_up_date: executionData.follow_up_date || null,
      };

      const { error: executionError } = await supabase
        .from('service_executions')
        .insert([serviceExecutionData]);

      if (executionError) throw executionError;

      // Update assignment status to completed
      await updateAssignmentStatus(selectedAssignment.id, 'completed');

      // Update service request status
      const { error: requestUpdateError } = await supabase
        .from('service_requests')
        .update({ 
          status: 'completed',
          actual_cost: totalCost
        })
        .eq('id', selectedAssignment.service_request_id);

      if (requestUpdateError) throw requestUpdateError;

      showSuccess({ title: 'Service completed successfully!' });
      setShowExecutionModal(false);
      setSelectedAssignment(null);
      resetExecutionData();
      loadTechnicianData();

    } catch (error: any) {
      showError({ title: error.message || 'Failed to complete service' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetExecutionData = () => {
    setExecutionData({
      work_performed: '',
      root_cause_analysis: '',
      solution_provided: '',
      parts_used: [],
      labor_hours: 0,
      materials_cost: 0,
      service_quality: 5,
      additional_notes: '',
      follow_up_required: false,
      follow_up_date: '',
    });
  };

  const addPart = () => {
    setExecutionData(prev => ({
      ...prev,
      parts_used: [...prev.parts_used, { part_name: '', quantity: 1, cost: 0 }]
    }));
  };

  const updatePart = (index: number, field: string, value: any) => {
    setExecutionData(prev => ({
      ...prev,
      parts_used: prev.parts_used.map((part, i) => 
        i === index ? { ...part, [field]: value } : part
      )
    }));
  };

  const removePart = (index: number) => {
    setExecutionData(prev => ({
      ...prev,
      parts_used: prev.parts_used.filter((_, i) => i !== index)
    }));
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
      case 'assigned': return 'text-blue-700 bg-blue-100';
      case 'accepted': return 'text-green-700 bg-green-100';
      case 'en_route': return 'text-purple-700 bg-purple-100';
      case 'arrived': return 'text-indigo-700 bg-indigo-100';
      case 'in_progress': return 'text-orange-700 bg-orange-100';
      case 'completed': return 'text-green-700 bg-green-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const today = new Date().toISOString().split('T')[0];
    const assignmentDate = assignment.scheduled_date;
    
    if (activeTab === 'today') {
      return assignmentDate === today;
    } else if (activeTab === 'upcoming') {
      return assignmentDate > today;
    } else {
      return assignmentDate < today;
    }
  });

  return (
    <div className="max-w-7xl mx-auto p-4">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Technician Dashboard</h1>
        <p className="text-gray-600">Manage your service assignments and track progress</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.todays_assignments}</div>
            <div className="text-sm text-gray-600">Today's Jobs</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.completed_today}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending_assignments}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.average_rating}/5</div>
            <div className="text-sm text-gray-600">Rating</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6">
        {[
          { key: 'today', label: 'Today' },
          { key: 'upcoming', label: 'Upcoming' },
          { key: 'history', label: 'History' },
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

      {/* Assignments List */}
      <div className="space-y-4">
        {filteredAssignments.map(assignment => (
          <Card key={assignment.id}>
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold">{assignment.service_request.request_number}</h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(assignment.service_request.priority)}`}>
                      {assignment.service_request.priority}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(assignment.status)}`}>
                      {assignment.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Customer:</strong> {assignment.service_request.customer.full_name}</p>
                      <p><strong>Service:</strong> {assignment.service_request.service_type.type_name}</p>
                      <p><strong>Time:</strong> {assignment.scheduled_time_start} - {assignment.scheduled_time_end}</p>
                    </div>
                    <div>
                      <p><strong>Phone:</strong> {assignment.service_request.contact_phone}</p>
                      <p><strong>Address:</strong> {assignment.service_request.customer_address}</p>
                      <p><strong>Date:</strong> {new Date(assignment.scheduled_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded">
                    <p className="text-sm"><strong>Problem:</strong> {assignment.service_request.problem_description}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {assignment.acceptance_status === 'pending' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => updateAssignmentStatus(assignment.id, 'accepted', 'accepted')}
                    >
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => updateAssignmentStatus(assignment.id, 'cancelled', 'rejected')}
                    >
                      Reject
                    </Button>
                  </>
                )}
                
                {assignment.status === 'accepted' && (
                  <Button
                    size="sm"
                    onClick={() => updateAssignmentStatus(assignment.id, 'en_route')}
                  >
                    Start Journey
                  </Button>
                )}
                
                {assignment.status === 'en_route' && (
                  <Button
                    size="sm"
                    onClick={() => updateAssignmentStatus(assignment.id, 'arrived')}
                  >
                    Mark Arrived
                  </Button>
                )}
                
                {assignment.status === 'arrived' && (
                  <Button
                    size="sm"
                    onClick={() => updateAssignmentStatus(assignment.id, 'in_progress')}
                  >
                    Start Work
                  </Button>
                )}
                
                {assignment.status === 'in_progress' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowExecutionModal(true);
                    }}
                  >
                    Complete Service
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const url = `https://maps.google.com/?q=${encodeURIComponent(assignment.service_request.customer_address)}`;
                    window.open(url, '_blank');
                  }}
                >
                  Navigate
                </Button>
                
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    const url = `tel:${assignment.service_request.contact_phone}`;
                    window.open(url, '_self');
                  }}
                >
                  Call Customer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Service Completion Modal */}
      {showExecutionModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Complete Service - {selectedAssignment.service_request.request_number}</h3>
              
              <div className="space-y-6">
                {/* Work Performed */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Performed *
                  </label>
                  <textarea
                    value={executionData.work_performed}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, work_performed: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Describe the work that was performed..."
                    required
                  />
                </div>

                {/* Root Cause Analysis */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Root Cause Analysis
                  </label>
                  <textarea
                    value={executionData.root_cause_analysis}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, root_cause_analysis: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What was the root cause of the problem?"
                  />
                </div>

                {/* Solution Provided */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Solution Provided
                  </label>
                  <textarea
                    value={executionData.solution_provided}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, solution_provided: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="What solution was implemented?"
                  />
                </div>

                {/* Parts Used */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Parts Used</label>
                    <Button size="sm" onClick={addPart}>Add Part</Button>
                  </div>
                  
                  {executionData.parts_used.map((part, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                      <Input
                        placeholder="Part name"
                        value={part.part_name}
                        onChange={(e) => updatePart(index, 'part_name', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Quantity"
                        value={part.quantity}
                        onChange={(e) => updatePart(index, 'quantity', parseInt(e.target.value))}
                      />
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Cost (₹)"
                        value={part.cost}
                        onChange={(e) => updatePart(index, 'cost', parseFloat(e.target.value))}
                      />
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => removePart(index)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Labor and Costs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labor Hours
                    </label>
                    <Input
                      type="number"
                      step="0.5"
                      value={executionData.labor_hours}
                      onChange={(e) => setExecutionData(prev => ({ ...prev, labor_hours: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Materials Cost (₹)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={executionData.materials_cost}
                      onChange={(e) => setExecutionData(prev => ({ ...prev, materials_cost: parseFloat(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Quality (1-5)
                    </label>
                    <select
                      value={executionData.service_quality}
                      onChange={(e) => setExecutionData(prev => ({ ...prev, service_quality: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 - Excellent</option>
                      <option value={4}>4 - Good</option>
                      <option value={3}>3 - Average</option>
                      <option value={2}>2 - Below Average</option>
                      <option value={1}>1 - Poor</option>
                    </select>
                  </div>
                </div>

                {/* Follow-up */}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={executionData.follow_up_required}
                      onChange={(e) => setExecutionData(prev => ({ ...prev, follow_up_required: e.target.checked }))}
                    />
                    <span className="text-sm font-medium text-gray-700">Follow-up required</span>
                  </label>
                  
                  {executionData.follow_up_required && (
                    <div className="mt-2">
                      <Input
                        type="date"
                        value={executionData.follow_up_date}
                        onChange={(e) => setExecutionData(prev => ({ ...prev, follow_up_date: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  )}
                </div>

                {/* Additional Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes
                  </label>
                  <textarea
                    value={executionData.additional_notes}
                    onChange={(e) => setExecutionData(prev => ({ ...prev, additional_notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Any additional notes or recommendations..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowExecutionModal(false);
                    setSelectedAssignment(null);
                    resetExecutionData();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={completeService}
                  disabled={isLoading || !executionData.work_performed}
                >
                  {isLoading ? 'Completing...' : 'Complete Service'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 