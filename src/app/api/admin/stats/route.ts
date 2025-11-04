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

    if (profileError || !userProfile || !['admin', 'service_manager'].includes(userProfile.role)) {
      return { error: 'Admin or manager access required', status: 403 };
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

    // Get total counts
    const [
      { count: totalCustomers },
      { count: totalServices },
      { count: totalComplaints },
      { count: totalTechnicians },
      { count: pendingServices },
      { count: completedServices }
    ] = await Promise.all([
      supabaseAdmin.from('customers').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('services').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('role', 'technician'),
      supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('status', 'completed')
    ]);

    // Get recent activity
    const { data: recentServices } = await supabaseAdmin
      .from('services')
      .select(`
        id,
        service_number,
        status,
        created_at,
        customer:customers(business_name)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Get service status distribution
    const { data: serviceStatusData } = await supabaseAdmin
      .from('services')
      .select('status')
      .order('status');

    const statusDistribution = serviceStatusData?.reduce((acc: any, service) => {
      acc[service.status] = (acc[service.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Get monthly service trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyServices } = await supabaseAdmin
      .from('services')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at');

    const monthlyTrends = monthlyServices?.reduce((acc: any, service) => {
      const month = new Date(service.created_at).toISOString().slice(0, 7); // YYYY-MM
      acc[month] = (acc[month] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      overview: {
        totalCustomers: totalCustomers || 0,
        totalServices: totalServices || 0,
        totalComplaints: totalComplaints || 0,
        totalTechnicians: totalTechnicians || 0,
        pendingServices: pendingServices || 0,
        completedServices: completedServices || 0,
        completionRate: totalServices ? Math.round((completedServices || 0) / totalServices * 100) : 0
      },
      recentActivity: recentServices || [],
      statusDistribution,
      monthlyTrends,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch admin statistics' }, { status: 500 });
  }
}