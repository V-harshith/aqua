"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAuthContext } from '@/context/AuthContext';
import { useToastContext } from '@/context/ToastContext';
import { supabase, UserRole } from '@/lib/supabase';

export default function SignUpForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuthContext();
  const { success, error: showError, info } = useToastContext();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!firstName.trim() || !lastName.trim()) {
      showError({
        title: 'Missing Information',
        message: 'First name and last name are required'
      });
      setLoading(false);
      return;
    }

    // Validate passwords match
    if (password !== confirmPassword) {
      showError({
        title: 'Password Mismatch',
        message: 'Passwords do not match. Please try again.'
      });
      setLoading(false);
      return;
    }

    // Validate password strength
    if (password.length < 6) {
      showError({
        title: 'Weak Password',
        message: 'Password must be at least 6 characters long'
      });
      setLoading(false);
      return;
    }

    try {
      info({
        title: 'Creating Account',
        message: 'Please wait while we set up your account...'
      });

      // Create Supabase auth user with metadata
      // The database trigger will automatically create the user profile
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: `${firstName.trim()} ${lastName.trim()}`,
            phone: phone.trim() || undefined,
            department: department.trim() || undefined,
            employee_id: employeeId.trim() || undefined,
            address: address.trim() || undefined,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        if (authData.user.email_confirmed_at) {
          success({
            title: 'Account Created Successfully!',
            message: 'You can now sign in to your account.',
            duration: 4000
          });
          setTimeout(() => {
            router.push('/signin');
          }, 2000);
        } else {
          success({
            title: 'Account Created Successfully!',
            message: 'Please check your email for a verification link before signing in.',
            duration: 6000
          });
          info({
            title: 'Email Verification Required',
            message: 'Click the link in your email to activate your account.',
            duration: 8000
          });
        }
        
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
        setFirstName('');
        setLastName('');
        setPhone('');
        setDepartment('');
        setEmployeeId('');
        setAddress('');
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Handle specific error types
      if (error.message.includes('email')) {
        showError({
          title: 'Email Error',
          message: 'This email is already registered or invalid. Please try a different email.',
          duration: 6000
        });
      } else if (error.message.includes('password')) {
        showError({
          title: 'Password Error',
          message: 'Password requirements not met. Please use a stronger password.',
          duration: 6000
        });
      } else {
        showError({
          title: 'Registration Failed',
          message: error.message || 'An unexpected error occurred. Please try again.',
          duration: 6000
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="text-center">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-sm text-gray-500 mt-2">Join Project Aqua - Water Management System</p>
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="firstName"
              type="text"
              value={firstName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              id="lastName"
              type="text"
              value={lastName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
              required
            />
          </div>

          <Input
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Phone Number"
            id="phone"
            type="tel"
            value={phone}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
            placeholder="Optional"
          />

          <Input
            label="Address"
            id="address"
            type="text"
            value={address}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddress(e.target.value)}
            placeholder="Your address (optional)"
          />

          <Input
            label="Employee ID (if applicable)"
            id="employeeId"
            type="text"
            value={employeeId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmployeeId(e.target.value)}
            placeholder="Leave blank if you're a customer"
          />

          <Input
            label="Department (if applicable)"
            id="department"
            type="text"
            value={department}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDepartment(e.target.value)}
            placeholder="Leave blank if you're a customer"
          />

          <Input
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
            required
          />

          <Input
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
            required
          />

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
            <p className="font-medium">Note:</p>
            <p>New accounts are created with customer access by default. Contact your administrator to request employee role assignments for internal staff.</p>
          </div>

          <Button
            type="submit"
            variant="primary"
            fullWidth
            isLoading={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
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