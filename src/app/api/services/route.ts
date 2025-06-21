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

// GET - List all services with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const service_type = searchParams.get('service_type') || '';
    const assigned_technician = searchParams.get('assigned_technician') || '';
    const customer_id = searchParams.get('customer_id') || '';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('services')
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `, { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`service_number.ilike.%${search}%,description.ilike.%${search}%,service_type.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (service_type) {
      query = query.eq('service_type', service_type);
    }

    if (assigned_technician) {
      query = query.eq('assigned_technician', assigned_technician);
    }

    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      services: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new service request
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      customer_id,
      complaint_id,
      service_type,
      description,
      scheduled_date,
      estimated_hours,
      assigned_technician
    } = body;

    // Validate required fields
    if (!customer_id || !service_type || !description) {
      return NextResponse.json({ 
        error: 'Customer ID, service type, and description are required' 
      }, { status: 400 });
    }

    // Generate service number
    const service_number = await generateServiceNumber();

    const serviceData: any = {
      service_number,
      customer_id,
      service_type,
      description,
      status: assigned_technician ? 'assigned' : 'pending',
      estimated_hours
    };

    if (complaint_id) serviceData.complaint_id = complaint_id;
    if (scheduled_date) serviceData.scheduled_date = scheduled_date;
    if (assigned_technician) serviceData.assigned_technician = assigned_technician;

    const { data, error } = await supabaseAdmin
      .from('services')
      .insert([serviceData])
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        technician:users!services_assigned_technician_fkey(full_name, email, phone),
        complaint:complaints(complaint_number, title, priority)
      `)
      .single();

    if (error) {
      console.error('Error creating service:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ service: data }, { status: 201 });

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