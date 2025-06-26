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
    const { service_id, technician_id } = body;

    // Validate required fields
    if (!service_id || !technician_id) {
      return NextResponse.json({ 
        error: 'Service ID and technician ID are required' 
      }, { status: 400 });
    }

    // Update the service with assigned technician
    const { data, error } = await supabaseAdmin
      .from('services')
      .update({ 
        assigned_technician: technician_id,
        status: 'assigned'
      })
      .eq('id', service_id)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();

    if (error) {
      console.error('Error assigning service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      service: data,
      message: 'Service assigned successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - Get available technicians
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date'); // Optional: filter by availability on specific date

    // Get all active technicians
    const { data: technicians, error } = await supabaseAdmin
      .from('users')
      .select(`
        id,
        full_name,
        email,
        phone,
        department
      `)
      .eq('role', 'technician')
      .eq('is_active', true)
      .order('full_name');

    if (error) {
      console.error('Error fetching technicians:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If date is provided, check their workload for that date
    if (date) {
      const technicianWorkload = await Promise.all(
        technicians.map(async (tech) => {
          const { data: services } = await supabaseAdmin
            .from('services')
            .select('id, estimated_hours')
            .eq('assigned_technician', tech.id)
            .gte('scheduled_date', `${date}T00:00:00`)
            .lt('scheduled_date', `${date}T23:59:59`)
            .in('status', ['assigned', 'in_progress']);

          const totalHours = services?.reduce((sum, service) => 
            sum + (service.estimated_hours || 0), 0) || 0;

          return {
            ...tech,
            scheduled_hours: totalHours,
            availability: totalHours < 8 ? 'available' : 'busy' // Assuming 8-hour workday
          };
        })
      );

      return NextResponse.json({ technicians: technicianWorkload });
    }

    return NextResponse.json({ technicians });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Reassign service to different technician
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      service_id,
      new_technician_id,
      reason
    } = body;

    // Validate required fields
    if (!service_id || !new_technician_id) {
      return NextResponse.json({ 
        error: 'Service ID and new Technician ID are required' 
      }, { status: 400 });
    }

    // Check if new technician exists and is active
    const { data: technician, error: techError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, role, is_active')
      .eq('id', new_technician_id)
      .single();

    if (techError || !technician) {
      return NextResponse.json({ 
        error: 'New technician not found' 
      }, { status: 404 });
    }

    if (!technician.is_active || technician.role !== 'technician') {
      return NextResponse.json({ 
        error: 'Invalid technician or technician is not active' 
      }, { status: 400 });
    }

    // Update service with new assignment
    const updateData: any = {
      assigned_technician: new_technician_id,
      status: 'assigned' // Reset to assigned status
    };

    if (reason) {
      // Append reassignment note to service notes
      const { data: currentService } = await supabaseAdmin
        .from('services')
        .select('service_notes')
        .eq('id', service_id)
        .single();

      const existingNotes = currentService?.service_notes || '';
      const reassignmentNote = `\n[${new Date().toISOString()}] Reassigned to ${technician.full_name}. Reason: ${reason}`;
      updateData.service_notes = existingNotes + reassignmentNote;
    }

    const { data, error } = await supabaseAdmin
      .from('services')
      .update(updateData)
      .eq('id', service_id)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();

    if (error) {
      console.error('Error reassigning technician:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Service reassigned successfully',
      service: data 
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 