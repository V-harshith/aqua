'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

export default function ResetPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { resetPassword } = useAuthContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      
      setMessage('Password reset link sent to your email!');
    } catch (error: any) {
      setError(error.message || 'Failed to send reset password email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Reset Password</h1>
          <p className="text-sm text-gray-500 mt-2">Enter your email to receive a password reset link</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 border border-red-200 text-red-700 rounded">
              {error}
            </div>
          )}

          {message && (
            <div className="p-3 bg-green-100 border border-green-200 text-green-700 rounded">
              {message}
            </div>
          )}

          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter>
        <div className="text-center text-sm w-full">
          Remember your password?{' '}
          <Link href="/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}