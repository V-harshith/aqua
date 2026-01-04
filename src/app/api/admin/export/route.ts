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

// Helper to verify admin access
async function verifyAdminAccess(request: NextRequest) {
  const authHeader = request.headers.get('author');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  const { data: userProfile } = await supabaseAdmin
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || !['admin', 'dept_head'].includes(userProfile.role)) {
    return null;
  }

  return user;
}

function convertToCSV(data: any[], headers: string[]): string {
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape commas and quotes
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAdminAccess(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'users', 'services', 'complaints'
    const format = searchParams.get('format') || 'csv'; // 'csv', 'json'

    let data: any[] = [];
    let headers: string[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        const { data: users } = await supabaseAdmin
          .from('users')
          .select('id, full_name, email, role, phone, created_at, is_active')
          .order('created_at', { ascending: false });

        data = users || [];
        headers = ['full_name', 'email', 'role', 'phone', 'created_at', 'is_active'];
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'services':
        const { data: services } = await supabaseAdmin
          .from('services')
          .select('service_number, service_type, status, priority, scheduled_date, created_at')
          .order('created_at', { ascending: false });

        data = services || [];
        headers = ['service_number', 'service_type', 'status', 'priority', 'scheduled_date', 'created_at'];
        filename = `services_export_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'complaints':
        const { data: complaints } = await supabaseAdmin
          .from('complaints')
          .select('complaint_number, title, category, status, priority, created_at')
          .order('created_at', { ascending: false });

        data = complaints || [];
        headers = ['complaint_number', 'title', 'category', 'status', 'priority', 'created_at'];
        filename = `complaints_export_${new Date().toISOString().split('T')[0]}`;
        break;

      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    if (format === 'json') {
      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
          'Content-Type': 'application/json',
        },
      });
    } else {
      // CSV format
      const csv = convertToCSV(data, headers);

      return new NextResponse(csv, {
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'Content-Type': 'text/csv',
        },
      });
    }
  } catch (error: any) {
    console.error('Export API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}