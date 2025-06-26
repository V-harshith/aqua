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

// Generate complaint number
async function generateComplaintNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  
  // Get the latest complaint number for this month
  const { data } = await supabaseAdmin
    .from('complaints')
    .select('complaint_number')
    .like('complaint_number', `CMP${year}${month}%`)
    .order('complaint_number', { ascending: false })
    .limit(1);

  let sequence = 1;
  if (data && data.length > 0) {
    const lastNumber = data[0].complaint_number;
    const lastSequence = parseInt(lastNumber.slice(-4));
    sequence = lastSequence + 1;
  }

  return `CMP${year}${month}${String(sequence).padStart(4, '0')}`;
}

// GET - Fetch complaints
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const assignedTo = searchParams.get('assigned_to');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');

    let query = supabaseAdmin
      .from('complaints')
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person, billing_address),
        assigned_user:users!complaints_assigned_to_fkey(full_name, email, phone)
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (customerId) {
      query = query.eq('customer_id', customerId);
    }
    
    if (assignedTo) {
      query = query.eq('assigned_to', assignedTo);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (priority) {
      query = query.eq('priority', priority);
    }

    const { data: complaints, error } = await query;

    if (error) {
      console.error('Error fetching complaints:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Fetched ${complaints?.length || 0} complaints`);

    return NextResponse.json({ 
      complaints: complaints || [],
      count: complaints?.length || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      customer_id,
      title,
      description,
      category,
      priority = 'medium',
      location,
      reported_by
    } = body;

    // Validate required fields
    if (!customer_id || !title || !description) {
      return NextResponse.json({ 
        error: 'Customer ID, title, and description are required' 
      }, { status: 400 });
    }

    // Generate complaint number
    const complaintNumber = `CMP-${Date.now().toString().slice(-6)}`;

    const { data: complaint, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        complaint_number: complaintNumber,
        customer_id,
        title,
        description,
        category: category || 'general',
        priority,
        location,
        reported_by,
        status: 'open'
      })
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person)
      `)
      .single();

    if (error) {
      console.error('Error creating complaint:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log(`✅ Created complaint: ${complaintNumber}`);

    return NextResponse.json({ 
      success: true,
      complaint,
      message: 'Complaint created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update complaint
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const complaintId = searchParams.get('id');
    const body = await request.json();

    if (!complaintId) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    // If status is being changed to resolved, add resolved_at timestamp
    if (body.status === 'resolved' && !body.resolved_at) {
      body.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .update(body)
      .eq('id', complaintId)
      .select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        assigned_technician:users!complaints_assigned_to_fkey(full_name, email),
        reporter:users!complaints_reported_by_fkey(full_name, email)
      `)
      .single();

    if (error) {
      console.error('Error updating complaint:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ complaint: data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete complaint
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const complaintId = searchParams.get('id');

    if (!complaintId) {
      return NextResponse.json({ error: 'Complaint ID is required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('complaints')
      .delete()
      .eq('id', complaintId);

    if (error) {
      console.error('Error deleting complaint:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Complaint deleted successfully' });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 