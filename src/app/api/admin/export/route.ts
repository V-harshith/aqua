import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';
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
    // Authentication and RBAC guard
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized: missing token' }, { status: 401 });
    }

    // Validate user using the token
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: invalid token' }, { status: 401 });
    }

    // Check user role (only admin/dept_head allowed to export)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || !['admin', 'dept_head'].includes(profile.role)) {
      return NextResponse.json({ error: 'Forbidden: insufficient role' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users';
    const format = searchParams.get('format') || 'csv';
    let exportData: any[] | Record<string, any> = [];
    let filename = '';
    switch (type) {
      case 'users':
        const usersResponse = await supabaseAdmin.from('users').select('*');
        if (usersResponse.error) throw new Error(`Users export error: ${usersResponse.error.message}`);
        exportData = usersResponse.data || [];
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'customers':
        const customersResponse = await supabaseAdmin.from('customers').select(`
          *,
          user:users(full_name, email, phone)
        `);
        if (customersResponse.error) throw new Error(`Customers export error: ${customersResponse.error.message}`);
        exportData = customersResponse.data || [];
        filename = `customers_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'complaints':
        const complaintsResponse = await supabaseAdmin.from('complaints').select(`
          *,
          customer:customers(business_name, contact_person),
          assigned_user:users(full_name, email)
        `);
        if (complaintsResponse.error) throw new Error(`Complaints export error: ${complaintsResponse.error.message}`);
        exportData = complaintsResponse.data || [];
        filename = `complaints_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'services':
        const servicesResponse = await supabaseAdmin.from('services').select(`
          *,
          customer:customers(business_name, contact_person),
          technician:users(full_name, email, phone)
        `);
        if (servicesResponse.error) throw new Error(`Services export error: ${servicesResponse.error.message}`);
        exportData = servicesResponse.data || [];
        filename = `services_export_${new Date().toISOString().split('T')[0]}`;
        break;
      case 'all_data':
        // For comprehensive export, create an object structure
        const [users, customers, complaints, services] = await Promise.all([
          supabaseAdmin.from('users').select('*'),
          supabaseAdmin.from('customers').select('*'),
          supabaseAdmin.from('complaints').select('*'),
          supabaseAdmin.from('services').select('*')
        ]);
        // Check for errors in parallel requests
        if (users.error) throw new Error(`Users data error: ${users.error.message}`);
        if (customers.error) throw new Error(`Customers data error: ${customers.error.message}`);
        if (complaints.error) throw new Error(`Complaints data error: ${complaints.error.message}`);
        if (services.error) throw new Error(`Services data error: ${services.error.message}`);
        const allDataExport = {
          users: users.data || [],
          customers: customers.data || [],
          complaints: complaints.data || [],
          services: services.data || [],
          export_info: {
            exported_at: new Date().toISOString(),
            total_records: (users.data?.length || 0) + (customers.data?.length || 0) + (complaints.data?.length || 0) + (services.data?.length || 0),
            data_types: ['users', 'customers', 'complaints', 'services']
          }
        };
        exportData = allDataExport;
        filename = `complete_export_${new Date().toISOString().split('T')[0]}`;
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }
    console.log(`✅ Exported ${Array.isArray(exportData) ? exportData.length : 'comprehensive'} real records for ${type}`);
    // Generate file based on format
    if (format === 'csv') {
      let csvContent = '';
      if (type === 'all_data' && !Array.isArray(exportData)) {
        // For all_data, create a summary CSV
        csvContent = 'Data Type,Record Count,Sample Data\n';
        Object.entries(exportData).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            csvContent += `${key},${value.length},"${JSON.stringify(value[0] || {})}"\n`;
          }
        });
      } else if (Array.isArray(exportData)) {
        // Regular CSV export for arrays
        if (exportData.length > 0) {
          const headers = Object.keys(exportData[0]);
          csvContent = headers.join(',') + '\n';
          exportData.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              if (typeof value === 'object' && value !== null) {
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
              }
              return `"${String(value || '').replace(/"/g, '""')}"`;
            });
            csvContent += values.join(',') + '\n';
          });
        }
      }
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    if (format === 'json') {
      return NextResponse.json(exportData, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
          'Cache-Control': 'no-store',
        },
      });
    }
    if (format === 'excel') {
      let workbook: XLSX.WorkBook | undefined;
      if (type === 'all_data' && !Array.isArray(exportData)) {
        // For all_data, create multiple sheets
        workbook = XLSX.utils.book_new();
        Object.entries(exportData).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(value);
            XLSX.utils.book_append_sheet(workbook!, worksheet, key);
          }
        });
      } else if (Array.isArray(exportData)) {
        // Regular Excel export for arrays
        workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      if (workbook) {
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return new NextResponse(buffer, {
          status: 200,
          headers: {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
            'Cache-Control': 'no-store',
          },
        });
      }
    }
    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error: any) {
    console.error('❌ Export error:', error);
    return NextResponse.json(
      { 
        error: 'Export failed', 
        details: error.message,
        timestamp: new Date().toISOString() 
      },
      { status: 500 }
    );
  }
} 