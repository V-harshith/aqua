'use client';
import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/context/AuthContext';
import Button from '@/components/ui/Button';
function AccessDeniedContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { userProfile, signOut } = useAuthContext();
  const error = searchParams.get('error');
  const requiredRole = searchParams.get('required_role');
  const handleGoBack = () => {
    router.back();
  };
  const handleGoHome = () => {
    router.push('/');
  };
  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
            <svg
              className="h-8 w-8 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          {/* Title */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h1>
          {/* Message */}
          <p className="text-gray-600 mb-6">
            {error === 'insufficient_permissions' 
              ? "You don't have permission to access this page."
              : "You are not authorized to view this content."
            }
          </p>
          {/* User Info */}
          {userProfile && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Current Role:</span>{' '}
                <span className="capitalize">
                  {userProfile.role.replace('_', ' ')}
                </span>
              </p>
              {requiredRole && (
                <p className="text-sm text-gray-700 mt-2">
                  <span className="font-medium">Required Role(s):</span>{' '}
                  <span className="text-red-600">{requiredRole}</span>
                </p>
              )}
            </div>
          )}
          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleGoBack}
              variant="primary"
              fullWidth
            >
              Go Back
            </Button>
            <Button
              onClick={handleGoHome}
              variant="secondary"
              fullWidth
            >
              Go to Home
            </Button>
            {userProfile && (
              <Button
                onClick={handleSignOut}
                variant="outline"
                fullWidth
              >
                Sign Out
              </Button>
            )}
          </div>
          {/* Help Text */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              If you believe you should have access to this page, please contact your administrator.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default function AccessDenied() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Loading...</p>
        </div>
      </div>
    }>
      <AccessDeniedContent />
    </Suspense>
  );
} 