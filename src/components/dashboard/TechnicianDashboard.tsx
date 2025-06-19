'use client';

import { useAuthContext } from '@/context/AuthContext';
import Link from 'next/link';

export function TechnicianDashboard() {
  const { userProfile } = useAuthContext();

  const technicianStats = [
    { label: 'Assigned Services', value: '12', icon: '🔧' },
    { label: 'Completed Today', value: '5', icon: '✅' },
    { label: 'Pending Tasks', value: '7', icon: '⏳' },
    { label: 'Work Hours', value: '6.5h', icon: '⏰' }
  ];

  const assignedServices = [
    { service: 'Water Pump Repair', address: '123 Main St', priority: 'High', status: 'In Progress', time: '09:00 AM' },
    { service: 'Pipe Maintenance', address: '456 Oak Ave', priority: 'Medium', status: 'Scheduled', time: '11:30 AM' },
    { service: 'Meter Reading', address: '789 Pine St', priority: 'Low', status: 'Pending', time: '02:00 PM' }
  ];

  const quickActions = [
    { label: 'Check In', href: '/technician/checkin', icon: '📍', color: 'green' },
    { label: 'Report Issue', href: '/technician/report', icon: '⚠️', color: 'red' },
    { label: 'Update Service', href: '/services', icon: '📝', color: 'blue' },
    { label: 'Request Parts', href: '/technician/parts', icon: '🔩', color: 'yellow' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Technician Dashboard</h1>
            <p className="text-gray-600">Field Operations & Service Management</p>
          </div>
          <div className="flex items-center bg-yellow-50 px-3 py-2 rounded-lg">
            <span className="text-yellow-600 text-sm font-medium">🔧 Technician</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {technicianStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
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
              <Link
                key={index}
                href={action.href}
                className="flex items-center p-3 rounded-lg border hover:bg-yellow-50 hover:border-yellow-200 transition-colors duration-200"
              >
                <span className="text-lg mr-3">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Assigned Services</h3>
          <div className="space-y-4">
            {assignedServices.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{service.service}</h4>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>📍 {service.address}</span>
                  <span>🕐 {service.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 