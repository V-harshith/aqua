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

// Helper to verify role
async function verifyAccountAccess(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return null;

    const { data: profile } = await supabaseAdmin
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || !['admin', 'accounts_manager', 'dept_head'].includes(profile.role)) {
        return null;
    }
    return user;
}

export async function GET(request: NextRequest) {
    const user = await verifyAccountAccess(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'stats', 'invoices', 'payments'

    try {
        if (type === 'stats') {
            const today = new Date().toISOString().split('T')[0];
            const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // Parallel queries for stats
            const [
                { count: totalInvoices, data: totalRevData },
                { count: monthlyInvoices, data: monthlyRevData },
                { count: pendingCount, data: pendingData },
                { count: overdueCount, data: overdueData }
            ] = await Promise.all([
                supabaseAdmin.from('invoices').select('amount', { count: 'exact' }),
                supabaseAdmin.from('invoices').select('amount', { count: 'exact' }).gte('created_at', monthStart),
                supabaseAdmin.from('invoices').select('amount', { count: 'exact' }).eq('status', 'pending'),
                supabaseAdmin.from('invoices').select('amount', { count: 'exact' }).eq('status', 'overdue')
            ]);

            const totalRevenue = totalRevData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
            const monthlyRevenue = monthlyRevData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
            const pendingAmount = pendingData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;
            const overdueAmount = overdueData?.reduce((sum, inv) => sum + (inv.amount || 0), 0) || 0;

            return NextResponse.json({
                success: true,
                stats: {
                    totalRevenue,
                    monthlyRevenue,
                    pendingPayments: pendingAmount,
                    overduePayments: overdueAmount,
                    outstandingInvoices: pendingCount || 0
                }
            });

        } else if (type === 'invoices') {
            const { data: invoices, error } = await supabaseAdmin
                .from('invoices')
                .select(`
          *,
          customer:customers(business_name, contact_person, customer_code)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return NextResponse.json({ success: true, invoices });

        } else if (type === 'payments') {
            const { data: payments, error } = await supabaseAdmin
                .from('payments')
                .select(`
          *,
          customer:customers(business_name, contact_person)
        `)
                .order('payment_date', { ascending: false })
                .limit(50);

            if (error) throw error;
            return NextResponse.json({ success: true, payments });
        }

        return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });

    } catch (error: any) {
        console.error('Accounts API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyAccountAccess(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    try {
        if (action === 'create_invoice') {
            const { data: invoice, error } = await supabaseAdmin
                .from('invoices')
                .insert({
                    ...data,
                    status: 'pending',
                    created_by: user.id
                })
                .select()
                .single();

            if (error) throw error;
            return NextResponse.json({ success: true, invoice });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
