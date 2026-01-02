'use client';

export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import UpdatePasswordContent from './UpdatePasswordContent';
export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <UpdatePasswordContent />
    </Suspense>
  );
} 