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
    const dashboardType = searchParams.get('type') || 'admin';
    const userId = searchParams.get('userId');
    let stats = {};
    let activities = [];
    switch (dashboardType) {
      case 'admin':
        stats = await getAdminStats();
        activities = await getAdminActivities();
        break;
      case 'product_manager':
        stats = await getProductManagerStats();
        activities = await getProductActivities();
        break;
      case 'service_manager':
        stats = await getServiceManagerStats();
        activities = await getServiceActivities();
        break;
      case 'technician':
        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        stats = await getTechnicianStats(userId);
        activities = await getTechnicianActivities(userId);
        break;
      case 'customer':
        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        stats = await getCustomerStats(userId);
        activities = await getCustomerActivities(userId);
        break;
      case 'driver_manager':
        if (!userId) return NextResponse.json({ error: 'User ID required' }, { status: 400 });
        stats = await getDriverStats(userId);
        activities = await getDriverActivities(userId);
        break;
      default:
        return NextResponse.json({ error: 'Invalid dashboard type' }, { status: 400 });
    }
    return NextResponse.json({
      success: true,
      data: {
        stats,
        activities,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch dashboard data'
    }, { status: 500 });
  }
}
async function getAdminStats() {
  const [
    totalUsers,
    activeUsers,
    openComplaints
  ] = await Promise.all([
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).in('status', ['open', 'assigned'])
  ]);
  return {
    totalUsers: totalUsers.count || 0,
    activeUsers: activeUsers.count || 0,
    openComplaints: openComplaints.count || 0,
    monthlyRevenue: 125000
  };
}
async function getProductManagerStats() {
  return {
    totalProducts: 45,
    activeProducts: 42,
    lowStockProducts: 8,
    outOfStockProducts: 3
  };
}
async function getServiceManagerStats() {
  const [
    totalComplaints,
    openComplaints
  ] = await Promise.all([
    supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }),
    supabaseAdmin.from('complaints').select('*', { count: 'exact', head: true }).eq('status', 'open')
  ]);
  return {
    totalComplaints: totalComplaints.count || 0,
    openComplaints: openComplaints.count || 0,
    pendingServices: 12,
    completedToday: 8
  };
}
async function getTechnicianStats(userId: string) {
  return {
    assignedJobs: 5,
    completedJobs: 25,
    pendingJobs: 3,
    avgRating: 4.5
  };
}
async function getCustomerStats(userId: string) {
  return {
    activeProducts: 3,
    serviceRequests: 8,
    complaints: 2,
    totalSpent: 25000
  };
}
async function getDriverStats(userId: string) {
  return {
    totalDistributions: 45,
    completedToday: 3,
    totalLiters: 15000,
    efficiency: 95
  };
}
async function getAdminActivities() {
  const { data } = await supabaseAdmin
    .from('complaints')
    .select('id, complaint_number, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data?.map(item => ({
    id: item.id,
    type: 'complaint',
    title: item.title,
    timestamp: item.created_at,
    status: item.status
  })) || [];
}
async function getProductActivities() {
  return [{
    id: '1',
    type: 'product',
    title: 'New product registered',
    timestamp: new Date().toISOString(),
    status: 'active'
  }];
}
async function getServiceActivities() {
  const { data } = await supabaseAdmin
    .from('service_requests')
    .select('id, request_number, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  return data?.map(item => ({
    id: item.id,
    type: 'service',
    title: `Service ${item.request_number}`,
    timestamp: item.created_at,
    status: item.status
  })) || [];
}
async function getTechnicianActivities(userId: string) {
  return [{
    id: '1',
    type: 'assignment',
    title: 'Service assignment completed',
    timestamp: new Date().toISOString(),
    status: 'completed'
  }];
}
async function getCustomerActivities(userId: string) {
  return [{
    id: '1',
    type: 'service',
    title: 'Service request submitted',
    timestamp: new Date().toISOString(),
    status: 'pending'
  }];
}
async function getDriverActivities(userId: string) {
  return [{
    id: '1',
    type: 'distribution',
    title: 'Water distribution completed',
    timestamp: new Date().toISOString(),
    status: 'completed'
  }];
} 