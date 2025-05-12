'use client';

import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function Dashboard() {
  const { user, loading, signOut } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to sign in
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [user, loading, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/signin');
  };

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Welcome to Project Aqua</h2>
          <div className="mb-4">
            <p className="text-gray-700">You are signed in as:</p>
            <p className="font-medium">{user?.email}</p>
          </div>
          <div className="border-t pt-4">
            <p className="text-gray-600">
              This is a protected dashboard page that only authenticated users can access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}