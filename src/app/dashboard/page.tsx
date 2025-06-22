'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminDashboard } from '@/components/dashboard/AdminDashboard';
import { EnhancedAdminDashboard } from '@/components/dashboard/EnhancedAdminDashboard';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { ServiceManagerDashboard } from '@/components/dashboard/ServiceManagerDashboard';
import { AccountsManagerDashboard } from '@/components/dashboard/AccountsManagerDashboard';
import { ProductManagerDashboard } from '@/components/dashboard/ProductManagerDashboard';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';
import { DashboardNavigation } from '@/components/ui/DashboardNavigation';

export default function DashboardPage() {
  const { user, userProfile, loading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      const { createClient } = await import('@/lib/supabase');
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push('/signin');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderRoleBasedDashboard = () => {
    if (!userProfile) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center bg-white p-8 rounded-lg shadow">
            <div className="text-gray-600 text-4xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">
              Your user profile could not be loaded.
            </p>
            <button
              onClick={handleSignOut}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      );
    }

    // Render dashboard based on user role
    switch (userProfile.role) {
      case 'admin':
        return <EnhancedAdminDashboard />;
      case 'customer':
        return <CustomerDashboard />;
      case 'dept_head':
      case 'driver_manager':
        return <ManagerDashboard />;
      case 'service_manager':
        return <ServiceManagerDashboard />;
      case 'accounts_manager':
        return <AccountsManagerDashboard />;
      case 'product_manager':
        return <ProductManagerDashboard />;
      case 'technician':
        return <TechnicianDashboard />;
      default:
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center bg-white p-8 rounded-lg shadow">
              <div className="text-red-600 text-4xl mb-4">🚫</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-4">
                You don&apos;t have access to this dashboard. Role: {userProfile.role}
              </p>
              <button
                onClick={handleSignOut}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
          <p className="text-sm text-gray-500">Please wait while we load your data</p>
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
      {/* Navigation */}
      <DashboardNavigation />
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderRoleBasedDashboard()}
      </main>
    </div>
  );
}