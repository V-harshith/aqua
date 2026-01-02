import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Read token from Authorization header and validate user
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data: notifications, error } = await query;

    if (error) {
      // If table missing or query fails, return safe empty result (graceful bypass)
      console.warn('Notifications query failed (table may not exist):', error.message);
      return NextResponse.json({ notifications: [], unreadCount: 0 });
    }

    const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0;
    return NextResponse.json({ notifications, unreadCount });
  } catch (error) {
    // Graceful fallback on any unexpected failure
    console.error('Unexpected notifications error:', error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();
    
    // Validate user from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin or service manager
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userError || !userData || !['admin', 'service_manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, title, message, type, related_id, action_url } = body;

    if (!user_id || !title || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id,
        title,
        message,
        type: type || 'info',
        related_id,
        action_url
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}