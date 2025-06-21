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
    const role = searchParams.get('role') || 'customer';
    const userId = searchParams.get('user_id');
    const timeframe = searchParams.get('timeframe') || 'week'; // week, month, year

    // Calculate date ranges
    const now = new Date();
    const startDate = new Date();
    
    switch (timeframe) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const stats: any = {};

    // Common stats for all roles
    const [
      totalCustomers,
      totalComplaints,
      totalServices,
      totalProducts,
      totalUsers
    ] = await Promise.all([
      supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('complaints').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('services').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('products').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true })
    ]);

    // Recent activity (complaints and services in the timeframe)
    const [recentComplaints, recentServices] = await Promise.all([
      supabaseAdmin
        .from('complaints')
        .select('status')
        .gte('created_at', startDate.toISOString()),
      supabaseAdmin
        .from('services')
        .select('status')
        .gte('created_at', startDate.toISOString())
    ]);

    // Base stats
    stats.totals = {
      customers: totalCustomers.count || 0,
      complaints: totalComplaints.count || 0,
      services: totalServices.count || 0,
      products: totalProducts.count || 0,
      users: totalUsers.count || 0
    };

    // Recent activity stats
    stats.recent_complaints = {
      total: recentComplaints.data?.length || 0,
      open: recentComplaints.data?.filter(c => c.status === 'open').length || 0,
      in_progress: recentComplaints.data?.filter(c => c.status === 'in_progress').length || 0,
      resolved: recentComplaints.data?.filter(c => c.status === 'resolved').length || 0,
      closed: recentComplaints.data?.filter(c => c.status === 'closed').length || 0
    };

    stats.recent_services = {
      total: recentServices.data?.length || 0,
      pending: recentServices.data?.filter(s => s.status === 'pending').length || 0,
      assigned: recentServices.data?.filter(s => s.status === 'assigned').length || 0,
      in_progress: recentServices.data?.filter(s => s.status === 'in_progress').length || 0,
      completed: recentServices.data?.filter(s => s.status === 'completed').length || 0
    };

    // Role-specific stats
    switch (role) {
      case 'admin':
      case 'dept_head':
        // Admin/Department Head stats
        const [usersByRole, complaintsThisMonth, servicesThisMonth] = await Promise.all([
          supabaseAdmin.from('users').select('role'),
          supabaseAdmin
            .from('complaints')
            .select('created_at, priority')
            .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString()),
          supabaseAdmin
            .from('services')
            .select('created_at, status')
            .gte('created_at', new Date(now.getFullYear(), now.getMonth(), 1).toISOString())
        ]);

        stats.users_by_role = usersByRole.data?.reduce((acc: any, user: any) => {
          acc[user.role] = (acc[user.role] || 0) + 1;
          return acc;
        }, {}) || {};

        stats.this_month = {
          complaints: complaintsThisMonth.data?.length || 0,
          high_priority_complaints: complaintsThisMonth.data?.filter(c => ['high', 'critical'].includes(c.priority)).length || 0,
          services: servicesThisMonth.data?.length || 0,
          completed_services: servicesThisMonth.data?.filter(s => s.status === 'completed').length || 0
        };
        break;

      case 'service_manager':
        // Service Manager stats
        const [pendingServices, assignedServices, technicians] = await Promise.all([
          supabaseAdmin
            .from('services')
            .select('id')
            .eq('status', 'pending'),
          supabaseAdmin
            .from('services')
            .select('assigned_technician')
            .eq('status', 'assigned'),
          supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'technician')
            .eq('is_active', true)
        ]);

        stats.services = {
          pending_assignment: pendingServices.data?.length || 0,
          assigned: assignedServices.data?.length || 0,
          available_technicians: technicians.data?.length || 0
        };
        break;

      case 'technician':
        // Technician stats - services assigned to them
        if (userId) {
          const [myServices, myCompletedToday] = await Promise.all([
            supabaseAdmin
              .from('services')
              .select('status, scheduled_date')
              .eq('assigned_technician', userId),
            supabaseAdmin
              .from('services')
              .select('id')
              .eq('assigned_technician', userId)
              .eq('status', 'completed')
              .gte('completed_date', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString())
          ]);

          stats.my_services = {
            total: myServices.data?.length || 0,
            pending: myServices.data?.filter(s => s.status === 'assigned').length || 0,
            in_progress: myServices.data?.filter(s => s.status === 'in_progress').length || 0,
            scheduled_today: myServices.data?.filter(s => {
              const serviceDate = new Date(s.scheduled_date || '');
              return serviceDate.toDateString() === now.toDateString();
            }).length || 0,
            completed_today: myCompletedToday.data?.length || 0
          };
        }
        break;

      case 'customer':
        // Customer stats - their own data
        if (userId) {
          const [customer] = await Promise.all([
            supabaseAdmin
              .from('customers')
              .select('id')
              .eq('user_id', userId)
              .single()
          ]);

          if (customer.data) {
            const [myComplaints, myServices] = await Promise.all([
              supabaseAdmin
                .from('complaints')
                .select('status, created_at')
                .eq('customer_id', customer.data.id),
              supabaseAdmin
                .from('services')
                .select('status, created_at')
                .eq('customer_id', customer.data.id)
            ]);

            stats.my_data = {
              complaints: {
                total: myComplaints.data?.length || 0,
                open: myComplaints.data?.filter(c => c.status === 'open').length || 0,
                resolved: myComplaints.data?.filter(c => c.status === 'resolved').length || 0
              },
              services: {
                total: myServices.data?.length || 0,
                pending: myServices.data?.filter(s => ['pending', 'assigned'].includes(s.status)).length || 0,
                completed: myServices.data?.filter(s => s.status === 'completed').length || 0
              }
            };
          }
        }
        break;

      case 'product_manager':
        // Product Manager stats
        const [activeProducts, productCategories] = await Promise.all([
          supabaseAdmin
            .from('products')
            .select('category, is_active'),
          supabaseAdmin
            .from('products')
            .select('category')
        ]);

        stats.products = {
          active: activeProducts.data?.filter(p => p.is_active).length || 0,
          inactive: activeProducts.data?.filter(p => !p.is_active).length || 0,
          by_category: productCategories.data?.reduce((acc: any, product: any) => {
            acc[product.category] = (acc[product.category] || 0) + 1;
            return acc;
          }, {}) || {}
        };
        break;

      case 'accounts_manager':
        // Accounts Manager stats - could include billing data when implemented
        stats.accounts = {
          active_customers: stats.totals.customers,
          pending_bills: 0, // TODO: Implement when billing module is added
          collected_this_month: 0 // TODO: Implement when billing module is added
        };
        break;
    }

    // Performance metrics
    stats.performance = {
      complaint_resolution_rate: stats.recent_complaints.total > 0 
        ? Math.round((stats.recent_complaints.resolved / stats.recent_complaints.total) * 100)
        : 0,
      service_completion_rate: stats.recent_services.total > 0 
        ? Math.round((stats.recent_services.completed / stats.recent_services.total) * 100)
        : 0,
      customer_satisfaction: 85 // TODO: Implement when feedback system is added
    };

    stats.timeframe = timeframe;
    stats.generated_at = new Date().toISOString();

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Error generating dashboard stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 