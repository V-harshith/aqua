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

// POST - Assign service to technician
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_id, technician_id, notes } = body;

    // Validate required fields
    if (!service_id || !technician_id) {
      return NextResponse.json({ 
        error: 'Service ID and Technician ID are required' 
      }, { status: 400 });
    }

    // Check if service exists and is assignable
    const { data: service, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('id, status, service_number')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (service.status !== 'pending') {
      return NextResponse.json({ 
        error: 'Service is not available for assignment' 
      }, { status: 400 });
    }

    // Check if technician exists
    const { data: technician, error: techError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .eq('id', technician_id)
      .eq('role', 'technician')
      .single();

    if (techError || !technician) {
      return NextResponse.json({ error: 'Technician not found' }, { status: 404 });
    }

    // Assign the service
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('services')
      .update({
        assigned_technician: technician_id,
        status: 'assigned',
        assigned_at: new Date().toISOString(),
        assignment_notes: notes || null
      })
      .eq('id', service_id)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        technician:users!services_assigned_technician_fkey(full_name, email, phone)
      `)
      .single();

    if (updateError) {
      console.error('Error assigning service:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Create notification for technician (optional)
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: technician_id,
          title: 'New Service Assignment',
          message: `You have been assigned service ${service.service_number}`,
          type: 'service_assignment',
          related_id: service_id,
          created_at: new Date().toISOString()
        });
    } catch (notificationError) {
      console.warn('Failed to create notification:', notificationError);
      // Don't fail the assignment if notification fails
    }

    return NextResponse.json({ 
      success: true,
      service: updatedService,
      message: `Service ${service.service_number} assigned to ${technician.full_name}`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get assignment history or available assignments
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'available' or 'history'
    const technicianId = searchParams.get('technician_id');

    if (type === 'available') {
      // Get services available for assignment
      const { data: availableServices, error } = await supabaseAdmin
        .from('services')
        .select(`
          *,
          customer:customers(customer_code, business_name, contact_person, billing_address)
        `)
        .eq('status', 'pending')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching available services:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        services: availableServices || [],
        count: availableServices?.length || 0
      });

    } else if (type === 'history') {
      // Get assignment history
      let query = supabaseAdmin
        .from('services')
        .select(`
          *,
          customer:customers(customer_code, business_name, contact_person),
          technician:users!services_assigned_technician_fkey(full_name, email, phone)
        `)
        .not('assigned_technician', 'is', null)
        .order('assigned_at', { ascending: false });

      // Filter by technician if specified
      if (technicianId) {
        query = query.eq('assigned_technician', technicianId);
      }

      const { data: assignmentHistory, error } = await query;

      if (error) {
        console.error('Error fetching assignment history:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        assignments: assignmentHistory || [],
        count: assignmentHistory?.length || 0
      });

    } else {
      return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Reassign service
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { service_id, new_technician_id, reason } = body;

    // Validate required fields
    if (!service_id || !new_technician_id) {
      return NextResponse.json({ 
        error: 'Service ID and new Technician ID are required' 
      }, { status: 400 });
    }

    // Get current service details
    const { data: currentService, error: serviceError } = await supabaseAdmin
      .from('services')
      .select('*, technician:users!services_assigned_technician_fkey(full_name)')
      .eq('id', service_id)
      .single();

    if (serviceError || !currentService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Check if new technician exists
    const { data: newTechnician, error: techError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role')
      .eq('id', new_technician_id)
      .eq('role', 'technician')
      .single();

    if (techError || !newTechnician) {
      return NextResponse.json({ error: 'New technician not found' }, { status: 404 });
    }

    // Reassign the service
    const { data: updatedService, error: updateError } = await supabaseAdmin
      .from('services')
      .update({
        assigned_technician: new_technician_id,
        assigned_at: new Date().toISOString(),
        reassignment_reason: reason || null,
        status: currentService.status === 'completed' ? 'assigned' : currentService.status
      })
      .eq('id', service_id)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        technician:users!services_assigned_technician_fkey(full_name, email, phone)
      `)
      .single();

    if (updateError) {
      console.error('Error reassigning service:', updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      service: updatedService,
      message: `Service reassigned to ${newTechnician.full_name}`
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}