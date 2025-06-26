import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
// GET - List all technicians with their workload and availability
export async function GET() {
  try {
    const { data: technicians, error } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, phone, is_available')
      .eq('role', 'technician');
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      technicians: technicians || []
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
// POST - Create or update technician availability and skills
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { technicianId, availability } = body;
    if (!technicianId) {
      return NextResponse.json({ error: 'Technician ID required' }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_available: availability })
      .eq('id', technicianId)
      .select()
      .single();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({
      success: true,
      technician: data
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 