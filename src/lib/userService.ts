import { supabase } from './supabase';
import { UserRole } from './supabase';

export interface CreateUserData {
  email: string;
  password: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  employee_id?: string;
  department?: string;
  is_active?: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  employee_id?: string;
  department?: string;
  is_active: boolean;
  created_at: string;
}

// Create a new user (Admin only) - Now uses API route
export async function createUser(userData: CreateUserData): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData)
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to create user' };
    }

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Get all users (Admin only) - Now uses API route
export async function getAllUsers(): Promise<{ success: boolean; users?: UserProfile[]; error?: string }> {
  try {
    const response = await fetch('/api/admin/users');
    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to fetch users' };
    }

    return { success: true, users: result.users || [] };
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Update user profile (Admin only) - Now uses API route
export async function updateUser(userId: string, updates: Partial<CreateUserData>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, updates })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to update user' };
    }

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Toggle user active status (Admin only) - Now uses API route
export async function toggleUserStatus(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    // First get current status from local state or make a call to get current user
    const getUserResponse = await fetch('/api/admin/users');
    const getUserResult = await getUserResponse.json();
    
    if (!getUserResponse.ok) {
      return { success: false, error: 'Failed to get current user status' };
    }

    const currentUser = getUserResult.users?.find((u: UserProfile) => u.id === userId);
    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }

    // Toggle the status
    const newStatus = !currentUser.is_active;
    
    const response = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        userId, 
        updates: { is_active: newStatus }
      })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to toggle user status' };
    }

    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error toggling user status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Delete user (Admin only) - Now uses API route
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Failed to delete user' };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
} 