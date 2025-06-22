'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

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

interface AllUserData {
  users: any[];
  complaints: any[];
  services: any[];
  stats: {
    totalUsers: number;
    activeUsers: number;
    customerCount: number;
    staffCount: number;
    totalComplaints: number;
    openComplaints: number;
    totalServices: number;
    pendingServices: number;
    roleBreakdown: Record<string, number>;
    lastUpdated: string;
  };
}

export const EnhancedAdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { success, error } = useToastContext();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [allData, setAllData] = useState<AllUserData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'complaints' | 'services' | 'export'>('overview');
  const [isExporting, setIsExporting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    loadAllData();
    // Auto-refresh every 30 seconds for real-time data
    const interval = setInterval(loadAllData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      setSigningOut(true);
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }
      success({ title: 'Signed out successfully' });
      router.push('/signin');
    } catch (err: any) {
      error({ title: 'Sign out failed', message: err.message });
    } finally {
      setSigningOut(false);
    }
  };

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/all-data', {
        cache: 'no-store', // Prevent caching for real-time data
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAllData(data);
    } catch (err: any) {
      console.error('Error loading all data:', err);
      error({ title: 'Failed to load dashboard data', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (type: string, format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      setIsExporting(true);
      console.log(`🔄 Starting export: ${type} in ${format} format`);
      
      const response = await fetch(`/api/admin/export?type=${type}&format=${format}`, {
        method: 'GET',
        headers: {
          'Accept': format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 
                   format === 'csv' ? 'text/csv' : 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`);
      }

      console.log(`✅ Export response received for ${type}`);

      // Get the filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      let filename = `${type}_export_${new Date().toISOString().split('T')[0]}`;
      
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Handle different formats
      let blob: Blob;
      if (format === 'json') {
        const jsonData = await response.json();
        blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
      } else {
        blob = await response.blob();
      }

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename.includes('.') ? filename : `${filename}.${format}`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      console.log(`📥 Downloaded: ${link.download}`);
      success({ 
        title: `${type.toUpperCase()} Export Complete!`, 
        message: `Downloaded ${link.download} successfully` 
      });
      
    } catch (err: any) {
      console.error('❌ Export error:', err);
      error({ 
        title: 'Export Failed', 
        message: err.message || 'Unknown error occurred' 
      });
    } finally {
      setIsExporting(false);
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

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'open': return 'bg-red-100 text-red-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading && !allData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
          <p className="text-sm text-gray-500">Fetching real-time data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Single Clean Header with Navigation */}
      <Card>
        <div className="p-4 border-b">
          <nav className="flex items-center space-x-2 text-sm text-gray-600">
            <Link href="/dashboard" className="hover:text-blue-600 flex items-center transition-colors">
              <span className="mr-1">🏠</span>
              Main Dashboard
            </Link>
            <span>›</span>
            <span className="text-gray-900 font-medium">Admin Panel</span>
          </nav>
        </div>
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
            <p className="text-gray-600">Complete system overview with real-time data</p>
            {allData?.stats && (
              <p className="text-sm text-gray-500 mt-1">
                Last updated: {formatDate(allData.stats.lastUpdated)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="outline"
              className="border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              ⬅️ Back to Dashboard
            </Button>
            <Button
              onClick={loadAllData}
              variant="secondary"
              disabled={isLoading}
            >
              {isLoading ? '🔄 Refreshing...' : '🔄 Refresh'}
            </Button>
            <div className="bg-red-50 px-3 py-2 rounded-lg">
              <span className="text-red-600 font-medium">👑 Administrator</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              disabled={signingOut}
            >
              🚪 Sign Out
            </Button>
          </div>
        </div>
      </Card>

      {/* Real-time Stats */}
      {allData?.stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{allData.stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{allData.stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{allData.stats.customerCount}</div>
              <div className="text-sm text-gray-600">Customers</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{allData.stats.staffCount}</div>
              <div className="text-sm text-gray-600">Staff</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{allData.stats.totalComplaints}</div>
              <div className="text-sm text-gray-600">Complaints</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{allData.stats.openComplaints}</div>
              <div className="text-sm text-gray-600">Open Issues</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-indigo-600">{allData.stats.totalServices}</div>
              <div className="text-sm text-gray-600">Services</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-4 text-center">
              <div className="text-2xl font-bold text-pink-600">{allData.stats.pendingServices}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Overview', icon: '📊' },
            { key: 'users', label: 'All Users', icon: '👥' },
            { key: 'complaints', label: 'All Complaints', icon: '📝' },
            { key: 'services', label: 'All Services', icon: '🔧' },
            { key: 'export', label: 'Data Export', icon: '📤' }
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
          {/* Role Distribution */}
          <Card title="Role Distribution">
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(allData?.stats.roleBreakdown || {}).map(([role, count]) => (
                <div key={role} className="text-center p-3 border rounded-lg">
                  <div className="text-2xl mb-1">
                    {role === 'admin' ? '👑' : 
                     role === 'customer' ? '👤' : 
                     role.includes('manager') ? '👔' : 
                     role === 'technician' ? '🔧' : '👥'}
                  </div>
                  <p className="text-sm text-gray-600 capitalize">{role.replace('_', ' ')}</p>
                  <p className="text-lg font-semibold">{count}</p>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Link href="/admin/users/new" className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                <span className="mr-3">👤</span>
                <span>Add New User</span>
              </Link>
              <Link href="/admin/users" className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                <span className="mr-3">👥</span>
                <span>Manage Users</span>
              </Link>
              <button 
                onClick={() => setActiveTab('export')}
                className="w-full flex items-center p-3 border rounded-lg hover:bg-gray-50"
              >
                <span className="mr-3">📤</span>
                <span>Export Data</span>
              </button>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card title={`All Users (${allData?.users?.length || 0})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Role</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {allData?.users?.map(user => (
                  <tr key={user.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-2">{user.email}</td>
                    <td className="p-2 capitalize">{user.role?.replace('_', ' ')}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(user.status || 'active')}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="p-2">{formatDate(user.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'complaints' && (
        <Card title={`All Complaints (${allData?.complaints?.length || 0})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Number</th>
                  <th className="text-left p-2">Title</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {allData?.complaints?.map(complaint => (
                  <tr key={complaint.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{complaint.complaint_number}</td>
                    <td className="p-2">{complaint.title}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="p-2">{complaint.priority}</td>
                    <td className="p-2">{formatDate(complaint.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'services' && (
        <Card title={`All Services (${allData?.services?.length || 0})`}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Request #</th>
                  <th className="text-left p-2">Type</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Priority</th>
                  <th className="text-left p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {allData?.services?.map(service => (
                  <tr key={service.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{service.request_number}</td>
                    <td className="p-2">{service.service_type}</td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(service.status)}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="p-2">{service.priority}</td>
                    <td className="p-2">{formatDate(service.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Export Header */}
          <Card>
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">🗂️ Comprehensive Data Export Center</h2>
              <p className="text-gray-600 mb-4">Export all admin data routes in CSV, Excel, or JSON formats. All downloads include real-time data.</p>
              
              {isExporting && (
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600 font-medium">Preparing your download...</span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Export Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            
            {/* Users Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👥</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Users Data</h3>
                    <p className="text-sm text-gray-600">{allData?.users?.length || 0} records</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">All user accounts, roles, and profiles</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=users&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=users&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=users&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Technicians Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🔧</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Technicians</h3>
                    <p className="text-sm text-gray-600">Tech staff only</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Technician profiles and assignments</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=technicians&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=technicians&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=technicians&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Customers Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👤</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Customers</h3>
                    <p className="text-sm text-gray-600">Customer data</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Customer profiles and details</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=customers&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=customers&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=customers&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Complaints Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">📝</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Complaints</h3>
                    <p className="text-sm text-gray-600">{allData?.complaints?.length || 0} records</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">All complaints and issues</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=complaints&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=complaints&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=complaints&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Services Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🛠️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Services</h3>
                    <p className="text-sm text-gray-600">{allData?.services?.length || 0} records</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">All service requests and jobs</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=services&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=services&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=services&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Products Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">📦</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Products</h3>
                    <p className="text-sm text-gray-600">Product catalog</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Product catalog and inventory</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=products&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=products&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=products&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Billing Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">💳</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Billing</h3>
                    <p className="text-sm text-gray-600">Financial data</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Billing records and invoices</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=billing&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=billing&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=billing&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Drivers Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🚛</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Drivers</h3>
                    <p className="text-sm text-gray-600">Driver staff</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">All delivery drivers and fleet staff</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=drivers&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=drivers&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=drivers&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Driver Manager Export */}
            <Card>
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">👔</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Driver Manager</h3>
                    <p className="text-sm text-gray-600">Management staff</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Driver management and fleet supervisors</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=driver_manager&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full"
                  >
                    📊 Download CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=driver_manager&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=driver_manager&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download JSON
                  </Button>
                </div>
              </div>
            </Card>

            {/* Complete Database Export */}
            <Card>
              <div className="p-6 border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center mr-4">
                    <span className="text-2xl">🗄️</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Complete Export</h3>
                    <p className="text-sm text-gray-600">All data combined</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">Everything in one comprehensive export</p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=all_data&format=csv`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-gray-700 hover:bg-gray-800"
                  >
                    📊 Download All CSV
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=all_data&format=excel`, '_blank')}
                    disabled={isExporting}
                    size="sm"
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    📈 Download All Excel
                  </Button>
                  <Button
                    onClick={() => window.open(`/api/admin/export?type=all_data&format=json`, '_blank')}
                    disabled={isExporting}
                    variant="secondary"
                    size="sm"
                    className="w-full"
                  >
                    📄 Download All JSON
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Export Instructions */}
          <Card>
            <div className="p-6">
              <h3 className="font-bold text-lg mb-4">📋 Export Instructions & Best Practices</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-semibold text-blue-600 mb-2">📊 CSV Format</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Perfect for Excel and Google Sheets</li>
                    <li>• Best for data analysis and pivot tables</li>
                    <li>• Lightweight and fast downloads</li>
                    <li>• Compatible with all spreadsheet software</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-green-600 mb-2">📈 Excel Format</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Native Excel (.xlsx) files</li>
                    <li>• Preserves formatting and structure</li>
                    <li>• Ready for business presentations</li>
                    <li>• Multiple sheets for comprehensive exports</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-600 mb-2">📄 JSON Format</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Perfect for technical integrations</li>
                    <li>• API-ready structured data</li>
                    <li>• Preserves all data relationships</li>
                    <li>• Ideal for developers and automated systems</li>
                  </ul>
                </div>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>⚡ Pro Tip:</strong> All exports use real-time data from the database and include proper timestamps. 
                  Large exports may take a moment to generate - please be patient for comprehensive datasets.
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}; 