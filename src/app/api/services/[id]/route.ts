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

// Verify user access (optional for backward compatibility)
async function verifyUserAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { user: null, userProfile: null };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { user: null, userProfile: null };
    }

    // Get user profile
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile) {
      return { user: null, userProfile: null };
    }

    return { user, userProfile };
  } catch (error) {
    return { user: null, userProfile: null };
  }
}

// GET - Fetch single service
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify user access (optional)
    const authResult = await verifyUserAccess(request);
    const { userProfile } = authResult;

    const { id } = await params;
    
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(id, full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if user has permission to view this service
    if (userProfile) {
      const canView = 
        userProfile.role === 'admin' ||
        userProfile.role === 'service_manager' ||
        (userProfile.role === 'customer' && service.customer_id === userProfile.id) ||
        (userProfile.role === 'technician' && service.assigned_technician === userProfile.id);

      if (!canView) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      service,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update service
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify user access
    const authResult = await verifyUserAccess(request);
    const { userProfile } = authResult;

    if (!userProfile) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    // Get current service to check permissions
    const { data: currentService, error: fetchError } = await supabaseAdmin
      .from('services')
      .select('customer_id, assigned_technician')
      .eq('id', id)
      .single();

    if (fetchError || !currentService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check permissions
    const canEdit = 
      userProfile.role === 'admin' ||
      userProfile.role === 'service_manager' ||
      (userProfile.role === 'technician' && currentService.assigned_technician === userProfile.id);

    if (!canEdit) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: any = {};
    
    // Only allow certain fields to be updated based on role
    if (['admin', 'service_manager'].includes(userProfile.role)) {
      // Admins and service managers can update everything
      if (body.service_type) updateData.service_type = body.service_type;
      if (body.description) updateData.description = body.description;
      if (body.priority) updateData.priority = body.priority;
      if (body.status) updateData.status = body.status;
      if (body.scheduled_date) updateData.scheduled_date = body.scheduled_date;
      if (body.estimated_hours) updateData.estimated_hours = body.estimated_hours;
      if (body.assigned_technician !== undefined) updateData.assigned_technician = body.assigned_technician;
    } else if (userProfile.role === 'technician') {
      // Technicians can only update status and actual hours
      if (body.status && ['assigned', 'in_progress', 'completed'].includes(body.status)) {
        updateData.status = body.status;
      }
      if (body.actual_hours) updateData.actual_hours = body.actual_hours;
    }

    // Add completion timestamp if status is being set to completed
    if (updateData.status === 'completed' && !body.completed_date) {
      updateData.completed_date = new Date().toISOString();
    }

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(id, full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      service: updatedService,
      message: 'Service updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete service (admin only)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Verify user access
    const authResult = await verifyUserAccess(request);
    const { userProfile } = authResult;

    if (!userProfile || userProfile.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Service deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}