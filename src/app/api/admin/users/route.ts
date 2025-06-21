import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Check if required environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL environment variable is not set');
}

if (!serviceRoleKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
}

// Server-side Supabase client with service role (can perform admin operations)
const supabaseAdmin = supabaseUrl && serviceRoleKey ? createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;

// GET - Fetch all users
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error. Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are set.' 
      }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact administrator.' 
      }, { status: 500 });
    }

    const { email, password, full_name, role, phone, department, is_active } = await request.json();

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    console.log('Creating user:', { email, full_name, role });

    // Check if user already exists by email in both auth and users table
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin.listUsers();
    const emailExistsInAuth = existingAuthUser?.users?.some(u => u.email === email);
    
    if (emailExistsInAuth) {
      console.log('Auth user already exists with email:', email);
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      console.log('User already exists in users table with email:', email);
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 400 });
    }

    // Create user in Supabase Auth with complete metadata
    // The database trigger will automatically create the profile
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
        phone: phone || null,
        department: department || null,
        is_active: is_active ?? true
      }
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    console.log('Auth user created with ID:', authData.user.id);

    // Wait a moment for the trigger to execute, then fetch the created profile
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('Profile not found after trigger execution:', profileError);
      
      // If profile doesn't exist, create it manually as fallback
      const { data: manualProfile, error: manualError } = await supabaseAdmin
        .from('users')
        .insert([
          {
            id: authData.user.id,
            email,
            full_name,
            role,
            phone: phone || null,
            department: department || null,
            is_active: is_active ?? true
          }
        ])
        .select()
        .single();

      if (manualError) {
        console.error('Manual profile creation failed:', manualError);
        // Cleanup: Delete the auth user if profile creation failed
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
        return NextResponse.json({ error: 'Failed to create user profile. Please try again.' }, { status: 500 });
      }

      console.log('Manual profile created as fallback:', manualProfile.id);
      return NextResponse.json({ 
        user: {
          id: authData.user.id,
          email: authData.user.email,
          ...manualProfile
        }
      });
    }

    console.log('User profile created by trigger:', profileData.id);

    return NextResponse.json({ 
      user: {
        id: authData.user.id,
        email: authData.user.email,
        ...profileData
      }
    });

  } catch (error) {
    console.error('Unexpected error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update user status
export async function PATCH(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact administrator.' 
      }, { status: 500 });
    }

    const { userId, updates } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ user: data });

  } catch (error) {
    console.error('Unexpected error updating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Server configuration error. Please contact administrator.' 
      }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Step 1: Delete from users table (profile)
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    // Step 2: Delete from auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting auth user:', authError);
      // Note: We don't return error here as profile is already deleted
    }

    return NextResponse.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Unexpected error deleting user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}