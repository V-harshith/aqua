import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notification_ids, mark_all = false } = body;

    let query = supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', user.id);

    if (mark_all) {
      // Mark all unread notifications as read
      query = query.eq('is_read', false);
    } else if (notification_ids && Array.isArray(notification_ids)) {
      // Mark specific notifications as read
      query = query.in('id', notification_ids);
    } else {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    const { data: notifications, error } = await query.select();

    if (error) {
      console.error('Error marking notifications as read:', error);
      return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Notifications marked as read',
      updated_count: notifications?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}