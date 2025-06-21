"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '../ui/Card';
import { RoleBasedNavigation } from '../ui/RoleBasedNavigation';
import { useAuth } from '../../hooks/useAuth';

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
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const adminStats = [
    { label: 'Total Users', value: stats?.totalUsers || 0, change: '+12%', icon: '👥' },
    { label: 'Active Users', value: stats?.activeUsers || 0, change: '+8%', icon: '✅' },
    { label: 'Customers', value: stats?.customersCount || 0, change: '+15%', icon: '👤' },
    { label: 'Staff Members', value: stats?.staffCount || 0, change: '+5%', icon: '👔' },
    { label: 'Open Complaints', value: stats?.openComplaints || 0, change: '-3%', icon: '📋' },
    { label: 'User Growth', value: `${stats?.userGrowthPercentage || 0}%`, change: 'This month', icon: '📈' }
  ];

  const recentActivities = [
    { action: 'New user registered', user: 'System', time: '2 hours ago', type: 'user' },
    { action: 'Service completed', user: 'Technician Ram', time: '3 hours ago', type: 'service' },
    { action: 'Complaint resolved', user: 'Manager Shyam', time: '4 hours ago', type: 'service' },
    { action: 'Stats updated', user: 'System', time: '5 min ago', type: 'system' },
    { action: 'Database healthy', user: 'System', time: '10 min ago', type: 'system' }
  ];

  const quickActions = [
    { label: 'Add New User', href: '/admin/users/new', icon: '👤' },
    { label: 'Manage Users', href: '/admin/users', icon: '👥' },
    { label: 'User Management', href: '/admin', icon: '⚙️' },
    { label: 'Refresh Stats', onClick: fetchStats, icon: '🔄' },
    { label: 'System Health', href: '/analytics', icon: '🏥' }
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
                <p className="text-sm text-green-600">{stat.change}</p>
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