'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

interface ServiceRequest {
  id: string;
  request_number: string;
  customer_id: string;
  priority: string;
  preferred_date: string;
  customer_address: string;
  contact_phone: string;
  problem_description: string;
  status: string;
  customer: {
    first_name: string;
    last_name: string;
  };
}

interface Technician {
  id: string;
  full_name: string;
  phone: string;
}

export const ServiceAssignmentWorkflow: React.FC = () => {
  const { user } = useAuth();
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);

  const [assignmentForm, setAssignmentForm] = useState({
    technician_id: '',
    scheduled_date: '',
    notes: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load service requests (using complaints as service requests for now)
      const { data: requests, error: requestsError } = await supabase
        .from('complaints')
        .select(`
          id,
          complaint_number,
          customer_id,
          title,
          description,
          priority,
          status,
          location,
          customer:customers(contact_person)
        `)
        .eq('status', 'open')
        .order('priority', { ascending: false });

      if (requestsError) throw requestsError;

      // Transform complaints to service requests format
      const transformedRequests = requests?.map(req => ({
        id: req.id,
        request_number: req.complaint_number,
        customer_id: req.customer_id,
        priority: req.priority,
        preferred_date: new Date().toISOString().split('T')[0],
        customer_address: req.location || 'Address not specified',
        contact_phone: 'N/A',
        problem_description: req.description,
        status: req.status,
        customer: {
          first_name: req.customer?.contact_person || 'Unknown',
          last_name: ''
        }
      })) || [];

      setServiceRequests(transformedRequests);

      // Load technicians
      const { data: techData, error: techError } = await supabase
        .from('users')
        .select('id, full_name, phone')
        .eq('role', 'technician')
        .eq('is_active', true);

      if (techError) throw techError;
      setTechnicians(techData || []);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignService = (request: ServiceRequest) => {
    setSelectedRequest(request);
    setShowAssignForm(true);
    setAssignmentForm({
      technician_id: '',
      scheduled_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const submitAssignment = async () => {
    if (!selectedRequest || !assignmentForm.technician_id) {
      return;
    }

    setIsLoading(true);
    try {
      // Update complaint status to assigned
      const { error: updateError } = await supabase
        .from('complaints')
        .update({ 
          status: 'assigned',
          assigned_to: assignmentForm.technician_id
        })
        .eq('id', selectedRequest.id);

      if (updateError) throw updateError;

      setShowAssignForm(false);
      setSelectedRequest(null);
      await loadData();

    } catch (error) {
      console.error('Error assigning service:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Service Assignment</h1>
        <p className="text-gray-600 mt-1">Assign technicians to service requests</p>
      </div>

      <div className="space-y-4">
        {serviceRequests.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No pending service requests</p>
            </CardContent>
          </Card>
        ) : (
          serviceRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {request.request_number}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(request.priority)}`}>
                        {request.priority?.toUpperCase() || 'MEDIUM'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Customer:</span> {request.customer.first_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Address:</span> {request.customer_address}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Status:</span> {request.status}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Description:</span> {request.problem_description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="ml-4">
                    <Button
                      onClick={() => handleAssignService(request)}
                      disabled={isLoading}
                    >
                      Assign Technician
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignForm && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
            <h3 className="text-xl font-bold mb-4">Assign Technician</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Request
                </label>
                <p className="text-sm text-gray-600">
                  {selectedRequest.request_number}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Technician *
                </label>
                <select
                  value={assignmentForm.technician_id}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, technician_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Technician</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name}
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
                  value={assignmentForm.scheduled_date}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, scheduled_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Special instructions..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                onClick={() => {
                  setShowAssignForm(false);
                  setSelectedRequest(null);
                }}
                variant="secondary"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={submitAssignment}
                disabled={isLoading}
              >
                {isLoading ? 'Assigning...' : 'Assign'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};