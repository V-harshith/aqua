'use client';
import { createContext, useContext, ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { User, Session } from '@supabase/supabase-js';
import { UserRole, User as WaterUser } from '@/lib/supabase';
type AuthContextType = {
  user: User | null;
  userProfile: WaterUser | null;
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
  updateProfile: (updates: Partial<WaterUser>) => Promise<{
    data?: any;
    error?: any;
  }>;
  // Role checking functions
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isAdmin: () => boolean;
  isManager: () => boolean;
  canManageUsers: () => boolean;
  canManageComplaints: () => boolean;
  canManageServices: () => boolean;
  canManageVehicles: () => boolean;
  canViewDashboard: () => boolean;
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