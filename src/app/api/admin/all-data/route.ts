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

// Verify admin access
async function verifyAdminAccess(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { error: 'Missing or invalid authorization header', status: 401 };
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return { error: 'Invalid token', status: 401 };
    }

    // Check if user has admin role
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !userProfile || userProfile.role !== 'admin') {
      return { error: 'Admin access required', status: 403 };
    }

    return { user, userProfile };
  } catch (error) {
    return { error: 'Authentication failed', status: 500 };
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify admin access
    const authResult = await verifyAdminAccess(request);
    if ('error' in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // Fetch all data in parallel for better performance
    const [
      customersResult,
      servicesResult,
      complaintsResult,
      usersResult,
      serviceTypesResult,
      productsResult,
      techniciansResult
    ] = await Promise.all([
      supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('services').select(`
        *,
        customer:customers(customer_code, business_name, contact_person),
        technician:users!services_assigned_technician_fkey(full_name, email)
      `).order('created_at', { ascending: false }),
      supabaseAdmin.from('complaints').select(`
        *,
        customer:customers(customer_code, business_name, contact_person)
      `).order('created_at', { ascending: false }),
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('service_types').select('*').order('type_name'),
      supabaseAdmin.from('products').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('users').select('*').eq('role', 'technician').order('full_name')
    ]);

    // Check for errors
    const errors = [
      customersResult.error,
      servicesResult.error,
      complaintsResult.error,
      usersResult.error,
      serviceTypesResult.error,
      productsResult.error,
      techniciansResult.error
    ].filter(Boolean);

    if (errors.length > 0) {
      console.error('Database errors:', errors);
      return NextResponse.json({ error: 'Failed to fetch some data' }, { status: 500 });
    }

    // Calculate summary statistics
    const customers = customersResult.data || [];
    const services = servicesResult.data || [];
    const complaints = complaintsResult.data || [];
    const users = usersResult.data || [];
    const serviceTypes = serviceTypesResult.data || [];
    const products = productsResult.data || [];
    const technicians = techniciansResult.data || [];

    const stats = {
      totalCustomers: customers.length,
      totalServices: services.length,
      totalComplaints: complaints.length,
      totalUsers: users.length,
      totalServiceTypes: serviceTypes.length,
      totalProducts: products.length,
      totalTechnicians: technicians.length,
      pendingServices: services.filter(s => s.status === 'pending').length,
      completedServices: services.filter(s => s.status === 'completed').length,
      openComplaints: complaints.filter(c => c.status !== 'resolved').length,
      activeUsers: users.filter(u => u.is_active).length
    };

    return NextResponse.json({
      success: true,
      data: {
        customers,
        services,
        complaints,
        users,
        serviceTypes,
        products,
        technicians
      },
      stats,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

  } catch (error) {
    console.error('Admin all-data API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}