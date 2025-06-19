import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';

interface DashboardAction {
  id: string;
  title: string;
  hindiTitle: string;
  icon: string;
  color: string;
  href?: string;
  action?: () => void;
  roles: string[];
}

export const SimpleDashboard: React.FC = () => {
  const { user, userProfile } = useAuth();

  const dashboardActions: DashboardAction[] = [
    {
      id: 'water-problem',
      title: 'Water Problem',
      hindiTitle: 'पानी की समस्या',
      icon: '🚨',
      color: 'bg-red-500 hover:bg-red-600',
      href: '/complaint',
      roles: ['customer', 'technician']
    },
    {
      id: 'call-help',
      title: 'Call for Help',
      hindiTitle: 'मदद के लिए कॉल',
      icon: '📞',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => window.open('tel:+919876543210'),
      roles: ['customer', 'technician']
    },
    {
      id: 'water-delivery',
      title: 'Water Delivery',
      hindiTitle: 'पानी की डिलीवरी',
      icon: '🚛',
      color: 'bg-blue-500 hover:bg-blue-600',
      href: '/driver',
      roles: ['driver_manager', 'admin']
    },
    {
      id: 'my-work',
      title: 'My Work',
      hindiTitle: 'मेरा काम',
      icon: '⚙️',
      color: 'bg-orange-500 hover:bg-orange-600',
      href: '/technician-work',
      roles: ['technician']
    },
    {
      id: 'complaints',
      title: 'All Problems',
      hindiTitle: 'सभी समस्याएं',
      icon: '📋',
      color: 'bg-purple-500 hover:bg-purple-600',
      href: '/complaints',
      roles: ['service_manager', 'admin', 'dept_head']
    },
    {
      id: 'users',
      title: 'People',
      hindiTitle: 'लोग',
      icon: '👥',
      color: 'bg-indigo-500 hover:bg-indigo-600',
      href: '/admin/users',
      roles: ['admin', 'dept_head']
    },
    {
      id: 'money',
      title: 'Money',
      hindiTitle: 'पैसा',
      icon: '💰',
      color: 'bg-emerald-500 hover:bg-emerald-600',
      href: '/accounts',
      roles: ['accounts_manager', 'admin', 'dept_head']
    },
    {
      id: 'products',
      title: 'Products',
      hindiTitle: 'सामान',
      icon: '📦',
      color: 'bg-cyan-500 hover:bg-cyan-600',
      href: '/products',
      roles: ['product_manager', 'admin', 'dept_head']
    },
    {
      id: 'reports',
      title: 'Reports',
      hindiTitle: 'रिपोर्ट',
      icon: '📊',
      color: 'bg-pink-500 hover:bg-pink-600',
      href: '/reports',
      roles: ['admin', 'dept_head', 'accounts_manager', 'service_manager', 'product_manager']
    }
  ];

  const getFilteredActions = () => {
    if (!userProfile?.role) return [];
    
    return dashboardActions.filter(action => 
      action.roles.includes(userProfile.role)
    );
  };

  const handleActionClick = (action: DashboardAction) => {
    if (action.action) {
      action.action();
    } else if (action.href) {
      window.location.href = action.href;
    }
  };

  const filteredActions = getFilteredActions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-6xl mb-4">💧</div>
        <h1 className="text-3xl font-bold text-blue-800 mb-2">
          प्रोजेक्ट अक्वा
        </h1>
        <p className="text-xl text-blue-600">
          Project Aqua
        </p>
        {userProfile && (
          <div className="mt-4 bg-white rounded-full px-6 py-3 shadow-md inline-block">
            <p className="text-lg font-medium text-gray-800">
              नमस्कार, {userProfile.full_name} जी
            </p>
            <p className="text-sm text-gray-600">
              Hello, {userProfile.full_name}
            </p>
          </div>
        )}
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {filteredActions.map((action) => (
          <div
            key={action.id}
            onClick={() => handleActionClick(action)}
            className="cursor-pointer transform transition-all duration-200 hover:scale-105"
          >
            <Card className={`${action.color} text-white shadow-lg hover:shadow-xl border-0 h-full`}>
              <div className="p-8 text-center">
                <div className="text-6xl mb-4">{action.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{action.hindiTitle}</h3>
                <p className="text-lg opacity-90">{action.title}</p>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* Emergency Contact */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => window.open('tel:+919876543210')}
          className="bg-red-500 hover:bg-red-600 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-110"
          aria-label="Emergency Call"
        >
          <div className="text-center">
            <div className="text-2xl">🆘</div>
            <div className="text-xs mt-1">Help</div>
          </div>
        </button>
      </div>

      {/* Simple Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center max-w-md mx-auto">
          <button
            onClick={() => window.location.href = '/'}
            className="flex flex-col items-center py-2 px-3 text-blue-600"
          >
            <span className="text-xl">🏠</span>
            <span className="text-xs">Home</span>
          </button>
          <button
            onClick={() => window.location.href = '/profile'}
            className="flex flex-col items-center py-2 px-3 text-gray-600"
          >
            <span className="text-xl">👤</span>
            <span className="text-xs">Profile</span>
          </button>
          <button
            onClick={() => window.location.href = '/help'}
            className="flex flex-col items-center py-2 px-3 text-gray-600"
          >
            <span className="text-xl">❓</span>
            <span className="text-xs">Help</span>
          </button>
          <button
            onClick={() => {
              if (confirm('क्या आप बाहर निकलना चाहते हैं? / Do you want to logout?')) {
                window.location.href = '/signin';
              }
            }}
            className="flex flex-col items-center py-2 px-3 text-red-600"
          >
            <span className="text-xl">🚪</span>
            <span className="text-xs">Exit</span>
          </button>
        </div>
      </div>

      {/* Spacing for bottom navigation */}
      <div className="h-20"></div>
    </div>
  );
}; 