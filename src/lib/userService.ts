import { supabase } from './supabase';
import { UserRole } from './supabase';
import { authenticatedGet, authenticatedPost, authenticatedPatch, authenticatedDelete } from './auth-client';
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
    const result = await authenticatedPost('/api/admin/users', userData);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
// Get all users (Admin only) - Now uses API route
export async function getAllUsers(): Promise<{ success: boolean; users?: UserProfile[]; error?: string }> {
  try {
    const result = await authenticatedGet('/api/admin/users');
    return { success: true, users: result.users || [] };
  } catch (error) {
    console.error('Unexpected error fetching users:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
// Update user profile (Admin only) - Now uses API route
export async function updateUser(userId: string, updates: Partial<CreateUserData>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    const result = await authenticatedPatch(`/api/admin/users?id=${userId}`, updates);
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
// Toggle user active status (Admin only) - Now uses API route
export async function toggleUserStatus(userId: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
  try {
    // First get current status
    const getUserResult = await authenticatedGet('/api/admin/users');
    const currentUser = getUserResult.users?.find((u: UserProfile) => u.id === userId);
    if (!currentUser) {
      return { success: false, error: 'User not found' };
    }
    // Toggle the status
    const newStatus = !currentUser.is_active;
    const result = await authenticatedPatch(`/api/admin/users?id=${userId}`, { is_active: newStatus });
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Unexpected error toggling user status:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
// Delete user (Admin only) - Now uses API route
export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await authenticatedDelete(`/api/admin/users?id=${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
} 