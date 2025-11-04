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
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
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