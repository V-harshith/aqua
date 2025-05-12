'use client';

import Link from 'next/link';
import { useAuthContext } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';

export default function AuthNav() {
  const { user } = useAuthContext();
  const pathname = usePathname();

  return (
    <nav className="flex justify-between items-center py-4 px-6 bg-white shadow-sm">
      <Link href="/" className="text-xl font-bold text-blue-600">
        Project Aqua
      </Link>
      
      <div className="space-x-4">
        {user ? (
          <Link 
            href="/dashboard" 
            className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link 
              href="/signin" 
              className={`px-4 py-2 rounded ${pathname === '/signin' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
            >
              Sign In
            </Link>
            <Link 
              href="/signup" 
              className={`px-4 py-2 rounded ${pathname === '/signup' ? 'bg-blue-600 text-white' : 'text-blue-600 hover:bg-blue-50'} transition-colors`}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}