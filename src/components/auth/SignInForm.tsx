"use client";

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthContext } from '@/context/AuthContext';

export default function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn } = useAuthContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validate fields
    if (!email.trim() || !password.trim()) {
      setMessage('Please enter both email and password');
      setLoading(false);
      return;
    }

    try {
      console.log('🔑 Attempting sign-in for:', email);
      setMessage('Signing in...');

      const { data, error } = await signIn(email, password);
      
      if (error) {
        console.error('🔑 Sign-in error:', error);
        setMessage(`Error: ${error.message}`);
        setLoading(false);
        return;
      }

      if (data.user) {
        console.log('🔑 Sign-in successful:', data.user.email);
        setMessage('✅ Sign-in successful! Redirecting...');
        
        // Use router.push for proper Next.js navigation
        router.push('/dashboard');
        router.refresh();
      }
    } catch (error: any) {
      console.error('🔑 Sign-in failed:', error);
      setMessage(`Error: ${error.message || 'Sign-in failed'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="text-center">
            <h1 className="text-2xl font-bold">Welcome Back</h1>
            <p className="text-sm text-gray-500 mt-2">Sign in to Project Aqua</p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
              <p className="font-semibold text-blue-800">Test Credentials:</p>
              <p className="text-blue-700">Email: freakoffitnessig@gmail.com</p>
              <p className="text-blue-700">Email: athri3nandan@gmail.com</p>
              <p className="text-blue-700">Password: Use your actual password</p>
            </div>
            {message && (
              <div className={`mt-3 p-2 rounded text-sm ${
                message.includes('Error') ? 'bg-red-100 text-red-700' : 
                message.includes('✅') ? 'bg-green-100 text-green-700' : 
                'bg-blue-100 text-blue-700'
              }`}>
                {message}
              </div>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="text-right">
              <Link 
                href="/reset-password" 
                className="text-sm text-blue-600 hover:underline"
              >
                Forgot your password?
              </Link>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        
        <CardFooter>
          <div className="text-center text-sm w-full">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}