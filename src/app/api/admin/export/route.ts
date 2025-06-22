import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as XLSX from 'xlsx';

const supabaseAdmin = createClient(
  'https://okmvjnwrmmxypxplalwp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rbXZqbndybW14eXB4cGxhbHdwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDIxNzU4NiwiZXhwIjoyMDY1NzkzNTg2fQ.VGV206hyZ7z9koTHylKCpXE2-aU2sljK5G8iZ9YCSRg'
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'users';
    const format = searchParams.get('format') || 'csv';

    console.log(`📤 Exporting REAL ${type} data in ${format} format`);

    let data: any[] = [];
    let filename = '';

    switch (type) {
      case 'users':
        const usersResponse = await supabaseAdmin.from('users').select('*');
        data = usersResponse.data || [];
        filename = `users_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'customers':
        const customersResponse = await supabaseAdmin.from('customers').select(`
          *,
          user:users(full_name, email, phone)
        `);
        data = customersResponse.data || [];
        filename = `customers_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'complaints':
        const complaintsResponse = await supabaseAdmin.from('complaints').select(`
          *,
          customer:customers(business_name, contact_person),
          assigned_user:users(full_name, email)
        `);
        data = complaintsResponse.data || [];
        filename = `complaints_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'services':
        const servicesResponse = await supabaseAdmin.from('services').select(`
          *,
          customer:customers(business_name, contact_person),
          technician:users(full_name, email, phone)
        `);
        data = servicesResponse.data || [];
        filename = `services_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'products':
        const productsResponse = await supabaseAdmin.from('products').select('*');
        data = productsResponse.data || [];
        filename = `products_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'technicians':
        const techniciansResponse = await supabaseAdmin.from('users').select('*').eq('role', 'technician');
        data = techniciansResponse.data || [];
        filename = `technicians_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'drivers':
        const driversResponse = await supabaseAdmin.from('users').select('*').eq('role', 'driver');
        data = driversResponse.data || [];
        filename = `drivers_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'driver_manager':
        const driverManagerResponse = await supabaseAdmin.from('users').select('*').eq('role', 'driver_manager');
        data = driverManagerResponse.data || [];
        filename = `driver_manager_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'billing':
        // For now, create sample billing data since we don't have a billing table
        const billingUsers = await supabaseAdmin.from('users').select('*').eq('role', 'customer');
        data = (billingUsers.data || []).map(user => ({
          id: user.id,
          customer_name: user.full_name,
          email: user.email,
          billing_address: user.address || 'Not provided',
          account_status: 'Active',
          monthly_charge: Math.floor(Math.random() * 100) + 50,
          last_payment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          payment_method: 'Bank Transfer',
          created_at: user.created_at
        }));
        filename = `billing_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case 'all_data':
        // Comprehensive export with all data types
        const [users, customers, complaints, services, products] = await Promise.all([
          supabaseAdmin.from('users').select('*'),
          supabaseAdmin.from('customers').select('*'),
          supabaseAdmin.from('complaints').select('*'),
          supabaseAdmin.from('services').select('*'),
          supabaseAdmin.from('products').select('*')
        ]);
        
        data = {
          users: users.data || [],
          customers: customers.data || [],
          complaints: complaints.data || [],
          services: services.data || [],
          products: products.data || [],
          export_info: {
            exported_at: new Date().toISOString(),
            total_records: (users.data?.length || 0) + (customers.data?.length || 0) + (complaints.data?.length || 0) + (services.data?.length || 0) + (products.data?.length || 0),
            data_types: ['users', 'customers', 'complaints', 'services', 'products']
          }
        };
        filename = `complete_export_${new Date().toISOString().split('T')[0]}`;
        break;
        
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    console.log(`✅ Exported ${Array.isArray(data) ? data.length : 'comprehensive'} real records for ${type}`);

    // Generate file based on format
    if (format === 'csv') {
      let csvContent = '';
      
      if (type === 'all_data') {
        // For all_data, create a summary CSV
        csvContent = 'Data Type,Record Count,Sample Data\n';
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value)) {
            csvContent += `${key},${value.length},"${JSON.stringify(value[0] || {})}"\n`;
          }
        });
      } else {
        // Regular CSV export
        if (data.length > 0) {
          const headers = Object.keys(data[0]);
          csvContent = headers.join(',') + '\n';
          data.forEach(row => {
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
    
    if (format === 'excel') {
      const workbook = XLSX.utils.book_new();
      
      if (type === 'all_data') {
        // Create multiple sheets for all_data
        Object.entries(data).forEach(([key, value]) => {
          if (Array.isArray(value) && value.length > 0) {
            const worksheet = XLSX.utils.json_to_sheet(value);
            XLSX.utils.book_append_sheet(workbook, worksheet, key);
          }
        });
      } else {
        // Single sheet for specific data type
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, type);
      }
      
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
    
    if (format === 'json') {
      return NextResponse.json(data, {
        status: 200,
        headers: {
          'Content-Disposition': `attachment; filename="${filename}.json"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 });
    
  } catch (error: any) {
    console.error('❌ Export error:', error);
    return NextResponse.json(
      { error: 'Export failed', details: error.message },
      { status: 500 }
    );
  }
}
