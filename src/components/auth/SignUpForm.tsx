'use client';

import { useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/Card';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const { signUp } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await signUp(email, password);
      if (error) throw error;
      
      setMessage('Registration successful! Please check your email for verification.');
      // Optionally redirect to sign-in page after a delay
      setTimeout(() => {
        router.push('/signin');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-sm text-gray-500 mt-2">Sign up to get started</p>
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

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Signing up...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      
      <CardFooter>
        <div className="text-center text-sm w-full">
          Already have an account?{' '}
          <Link href="/signin" className="text-blue-600 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}