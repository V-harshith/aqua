'use client';

import { useAuthContext } from '@/context/AuthContext';
import { RoleBasedNavigation } from '@/components/ui/RoleBasedNavigation';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export function ManagerDashboard() {
  const { userProfile } = useAuthContext();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.push('/signin');
    } catch (err: any) {
      console.error('Sign out failed:', err);
    }
  };

  // Role-specific stats based on manager type
  const getManagerStats = () => {
    switch (userProfile?.role) {
      case 'service_manager':
        return [
          { label: 'Active Services', value: '45', change: '+8%', icon: '🔧' },
          { label: 'Pending Complaints', value: '12', change: '-15%', icon: '📝' },
          { label: 'Technicians Available', value: '8', change: '0%', icon: '👥' },
          { label: 'Avg Response Time', value: '2.3h', change: '-10%', icon: '⏱️' }
        ];
      case 'accounts_manager':
        return [
          { label: 'Monthly Revenue', value: '$45,230', change: '+12%', icon: '💰' },
          { label: 'Pending Payments', value: '23', change: '-5%', icon: '⏳' },
          { label: 'Collection Rate', value: '94%', change: '+3%', icon: '📊' },
          { label: 'Overdue Accounts', value: '8', change: '-20%', icon: '⚠️' }
        ];
      default:
        return [
          { label: 'Team Performance', value: '85%', change: '+5%', icon: '📈' },
          { label: 'Active Projects', value: '12', change: '+2', icon: '📋' },
          { label: 'Department Budget', value: '$25,000', change: '+8%', icon: '💰' },
          { label: 'Team Members', value: '15', change: '0%', icon: '👥' }
        ];
    }
  };

  const managerStats = getManagerStats();

  const quickActions = [
    { label: 'Team Management', href: '/team', icon: '👥', color: 'blue' },
    { label: 'Department Reports', href: '/reports/department', icon: '📊', color: 'green' },
    { label: 'Budget Planning', href: '/budget', icon: '💰', color: 'purple' },
    { label: 'Performance Review', href: '/performance', icon: '📈', color: 'yellow' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600">Department Operations & Management</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-green-600 text-sm font-medium">🏢 Manager</span>
            </div>
            <Button
              onClick={handleSignOut}
              variant="danger"
              size="sm"
            >
              🚪 Sign Out
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {managerStats.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last week
                </p>
              </div>
              <div className="text-3xl">{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Management Tools</h3>
        <RoleBasedNavigation 
          orientation="horizontal" 
          showIcons={true} 
          showDescriptions={false}
          className="justify-center"
        />
      </div>
    </div>
  );
} 