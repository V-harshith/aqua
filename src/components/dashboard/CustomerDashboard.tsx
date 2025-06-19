'use client';

import { useAuthContext } from '@/context/AuthContext';
import Link from 'next/link';

export function CustomerDashboard() {
  const { userProfile } = useAuthContext();

  const customerStats = [
    { label: 'Active Services', value: '3', icon: '🔧' },
    { label: 'Open Complaints', value: '1', icon: '📝' },
    { label: 'This Month Bill', value: '$156', icon: '💰' },
    { label: 'Water Usage', value: '1,250L', icon: '💧' }
  ];

  const recentServices = [
    { service: 'Water Connection Repair', status: 'In Progress', date: '2024-01-15', technician: 'John Smith' },
    { service: 'Monthly Maintenance', status: 'Completed', date: '2024-01-10', technician: 'Mike Johnson' },
    { service: 'Meter Reading', status: 'Scheduled', date: '2024-01-20', technician: 'Sarah Wilson' }
  ];

  const quickActions = [
    { label: 'Request Service', href: '/services/new', icon: '🔧', color: 'blue' },
    { label: 'File Complaint', href: '/complaints/new', icon: '📝', color: 'red' },
    { label: 'View Bills', href: '/billing', icon: '💰', color: 'green' },
    { label: 'Contact Support', href: '/support', icon: '📞', color: 'purple' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600">Manage your water services and account</p>
          </div>
          <div className="flex items-center bg-blue-50 px-3 py-2 rounded-lg">
            <span className="text-blue-600 text-sm font-medium">👤 Customer</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {customerStats.map((stat, index) => (
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
                className="flex items-center p-3 rounded-lg border hover:bg-blue-50 hover:border-blue-200 transition-colors duration-200"
              >
                <span className="text-lg mr-3">{action.icon}</span>
                <span className="font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Services */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Services</h3>
          <div className="space-y-4">
            {recentServices.map((service, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{service.service}</h4>
                  <span className={`
                    px-2 py-1 rounded-full text-xs font-medium
                    ${service.status === 'Completed' ? 'bg-green-100 text-green-800' : ''}
                    ${service.status === 'In Progress' ? 'bg-yellow-100 text-yellow-800' : ''}
                    ${service.status === 'Scheduled' ? 'bg-blue-100 text-blue-800' : ''}
                  `}>
                    {service.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Technician: {service.technician}</span>
                  <span>{service.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Service Address</h4>
            <p className="text-gray-600">123 Main Street, Water City, WC 12345</p>
            <p className="text-sm text-gray-500 mt-1">Connection ID: WC-2024-001</p>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Billing Information</h4>
            <p className="text-gray-600">Next bill date: January 25, 2024</p>
            <p className="text-sm text-gray-500 mt-1">Payment method: Auto-pay enabled</p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="bg-red-50 rounded-lg p-6 border-l-4 border-red-400">
        <h3 className="text-lg font-semibold text-red-800 mb-2">Emergency Contact</h3>
        <p className="text-red-700">For water emergencies, call: <strong>1-800-WATER-911</strong></p>
        <p className="text-sm text-red-600 mt-1">Available 24/7 for urgent water service issues</p>
      </div>
    </div>
  );
} 