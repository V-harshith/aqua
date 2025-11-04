import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

// Verify admin access
async function verifyAdminAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user, userProfile };
  } catch (error) {
    return { error: 'Authentication failed', status: 500 };
  }
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply role filter if specified
    if (role && role !== 'all') {
      query = query.eq('role', role);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      users: users || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const body = await request.json();
    const {
      email,
      password,
      full_name,
      phone,
      role = 'customer',
      status = 'active'
    } = body;

    // Validate required fields
    if (!email || !password || !full_name) {
      return NextResponse.json({ 
        error: 'Email, password, and full name are required' 
      }, { status: 400 });
    }

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role
      }
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    // Create user profile in users table
    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email,
        full_name,
        phone,
        role,
        status,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (profileError) {
      console.error('User profile creation error:', profileError);
      // Try to clean up auth user if profile creation failed
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user,
      message: 'User created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    const body = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { password, ...profileData } = body;

    // Update auth user if password is provided
    if (password) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
        userId,
        { password }
      );

      if (authError) {
        console.error('Auth update error:', authError);
        return NextResponse.json({ error: authError.message }, { status: 500 });
      }
    }

    // Update user profile
    const { data: user, error: profileError } = await supabaseAdmin
      .from('users')
      .update(profileData)
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      console.error('Profile update error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      user,
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Delete from users table first
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Profile deletion error:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Auth deletion error:', authError);
      // Profile is already deleted, but log the auth error
      console.warn('Auth user deletion failed, but profile was deleted');
    }

    return NextResponse.json({ 
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}