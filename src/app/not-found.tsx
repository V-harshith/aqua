import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
            <p className="text-gray-600 mt-2">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-500">
              Error Code: 404
            </p>
            <p className="text-sm text-gray-500">
              This might happen if:
            </p>
            <ul className="text-sm text-gray-500 text-left space-y-1">
              <li>• The URL was typed incorrectly</li>
              <li>• The page has been moved or deleted</li>
              <li>• You don't have permission to access this page</li>
            </ul>
          </div>
          
          <div className="flex gap-2">
            <Link href="/" className="flex-1">
              <Button className="w-full">Go Home</Button>
            </Link>
            <Link href="/dashboard" className="flex-1">
              <Button variant="outline" className="w-full">
                Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="text-center">
            <button
              onClick={() => window.history.back()}
              className="text-sm text-blue-600 hover:underline"
            >
              ← Go Back
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}