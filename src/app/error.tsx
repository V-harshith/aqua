'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Something went wrong</h1>
            <p className="text-gray-600 mt-2">
              We encountered an unexpected error while loading this page.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm font-medium text-red-800">Error Details:</p>
              <p className="text-xs text-red-700 mt-1 font-mono break-all">
                {error.message}
              </p>
              {error.digest && (
                <p className="text-xs text-red-600 mt-1">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={reset} className="flex-1">
              Try Again
            </Button>
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>

          <div className="text-center text-sm text-gray-500">
            If this problem persists, please contact support.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}