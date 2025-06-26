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
// GET - List all customers with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const offset = (page - 1) * limit;
    let query = supabaseAdmin
      .from('customers')
      .select(`
        *,
        user:users(full_name, email, phone)
      `, { count: 'exact' });
    // Apply filters
    if (search) {
      query = query.or(`customer_code.ilike.%${search}%,business_name.ilike.%${search}%,contact_person.ilike.%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }
    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });
    const { data, error, count } = await query;
    if (error) {
      console.error('Error fetching customers:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      customers: data,
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
// POST - Create new customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      customer_code,
      business_name,
      contact_person,
      billing_address,
      service_address,
      water_connection_id,
      meter_number,
      status = 'active'
    } = body;
    // Validate required fields
    if (!customer_code || !billing_address) {
      return NextResponse.json({ 
        error: 'Customer code and billing address are required' 
      }, { status: 400 });
    }
    // Generate customer code if not provided
    const finalCustomerCode = customer_code || `CUST${Date.now()}`;
    const { data, error } = await supabaseAdmin
      .from('customers')
      .insert([{
        user_id,
        customer_code: finalCustomerCode,
        business_name,
        contact_person,
        billing_address,
        service_address,
        water_connection_id,
        meter_number,
        status
      }])
      .select(`
        *,
        user:users(full_name, email, phone)
      `)
      .single();
    if (error) {
      console.error('Error creating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ customer: data }, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// PATCH - Update customer
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    const body = await request.json();
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('customers')
      .update(body)
      .eq('id', customerId)
      .select(`
        *,
        user:users(full_name, email, phone)
      `)
      .single();
    if (error) {
      console.error('Error updating customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ customer: data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// DELETE - Delete customer
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('id');
    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID is required' }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from('customers')
      .delete()
      .eq('id', customerId);
    if (error) {
      console.error('Error deleting customer:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 