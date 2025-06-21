import { useState, useEffect } from 'react';
import { supabase, UserRole, User as WaterUser } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { useRouter, usePathname } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<WaterUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Fetch user profile from our database
    const fetchUserProfile = async (userId: string): Promise<WaterUser | null> => {
      try {
        console.log('🔍 Fetching profile for user ID:', userId);
        
        // Try to fetch the user profile
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (error) {
          console.error('🔍 Error fetching profile:', error.code, error.message);
          
          // If user doesn't exist in profiles table, try to create one
          if (error.code === 'PGRST116') {
            console.log('🔍 Profile not found, creating new profile...');
            return await createUserProfile(userId);
          }
          return null;
        }
        
        console.log('🔍 Successfully fetched profile:', data?.email);
        return data;
      } catch (error) {
        console.error('🔍 Exception in fetchUserProfile:', error);
        return null;
      }
    };

    // Create user profile if it doesn't exist
    const createUserProfile = async (userId: string): Promise<WaterUser | null> => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) return null;
        
        const newProfile: Partial<WaterUser> = {
          id: authUser.id,
          email: authUser.email || '',
          full_name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
          role: (authUser.user_metadata?.role as UserRole) || 'customer',
          phone: authUser.user_metadata?.phone,
          department: authUser.user_metadata?.department,
          employee_id: authUser.user_metadata?.employee_id,
          address: authUser.user_metadata?.address,
          is_active: true
        };
        
        console.log('🔍 Creating profile for:', newProfile.email);
        
        const { data, error } = await supabase
          .from('users')
          .insert(newProfile)
          .select()
          .single();
        
        if (error) {
          console.error('🔍 Error creating profile:', error.code, error.message);
          return null;
        }
        
        console.log('🔍 Successfully created profile');
        return data;
      } catch (error) {
        console.error('🔍 Exception in createUserProfile:', error);
        return null;
      }
    };

    // Handle refresh token errors and redirect to sign-in
    const handleAuthError = (error: any) => {
      if (error?.message?.includes('refresh_token_not_found') || 
          error?.message?.includes('Invalid refresh token') ||
          error?.message?.includes('AuthSessionMissingError')) {
        console.log('🔄 Refresh token invalid, redirecting to sign-in...');
        
        // Only redirect if not already on auth pages
        const authPages = ['/signin', '/signup', '/reset-password', '/update-password'];
        if (!authPages.some(page => pathname?.startsWith(page))) {
          router.push('/signin');
        }
        return true;
      }
      return false;
    };

    // Get current session and user profile
    const getInitialSession = async () => {
      setLoading(true);
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('🔍 Error getting session:', error);
          if (handleAuthError(error)) {
            setLoading(false);
            return;
          }
        }
        
        console.log('🔍 Session:', !!session, 'User:', !!session?.user);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (error) {
        console.error('🔍 Error in getInitialSession:', error);
        handleAuthError(error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔍 Auth changed:', event, !!session);
        
        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('🔄 Token refresh failed, redirecting to sign-in...');
          const authPages = ['/signin', '/signup', '/reset-password', '/update-password'];
          if (!authPages.some(page => pathname?.startsWith(page))) {
            router.push('/signin');
          }
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  const signUp = async (email: string, password: string, userData?: {
    full_name?: string;
    role?: UserRole;
    phone?: string;
    department?: string;
    employee_id?: string;
    address?: string;
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {}
      }
    });
    
    return { data, error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { data, error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      setUser(null);
      setUserProfile(null);
      setSession(null);
    }
    return { error };
  };

  const resetPassword = async (email: string) => {
    return supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
  };

  const updatePassword = async (newPassword: string) => {
    return supabase.auth.updateUser({
      password: newPassword
    });
  };

  // Role checking functions
  const hasRole = (role: UserRole): boolean => {
    return userProfile?.role === role;
  };

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return userProfile?.role ? roles.includes(userProfile.role) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isManager = (): boolean => {
    return hasAnyRole(['admin', 'dept_head', 'service_manager', 'accounts_manager', 'product_manager', 'driver_manager']);
  };

  const canManageUsers = (): boolean => {
    return hasAnyRole(['admin', 'dept_head']);
  };

  const canManageComplaints = (): boolean => {
    return hasAnyRole(['admin', 'dept_head', 'service_manager', 'technician']);
  };

  const canManageServices = (): boolean => {
    return hasAnyRole(['admin', 'dept_head', 'service_manager', 'technician']);
  };

  const canManageVehicles = (): boolean => {
    return hasAnyRole(['admin', 'dept_head', 'driver_manager']);
  };

  const canViewDashboard = (): boolean => {
    return !!userProfile;
  };

  const updateProfile = async (updates: Partial<WaterUser>) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    setUserProfile(data);
    return data;
  };

  return {
    user,
    userProfile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasRole,
    hasAnyRole,
    isAdmin,
    isManager,
    canManageUsers,
    canManageComplaints,
    canManageServices,
    canManageVehicles,
    canViewDashboard,
  };
}