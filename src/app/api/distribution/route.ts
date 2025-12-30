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
async function verifyDistributionAccess(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) return null;
    return user;
}

export async function GET(request: NextRequest) {
    const user = await verifyDistributionAccess(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'distributions', 'stats', 'vehicles'

    try {
        if (type === 'distributions') {
            const { data, error } = await supabaseAdmin
                .from('water_distributions')
                .select(`
          *,
          driver:users!driver_id(full_name, phone)
        `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return NextResponse.json({ success: true, distributions: data });

        } else if (type === 'vehicles') {
            const { data, error } = await supabaseAdmin
                .from('vehicles')
                .select('*')
                .order('vehicle_number');

            if (error) throw error;
            return NextResponse.json({ success: true, vehicles: data });

        } else if (type === 'routes') {
            const { data, error } = await supabaseAdmin
                .from('routes')
                .select('*')
                .order('route_name');

            if (error) throw error;
            return NextResponse.json({ success: true, routes: data });
        }

        // Default or Stats (can be expanded)
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Distribution API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    const user = await verifyDistributionAccess(request);
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    try {
        const { data, error } = await supabaseAdmin
            .from('water_distributions')
            .insert({
                ...body,
                created_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, distribution: data });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const user = await verifyDistributionAccess(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { id, ...updates } = body;

    try {
        const { data, error } = await supabaseAdmin
            .from('water_distributions')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json({ success: true, distribution: data });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
