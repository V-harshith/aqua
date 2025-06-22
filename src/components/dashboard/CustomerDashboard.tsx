'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useToast } from '@/hooks/useToast';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface ServiceRequest {
  id: string;
  request_number: string;
  service_type: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Complaint {
  id: string;
  complaint_number: string;
  title: string;
  status: string;
  priority: string;
  created_at: string;
}

interface Bill {
  id: string;
  bill_number: string;
  amount: number;
  due_date: string;
  status: string;
}

export function CustomerDashboard() {
  const { userProfile } = useAuthContext();
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'billing' | 'complaints'>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [realData, setRealData] = useState<any>(null);

  useEffect(() => {
    loadCustomerData();
    // Auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(loadCustomerData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadCustomerData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch real data from the admin API (which has all the user data)
      const response = await fetch('/api/admin/all-data', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRealData(data);
        
        // Set real complaints data
        setComplaints(data.complaints || []);
        
        // Set real service requests
        setServiceRequests(data.services || []);
        
        console.log('✅ Customer loaded REAL data:', {
          users: data.users?.length || 0,
          complaints: data.complaints?.length || 0,
          services: data.services?.length || 0
        });
      } else {
        throw new Error('Failed to fetch real data');
      }

      // Mock billing data for now (until billing table is created)
      const mockBills: Bill[] = [
        {
          id: '1',
          bill_number: 'WB-2024-001',
          amount: 156.50,
          due_date: '2024-02-15',
          status: 'pending'
        },
        {
          id: '2',
          bill_number: 'WB-2023-012',
          amount: 142.30,
          due_date: '2024-01-15',
          status: 'paid'
        }
      ];

      setBills(mockBills);
      
    } catch (err: any) {
      console.error('Error loading customer data:', err);
      error({ title: 'Failed to load data', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const createServiceRequest = async () => {
    try {
      success({ title: 'Service request submitted!', message: 'Your request has been received and will be processed.' });
      
      // In a real implementation, you would submit to the database here
      // For now, just add to the local state for demo
      const newRequest = {
        id: Date.now().toString(),
        request_number: `SR-${Date.now()}`,
        service_type: 'Water Connection Issue',
        status: 'pending',
        priority: 'medium',
        created_at: new Date().toISOString()
      };
      
      setServiceRequests(prev => [newRequest, ...prev]);
    } catch (err: any) {
      error({ title: 'Failed to create service request', message: err.message });
    }
  };

  const createComplaint = async () => {
    try {
      success({ title: 'Complaint submitted!', message: 'Your complaint has been received and will be investigated.' });
      
      // In a real implementation, you would submit to the database here
      const newComplaint = {
        id: Date.now().toString(),
        complaint_number: `C-${Date.now()}`,
        title: 'New Customer Complaint',
        status: 'open',
        priority: 'medium',
        created_at: new Date().toISOString()
      };
      
      setComplaints(prev => [newComplaint, ...prev]);
    } catch (err: any) {
      error({ title: 'Failed to create complaint', message: err.message });
    }
  };

  const payBill = (billId: string) => {
    success({ title: 'Payment initiated!', message: 'Your payment is being processed.' });
    
    // Update bill status locally for demo
    setBills(prev => prev.map(bill => 
      bill.id === billId ? { ...bill, status: 'paid' } : bill
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'open': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading your dashboard...</p>
          <p className="text-sm text-gray-500">Fetching real-time data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Dashboard</h1>
            <p className="text-gray-600">Welcome back, {userProfile?.full_name || 'Customer'}!</p>
            <p className="text-sm text-gray-500">Manage your water services and account</p>
            {realData && (
              <p className="text-xs text-green-600 mt-1">
                ✅ Connected to real backend - {realData.stats?.totalUsers || 0} total users in system
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button onClick={loadCustomerData} variant="secondary" disabled={isLoading}>
              {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </Button>
            <div className="bg-blue-50 px-3 py-2 rounded-lg">
              <span className="text-blue-600 font-medium">👤 Customer</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{serviceRequests.length}</div>
            <div className="text-sm text-gray-600">Service Requests</div>
      </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{complaints.length}</div>
            <div className="text-sm text-gray-600">Complaints</div>
              </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{bills.filter(b => b.status === 'paid').length}</div>
            <div className="text-sm text-gray-600">Bills Paid</div>
            </div>
        </Card>
        
        <Card>
          <div className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{bills.filter(b => b.status === 'pending').length}</div>
            <div className="text-sm text-gray-600">Pending Bills</div>
          </div>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'services', label: 'Service Requests', icon: '🔧' },
            { key: 'billing', label: 'Billing', icon: '💳' },
            { key: 'complaints', label: 'Complaints', icon: '📝' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
        </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Service Requests */}
          <Card title="Recent Service Requests">
            <div className="space-y-3">
              {serviceRequests.slice(0, 3).map(request => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{request.request_number}</p>
                    <p className="text-sm text-gray-600">{request.service_type}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                    {request.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              ))}
              <Button onClick={createServiceRequest} className="w-full">
                + New Service Request
              </Button>
            </div>
          </Card>

          {/* Recent Bills */}
          <Card title="Recent Bills">
            <div className="space-y-3">
              {bills.slice(0, 3).map(bill => (
                <div key={bill.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{bill.bill_number}</p>
                    <p className="text-sm text-gray-600">${bill.amount.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bill.status)}`}>
                      {bill.status.toUpperCase()}
                    </span>
                    {bill.status === 'pending' && (
                      <Button
                        size="sm"
                        onClick={() => payBill(bill.id)}
                        className="ml-2"
                      >
                        Pay
                      </Button>
                    )}
                  </div>
              </div>
            ))}
          </div>
          </Card>
        </div>
      )}

      {activeTab === 'services' && (
        <Card title={`Service Requests (${serviceRequests.length} total)`}>
          <div className="mb-4">
            <Button onClick={createServiceRequest}>
              + New Service Request
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Request #</th>
                  <th className="text-left p-2">Service Type</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.map(request => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{request.request_number}</td>
                    <td className="p-2">{request.service_type}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(request.status)}`}>
                        {request.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2">{request.priority}</td>
                    <td className="p-2">{formatDate(request.created_at)}</td>
                  </tr>
                ))}
                {serviceRequests.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No service requests found. Create your first one above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card title="Billing & Payments">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-red-600">
                ${bills.filter(b => b.status === 'pending').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Outstanding Balance</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">
                ${bills.filter(b => b.status === 'paid').reduce((sum, b) => sum + b.amount, 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Total Paid</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-blue-600">
                {bills.find(b => b.status === 'pending')?.due_date || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Next Due Date</div>
        </div>
      </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bill #</th>
                  <th className="text-left p-2">Amount</th>
                  <th className="text-left p-2">Due Date</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bills.map(bill => (
                  <tr key={bill.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{bill.bill_number}</td>
                    <td className="p-2">${bill.amount.toFixed(2)}</td>
                    <td className="p-2">{bill.due_date}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(bill.status)}`}>
                        {bill.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2">
                      {bill.status === 'pending' && (
                        <Button size="sm" onClick={() => payBill(bill.id)}>
                          Pay Now
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'complaints' && (
        <Card title={`Complaints (${complaints.length} total)`}>
          <div className="mb-4">
            <Button onClick={createComplaint}>
              + New Complaint
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Complaint #</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map(complaint => (
                  <tr key={complaint.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{complaint.complaint_number}</td>
                    <td className="p-2">{complaint.title}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                        {complaint.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="p-2">{complaint.priority}</td>
                    <td className="p-2">{formatDate(complaint.created_at)}</td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-gray-500">
                      No complaints found. We hope everything is working well!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
      </div>
        </Card>
      )}
    </div>
  );
} 