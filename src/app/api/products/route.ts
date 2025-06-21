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

// GET - List all products with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const is_active = searchParams.get('is_active');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true');
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      products: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      unit_price,
      unit_type = 'piece',
      is_active = true
    } = body;

    // Validate required fields
    if (!name || !category || unit_price === undefined) {
      return NextResponse.json({ 
        error: 'Name, category, and unit price are required' 
      }, { status: 400 });
    }

    // Validate unit_price is a positive number
    if (isNaN(unit_price) || unit_price < 0) {
      return NextResponse.json({ 
        error: 'Unit price must be a positive number' 
      }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .insert([{
        name,
        description,
        category,
        unit_price: parseFloat(unit_price),
        unit_type,
        is_active
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH - Update product
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const body = await request.json();

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Validate unit_price if provided
    if (body.unit_price !== undefined) {
      if (isNaN(body.unit_price) || body.unit_price < 0) {
        return NextResponse.json({ 
          error: 'Unit price must be a positive number' 
        }, { status: 400 });
      }
      body.unit_price = parseFloat(body.unit_price);
    }

    const { data, error } = await supabaseAdmin
      .from('products')
      .update(body)
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ product: data });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete product (soft delete by setting is_active to false)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('id');
    const hard_delete = searchParams.get('hard_delete') === 'true';

    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    if (hard_delete) {
      // Hard delete - actually remove from database
      const { error } = await supabaseAdmin
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        console.error('Error deleting product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ message: 'Product deleted permanently' });
    } else {
      // Soft delete - mark as inactive
      const { data, error } = await supabaseAdmin
        .from('products')
        .update({ is_active: false })
        .eq('id', productId)
        .select()
        .single();

      if (error) {
        console.error('Error deactivating product:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Product deactivated successfully',
        product: data 
      });
    }

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 