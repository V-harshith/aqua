-- Product Management Module - SQL Migration
-- Following Supabase best practices for inventory management and RLS

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    gstin VARCHAR(20),
    rating DECIMAL(3,2) DEFAULT 0.00 CHECK (rating >= 0 AND rating <= 5),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    sku VARCHAR(50) UNIQUE,
    current_stock INTEGER DEFAULT 0 CHECK (current_stock >= 0),
    min_stock_level INTEGER DEFAULT 10 CHECK (min_stock_level >= 0),
    max_stock_level INTEGER DEFAULT 100 CHECK (max_stock_level >= min_stock_level),
    unit_price DECIMAL(12,2) DEFAULT 0.00 CHECK (unit_price >= 0),
    unit VARCHAR(20) DEFAULT 'piece', -- piece, kg, liter, meter, etc.
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
    last_restocked TIMESTAMPTZ,
    reorder_point INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inventory Movements Table (for tracking stock in/out)
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment')),
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(12,2),
    reference_number VARCHAR(100), -- PO number, invoice number, etc.
    reason TEXT,
    performed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    previous_stock INTEGER,
    new_stock INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Orders Table
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'received', 'partial', 'completed', 'cancelled')),
    order_date TIMESTAMPTZ DEFAULT NOW(),
    expected_delivery TIMESTAMPTZ,
    received_date TIMESTAMPTZ,
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Purchase Order Items Table
CREATE TABLE IF NOT EXISTS public.purchase_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(12,2) NOT NULL CHECK (unit_price >= 0),
    received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
    line_total DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Stock Alerts/Notifications Table
CREATE TABLE IF NOT EXISTS public.stock_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON public.inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON public.stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON public.stock_alerts(is_resolved);

-- Enable RLS on all tables
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Product Categories
CREATE POLICY "Product categories are viewable by authenticated users" ON public.product_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Product categories manageable by product managers and admins" ON public.product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'dept_head')
        )
    );

-- RLS Policies for Suppliers
CREATE POLICY "Suppliers are viewable by staff" ON public.suppliers
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Suppliers manageable by product and accounts managers" ON public.suppliers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager', 'dept_head')
        )
    );

-- RLS Policies for Products
CREATE POLICY "Products are viewable by staff and service" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'technician', 'accounts_manager', 'dept_head')
        )
    );

CREATE POLICY "Products manageable by product managers" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'dept_head')
        )
    );

-- RLS Policies for Inventory Movements
CREATE POLICY "Inventory movements viewable by relevant staff" ON public.inventory_movements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'accounts_manager', 'dept_head')
        )
    );

CREATE POLICY "Inventory movements manageable by product managers" ON public.inventory_movements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'dept_head')
        )
        OR (performed_by = auth.uid())
    );

-- RLS Policies for Purchase Orders
CREATE POLICY "Purchase orders viewable by management" ON public.purchase_orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager', 'dept_head')
        )
    );

CREATE POLICY "Purchase orders manageable by product and accounts managers" ON public.purchase_orders
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'accounts_manager', 'dept_head')
        )
        OR (created_by = auth.uid())
    );

-- RLS Policies for Purchase Order Items
CREATE POLICY "PO items inherit purchase order permissions" ON public.purchase_order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.purchase_orders po
            JOIN public.users u ON u.id = auth.uid()
            WHERE po.id = purchase_order_items.purchase_order_id
            AND u.role IN ('admin', 'product_manager', 'accounts_manager', 'dept_head')
        )
    );

CREATE POLICY "PO items manageable with purchase order permissions" ON public.purchase_order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.purchase_orders po
            JOIN public.users u ON u.id = auth.uid()
            WHERE po.id = purchase_order_items.purchase_order_id
            AND (u.role IN ('admin', 'product_manager', 'accounts_manager', 'dept_head')
                 OR po.created_by = auth.uid())
        )
    );

