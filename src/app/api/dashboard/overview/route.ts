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

    // Get overview data based on user role
    let overviewData = {};

    if (role === 'admin' || role === 'service_manager') {
      // Admin/Manager overview
      const [
        servicesResult,
        complaintsResult,
        customersResult,
        techniciansResult
      ] = await Promise.all([
        supabaseAdmin.from('services').select('status, priority, created_at'),
        supabaseAdmin.from('complaints').select('status, priority, created_at'),
        supabaseAdmin.from('customers').select('created_at'),
        supabaseAdmin.from('users').select('created_at').eq('role', 'technician')
      ]);

      const services = servicesResult.data || [];
      const complaints = complaintsResult.data || [];
      const customers = customersResult.data || [];
      const technicians = techniciansResult.data || [];

      // Service status breakdown
      const serviceStatusBreakdown = services.reduce((acc: any, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      }, {});

      // Priority breakdown
      const priorityBreakdown = services.reduce((acc: any, service) => {
        acc[service.priority] = (acc[service.priority] || 0) + 1;
        return acc;
      }, {});

      // Recent trends (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentServices = services.filter(s => new Date(s.created_at) >= thirtyDaysAgo);
      const recentComplaints = complaints.filter(c => new Date(c.created_at) >= thirtyDaysAgo);

      overviewData = {
        totals: {
          services: services.length,
          complaints: complaints.length,
          customers: customers.length,
          technicians: technicians.length
        },
        serviceStatusBreakdown,
        priorityBreakdown,
        recentTrends: {
          newServices: recentServices.length,
          newComplaints: recentComplaints.length,
          period: '30 days'
        }
      };

    } else if (role === 'technician' && userId) {
      // Technician overview
      const [
        assignedServicesResult,
        completedServicesResult
      ] = await Promise.all([
        supabaseAdmin.from('services').select('*').eq('assigned_technician', userId),
        supabaseAdmin.from('services').select('*').eq('assigned_technician', userId).eq('status', 'completed')
      ]);

      const assignedServices = assignedServicesResult.data || [];
      const completedServices = completedServicesResult.data || [];

      // Status breakdown for technician's services
      const myServiceStatusBreakdown = assignedServices.reduce((acc: any, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      }, {});

      overviewData = {
        totals: {
          assignedServices: assignedServices.length,
          completedServices: completedServices.length,
          pendingServices: assignedServices.filter(s => s.status === 'pending').length,
          inProgressServices: assignedServices.filter(s => s.status === 'in_progress').length
        },
        myServiceStatusBreakdown,
        completionRate: assignedServices.length > 0 
          ? Math.round((completedServices.length / assignedServices.length) * 100) 
          : 0
      };

    } else if (role === 'customer' && userId) {
      // Customer overview
      const [
        myServicesResult,
        myComplaintsResult
      ] = await Promise.all([
        supabaseAdmin.from('services').select('*').eq('customer_id', userId),
        supabaseAdmin.from('complaints').select('*').eq('customer_id', userId)
      ]);

      const myServices = myServicesResult.data || [];
      const myComplaints = myComplaintsResult.data || [];

      // Status breakdown for customer's services
      const myServiceStatusBreakdown = myServices.reduce((acc: any, service) => {
        acc[service.status] = (acc[service.status] || 0) + 1;
        return acc;
      }, {});

      overviewData = {
        totals: {
          myServices: myServices.length,
          myComplaints: myComplaints.length,
          activeServices: myServices.filter(s => ['pending', 'assigned', 'in_progress'].includes(s.status)).length,
          completedServices: myServices.filter(s => s.status === 'completed').length
        },
        myServiceStatusBreakdown
      };
    }

    // Get recent activity
    const { data: recentActivity } = await supabaseAdmin
      .from('services')
      .select(`
        id,
        service_number,
        status,
        created_at,
        customer:customers(business_name),
        technician:users!services_assigned_technician_fkey(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      overview: overviewData,
      recentActivity: recentActivity || [],
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard overview' }, { status: 500 });
  }
}