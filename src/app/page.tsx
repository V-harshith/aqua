'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';
import { useState } from 'react';

export default function Home() {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const [showSignUp, setShowSignUp] = useState(false);

  useEffect(() => {
    // Only redirect if user is authenticated
    if (!loading && user) {
      console.log('🏠 User authenticated, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show landing page with auth forms if user is not authenticated
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-100">
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          {/* Left side - Branding */}
          <div className="text-center lg:text-left">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Project <span className="text-blue-600">Aqua</span>
              </h1>
              <p className="text-xl text-gray-600 mb-6">
                Comprehensive Water Management System
              </p>
              <p className="text-lg text-gray-500 max-w-lg">
                Streamline water service operations, manage complaints, track deliveries, 
                and ensure efficient resource allocation across your organization.
              </p>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-blue-600 text-2xl mb-2">🔧</div>
                <h3 className="font-semibold mb-1">Service Management</h3>
                <p className="text-sm text-gray-600">Handle service requests efficiently</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-blue-600 text-2xl mb-2">📱</div>
                <h3 className="font-semibold mb-1">Complaint Tracking</h3>
                <p className="text-sm text-gray-600">Track and resolve customer issues</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-blue-600 text-2xl mb-2">🚛</div>
                <h3 className="font-semibold mb-1">Fleet Management</h3>
                <p className="text-sm text-gray-600">Manage delivery vehicles and drivers</p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <div className="text-blue-600 text-2xl mb-2">📊</div>
                <h3 className="font-semibold mb-1">Analytics</h3>
                <p className="text-sm text-gray-600">Comprehensive reporting and insights</p>
              </div>
            </div>

            {/* Security & Access Info */}
            <div className="bg-white/40 backdrop-blur-sm rounded-lg p-4 text-left">
              <h4 className="font-semibold text-gray-800 mb-2">Secure Internal Tool</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• <span className="font-medium">Secure Registration:</span> All users start as customers</p>
                <p>• <span className="font-medium">Admin Control:</span> Only admins assign employee roles</p>
                <p>• <span className="font-medium">Role-Based Access:</span> Permissions based on job function</p>
                <p>• <span className="font-medium">Internal Use:</span> Designed for company employees</p>
              </div>
            </div>
          </div>

          {/* Right side - Authentication Form */}
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              {/* Toggle buttons */}
              <div className="flex bg-white/20 backdrop-blur-sm rounded-lg p-1 mb-6">
                <button
                  onClick={() => setShowSignUp(false)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    !showSignUp
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setShowSignUp(true)}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                    showSignUp
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Authentication Form */}
              {showSignUp ? <SignUpForm /> : <SignInForm />}

              {/* Additional Links */}
              <div className="mt-6 text-center">
                <Link 
                  href="/reset-password"
                  className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <p className="text-sm text-gray-500">
          © {new Date().getFullYear()} Project Aqua. Water Management System.
        </p>
      </div>
    </div>
  );
}
