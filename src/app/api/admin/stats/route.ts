import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// GET - Fetch admin dashboard statistics
export async function GET() {
  try {
    // Get user statistics
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('role, is_active, created_at');

    if (usersError) {
      console.error('Error fetching users for stats:', usersError);
      return NextResponse.json({ error: usersError.message }, { status: 500 });
    }

    // Calculate statistics
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    // User stats
    const totalUsers = users?.length || 0;
    const activeUsers = users?.filter(user => user.is_active).length || 0;
    const customersCount = users?.filter(user => user.role === 'customer').length || 0;
    const staffCount = users?.filter(user => user.role !== 'customer').length || 0;
    
    // New users this month
    const newUsersThisMonth = users?.filter(user => 
      new Date(user.created_at) > lastMonth
    ).length || 0;

    // Calculate growth percentage (simplified)
    const userGrowthPercentage = totalUsers > 0 ? Math.round((newUsersThisMonth / totalUsers) * 100) : 0;

    // Role breakdown
    const roleBreakdown = users?.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const stats = {
      totalUsers,
      activeUsers,
      customersCount,
      staffCount,
      openComplaints: 0, // Will be implemented when complaints system is added
      userGrowthPercentage,
      roleBreakdown,
      lastUpdated: now.toISOString()
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error('Unexpected error fetching admin stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 