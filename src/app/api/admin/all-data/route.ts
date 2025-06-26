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
    // Fetch all data in parallel for better performance
    const [usersResult, complaintsResult, servicesResult, customersResult] = await Promise.all([
      supabaseAdmin.from('users').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('complaints').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('services').select('*').order('created_at', { ascending: false }),
      supabaseAdmin.from('customers').select('*').order('created_at', { ascending: false })
    ]);
    // Check for errors
    if (usersResult.error) {
      console.error('❌ Users fetch error:', usersResult.error);
      throw new Error(`Users data error: ${usersResult.error.message}`);
    }
    if (complaintsResult.error) {
      console.error('❌ Complaints fetch error:', complaintsResult.error);
      throw new Error(`Complaints data error: ${complaintsResult.error.message}`);
    }
    if (servicesResult.error) {
      console.error('❌ Services fetch error:', servicesResult.error);
      throw new Error(`Services data error: ${servicesResult.error.message}`);
    }
    if (customersResult.error) {
      console.error('❌ Customers fetch error:', customersResult.error);
      throw new Error(`Customers data error: ${customersResult.error.message}`);
    }
    const users = usersResult.data || [];
    const complaints = complaintsResult.data || [];
    const services = servicesResult.data || [];
    const customers = customersResult.data || [];
    // Calculate real-time stats
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const customerCount = users.filter(u => u.role === 'customer').length;
    const staffCount = users.filter(u => u.role !== 'customer').length;
    const totalComplaints = complaints.length;
    const openComplaints = complaints.filter(c => 
      c.status === 'open' || 
      c.status === 'pending' || 
      c.status === 'assigned' || 
      c.status === 'in_progress'
    ).length;
    const totalServices = services.length;
    const pendingServices = services.filter(s => s.status === 'pending').length;
    // Calculate role breakdown
    const roleBreakdown: Record<string, number> = {};
    users.forEach(user => {
      const role = user.role || 'unknown';
      roleBreakdown[role] = (roleBreakdown[role] || 0) + 1;
    });
    const responseData = {
      users,
      complaints,
      services,
      customers,
      stats: {
        totalUsers,
        activeUsers,
        customerCount,
        staffCount,
        totalComplaints,
        openComplaints,
        totalServices,
        pendingServices,
        roleBreakdown,
        lastUpdated: new Date().toISOString()
      }
    };
    return NextResponse.json(responseData, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  } catch (error: any) {
    console.error('❌ Failed to load real-time dashboard data:', error);
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: 'Failed to load dashboard data', 
        details: error.message,
        timestamp: new Date().toISOString(),
        suggestion: 'Check Supabase connection and database tables'
      },
      { status: 500 }
    );
  }
}