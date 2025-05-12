'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{
    data: any;
    error: any;
  }>;
  signIn: (email: string, password: string) => Promise<{
    data: any;
    error: any;
  }>;
  signOut: () => Promise<{
    error: any;
  }>;
  resetPassword: (email: string) => Promise<{
    data: any;
    error: any;
  }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}