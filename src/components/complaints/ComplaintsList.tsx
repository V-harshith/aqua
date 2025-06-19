"use client";

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { supabase, Complaint } from '@/lib/supabase';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

type ComplaintWithDetails = Complaint & {
  customer?: {
    customer_code: string;
    contact_person: string;
    billing_address: string;
  };
  assigned_user?: {
    full_name: string;
    role: string;
  };
};

interface ComplaintsListProps {
  showActions?: boolean;
  customerId?: string;
  limit?: number;
}

export default function ComplaintsList({ 
  showActions = true, 
  customerId, 
  limit 
}: ComplaintsListProps) {
  const { userProfile, canManageComplaints } = useAuthContext();
  const [complaints, setComplaints] = useState<ComplaintWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'assigned' | 'resolved'>('all');

  useEffect(() => {
    fetchComplaints();
  }, [filter, customerId]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('complaints')
        .select(`
          *,
          customer:customers(customer_code, contact_person, billing_address),
          assigned_user:users!assigned_to(full_name, role)
        `);

      // Apply filters based on user role and props
      if (customerId) {
        query = query.eq('customer_id', customerId);
      } else if (userProfile?.role === 'customer') {
        // Customer can only see their own complaints
        const { data: customerData } = await supabase
          .from('customers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();
        
        if (customerData) {
          query = query.eq('customer_id', customerData.id);
        }
      } else if (userProfile?.role === 'technician') {
        // Technician can see assigned complaints or unassigned ones
        query = query.or(`assigned_to.eq.${userProfile.id},assigned_to.is.null`);
      }

      // Apply status filter
      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      // Order by priority and created date
      query = query.order('priority', { ascending: false })
                  .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      setComplaints(data || []);
    } catch (error: any) {
      console.error('Error fetching complaints:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (
    complaintId: string, 
    newStatus: string, 
    assignTo?: string
  ) => {
    try {
      const updates: any = { status: newStatus };
      if (assignTo !== undefined) {
        updates.assigned_to = assignTo;
      }

      const { error } = await supabase
        .from('complaints')
        .update(updates)
        .eq('id', complaintId);

      if (error) throw error;
      
      // Refresh the list
      fetchComplaints();
    } catch (error: any) {
      console.error('Error updating complaint:', error);
      alert('Failed to update complaint: ' + error.message);
    }
  };

  const assignToSelf = (complaintId: string) => {
    updateComplaintStatus(complaintId, 'assigned', userProfile?.id);
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
      case 'assigned': return 'text-purple-600 bg-purple-100';
      case 'in_progress': return 'text-orange-600 bg-orange-100';
      case 'resolved': return 'text-green-600 bg-green-100';
      case 'closed': return 'text-gray-600 bg-gray-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-100 border border-red-200 text-red-700 rounded-md">
        Error loading complaints: {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      {showActions && (
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'open'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'assigned'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Assigned
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filter === 'resolved'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Resolved
            </button>
          </div>
          
          <Button onClick={fetchComplaints} variant="secondary">
            Refresh
          </Button>
        </div>
      )}

      {/* Complaints List */}
      {complaints.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-gray-400 text-4xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No complaints found
            </h3>
            <p className="text-gray-600">
              {filter === 'all' 
                ? 'No complaints have been submitted yet.'
                : `No ${filter} complaints found.`
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {complaints.map((complaint) => (
            <Card key={complaint.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {complaint.title}
                      </h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(complaint.priority)}`}>
                        {complaint.priority.toUpperCase()}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(complaint.status)}`}>
                        {complaint.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">ID:</span> {complaint.complaint_number}
                    </p>
                    
                    {complaint.customer && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Customer:</span> {complaint.customer.contact_person} ({complaint.customer.customer_code})
                      </p>
                    )}
                    
                    {complaint.assigned_user && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Assigned to:</span> {complaint.assigned_user.full_name}
                      </p>
                    )}
                    
                    {complaint.location && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Location:</span> {complaint.location}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right text-sm text-gray-500">
                    <p>{new Date(complaint.created_at).toLocaleDateString()}</p>
                    <p>{new Date(complaint.created_at).toLocaleTimeString()}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {complaint.description}
                  </p>
                </div>

                {/* Action Buttons */}
                {showActions && canManageComplaints() && (
                  <div className="flex gap-2 pt-4 border-t">
                    {complaint.status === 'open' && (
                      <>
                        <Button
                          onClick={() => assignToSelf(complaint.id)}
                          variant="primary"
                          size="sm"
                        >
                          Assign to Me
                        </Button>
                        <Button
                          onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                          variant="secondary"
                          size="sm"
                        >
                          Start Work
                        </Button>
                      </>
                    )}
                    
                    {complaint.status === 'assigned' && (
                      <Button
                        onClick={() => updateComplaintStatus(complaint.id, 'in_progress')}
                        variant="primary"
                        size="sm"
                      >
                        Start Work
                      </Button>
                    )}
                    
                    {complaint.status === 'in_progress' && (
                      <Button
                        onClick={() => updateComplaintStatus(complaint.id, 'resolved')}
                        variant="primary"
                        size="sm"
                      >
                        Mark Resolved
                      </Button>
                    )}
                    
                    {complaint.status === 'resolved' && (
                      <Button
                        onClick={() => updateComplaintStatus(complaint.id, 'closed')}
                        variant="secondary"
                        size="sm"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 