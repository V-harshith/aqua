'use client';

import { useState, useEffect } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { RoleBasedNavigation } from '@/components/ui/RoleBasedNavigation';
import Link from 'next/link';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  customersCount: number;
  staffCount: number;
  openComplaints: number;
  userGrowthPercentage: number;
  roleBreakdown: Record<string, number>;
  lastUpdated: string;
}

export function AdminDashboard() {
  const { userProfile } = useAuthContext();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/overview?type=admin');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch stats');
      }
      
      const dashboardData = result.data;
      setStats({
        totalUsers: dashboardData.stats.totalUsers,
        activeUsers: dashboardData.stats.activeUsers,
        customersCount: dashboardData.stats.customers || 0,
        staffCount: dashboardData.stats.staffMembers || 0,
        openComplaints: dashboardData.stats.openComplaints,
        userGrowthPercentage: dashboardData.stats.userGrowthPercentage || 0,
        roleBreakdown: {},
        lastUpdated: dashboardData.lastUpdated
      });
    } catch (error: any) {
      console.error('Error fetching admin stats:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const adminStats = stats ? [
    { 
      label: 'Total Users', 
      value: stats.totalUsers.toString(), 
      change: `+${stats.userGrowthPercentage}%`, 
      icon: '👥' 
    },
    { 
      label: 'Active Users', 
      value: stats.activeUsers.toString(), 
      change: `${Math.round((stats.activeUsers / stats.totalUsers) * 100)}%`, 
      icon: '✅' 
    },
    { 
      label: 'Staff Members', 
      value: stats.staffCount.toString(), 
      change: `${Math.round((stats.staffCount / stats.totalUsers) * 100)}%`, 
      icon: '🔧' 
    },
    { 
      label: 'Customers', 
      value: stats.customersCount.toString(), 
      change: `${Math.round((stats.customersCount / stats.totalUsers) * 100)}%`, 
      icon: '👤' 
    }
  ] : [];

  const recentActivities = [
    { action: 'User data refreshed', user: 'System', time: 'Just now', type: 'system' },
    { action: 'Dashboard accessed', user: userProfile?.full_name || 'Admin', time: '1 min ago', type: 'user' },
    { action: 'Stats updated', user: 'System', time: '5 min ago', type: 'system' },
    { action: 'Database healthy', user: 'System', time: '10 min ago', type: 'system' }
  ];

  const debugUsers = async () => {
    try {
      const response = await fetch('/api/debug/users');
      const result = await response.json();
      
      console.log('=== USER DEBUG INFO ===');
      console.log('Database Users:', result.dbUsers);
      console.log('Auth Users:', result.authUsers);
      console.log('Orphaned DB Users:', result.orphanedDbUsers);
      console.log('Orphaned Auth Users:', result.orphanedAuthUsers);
      console.log('Stats:', result.stats);
      
      alert(`Debug info logged to console. DB Users: ${result.stats?.totalDbUsers}, Auth Users: ${result.stats?.totalAuthUsers}, Orphaned: ${result.stats?.orphanedDb + result.stats?.orphanedAuth}`);
    } catch (error) {
      console.error('Debug error:', error);
      alert('Debug failed. Check console for details.');
    }
  };

  const quickActions = [
    { label: 'Add New User', href: '/admin/users/new', icon: '👤', color: 'blue' },
    { label: 'Manage Users', href: '/admin/users', icon: '👥', color: 'green' },
    { label: 'User Management', href: '/admin', icon: '⚙️', color: 'gray' },
    { label: 'Refresh Stats', onClick: fetchStats, icon: '🔄', color: 'purple' },
    { label: 'Debug Users', onClick: debugUsers, icon: '🐛', color: 'red' }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-red-800 font-medium">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-3 bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600">System Administration & Overview</p>
            {stats && (
              <p className="text-xs text-gray-400 mt-1">
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={fetchStats}
              className="text-gray-500 hover:text-gray-700 text-sm px-3 py-1 border rounded-md hover:bg-gray-50"
            >
              🔄 Refresh
            </button>
            <div className="flex items-center bg-red-50 px-3 py-2 rounded-lg">
              <span className="text-red-600 text-sm font-medium">👑 Administrator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {adminStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-green-600">
                  {stat.change} of total
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, index) => (
              action.href ? (
                <Link
                  key={index}
                  href={action.href}
                  className="flex items-center p-3 rounded-lg border transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300"
                >
                  <span className="text-lg mr-3">{action.icon}</span>
                  <span className="font-medium text-gray-700">{action.label}</span>
                </Link>
              ) : (
                <button
                  key={index}
                  onClick={action.onClick}
                  className="w-full flex items-center p-3 rounded-lg border transition-colors duration-200 hover:bg-gray-50 hover:border-gray-300"
                >
                  <span className="text-lg mr-3">{action.icon}</span>
                  <span className="font-medium text-gray-700">{action.label}</span>
                </button>
              )
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent System Activity</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm
                    ${activity.type === 'user' ? 'bg-blue-100 text-blue-600' : ''}
                    ${activity.type === 'service' ? 'bg-green-100 text-green-600' : ''}
                    ${activity.type === 'system' ? 'bg-purple-100 text-purple-600' : ''}
                  `}>
                    {activity.type === 'user' ? '👤' : activity.type === 'service' ? '🔧' : '⚙️'}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                    <p className="text-xs text-gray-500">by {activity.user}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Overview */}
      {stats && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Role Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.roleBreakdown).map(([role, count]) => (
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
        </div>
      )}

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Admin Navigation</h3>
        <RoleBasedNavigation 
          orientation="horizontal" 
          showIcons={true} 
          showDescriptions={true}
          className="justify-center"
        />
      </div>
    </div>
  );
} 