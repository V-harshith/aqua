'use client';
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useToastContext } from '@/context/ToastContext';
import { supabase } from '@/lib/supabase';
import { authenticatedGet } from '@/lib/auth-client';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
      router.replace('/');
    } catch (err: any) {
      error({ title: 'Sign out failed', message: err.message });
    } finally {
      setSigningOut(false);
    }
  };
  const loadAllData = async () => {
    try {
      setIsLoading(true);
      // Fetch real data from API with authentication
      const data = await authenticatedGet('/api/admin/all-data');
      if (!data) {
        throw new Error('No data received from server');
      }
      setAllData(data);
    } catch (err: any) {
      console.error('❌ Error loading dashboard data:', err);
      error({ 
        title: 'Failed to load dashboard data', 
        message: `${err.message}. Please check your internet connection and try again.` 
      });
      // Set empty state instead of mock data
      setAllData({
        users: [],
        complaints: [],
        services: [],
        stats: {
          totalUsers: 0,
          activeUsers: 0,
          customerCount: 0,
          staffCount: 0,
          totalComplaints: 0,
          openComplaints: 0,
          totalServices: 0,
          pendingServices: 0,
          roleBreakdown: {},
          lastUpdated: new Date().toISOString()
        }
      });
    } finally {
      setIsLoading(false);
    }
  };
  const exportData = async (type: string, format: 'csv' | 'json' | 'excel' = 'csv') => {
    try {
      setIsExporting(true);
      // Mock export for development
      const filename = `${type}_export_${new Date().toISOString().split('T')[0]}.${format}`;
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      success({ 
        title: `${type.toUpperCase()} Export Complete!`, 
        message: `Mock export for ${filename} completed` 
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
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Enhanced Admin Dashboard</h1>
            <p className="text-gray-600">System Overview & Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={loadAllData}
              variant="secondary"
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? '⏳ Loading...' : '🔄 Refresh'}
            </Button>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="sm"
              disabled={signingOut}
            >
              {signingOut ? 'Signing out...' : '🚪 Sign Out'}
            </Button>
          </div>
        </div>
      </Card>
      {/* Real-Time Stats */}
      {allData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{allData.stats.totalUsers}</div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{allData.stats.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{allData.stats.openComplaints}</div>
              <div className="text-sm text-gray-600">Open Complaints</div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{allData.stats.pendingServices}</div>
              <div className="text-sm text-gray-600">Pending Services</div>
            </div>
          </Card>
        </div>
      )}
      {/* Navigation Tabs */}
      <Card>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'users', label: 'Users', icon: '👥' },
              { id: 'complaints', label: 'Complaints', icon: '📝' },
              { id: 'services', label: 'Services', icon: '🔧' },
              { id: 'export', label: 'Export', icon: '📤' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
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
      </Card>
      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && allData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Role Breakdown */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">User Roles</h3>
                <div className="space-y-3">
                  {Object.entries(allData.stats.roleBreakdown).map(([role, count]) => (
                    <div key={role} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium capitalize">{role.replace('_', ' ')}</div>
                      <div className="text-lg font-bold">{count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
            {/* Quick Actions */}
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <Link href="/admin/users">
                    <Button className="w-full" variant="outline">
                      👥 Manage Users
                    </Button>
                  </Link>
                  <Link href="/complaints">
                    <Button className="w-full" variant="outline">
                      📝 View Complaints
                    </Button>
                  </Link>
                  <Link href="/services">
                    <Button className="w-full" variant="outline">
                      🔧 View Services
                    </Button>
                  </Link>
                  <Link href="/reports">
                    <Button className="w-full" variant="outline">
                      📊 View Reports
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        )}
        {activeTab === 'users' && allData && (
          <Card>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">All Users ({allData.users.length})</h3>
                <Link href="/admin/users/new">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    ➕ Add User
                  </Button>
                </Link>
              </div>
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
                    {allData.users.slice(0, 10).map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2 font-medium">{user.full_name || 'N/A'}</td>
                        <td className="p-2">{user.email}</td>
                        <td className="p-2 capitalize">{user.role?.replace('_', ' ')}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="p-2">{formatDate(user.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>
        )}
        {activeTab === 'complaints' && allData && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Complaints ({allData.complaints.length})</h3>
              <div className="space-y-4">
                {allData.complaints.slice(0, 10).map(complaint => (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{complaint.complaint_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(complaint.status)}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(complaint.created_at)}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{complaint.title}</div>
                    {complaint.description && (
                      <div className="text-sm text-gray-600 mt-1">{complaint.description}</div>
                    )}
                  </div>
                ))}
                {allData.complaints.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No complaints found
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
        {activeTab === 'services' && allData && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Services ({allData.services.length})</h3>
              <div className="space-y-4">
                {allData.services.slice(0, 10).map(service => (
                  <div key={service.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium">{service.service_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(service.created_at)}
                      </div>
                    </div>
                    <div className="font-medium text-gray-900">{service.service_type}</div>
                    {service.description && (
                      <div className="text-sm text-gray-600 mt-1">{service.description}</div>
                    )}
                  </div>
                ))}
                {allData.services.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No services found
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}
        {activeTab === 'export' && (
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Data Export</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { type: 'users', label: 'Users Data', description: 'Export all user information' },
                  { type: 'complaints', label: 'Complaints Data', description: 'Export all complaints' },
                  { type: 'services', label: 'Services Data', description: 'Export all services' }
                ].map(exportType => (
                  <div key={exportType.type} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{exportType.label}</h4>
                    <p className="text-sm text-gray-600 mb-4">{exportType.description}</p>
                    <div className="space-y-2">
                      {['csv', 'json', 'excel'].map(format => (
                        <Button
                          key={format}
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => exportData(exportType.type, format as any)}
                          disabled={isExporting}
                        >
                          {isExporting ? 'Exporting...' : `Export as ${format.toUpperCase()}`}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}; 