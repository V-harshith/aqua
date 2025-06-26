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

// GET - Fetch dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const technicianId = searchParams.get('technician_id');
    const userRole = searchParams.get('role');

    console.log(`📊 Fetching dashboard stats for ${userRole || 'user'}: ${customerId || technicianId || 'all'}`);

    if (customerId) {
      // Customer-specific stats
      const [servicesResult, complaintsResult] = await Promise.all([
        supabaseAdmin
          .from('services')
          .select('id, status, created_at')
          .eq('customer_id', customerId),
        supabaseAdmin
          .from('complaints')
          .select('id, status, created_at')
          .eq('customer_id', customerId)
      ]);

      if (servicesResult.error) throw new Error(`Services error: ${servicesResult.error.message}`);
      if (complaintsResult.error) throw new Error(`Complaints error: ${complaintsResult.error.message}`);

      const services = servicesResult.data || [];
      const complaints = complaintsResult.data || [];

      const stats = {
        activeServices: services.filter(s => ['pending', 'assigned', 'in_progress'].includes(s.status)).length,
        completedServices: services.filter(s => s.status === 'completed').length,
        pendingComplaints: complaints.filter(c => ['open', 'pending', 'assigned'].includes(c.status)).length,
        resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
        monthlyUsage: Math.floor(Math.random() * 1000) + 500, // Mock water usage
        currentBill: Math.floor(Math.random() * 200) + 100, // Mock billing
        lastPayment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      };

      return NextResponse.json({ stats, timestamp: new Date().toISOString() });

    } else if (technicianId) {
      // Technician-specific stats
      const servicesResult = await supabaseAdmin
        .from('services')
        .select('id, status, created_at, estimated_hours, actual_hours')
        .eq('assigned_technician', technicianId);

      if (servicesResult.error) throw new Error(`Services error: ${servicesResult.error.message}`);

      const services = servicesResult.data || [];

      const stats = {
        assignedJobs: services.filter(s => s.status === 'assigned').length,
        inProgressJobs: services.filter(s => s.status === 'in_progress').length,
        completedJobs: services.filter(s => s.status === 'completed').length,
        totalHours: services.reduce((sum, s) => sum + (s.actual_hours || 0), 0),
        avgRating: 4.2 + Math.random() * 0.6 // Mock rating
      };

      return NextResponse.json({ stats, timestamp: new Date().toISOString() });

    } else {
      // General/Admin stats
      const [usersResult, servicesResult, complaintsResult, customersResult] = await Promise.all([
        supabaseAdmin.from('users').select('id, role, is_active, created_at'),
        supabaseAdmin.from('services').select('id, status, created_at'),
        supabaseAdmin.from('complaints').select('id, status, created_at'),
        supabaseAdmin.from('customers').select('id, created_at')
      ]);

      if (usersResult.error) throw new Error(`Users error: ${usersResult.error.message}`);
      if (servicesResult.error) throw new Error(`Services error: ${servicesResult.error.message}`);
      if (complaintsResult.error) throw new Error(`Complaints error: ${complaintsResult.error.message}`);
      if (customersResult.error) throw new Error(`Customers error: ${customersResult.error.message}`);

      const users = usersResult.data || [];
      const services = servicesResult.data || [];
      const complaints = complaintsResult.data || [];
      const customers = customersResult.data || [];

      const stats = {
        totalUsers: users.length,
        activeUsers: users.filter(u => u.is_active).length,
        totalCustomers: customers.length,
        totalServices: services.length,
        pendingServices: services.filter(s => s.status === 'pending').length,
        completedServices: services.filter(s => s.status === 'completed').length,
        totalComplaints: complaints.length,
        openComplaints: complaints.filter(c => ['open', 'pending'].includes(c.status)).length,
        resolvedComplaints: complaints.filter(c => c.status === 'resolved').length,
        monthlyRevenue: Math.floor(Math.random() * 50000) + 100000, // Mock revenue
        customerSatisfaction: 4.3 + Math.random() * 0.5, // Mock satisfaction
        responseTime: Math.floor(Math.random() * 24) + 2 // Mock response time in hours
      };

      return NextResponse.json({ stats, timestamp: new Date().toISOString() });
    }

  } catch (error: any) {
    console.error('❌ Error fetching dashboard stats:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch dashboard statistics', 
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 