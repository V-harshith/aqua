import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
export async function GET() {
  try {
    const { data: serviceTypes, error } = await supabase
      .from('service_types')
      .select('*')
      .order('type_name');
    if (error) {
      console.error('Service types fetch error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(serviceTypes, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
  } catch (error) {
    console.error('Service types API error:', error);
    return NextResponse.json({ error: 'Failed to fetch service types' }, { status: 500 });
  }
}
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { data: serviceType, error } = await supabase
      .from('service_types')
      .insert([{
        type_code: body.type_code,
        type_name: body.type_name,
        category: body.category,
        description: body.description,
        estimated_duration: body.estimated_duration,
        base_price: body.base_price,
        requires_parts: body.requires_parts || false,
        skill_level: body.skill_level || 'basic',
        priority_level: body.priority_level || 3,
        is_emergency: body.is_emergency || false,
        status: body.status || 'active'
      }])
      .select()
      .single();
    if (error) {
      console.error('Service type creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(serviceType, { status: 201 });
  } catch (error) {
    console.error('Service type creation API error:', error);
    return NextResponse.json({ error: 'Failed to create service type' }, { status: 500 });
  }
}
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updateData } = body;
    const { data: serviceType, error } = await supabase
      .from('service_types')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('Service type update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(serviceType);
  } catch (error) {
    console.error('Service type update API error:', error);
    return NextResponse.json({ error: 'Failed to update service type' }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Service type ID required' }, { status: 400 });
    }
    const { error } = await supabase
      .from('service_types')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('Service type deletion error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ message: 'Service type deleted successfully' });
  } catch (error) {
    console.error('Service type deletion API error:', error);
    return NextResponse.json({ error: 'Failed to delete service type' }, { status: 500 });
  }
} 