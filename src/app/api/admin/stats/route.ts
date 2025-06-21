import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client with service role (can perform admin operations)
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
    // Get all users count
    const { count: totalUsers, error: totalError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('Error fetching total users:', totalError);
    }

    // Get active users count
    const { count: activeUsers, error: activeError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (activeError) {
      console.error('Error fetching active users:', activeError);
    }

    // Get staff members count (all roles except customer)
    const { count: staffMembers, error: staffError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .neq('role', 'customer');

    if (staffError) {
      console.error('Error fetching staff members:', staffError);
    }

    // Get customers count
    const { count: customers, error: customersError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'customer');

    if (customersError) {
      console.error('Error fetching customers:', customersError);
    }

    // Get recent complaints count
    const { count: complaints, error: complaintsError } = await supabaseAdmin
      .from('complaints')
      .select('*', { count: 'exact', head: true });

    if (complaintsError) {
      console.error('Error fetching complaints:', complaintsError);
    }

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      staffMembers: staffMembers || 0,
      customers: customers || 0,
      complaints: complaints || 0
    });

  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      totalUsers: 0,
      activeUsers: 0,
      staffMembers: 0,
      customers: 0,
      complaints: 0
    });
  }
} 