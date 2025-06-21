'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const [errorInfo, setErrorInfo] = useState<{
    title: string;
    description: string;
    action?: string;
  }>({ title: 'Authentication Error', description: 'An error occurred during authentication.' });

  useEffect(() => {
    const error = searchParams.get('error');
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (errorCode === 'otp_expired' || error === 'access_denied') {
      setErrorInfo({
        title: 'Verification Link Expired',
        description: 'The email verification link has expired. Please request a new one or try signing in again.',
        action: 'signin'
      });
    } else if (error === 'auth_callback_error') {
      setErrorInfo({
        title: 'Authentication Failed',
        description: 'There was an error processing your authentication. Please try signing in again.',
        action: 'signin'
      });
    } else if (errorDescription) {
      setErrorInfo({
        title: 'Authentication Error',
        description: decodeURIComponent(errorDescription),
        action: 'signin'
      });
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">{errorInfo.title}</h1>
            <p className="text-gray-600">{errorInfo.description}</p>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            {errorInfo.action === 'signin' && (
              <>
                <Link href="/signin">
                  <Button variant="primary" fullWidth>
                    Back to Sign In
                  </Button>
                </Link>
                <Link href="/reset-password">
                  <Button variant="outline" fullWidth>
                    Reset Password
                  </Button>
                </Link>
              </>
            )}
            
            <div className="text-center">
              <Link href="/" className="text-sm text-blue-600 hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
