import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'stats':
        return NextResponse.json({
          success: true,
          stats: {
            totalProducts: 45,
            activeProducts: 42,
            lowStockProducts: 8,
            outOfStockProducts: 3,
            totalInventoryValue: 125000
          }
        });
        
      case 'alerts':
        return NextResponse.json({
          success: true,
          alerts: [
            {
              id: '1',
              product_name: 'RO Membrane 75 GPD',
              current_stock: 5,
              min_stock_level: 10,
              priority: 'high'
            }
          ]
        });
        
      default:
        return NextResponse.json({
          success: true,
          products: [
            {
              id: '1',
              name: 'Water Filter Cartridge',
              category: 'Filters',
              current_stock: 15,
              min_stock_level: 20,
              unit_price: 250
            }
          ]
        });
    }

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, productId, quantity } = body;

    return NextResponse.json({
      success: true,
      message: `${action} completed for product ${productId}`
    });

  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 