'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { ServiceManagerDashboard } from '@/components/dashboard/ServiceManagerDashboard';
import { AccountsManagerDashboard } from '@/components/dashboard/AccountsManagerDashboard';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';
import { DashboardNavigation } from '@/components/ui/DashboardNavigation';

export default function DashboardPage() {
  const { user, userProfile, loading, signOut } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // Simple client-side auth check
    if (!loading && !user) {
      console.log('🏠 No user found, redirecting to signin');
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    console.log('🚪 Signing out...');
    await signOut();
    router.push('/signin');
  };

  // Role-based dashboard rendering
  const renderRoleBasedDashboard = () => {
    if (!userProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-lg shadow">
            <div className="text-amber-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600">Unable to load your user profile. Please contact administrator.</p>
            <button
              onClick={handleSignOut}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out & Try Again
            </button>
          </div>
        </div>
      );
    }

    // Render dashboard based on user role
    switch (userProfile.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'dept_head':
      case 'product_manager':
      case 'driver_manager':
        return <ManagerDashboard />;
      case 'service_manager':
        return <ServiceManagerDashboard />;
      case 'accounts_manager':
        return <AccountsManagerDashboard />;
      case 'technician':
        return <TechnicianDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow">
              <div className="text-red-600 text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600">Your role ({userProfile.role}) doesn't have dashboard access.</p>
              <button
                onClick={handleSignOut}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Redirecting to sign in...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Sign Out */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <span className="text-2xl mr-2">💧</span>
              <span className="text-xl font-bold text-blue-600">Project Aqua</span>
              {userProfile && (
                <span className="ml-4 text-sm text-gray-600">
                  Welcome, {userProfile.full_name}
                </span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <DashboardNavigation />

      {/* Role-based Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderRoleBasedDashboard()}
      </div>
    </div>
  );
}