import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://okmvjnwrmmxypxplalwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbXZqbndybW14eXB4cGxhbHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIxNzU4NiwiZXhwIjoyMDY1NzkzNTg2fQ.VGV206hyZ7z9koTHylKCpXE2-aU2sljK5G8iZ9YCSRg'
);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Loading ALL REAL admin data from Supabase...');
    
    // Get all REAL users data from Supabase
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (usersError) {
      console.error('Users error:', usersError);
    }

    // Get all REAL complaints data from Supabase
    const { data: complaints, error: complaintsError } = await supabaseAdmin
      .from('complaints')
      .select('*')
      .order('created_at', { ascending: false });

    if (complaintsError) {
      console.error('Complaints error:', complaintsError);
    }

    // Get all REAL service requests from Supabase (try both possible table names)
    let services: any[] = [];
    
    // Try service_requests table first
    const { data: serviceRequests, error: serviceError1 } = await supabaseAdmin
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (!serviceError1 && serviceRequests) {
      services = serviceRequests;
    } else {
      // Try services table as fallback
      const { data: servicesData, error: serviceError2 } = await supabaseAdmin
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!serviceError2 && servicesData) {
        services = servicesData;
      } else {
        console.error('Services error:', serviceError1, serviceError2);
      }
    }

    // Calculate real-time statistics from REAL data
    const stats = {
      totalUsers: users?.length || 0,
      activeUsers: users?.filter(u => u.status === 'active' || !u.status).length || users?.length || 0,
      customerCount: users?.filter(u => u.role === 'customer').length || 0,
      staffCount: users?.filter(u => u.role !== 'customer').length || 0,
      totalComplaints: complaints?.length || 0,
      openComplaints: complaints?.filter(c => c.status === 'open' || c.status === 'pending').length || 0,
      totalServices: services?.length || 0,
      pendingServices: services?.filter(s => s.status === 'pending').length || 0,
      roleBreakdown: users?.reduce((acc, user) => {
        const role = user.role || 'unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {},
      lastUpdated: new Date().toISOString()
    };

    console.log('✅ REAL admin data loaded successfully:', {
      users: users?.length || 0,
      complaints: complaints?.length || 0,
      services: services?.length || 0
    });

    return NextResponse.json({
      users: users || [],
      complaints: complaints || [],
      services: services || [],
      stats
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });

  } catch (error: any) {
    console.error('❌ REAL data API error:', error);
    
    // Return error with empty fallback data
    return NextResponse.json({
      users: [],
      complaints: [],
      services: [],
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        customerCount: 0,
        staffCount: 0,
        totalComplaints: 0,
        openComplaints: 0,
        totalServices: 0,
        pendingServices: 0,
        roleBreakdown: {},
        lastUpdated: new Date().toISOString()
      },
      error: error.message
    }, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      }
    });
  }
}