-- RLS Policies for Stock Alerts
CREATE POLICY "Stock alerts viewable by relevant staff" ON public.stock_alerts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'service_manager', 'dept_head')
        )
    );

CREATE POLICY "Stock alerts manageable by product managers" ON public.stock_alerts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role IN ('admin', 'product_manager', 'dept_head')
        )
    );

-- Functions for automatic stock management
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock based on inventory movement
    IF NEW.movement_type = 'in' THEN
        UPDATE public.products 
        SET current_stock = current_stock + NEW.quantity,
            last_restocked = CASE WHEN NEW.movement_type = 'in' THEN NOW() ELSE last_restocked END,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'out' THEN
        UPDATE public.products 
        SET current_stock = current_stock - NEW.quantity,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    ELSIF NEW.movement_type = 'adjustment' THEN
        UPDATE public.products 
        SET current_stock = NEW.new_stock,
            updated_at = NOW()
        WHERE id = NEW.product_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update product stock automatically
DROP TRIGGER IF EXISTS trigger_update_product_stock ON public.inventory_movements;
CREATE TRIGGER trigger_update_product_stock
    AFTER INSERT ON public.inventory_movements
    FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to generate stock alerts
CREATE OR REPLACE FUNCTION check_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for low stock
    IF NEW.current_stock <= NEW.min_stock_level AND NEW.current_stock > 0 THEN
        INSERT INTO public.stock_alerts (product_id, alert_type, priority, message)
        VALUES (
            NEW.id, 
            'low_stock', 
            CASE 
                WHEN NEW.current_stock <= (NEW.min_stock_level * 0.5) THEN 'high'
                ELSE 'medium'
            END,
            'Product ' || NEW.name || ' is running low on stock. Current: ' || NEW.current_stock || ', Minimum: ' || NEW.min_stock_level
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    -- Check for out of stock
    IF NEW.current_stock = 0 THEN
        INSERT INTO public.stock_alerts (product_id, alert_type, priority, message)
        VALUES (
            NEW.id, 
            'out_of_stock', 
            'critical',
            'Product ' || NEW.name || ' is out of stock!'
        )
        ON CONFLICT DO NOTHING;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to check stock levels
DROP TRIGGER IF EXISTS trigger_check_stock_levels ON public.products;
CREATE TRIGGER trigger_check_stock_levels
    AFTER UPDATE OF current_stock ON public.products
    FOR EACH ROW EXECUTE FUNCTION check_stock_levels();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_product_categories_updated_at ON public.product_categories;
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON public.purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON public.purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO public.product_categories (name, description) VALUES
    ('Filters', 'Water filter cartridges and components'),
    ('Membranes', 'RO membranes and related filtration media'),
    ('Tanks', 'Water storage tanks and containers'),
    ('Pumps', 'Water pumps and pressure systems'),
    ('Pipes & Fittings', 'Plumbing pipes, joints, and fittings'),
    ('Electronic Components', 'Controllers, sensors, and electronic parts')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.suppliers (name, contact_person, email, phone, address) VALUES
    ('FilterCorp Ltd', 'Rajesh Kumar', 'rajesh@filtercorp.com', '+91-9876543210', 'Plot 15, Industrial Area, Bangalore'),
    ('Membrane Solutions', 'Priya Sharma', 'priya@membranesol.com', '+91-9876543211', '24 Tech Park, Hyderabad'),
    ('TankMakers Inc', 'Amit Patel', 'amit@tankmakers.com', '+91-9876543212', 'Factory Road, Pune'),
    ('PumpTech Systems', 'Sunita Reddy', 'sunita@pumptech.com', '+91-9876543213', 'Industrial Estate, Chennai')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT ALL ON public.product_categories TO authenticated;
GRANT ALL ON public.suppliers TO authenticated;
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.inventory_movements TO authenticated;
GRANT ALL ON public.purchase_orders TO authenticated;
GRANT ALL ON public.purchase_order_items TO authenticated;
GRANT ALL ON public.stock_alerts TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;