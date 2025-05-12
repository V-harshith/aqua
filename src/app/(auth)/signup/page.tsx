import SignUpForm from '@/components/auth/SignUpForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign Up',
  description: 'Create a new account',
};

export default function SignUpPage() {
  return <SignUpForm />;
}