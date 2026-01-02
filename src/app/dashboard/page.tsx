'use client';

export const dynamic = 'force-dynamic';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { EnhancedAdminDashboard } from '@/components/dashboard/EnhancedAdminDashboard';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { ServiceManagerDashboard } from '@/components/dashboard/ServiceManagerDashboard';
import { AccountsManagerDashboard } from '@/components/dashboard/AccountsManagerDashboard';
import { ProductManagerDashboard } from '@/components/dashboard/ProductManagerDashboard';
import { TechnicianDashboard } from '@/components/dashboard/TechnicianDashboard';
import { DashboardLayout } from '@/components/ui/DashboardLayout';
import { supabase } from '@/lib/supabase';
export default function DashboardPage() {
  const { user, userProfile, loading } = useAuthContext();
  const router = useRouter();

  // Debug logging
  useEffect(() => {
    console.log('🔍 Dashboard State:', {
      loading,
      hasUser: !!user,
      hasProfile: !!userProfile,
      role: userProfile?.role,
      userId: user?.id
    });
  }, [user, userProfile, loading]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      router.replace('/');
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  return (
    <DashboardLayout showBackButton={false}>
      {renderRoleBasedDashboard()}
    </DashboardLayout>
  );
} 