import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Verify user access (optional for backward compatibility)
async function verifyUserAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      // Return null for no auth (backward compatibility)
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
// Generate service number
async function generateServiceNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  // Get the latest service number for this month
  const { data } = await supabaseAdmin
    .from('services')
    .select('service_number')
    .like('service_number', `SRV${year}${month}%`)
    .order('service_number', { ascending: false })
    .limit(1);
  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].service_number;
    const lastSequence = parseInt(lastNumber.slice(-4));
    sequence = lastSequence + 1;
  }
  return `SRV${year}${month}${String(sequence).padStart(4, '0')}`;
}
// GET - Fetch services
export async function GET(request: NextRequest) {
  try {
    // Verify user access (optional)
    const authResult = await verifyUserAccess(request);
    const { userProfile } = authResult;
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const technicianId = searchParams.get('technician_id');
    const status = searchParams.get('status');
    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .order('created_at', { ascending: false });
    // Apply role-based filtering (if authenticated)
    if (userProfile) {
      if (userProfile.role === 'customer') {
        // For customers, first get their customer record to get the proper customer_id
        const { data: customerRecord } = await supabaseAdmin
          .from('customers')
          .select('id')
          .eq('user_id', userProfile.id)
          .single();

        if (customerRecord) {
          query = query.eq('customer_id', customerRecord.id);
        } else {
          // No customer record found, return empty result
          return NextResponse.json({
            services: [],
            count: 0,
            timestamp: new Date().toISOString()
          });
        }
      } else if (userProfile.role === 'technician') {
        query = query.eq('assigned_technician', userProfile.id);
      }
    }

    // Apply additional filters
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    if (technicianId) {
      query = query.eq('assigned_technician', technicianId);
    }
    if (status) {
      query = query.eq('status', status);
    }
    const { data: services, error } = await query;
    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      services: services || [],
      count: services?.length || 0,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// POST - Create new service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      service_type,
      description,
      scheduled_date,
      estimated_hours,
      complaint_id
    } = body;
    // Validate required fields
    if (!customer_id || !service_type || !description) {
      return NextResponse.json({
        error: 'Customer ID, service type, and description are required'
      }, { status: 400 });
    }
    // Generate service number
    const serviceNumber = `SRV-${Date.now().toString().slice(-6)}`;
    const { data: service, error } = await supabaseAdmin
      .from('services')
      .insert({
        service_number: serviceNumber,
        customer_id,
        service_type,
        description,
        scheduled_date,
        estimated_hours,
        complaint_id,
        status: 'pending'
      })
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();
    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      service,
      message: 'Service created successfully'
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// PATCH - Update service
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');
    const body = await request.json();
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }
    // If status is being changed to completed, add completed_date timestamp
    if (body.status === 'completed' && !body.completed_date) {
      body.completed_date = new Date().toISOString();
    }
    // If assigning technician, update status to assigned
    if (body.assigned_technician && !body.status) {
      body.status = 'assigned';
    }
    const { data, error } = await supabaseAdmin
      .from('services')
      .update(body)
      .eq('id', serviceId)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();
    if (error) {
      console.error('Error updating service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ service: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// DELETE - Delete service
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const serviceId = searchParams.get('id');
    if (!serviceId) {
      return NextResponse.json({ error: 'Service ID is required' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('services')
      .delete()
      .eq('id', serviceId);
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