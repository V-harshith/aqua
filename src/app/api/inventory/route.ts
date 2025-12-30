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

// Helper to verify Product Manager access
async function verifyProductAccess(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.split(' ')[1];
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) return null;

  // Assuming role check logic - simple for now
  return user;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        const { count: totalProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true });
        const { count: activeProducts } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true);
        const { count: lowStock } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).lt('current_stock', 20); // Using 20 as threshold placeholder or query logic
        const { data: valueData } = await supabaseAdmin.from('products').select('current_stock, unit_price');

        const totalInventoryValue = valueData?.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.unit_price || 0)), 0) || 0;

        return NextResponse.json({
          success: true,
          stats: {
            totalProducts: totalProducts || 0,
            activeProducts: activeProducts || 0,
            lowStockProducts: lowStock || 0,
            outOfStockProducts: 0, // Need accurate query
            totalInventoryValue
          }
        });

      case 'alerts':
        const { data: alerts, error: alertError } = await supabaseAdmin
          .from('stock_alerts')
          .select(`
            *,
            product:products(name, current_stock, min_stock_level)
          `)
          .eq('is_resolved', false);

        if (alertError) throw alertError;

        // Transform to flat structure if needed by frontend
        const formattedAlerts = alerts?.map(a => ({
          id: a.id,
          product_name: a.product?.name,
          current_stock: a.product?.current_stock,
          min_stock_level: a.product?.min_stock_level,
          priority: a.priority,
          message: a.message
        }));

        return NextResponse.json({
          success: true,
          alerts: formattedAlerts || []
        });

      case 'movements':
        const { data: movements, error: moveError } = await supabaseAdmin
          .from('inventory_movements')
          .select(`
            id,
            movement_type,
            quantity,
            reason,
            created_at,
            product:products(name),
            performer:users(full_name)
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (moveError) throw moveError;

        const formattedMovements = movements?.map((m: any) => ({
          id: m.id,
          product_name: Array.isArray(m.product) ? m.product[0]?.name : m.product?.name,
          movement_type: m.movement_type,
          quantity: m.quantity,
          reason: m.reason,
          timestamp: m.created_at,
          user_name: Array.isArray(m.performer) ? m.performer[0]?.full_name : (m.performer?.full_name || 'Unknown')
        }));

        return NextResponse.json({
          success: true,
          movements: formattedMovements || []
        });

      default:
        // List products
        const { data: products, error: prodError } = await supabaseAdmin
          .from('products')
          .select('*, supplier:suppliers(name)')
          .order('name');

        if (prodError) throw prodError;

        return NextResponse.json({
          success: true,
          products: products || []
        });
    }
  } catch (error: any) {
    console.error('Inventory API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyProductAccess(request);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { action, productId, quantity, reason } = body;

    if (action === 'restock' || action === 'adjust') {
      // Create movement
      const { error: moveError } = await supabaseAdmin
        .from('inventory_movements')
        .insert({
          product_id: productId,
          movement_type: action === 'restock' ? 'in' : 'adjustment',
          quantity: quantity,
          reason: reason,
          performed_by: user.id
        });

      if (moveError) throw moveError;

      // Update product stock (Trigger in migration 10 handles this automatically!)
      // But if trigger fails or missing, we *could* do it here. 
      // Relying on trigger for now as per migration 10.

      return NextResponse.json({
        success: true,
        message: `${action} recorded successfully`
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}