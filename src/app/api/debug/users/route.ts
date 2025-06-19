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

// GET - Debug users table
export async function GET() {
  try {
    // Get all users from database
    const { data: dbUsers, error: dbError } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (dbError) {
      console.error('Error fetching DB users:', dbError);
    }

    // Get all auth users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
    }

    // Find orphaned records
    const dbUserIds = new Set(dbUsers?.map(u => u.id) || []);
    const authUserIds = new Set(authUsers?.users?.map(u => u.id) || []);
    
    const orphanedDbUsers = dbUsers?.filter(u => !authUserIds.has(u.id)) || [];
    const orphanedAuthUsers = authUsers?.users?.filter(u => !dbUserIds.has(u.id)) || [];

    return NextResponse.json({
      dbUsers: dbUsers || [],
      authUsers: authUsers?.users || [],
      orphanedDbUsers,
      orphanedAuthUsers,
      stats: {
        totalDbUsers: dbUsers?.length || 0,
        totalAuthUsers: authUsers?.users?.length || 0,
        orphanedDb: orphanedDbUsers.length,
        orphanedAuth: orphanedAuthUsers.length
      }
    });

  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 