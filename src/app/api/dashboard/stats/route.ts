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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const role = searchParams.get('role');

    // Base stats for all users
    const baseStats = await Promise.all([
      supabaseAdmin.from('services').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('customers').select('*', { count: 'exact', head: true })
    ]);

    const [
      { count: totalServices },
      { count: totalComplaints },
      { count: totalCustomers }
    ] = baseStats;

    let userSpecificStats = {};

    // Role-specific stats
    switch (role) {
      case 'technician':
        if (userId) {
          const [
            { count: assignedServices },
            { count: completedServices },
            { count: pendingServices }
          ] = await Promise.all([
            supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('assigned_technician', userId),
            supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('assigned_technician', userId).eq('status', 'completed'),
            supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('assigned_technician', userId).eq('status', 'pending')
          ]);

          userSpecificStats = {
            assignedServices: assignedServices || 0,
            completedServices: completedServices || 0,
            pendingServices: pendingServices || 0,
            completionRate: assignedServices ? Math.round((completedServices || 0) / assignedServices * 100) : 0
          };
        }
        break;

      case 'customer':
        if (userId) {
          const [
            { count: myServices },
            { count: myComplaints },
            { count: activeServices }
          ] = await Promise.all([
            supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('customer_id', userId),
            supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('customer_id', userId),
            supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('customer_id', userId).in('status', ['pending', 'assigned', 'in_progress'])
          ]);

          userSpecificStats = {
            myServices: myServices || 0,
            myComplaints: myComplaints || 0,
            activeServices: activeServices || 0
          };
        }
        break;

      case 'admin':
      case 'service_manager':
        const [
          { count: pendingServices },
          { count: completedServices },
          { count: urgentServices }
        ] = await Promise.all([
          supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
          supabaseAdmin.from('services').select('*', { count: 'exact', head: true }).eq('priority', 'urgent')
        ]);

        userSpecificStats = {
          pendingServices: pendingServices || 0,
          completedServices: completedServices || 0,
          urgentServices: urgentServices || 0,
          completionRate: totalServices ? Math.round((completedServices || 0) / totalServices * 100) : 0
        };
        break;
    }

    // Get recent activity based on role
    let recentActivity = [];
    
    if (role === 'technician' && userId) {
      const { data } = await supabaseAdmin
        .from('services')
        .select(`
          id,
          service_number,
          status,
          created_at,
          customer:customers(business_name)
        `)
        .eq('assigned_technician', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      recentActivity = data || [];
    } else if (role === 'customer' && userId) {
      const { data } = await supabaseAdmin
        .from('services')
        .select(`
          id,
          service_number,
          status,
          created_at,
          service_type
        `)
        .eq('customer_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      recentActivity = data || [];
    } else {
      const { data } = await supabaseAdmin
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
      recentActivity = data || [];
    }

    return NextResponse.json({
      overview: {
        totalServices: totalServices || 0,
        totalComplaints: totalComplaints || 0,
        totalCustomers: totalCustomers || 0,
        ...userSpecificStats
      },
      recentActivity,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard statistics' }, { status: 500 });
  }
}