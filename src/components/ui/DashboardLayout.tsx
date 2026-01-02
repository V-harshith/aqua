'use client';

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import { DashboardNavigation } from './DashboardNavigation';
import Button from './Button';

interface DashboardLayoutProps {
  children: React.ReactNode;
  showBackButton?: boolean;
  backButtonHref?: string;
  backButtonLabel?: string;
}

/**
 * DashboardLayout - Consistent layout wrapper for all dashboard pages
 * 
 * Features:
 * - Persistent header with navigation
 * - Sign-in/sign-out functionality always visible
 * - Optional "Go Back" button for sub-pages
 * - Breadcrumb-style navigation
 * - Sticky positioning to remain visible while scrolling
 */
export function DashboardLayout({ 
  children, 
  showBackButton = false,
  backButtonHref,
  backButtonLabel = 'Go Back'
}: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userProfile } = useAuthContext();

  // Auto-detect if we should show back button based on URL depth
  const shouldShowBackButton = showBackButton || (pathname?.split('/').filter(Boolean).length > 1);
  
  // Auto-generate back button href if not provided
  const defaultBackHref = pathname?.split('/').slice(0, -1).join('/') || '/dashboard';

  const handleGoBack = () => {
    if (backButtonHref) {
      router.push(backButtonHref);
    } else if (window.history.length > 1) {
      router.back();
    } else {
      router.push(defaultBackHref);
    }
  };

  // Generate breadcrumbs from current path
  const generateBreadcrumbs = () => {
    if (!pathname) return [];
    
    const paths = pathname.split('/').filter(Boolean);
    const breadcrumbs = paths.map((path, index) => {
      const href = '/' + paths.slice(0, index + 1).join('/');
      const label = path
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      return { label, href, isLast: index === paths.length - 1 };
    });
    
    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Navigation Header - Always Visible */}
      <DashboardNavigation />

      {/* Breadcrumbs and Back Button Section - Always Visible */}
      {shouldShowBackButton && (
        <div className="bg-white border-b border-gray-200 sticky top-[57px] z-30 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center justify-between">
              {/* Breadcrumbs */}
              <nav className="flex items-center space-x-2 text-sm">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  🏠 Home
                </button>
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={crumb.href}>
                    <span className="text-gray-400">/</span>
                    {crumb.isLast ? (
                      <span className="text-gray-900 font-medium">{crumb.label}</span>
                    ) : (
                      <button
                        onClick={() => router.push(crumb.href)}
                        className="text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {crumb.label}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </nav>

              {/* Back Button */}
              <Button
                onClick={handleGoBack}
                variant="outline"
                size="sm"
                className="flex items-center space-x-1"
              >
                <span>←</span>
                <span className="hidden sm:inline">{backButtonLabel}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {children}
      </main>

      {/* Optional Footer with User Info - Always Visible at Bottom */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div>
              <span className="font-medium">{userProfile?.full_name || userProfile?.email}</span>
              {' • '}
              <span className="capitalize">{userProfile?.role?.replace('_', ' ')}</span>
            </div>
            <div className="text-xs text-gray-500">
              Project Aqua © {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
